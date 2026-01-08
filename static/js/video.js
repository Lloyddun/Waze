let pc;
let localStream = null;
let remoteStream = null;
let callUnsubscribe = null;
let offerCandidatesUnsubscribe = null;
let answerCandidatesUnsubscribe = null;

const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ],
    iceCandidatePoolSize: 10,
};


function preferH264(sdp) {
    let sdpLines = sdp.split('\r\n');
    let mVideoLineIndex = -1;
    for (let i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('m=video') !== -1) {
            mVideoLineIndex = i;
            break;
        }
    }
    if (mVideoLineIndex === -1) return sdp;

    let payloadH264 = null;
    for (let i = 0; i < sdpLines.length; i++) {
        if (sdpLines[i].search('H264/90000') !== -1) {
            let match = sdpLines[i].match(/a=rtpmap:(\d+) H264\/90000/);
            if (match) {
                payloadH264 = match[1];
                break;
            }
        }
    }

    if (payloadH264) {
        let elements = sdpLines[mVideoLineIndex].split(' ');
        let newElements = [elements[0], elements[1], elements[2]];
        newElements.push(payloadH264);
        for (let i = 3; i < elements.length; i++) {
            if (elements[i] !== payloadH264) newElements.push(elements[i]);
        }
        sdpLines[mVideoLineIndex] = newElements.join(' ');
    }
    return sdpLines.join('\r\n');
}


async function setupWebRTC() {
    if(pc) pc.close();
    pc = new RTCPeerConnection(servers);
    
    remoteStream = new MediaStream();
    const remoteVid = document.getElementById('remoteVideo');
    
    if(!remoteVid) return;
    
    pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(t => remoteStream.addTrack(t));
        remoteVid.srcObject = remoteStream;
        remoteVid.setAttribute('autoplay', '');
        remoteVid.setAttribute('playsinline', '');
        remoteVid.play().catch(() => {
            remoteVid.muted = true;
            remoteVid.play();
        });
        remoteVid.classList.add('active');
    };

    if(localStream) {
        localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    }

    const callDoc = db.collection('calls').doc(currentSessionId);

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            const col = auth.currentUser.uid < currentPartnerId ? 'offerCandidates' : 'answerCandidates';
            callDoc.collection(col).add(event.candidate.toJSON());
        }
    };

    if (auth.currentUser.uid < currentPartnerId) {
        const offer = await pc.createOffer({ offerToReceiveVideo: 1, offerToReceiveAudio: 1 });
        const optimizedOffer = {
            type: offer.type,
            sdp: preferH264(offer.sdp)
        };
        await pc.setLocalDescription(optimizedOffer);
        await callDoc.set({ offer: optimizedOffer, answer: null });

        callUnsubscribe = callDoc.onSnapshot(snap => {
            const d = snap.data();
            if (!pc.currentRemoteDescription && d?.answer) {
                pc.setRemoteDescription(new RTCSessionDescription(d.answer));
            }
        });
        answerCandidatesUnsubscribe = callDoc.collection('answerCandidates').onSnapshot(s => {
            s.docChanges().forEach(c => { if(c.type === 'added') pc.addIceCandidate(new RTCIceCandidate(c.doc.data())); });
        });
    } else {
        callUnsubscribe = callDoc.onSnapshot(async snap => {
            const d = snap.data();
            if (!pc.currentRemoteDescription && d?.offer) {
                await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
                const answer = await pc.createAnswer();
                const optimizedAnswer = {
                    type: answer.type,
                    sdp: preferH264(answer.sdp)
                };
                await pc.setLocalDescription(optimizedAnswer);
                await callDoc.update({ answer: optimizedAnswer });
            }
        });
        offerCandidatesUnsubscribe = callDoc.collection('offerCandidates').onSnapshot(s => {
            s.docChanges().forEach(c => { if(c.type === 'added') pc.addIceCandidate(new RTCIceCandidate(c.doc.data())); });
        });
    }
}


async function initCamera() {
    try {
        const constraints = { 
            video: { 
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { max: 30 }
            }, 
            audio: {
                echoCancellation: true,
                noiseSuppression: true
            }
        };
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        const localVid = document.getElementById('localVideo');
        if(localVid) {
            localVid.srcObject = localStream;
            localVid.setAttribute('playsinline', '');
            localVid.setAttribute('muted', '');
        }
    } catch (e) { 
        showStatusMessage("⚠️ Camera bloquée par le système.");
    }
}


function stopCamera() {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    localStream = null;
}


window.toggleMute = function() {
    if(!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks()[0].enabled = !isMuted;
    const muteBtn = document.getElementById('mute-btn');
    if(muteBtn) muteBtn.innerHTML = isMuted ? '🔇' : '🎙️';
};


window.toggleVideo = function() {
    if(!localStream) return;
    isVideoOff = !isVideoOff;
    localStream.getVideoTracks()[0].enabled = !isVideoOff;
    const cameraBtn = document.getElementById('camera-btn');
    if(cameraBtn) cameraBtn.innerHTML = isVideoOff ? '🙈' : '👁️';
};


window.onload = async function() {
    await initCamera();
    startApp();
    setTimeout(() => {
        if(currentPartnerId) setupWebRTC();
    }, 1500);
};
