let auth, db;


window.handleSignUp = async function() {
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-pass').value.trim();
    const name = document.getElementById('signup-name').value.trim();
    const country = document.getElementById('signup-country').value;
    
    if (!email || !pass || !name || !country) return showStatusMessage("⚠️ Remplis tout !");
    
    try {
        const uc = await auth.createUserWithEmailAndPassword(email, pass);
        await db.collection("users").doc(uc.user.uid).set({
            uid: uc.user.uid, name, country, isOnline: true, currentMode: 'none',
            isOccupied: false, partnerId: null, isTyping: false,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        });
        showStatusMessage("Bienvenue sur Waze ! 🌍");
        setTimeout(() => window.location.href = '/selection', 1500);
    } catch (e) { 
        showStatusMessage("❌ " + e.message); 
    }
};


window.handleLogin = async function() {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    
    if(!email || !pass) return showStatusMessage("Identifiants requis");
    
    try { 
        await auth.signInWithEmailAndPassword(email, pass); 
    } catch (e) { 
        showStatusMessage("❌ Identifiants invalides"); 
    }
};


function showStatusMessage(txt) {
    const snack = document.getElementById('snackbar');
    if(snack) {
        snack.innerText = txt; 
        snack.classList.add('show');
        setTimeout(() => snack.classList.remove('show'), 2500);
    }
}


const countries = [
    "Afrique du Sud", "Algérie", "Angola", "Bénin", "Botswana", "Burkina Faso", 
    "Burundi", "Cameroun", "Cap-Vert", "Comores", "Congo-Brazzaville", 
    "Congo-Kinshasa", "Côte d'Ivoire", "Djibouti", "Égypte", "Gabon", "Gambie", 
    "Ghana", "Guinée", "Kenya", "Madagascar", "Mali", "Maroc", "Maurice", 
    "Mauritanie", "Niger", "Nigeria", "Ouganda", "Rwanda", "Sénégal", "Tchad", 
    "Togo", "Tunisie"
];


function populateCountries() {
    const select = document.getElementById('signup-country');
    if(select) {
        console.log("Populating countries...");
        select.innerHTML = '<option value="">Choisis ton pays...</option>';
        countries.forEach((country) => {
            let opt = document.createElement('option');
            opt.value = country; 
            opt.textContent = country;
            select.appendChild(opt);
        });
        console.log("Countries populated. Total options:", select.options.length);
    } else {
        console.error("Select element not found!");
    }
}


document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded");
    auth = window.auth;
    db = window.db;
    populateCountries();
});
