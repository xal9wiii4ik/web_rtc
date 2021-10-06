// let connectButton = document.querySelector('#connectButton')

var mapPeers = {}

var usernameInput = document.querySelector('#username')
let btnJoin = document.querySelector('#btn-join')

var username;
var webSocket;

let peerConnection;
let dataChannel;

let config = {
    iceServers: [
        {
            //stun что бы соединение восстанавливалось
            "urls": "stun:stun.l.google.com:19302",
        }
    ]
};

const constraints = {
    video: true,
    audio: true
}

const btnToggleAudio = document.querySelector('#btn-toggle-audio')
const btnToggleVideo = document.querySelector('#btn-toggle-video')

function webSocketOnMessage(event) {
    let parsedData = JSON.parse(event.data);

    let peerUsername = parsedData['peer']
    let action = parsedData['action']

    if (username == peerUsername) {
        return
    }


    var receiver_channel_name = parsedData['message']['receiver_channel_name']

    if (action == 'new-peer') {
        createOffer(peerUsername, receiver_channel_name)

        return
    }

    if (action == 'new-offer') {
        var offer = parsedData['message']['sdp']

        createAnswerer(offer, peerUsername, receiver_channel_name)

        return
    }

    if (action == 'new-answer') {
        var answer = parsedData['message']['sdp']

        var peer = mapPeers[peerUsername][0]

        var remoteVideo = createVideo(peerUsername)
        setOnTrack(peer, remoteVideo)

        peer.setRemoteDescription(answer)
        return
    }
}

function createAnswerer(offer, peerUsername, receiver_channel_name) {
    var peer = new RTCPeerConnection(null)

    addLocalTracks(peer)

    var remoteVideo = createVideo(peerUsername)
    setOnTrack(peer, remoteVideo)

    peer.addEventListener('datachannel', e => {
        peer.dc = e.channel
        peer.dc.addEventListener('open', () => {
        })
        peer.dc.addEventListener('message', dcOnMessage)

        mapPeers[peerUsername] = [peer, peer.dc]
    })


    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState

        if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed') {
            delete mapPeers[peerUsername]

            if (iceConnectionState != 'closed') {
                peer.close()
            }

            removeVideo(remoteVideo)
        }
    })

    peer.addEventListener('icecandidate', (event) => {
        if (event.candidate) {

            return
        }

        sendSignal('new-answer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        })
    })

    peer.setRemoteDescription(offer)
        .then(() => {
            console.log('Remote description set successfully for %s.', peerUsername)
            return peer.createAnswer()
        })
        .then(a => {
            console.log('Answer created ')

            peer.setLocalDescription(a)
        })
}

btnJoin.addEventListener('click', () => {
    username = usernameInput.value
    console.log('username: ', username)

    if (username == '') {
        return
    }

    usernameInput.value = ''
    usernameInput.disabled = true
    usernameInput.style.visibility = 'hidden'

    btnJoin.disabled = true
    btnJoin.style.visibility = 'hidden'

    var labelUsername = document.querySelector('#label-username')
    labelUsername.innerHTML = username

    var loc = window.location
    var wsStart = 'ws://'

    if (loc.protocol == 'https:') {
        wsStart = 'wss://'
    }

    // var endPoint = wsStart + loc.host + loc.pathname
    var endPoint = 'ws://0.0.0.0:8001'

    webSocket = new WebSocket(endPoint)

    webSocket.addEventListener('open', (e) => {
        console.log('Connection opened')

        sendSignal('new-peer', {})
    })
    webSocket.addEventListener('message', webSocketOnMessage)
    webSocket.addEventListener('close', (e) => {
        console.log('Connection closed')
    })
    webSocket.addEventListener('error', (e) => {
        console.log('Error type')
    })
})

var localStream = new MediaStream()
const localVideo = document.querySelector('#local-video')

