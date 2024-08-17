import io from 'socket.io-client';
import React, { useEffect, useState } from 'react';
import "./Voice.css";

// (1) Socket 서버에 연결
const socket = io('http://localhost:8090');

// (2) 방 관리 객체 생성
let rooms = {};

// (3) RTCPeerConnection 객체를 저장하는 객체 생성
const peerConnections = {};

// (4) 사용자가 방에 입장할 때 처리
socket.on('enter_room', async ({ userId, roomNum }) => {
    console.log(`Socket Event - enter_room: User ${userId} entered room ${roomNum}`);

    // (5) 해당 roomNum이 존재하지 않으면 초기화
    if (!rooms[roomNum]) {
        console.log(`Room ${roomNum} does not exist, creating new room.`);
        rooms[roomNum] = { users: [] };
    }

    // (6) 방에 접속한 사용자 목록에 새로운 사용자 추가
    if (!rooms[roomNum].users.includes(userId)) {
        rooms[roomNum].users.push(userId);
        console.log(`Current users in room ${roomNum}:`, rooms[roomNum].users);
    }

    // (7) 기존 사용자들이 새로운 사용자에게 offer 생성 및 전송
    for (const existingUserId of rooms[roomNum].users) {
        if (existingUserId !== userId) {
            console.log(`Creating offer from ${existingUserId} to ${userId} in room ${roomNum}`);
            const peerConnection = createPeerConnection(existingUserId, roomNum);
            peerConnections[`${roomNum}-${existingUserId}-${userId}`] = peerConnection;

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // (8) 생성된 offer를 새로운 사용자에게 전송
            console.log(`Sending offer from ${existingUserId} to ${userId}`);
            socket.emit('offer', { to: userId, from: existingUserId, offer, roomNum });
        }
    }
});

// (9) offer 수신 시 처리
socket.on('offer', async ({ to, from, offer, roomNum }) => {
    console.log(`Socket Event - offer: Received offer from ${from} to ${to} in room ${roomNum}`);

    // (10) 새로운 사용자에게서 받은 offer를 처리하고 answer 생성
    const peerConnection = createPeerConnection(from, roomNum);
    peerConnections[`${roomNum}-${from}-${to}`] = peerConnection;

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // (11) 생성된 answer를 offer 보낸 사용자에게 전송
    console.log(`Sending answer from ${to} to ${from} in room ${roomNum}`);
    socket.emit('answer', { to: from, from: to, answer, roomNum });
});

// (12) answer 수신 시 처리
socket.on('answer', async ({ from, answer, roomNum }) => {
    console.log(`Socket Event - answer: Received answer from ${from} in room ${roomNum}`);

    // (13) offer를 보냈던 사용자가 받은 answer를 처리하여 연결 완료
    const peerConnection = peerConnections[`${roomNum}-${from}-${socket.id}`];
    if (peerConnection) {
        console.log(`Setting remote description for connection from ${from}`);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } else {
        console.error(`No peerConnection found for ${roomNum}-${from}-${socket.id}`);
    }
});

// (14) RTCPeerConnection 생성 함수
function createPeerConnection(userId, roomNum) {
    console.log(`Creating new RTCPeerConnection for user ${userId} in room ${roomNum}`);
    const peerConnection = new RTCPeerConnection();

    // (15) ICE candidate 생성 시 서버로 전송
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log(`ICE Candidate generated for ${userId}:`, event.candidate);
            socket.emit('ice_candidate', {
                to: userId,
                from: socket.id,
                candidate: event.candidate,
                roomNum
            });
        }
    };

    // (16) 더미 오디오 스트림 생성 및 트랙 추가
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    const destination = audioContext.createMediaStreamDestination();
    oscillator.connect(destination);
    oscillator.start();

    const stream = destination.stream;
    stream.getTracks().forEach((track) => {
        console.log(`Adding track to peer connection for ${userId}`);
        peerConnection.addTrack(track, stream);
    });

    // (17) 상대방으로부터 트랙 수신 시 오디오 재생 및 소리 감지
    peerConnection.ontrack = (event) => {
        console.log(`Received remote track from ${userId}`);
        const audioElement = new Audio();
        audioElement.srcObject = event.streams[0];
        audioElement.play();

        // (18) 소리 감지를 위한 AnalyserNode 생성
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(event.streams[0]);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const detectVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            const userElement = document.getElementById(`user-${userId}`);
            if (userElement) {
                if (volume > 10) { // (19) 소리 감지 임계값
                    userElement.classList.add('speaking');
                } else {
                    userElement.classList.remove('speaking');
                }
            }
            requestAnimationFrame(detectVolume);
        };
        detectVolume();
    };

    return peerConnection;
}

// (20) ICE candidate 수신 시 처리
socket.on('ice_candidate', async ({ from, candidate, roomNum }) => {
    console.log(`Socket Event - ice_candidate: Received ICE candidate from ${from} in room ${roomNum}`);
    const peerConnection = peerConnections[`${roomNum}-${from}-${socket.id}`];
    if (peerConnection) {
        console.log(`Adding received ICE candidate to connection from ${from}`);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
        console.error(`No peerConnection found for ${roomNum}-${from}-${socket.id} to add ICE candidate`);
    }
});

// (21) 사용자가 방에 입장하는 함수
function joinRoom(userId, roomNum) {
    const tryEmitEnterRoom = () => {
        if (socket.connected) {
            console.log(`Joining room ${roomNum} as user ${userId}`);
            socket.emit('enter_room', { userId, roomNum });
        } else {
            console.log("Socket is not connected. Retrying...");
            setTimeout(tryEmitEnterRoom, 500); // 0.5초 후에 다시 시도
        }
    };

    tryEmitEnterRoom();
}

// (22) 사용자가 방에서 나가는 함수
function leaveRoom(userId, roomNum) {
    console.log(`Leaving room ${roomNum} as user ${userId}`);
    socket.emit('leave_room', { userId, roomNum });
}

// (23) React 컴포넌트 - VoiceChatRoom
function VoiceChatRoom() {
    const [users, setUsers] = useState([]);
    const roomNum = 'roomNum1';

    // (24) 컴포넌트가 마운트될 때 더미 사용자들을 방에 추가
    useEffect(() => {
        const dummyUsers = ['user1', 'user2', 'user3'];
        setUsers(dummyUsers);

        dummyUsers.forEach(user => joinRoom(user, roomNum));

        // (25) 컴포넌트 언마운트 시 사용자들을 방에서 나가게 처리
        return () => {
            dummyUsers.forEach(user => leaveRoom(user, roomNum));
        };
    }, []);

    return (
        <div className="room">
            <h2>{roomNum}</h2> {/* (26) 방 이름 표시 */}
            <div className="users">
                {users.map(user => (
                    <div key={user} className="user" id={`user-${user}`}>
                        <div className="user-avatar"></div> {/* (27) 사용자 아바타 - 원형 구체 */}
                        <p>{user}</p> {/* (28) 사용자 이름 표시 */}
                    </div>
                ))}
            </div>
        </div>
    );
}

// (29) 컴포넌트 내보내기
export default VoiceChatRoom;
