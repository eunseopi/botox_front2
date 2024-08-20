import io from 'socket.io-client';
import React, { useEffect, useState } from 'react';
import "./Voice.css";

// (1) Socket 서버에 연결
const socket = io('http://localhost:8090');

// (2) 방 관리 객체 생성
// 실제로 받은 room 에 존재하는 user 를 담을 것
// -> 6번과 7번 로직 삭제 및 8번 올바르게 호출할 수 있게 변경할 것
let rooms = {};

// (3) RTCPeerConnection 객체를 저장하는 객체 생성
const peerConnections = {};

// (4) 사용자 미디어 스트림을 저장하는 객체 생성
let localStream = null;

// (5) 사용자가 방에 입장할 때 처리
socket.on('enter_room', async ({ userId, roomNum }) => {
    console.log(`Socket Event - enter_room: User ${userId} entered room ${roomNum}`);

    // (6) 해당 roomNum이 존재하지 않으면 초기화
    if (!rooms[roomNum]) {
        console.log(`Room ${roomNum} does not exist, creating new room.`);
        rooms[roomNum] = { users: [] };
    }

    // (7) 방에 접속한 사용자 목록에 새로운 사용자 추가
    if (!rooms[roomNum].users.includes(userId)) {
        rooms[roomNum].users.push(userId);
        console.log(`Current users in room ${roomNum}:`, rooms[roomNum].users);
    }

    // (8) 기존 사용자들이 새로운 사용자에게 offer 생성 및 전송
    for (const existingUserId of rooms[roomNum].users) {
        if (existingUserId !== userId) {
            console.log(`Creating offer from ${existingUserId} to ${userId} in room ${roomNum}`);
            const peerConnection = await createPeerConnection(userId, existingUserId, roomNum);
            peerConnections[`${roomNum}-${existingUserId}-${userId}`] = peerConnection;
            console.log(`(enter_room)create peerConnection ${roomNum}-${existingUserId}-${userId}`)

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            // (9) 생성된 offer를 새로운 사용자에게 전송
            console.log(`Sending offer from ${existingUserId} to ${userId}`);
            socket.emit('offer', { to: userId, from: existingUserId, offer, roomNum });
        }
    }
});

// (10) offer 수신 시 처리
socket.on('offer', async ({ to, from, offer, roomNum }) => {
    console.log(`Socket Event - offer: Received offer from ${from} to ${to} in room ${roomNum}`);

    // (11) 수신한 offer를 처리하고 answer 생성
    const peerConnection = peerConnections[`${roomNum}-${from}-${to}`];
    console.log(peerConnection)

    if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // (12) 생성된 answer를 offer 보낸 사용자에게 전송
        console.log(`Sending answer from ${to} to ${from} in room ${roomNum}`);
        socket.emit('answer', {to: from, from: to, answer, roomNum});
    } else {
        console.error(`No peerConnection found for ${roomNum}-${from}-${to}`);
    }
    // 현재 peerConnections 상태 로그 출력
    logPeerConnections();
});

// (13) answer 수신 시 처리
socket.on('answer', async ({ to, from, answer, roomNum }) => {
    console.log(`Socket Event - answer: Received answer from ${from} in room ${roomNum}`);

    // (14) offer를 보냈던 사용자가 받은 answer를 처리하여 연결 완료
    const peerConnection = peerConnections[`${roomNum}-${from}-${to}`];
    if (peerConnection) {
        console.log(`Setting remote description for connection from ${from}`);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } else {
        console.error(`No peerConnection found for ${roomNum}-${from}-${to}`);
    }
});