var userMedia = navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
        localStream = stream
        localVideo.srcObject = localStream
        localVideo.muted = true


        let audioTrack = stream.getAudioTracks()
        let videoTrack = stream.getVideoTracks()
        audioTrack[0].enabled = true
        videoTrack[0].enabled = true

        btnToggleAudio.addEventListener('click', () => {
            audioTrack[0].enabled = !audioTrack[0].enabled

            if (audioTrack[0].enabled) {
                btnToggleAudio.innerHTML = 'Audio Mute'

                return
            }

            btnToggleAudio.innerHTML = 'Audio Unmute'
        })

        btnToggleVideo.addEventListener('click', () => {
            videoTrack[0].enabled = !videoTrack[0].enabled

            if (videoTrack[0].enabled) {
                btnToggleVideo.innerHTML = 'Video off'

                return
            }

            btnToggleVideo.innerHTML = 'Video on'
        })

    }).catch(error => {
        console.log('Error media', error)
    })

function getDataChannels(){
    var dataChannels = []

    for (peerUsername in mapPeers){
        var dataChanel = mapPeers[peerUsername][1]

        dataChannels.push(dataChanel)
    }

    return dataChannels
}

var btnSendMsg = document.querySelector('#btn-send-msg')
var messageInput = document.querySelector('#msg')
btnSendMsg.addEventListener('click', sendMsgOnClick)

function sendMsgOnClick(){
    console.log(1)
    var message = messageInput.value
    console.log(message)
    var li = document.createElement('li')
    li.appendChild(document.createTextNode('Me:     ' + message))
    li.classList.add('chat__message')
    messageList.appendChild(li)

    var dataChannels = getDataChannels()

    message = username + ':     ' + message

    for(index in dataChannels){
        dataChannels[index].send(message)
    }

    messageInput.value = ''
}

function sendSignal(action, message) {
    var jsonStr = JSON.stringify({
        'peer': username,
        'action': action,
        'message': message,
    })

    webSocket.send(jsonStr)
}


function createOffer(peerUsername, receiver_channel_name) {
    //null because in the same newtwork else need to add configured(servers)
    var peer = new RTCPeerConnection(null)

    addLocalTracks(peer)

    var dc = peer.createDataChannel('channel')
    dc.addEventListener('open', () => {
        console.log('Connection opened')
    })
    dc.addEventListener('message', dcOnMessage)

    var remoteVideo = createVideo(peerUsername)
    setOnTrack(peer, peerUsername)

    mapPeers[peerUsername] = [peer, dc]
    //    datachannel

    peer.addEventListener('iceconnectionstatechange', () => {
        var iceConnectionState = peer.iceConnectionState

        if (iceConnectionState === 'failed' || iceConnectionState === 'disconnected' || iceConnectionState === 'closed') {
            delete mapPeers[peerUsername]

            if (iceConnectionState != 'closed') {
                peer.close()
            }

            removeVideo(remoteVideo)
        }
    })

    peer.addEventListener('icecandidate', (event) => {
        if (event.candidate) {

            return
        }

        sendSignal('new-offer', {
            'sdp': peer.localDescription,
            'receiver_channel_name': receiver_channel_name
        })
    })

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => {
            console.log('Local description set successfully')
        })
}

function addLocalTracks(peer) {
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream)
    })

    return
}

var messageList = document.querySelector('#message-list')

function dcOnMessage(event) {
    var message = event.data

    var li = document.createElement('li')
    li.appendChild(document.createTextNode((message)))
    li.classList.add('chat__message')
    messageList.appendChild(li)
}

function createVideo(peerUsername) {
    var videoContainer = document.querySelector('#video__display')

    var remoteVideo = document.createElement('video')

    remoteVideo.id = peerUsername + '-video'
    remoteVideo.autoplay = true
    remoteVideo.playsInline = true

    var videoWrapper = document.createElement('div')
    videoWrapper.classList.add('video__items__my')

    videoContainer.appendChild(videoWrapper)

    videoWrapper.appendChild(remoteVideo)
    return remoteVideo
}

function setOnTrack(peer, remoteVideo) {
    var remoteStream = new MediaStream()

    remoteVideo.srcObject = remoteStream

    peer.addEventListener('track', async (event) => {
        remoteStream.addTrack(event.track, remoteStream)
    })
}

function removeVideo(video) {
    var videoWrapper = video.parentNode

    videoWrapper.parentNode.removeChild(videoWrapper)

}
