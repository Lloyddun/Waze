let auth, db;
let currentMode = 'video';
let currentPartnerId = null;
let currentSessionId = null;
let isMuted = false;
let isVideoOff = false;
let statusObserver = null;
let onlineUsersUnsubscribe = null;


window.onload = function() {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = '/selection';
        }
    });
    
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'hidden') updateUserStatus(false);
        else updateUserStatus(true);
    });
    
    const chatInput = document.getElementById('chat-input');
    if(chatInput) {
        chatInput.addEventListener('input', () => {
            handleTypingIndicator(true);
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => handleTypingIndicator(false), 2000);
        });
        
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    document.addEventListener('input', function (event) {
        if (event.target.id !== 'chat-input') return;
        autoExpand(event.target);
    }, false);
};


function showView(id) {
    document.querySelectorAll('.screen-container').forEach(v => v.style.display = 'none');
    const view = document.getElementById(id);
    if(view) view.style.display = 'flex';
}


async function updateUserStatus(online) {
    if (auth.currentUser) {
        await db.collection("users").doc(auth.currentUser.uid).update({ 
            isOnline: online, 
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}


function startOnlineCounter() {
    if(onlineUsersUnsubscribe) onlineUsersUnsubscribe();
    onlineUsersUnsubscribe = db.collection("users")
        .where("isOnline", "==", true)
        .onSnapshot(snap => {
            const count = snap.size;
            const onlineCount = document.getElementById('online-count');
            const onlineBadge = document.getElementById('online-count-badge');
            if(onlineCount) onlineCount.innerText = count;
            if(onlineBadge) onlineBadge.innerText = count + " Mapanes Actifs";
        }, err => console.log("Erreur compteur:", err));
}


window.startChatMode = async function(mode) {
    currentMode = mode;
    await db.collection("users").doc(auth.currentUser.uid).update({
        currentMode: mode, isOccupied: false, partnerId: null
    });
    
    if(mode === 'video' && typeof VIDEO_URL !== 'undefined') {
        window.location.href = VIDEO_URL;
    } else if(mode === 'text' && typeof CHAT_URL !== 'undefined') {
        window.location.href = CHAT_URL;
    }
};


function startStatusListener() {
    if(statusObserver) statusObserver();
    statusObserver = db.collection("users").doc(auth.currentUser.uid).onSnapshot(doc => {
        const data = doc.data();
        if(!data) return;
        if(currentPartnerId && !data.partnerId) {
            showStatusMessage("Le Mapane s'est enfui... 🔄");
            resetPartnerUI();
        }
        if(!currentPartnerId && data.partnerId && data.currentSessionId) {
            currentSessionId = data.currentSessionId;
            connectToPartner(data.partnerId);
        }
    });
}


async function connectToPartner(pId) {
    currentPartnerId = pId;
    const pDoc = await db.collection("users").doc(pId).get();
    const pData = pDoc.data();
    if(!pData) return;
    
    const infoText = `${pData.name} (${pData.country})`;
    const partnerInfo = document.getElementById('partner-info-text');
    const chatPartner = document.getElementById('chat-partner-name');
    if(partnerInfo) partnerInfo.innerText = infoText;
    if(chatPartner) chatPartner.innerText = infoText;
    showStatusMessage(`Connecté à ${pData.name} ✅`);
    
    if(currentMode === 'text') {
        const messages = document.getElementById('chat-messages');
        if(messages) messages.innerHTML = "";
        startChatListener();
    }
}


function showStatusMessage(txt) {
    const snack = document.getElementById('snackbar');
    if(snack) {
        snack.innerText = txt; 
        snack.classList.add('show');
        setTimeout(() => snack.classList.remove('show'), 2500);
    }
}


function autoExpand(field) {
    field.style.height = 'inherit';
    const computed = window.getComputedStyle(field);
    const height = parseInt(computed.getPropertyValue('border-top-width'), 10)
                 + parseInt(computed.getPropertyValue('padding-top'), 10)
                 + field.scrollHeight
                 + parseInt(computed.getPropertyValue('padding-bottom'), 10)
                 + parseInt(computed.getPropertyValue('border-bottom-width'), 10);
    field.style.height = Math.min(height, 150) + 'px';
}


window.goToMenu = async function() {
    if(auth.currentUser) await db.collection("users").doc(auth.currentUser.uid).update({ isOccupied: false, currentMode: 'none', isTyping: false });
    if(typeof SELECTION_URL !== 'undefined') {
        window.location.href = SELECTION_URL;
    }
};


window.realLogout = async function() {
    if(auth.currentUser) await db.collection("users").doc(auth.currentUser.uid).update({ isOnline: false, isTyping: false });
    auth.signOut().then(() => window.location.href = '/login');
};


let typingTimeout = null;
let chatObserver = null;
let typingObserver = null;

async function handleTypingIndicator(isTyping) {
    if (auth.currentUser && currentPartnerId) {
        await db.collection("users").doc(auth.currentUser.uid).update({ isTyping: isTyping });
    }
}


function startTypingListener() {
    if(typingObserver) typingObserver();
    typingObserver = db.collection("users").doc(currentPartnerId).onSnapshot(d => {
        const user = d.data();
        const indicator = document.getElementById('typing-indicator');
        if(user && user.isTyping && user.partnerId === auth.currentUser.uid) {
            if(indicator) indicator.innerText = `${user.name} est en train d'écrire...`;
            if(indicator) indicator.classList.add('visible');
        } else {
            if(indicator) indicator.classList.remove('visible');
        }
    });
}


window.sendMessage = async function() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(text && currentPartnerId && currentSessionId) {
        input.value = "";
        input.style.height = '50px';
        handleTypingIndicator(false);
        await db.collection("calls").doc(currentSessionId).collection("messages").add({
            text, senderId: auth.currentUser.uid, timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
};


function startChatListener() {
    chatObserver = db.collection("calls").doc(currentSessionId).collection("messages")
        .orderBy("timestamp", "asc").onSnapshot(snap => {
            const box = document.getElementById('chat-messages');
            if(!box) return;
            box.innerHTML = "";
            snap.forEach(doc => {
                const m = doc.data();
                const mine = m.senderId === auth.currentUser.uid;
                const div = document.createElement('div');
                div.className = `msg ${mine ? 'mine' : 'other'}`;
                div.innerHTML = `<div class="bubble">${m.text}</div>`;
                box.appendChild(div);
            });
            box.scrollTop = box.scrollHeight;
        });
}


function resetPartnerUI() {
    if(chatObserver) chatObserver();
    if(typingObserver) typingObserver();
    if(callUnsubscribe) callUnsubscribe();
    if(offerCandidatesUnsubscribe) offerCandidatesUnsubscribe();
    if(answerCandidatesUnsubscribe) answerCandidatesUnsubscribe();
    currentPartnerId = null;
    
    const partnerInfo = document.getElementById('partner-info-text');
    const chatPartner = document.getElementById('chat-partner-name');
    const messages = document.getElementById('chat-messages');
    const indicator = document.getElementById('typing-indicator');
    const remoteVid = document.getElementById('remoteVideo');
    
    if(partnerInfo) partnerInfo.innerText = "Recherche...";
    if(chatPartner) chatPartner.innerText = "...";
    if(messages) messages.innerHTML = "";
    if(indicator) indicator.classList.remove('visible');
    if(remoteVid) {
        remoteVid.srcObject = null;
        remoteVid.classList.remove('active');
    }
    if(pc) { 
        pc.close(); 
        pc = null; 
    }
}


window.nextMapane = async function() {
    const btn = document.getElementById('next-btn');
    if(btn) btn.classList.add('loading');
    const myId = auth.currentUser.uid;
    
    if(currentPartnerId) {
        await db.collection("users").doc(currentPartnerId).update({ partnerId: null, isOccupied: false, isTyping: false }).catch(()=>{});
    }
    await db.collection("users").doc(myId).update({ partnerId: null, isOccupied: false, isTyping: false });
    resetPartnerUI();

    try {
        const snapshot = await db.collection("users")
            .where("isOnline", "==", true)
            .where("isOccupied", "==", false)
            .where("currentMode", "==", currentMode)
            .limit(10).get();

        let potential = [];
        snapshot.forEach(doc => { if(doc.id !== myId) potential.push(doc.data()); });

        if(potential.length > 0) {
            const partner = potential[Math.floor(Math.random() * potential.length)];
            const newSess = "sess_" + Date.now() + "_" + Math.floor(Math.random()*1000);
            const batch = db.batch();
            batch.update(db.collection("users").doc(myId), { partnerId: partner.uid, isOccupied: true, currentSessionId: newSess });
            batch.update(db.collection("users").doc(partner.uid), { partnerId: myId, isOccupied: true, currentSessionId: newSess });
            await batch.commit();
        } else {
            showStatusMessage("En attente de nouveaux Mapanes... 😴");
        }
    } catch(e) { console.log(e); } finally {
        if(btn) setTimeout(() => btn.classList.remove('loading'), 1200);
    }
};


window.startApp = function() {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = '/login';
        }
    });
    
    startOnlineCounter();
    startStatusListener();
};