// (15) RTCPeerConnection 생성 함수
async function createPeerConnection(toUserId, fromUserId, roomNum) {
    console.log(`Creating new RTCPeerConnection for user ${toUserId} in room ${roomNum}`);
    const peerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ],
    });

    // (16) ICE candidate 생성 시 서버로 전송
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log(`ICE Candidate generated for ${toUserId}:`, event.candidate);
            socket.emit('ice_candidate', {
                to: toUserId,
                from: fromUserId,
                candidate: event.candidate,
                roomNum
            });
        }
    };

    // (17) 로컬 스트림을 추가하고 상대방으로부터 트랙 수신 시 오디오 재생 및 소리 감지
    if (localStream) {
        localStream.getTracks().forEach((track) => {
            console.log(`Adding track to peer connection for ${toUserId}`);
            // 오디오 트랙 추가하여 상대방에게 전달될 준비를 함
            peerConnection.addTrack(track, localStream);
        });
    }

    peerConnection.ontrack = (event) => {
        console.log(`Received remote track from ${toUserId}`);
        const audioElement = new Audio();
        audioElement.srcObject = event.streams[0];
        audioElement.play();

        // (18) 소리 감지를 위한 AnalyserNode 생성
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(event.streams[0]);
        microphone.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const detectVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            const userElement = document.getElementById(`user-${toUserId}`);
            if (userElement) {
                if (volume > 10) { // 소리 감지 임계값
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

// (19) ICE candidate 수신 시 처리
socket.on('ice_candidate', async ({to, from, candidate, roomNum }) => {
    console.log(`Socket Event - ice_candidate: Received ICE candidate from ${from} in room ${roomNum}`);

    // (19.1) 모든 peerConnection을 순회하여 적절한 연결을 찾는다.
    for (const key in peerConnections) {
        if (key.includes(roomNum) && key.includes(to) && key.includes(from)) {
            const peerConnection = peerConnections[key];
            if (peerConnection) {
                try {
                    console.log(`Adding received ICE candidate to connection ${to} from ${from}`);
                    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (error) {
                    console.error(`Error adding ICE candidate: ${error}`);
                }
                return;
            }
        }
    }

    // (19.2) 적절한 peerConnection이 없을 경우, 에러 로그
    console.error(`No peerConnection found for ${roomNum}-${to}-${from} to add ICE candidate`);
    // (19.3) 필요한 경우, peerConnection을 생성하도록 시도할 수 있음
    // (19.4) 관련 peerConnection을 다시 생성하거나 새로 생성할 수 있는 로직을 추가할 수 있음
});

// (20) 사용자가 방에 입장하는 함수
async function joinSocket(userId, roomNum) {
    // (21) Media stream을 한 번만 획득
    if (!localStream) {
        try {
            // audio 스트림을 얻음
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Local media stream acquired.");
        } catch (error) {
            console.error("Error accessing media devices.", error);
            return;
        }
    }

    const tryEmitEnterSocket = () => {
        if (socket.connected) {
            console.log(`Joining room ${roomNum} as user ${userId}`);
            socket.emit('enter_room', { userId, roomNum });
        } else {
            console.log("Socket is not connected. Retrying...");
            setTimeout(tryEmitEnterSocket, 500); // 0.5초 후에 다시 시도
        }
    };

    tryEmitEnterSocket();
}

// (24) user_left 수신 시 처리
socket.on('user_left', ({ userId, roomNum }) => {
    console.log(`Socket Event - user_left: User ${userId} left room ${roomNum}`);

    // (25) 방에서 나간 사용자의 peerConnection 종료 및 정리
    for (const key in peerConnections) {
        if (key.includes(roomNum) && (key.includes(userId))) {
            const peerConnection = peerConnections[key];
            if (peerConnection) {
                console.log(`Closing peerConnection ${key}`);
                peerConnection.close();
                delete peerConnections[key];
            }
        }
    }

    // (26) UI에서 방에서 나간 사용자 제거 -> ui 동적 제거 상담 필요
    const userElement = document.getElementById(`user-${userId}`);
    if (userElement) {
        userElement.classList.remove('speaking');
    }
});

// (22) 사용자가 방에서 나갈 때 호출되는 함수
function leaveSocket(userId, roomNum) {
    console.log(`Leaving room ${roomNum} as user ${userId}`);
    socket.emit('leave_room', { userId, roomNum });

    // (22-2) 로컬 스트림 종료 및 clean up
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
}



// (23) 현재 연결 상태 출력 함수
function logPeerConnections() {
    console.log("Current peerConnections:");
    for (const key in peerConnections) {
        const [roomNum, fromUserId, toUserId] = key.split('-');
        console.log(`Room: ${roomNum}, From: ${fromUserId}, To: ${toUserId}`);
    }
}

export {joinSocket, leaveSocket};
