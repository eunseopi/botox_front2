import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import volume from '../../../images/volume.png';
import mute from '../../../images/mute.png';
import call from '../../../images/call.png';
import report from '../../../images/report.png';
import friend from '../../../images/friend.png';
import { FaArrowLeft } from 'react-icons/fa';
import RoomEditModal from "../modal/RoomEditModal";

const VoiceChat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const roomInfo = location.state?.roomInfo || {};
    const [userData, setUserData] = useState(null);
    const textareaRef = useRef(null);
    const [newNickname, setNewNickname] = useState("");
    const [rooms, setRooms] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [inUsers, setInUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const { roomNum } = useParams();
    const [isExiting, setIsExiting] = useState(false); // 상태 추가
    const [editRoomInfo, setEditRoomInfo] = useState({
        roomTitle: "",
        roomContent: "",
        roomType: "",
        gameName: "",
        roomMasterId: 0,
        roomStatus: "",
        roomPassword: "",
        roomCapacityLimit: 0,
        roomUpdateTime: "",
        roomCreateAt: "",
        roomUserCount: 0
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isRoomEditModalOpen, setIsRoomEditModalOpen] = useState(false);
    const [RoomInfo, setRoomInfo] = useState(null);

    // (1) Socket 서버에 연결
    const socket = io('https://botox-chat.site', {
        path: '/socket.io',
        secure: true,
    });

// (2) 방 관리 객체 생성
// 실제로 받은 room 에 존재하는 user 를 담을 것
// -> 6번과 7번 로직 삭제 및 8번 올바르게 호출할 수 있게 변경할 것
    let socketRooms = {};

// (3) RTCPeerConnection 객체를 저장하는 객체 생성
    const peerConnections = {};

// (4) 사용자 미디어 스트림을 저장하는 객체 생성
    let localStream = null;

// (5) 클라이언트가 방에 입장했을 때 처리
    socket.on('enter_room', async ({ userId, roomNum }) => {
        console.log(`Socket Event - enter_room: User ${userId} entered room ${roomNum}`);

        // (6)해당 roomNum이 존재하지 않으면 초기화
        // room 의 필요성은..?
        if (!socketRooms[roomNum]) {
            console.log(`Room ${roomNum} does not exist, creating new room.`);
            socketRooms[roomNum] = { users: [] };
        } else {
            console.log(`Room ${roomNum} already exist!`)
        }

        // (7) 방에 접속한 사용자 목록에 새로운 사용자 추가
        if (!socketRooms[roomNum].users.includes(userId)) {
            socketRooms[roomNum].users.push(userId);
            console.log(`Current users in room ${roomNum}:`, socketRooms[roomNum].users);
        }
    });

// (8) 기존 사용자가 새로 입장한 사용자에게 offer 생성 및 전송
    socket.on('user_joined', async ({ userId, roomNum }) => {
        console.log(`Socket Event - user_joined: User ${userId} joined room ${roomNum}`);

        // (9) 방에 있는 모든 사용자들에 대해 offer 생성
        for (const existingUserId of socketRooms[roomNum].users) {
            if (existingUserId !== userId) {
                const connectionKey = `${roomNum}-${existingUserId}-${userId}`;

                // (9.1) 이미 연결이 존재하는지 확인
                if (peerConnections[connectionKey]) {
                    console.log(`PeerConnection already exists for ${existingUserId} to ${userId}`);
                    continue; // 이미 연결이 존재하면, 새로 생성하지 않음
                }

                console.log(`Creating offer from ${existingUserId} to ${userId} in room ${roomNum}`);
                const peerConnection = await createPeerConnection(userId, existingUserId, roomNum);
                peerConnections[connectionKey] = peerConnection;
                console.log(`(user_joined) create peerConnection ${connectionKey}`);

                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer); // client A 의 Local -> client B가 Remote 로 받아야할 offer

                // (10) 생성된 offer를 새로운 사용자에게 전송
                console.log(`Socket Event(송신) offer from ${existingUserId} to ${userId}`);
                socket.emit('offer', { to: userId, from: existingUserId, offer, roomNum });
            }
        }
    });


// (11) offer 수신 시 처리
    socket.on('offer', async ({ to, from, offer, roomNum }) => {
        console.log(`Socket Event(수신) - offer: Received offer from ${from} to ${to} in room ${roomNum}`);
        const connectionKey = `${roomNum}-${to}-${from}`;
        const peerConnection = await createPeerConnection(from, to, roomNum);
        peerConnections[connectionKey] = peerConnection;
        console.log(`(offer) create peerConnection ${connectionKey}`);

        if (peerConnection) {
            await peerConnection.setRemoteDescription(offer); // client B 의 Remote -> client A 의 Local offer
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer); // client B 의 Local -> client A 에게 보낼 Remote answer

            // (12) 생성된 answer를 offer 보낸 사용자에게 전송
            console.log(`Socket Event(송신) - answer from ${to} to ${from} in room ${roomNum}`);
            socket.emit('answer', { to: from, from: to, answer, roomNum });
        } else {
            console.error(`(offer-수신) No peerConnection found for ${roomNum}-${from}-${to}`);
        }

        // (13) 현재 peerConnections 상태 로그 출력
        logPeerConnections();
    });

// (14) answer 수신 시 처리
    socket.on('answer', async ({ to, from, answer, roomNum }) => {
        console.log(`Socket Event(수신) - answer: Received answer from ${from} in room ${roomNum}`);

        const peerConnection = peerConnections[`${roomNum}-${to}-${from}`];
        if (peerConnection) {
            console.log(`Setting remote description for connection from ${from}`);
            await peerConnection.setRemoteDescription(answer);
        } else {
            console.error(`(answer 수신) No peerConnection found for ${roomNum}-${from}-${to}`);
        }
    });

    const localStreamRef = useRef(null); // 자신의 미디어 스트림을 저장

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
                console.log(`${fromUserId} ICE Candidate generated for ${toUserId}:`, event.candidate);
                socket.emit('ice_candidate', {
                    to: toUserId,
                    from: fromUserId,
                    candidate: event.candidate,
                    roomNum
                });
            }
        };

        // (17) 로컬 스트림을 추가하고 상대방으로부터 트랙 수신 시 오디오 재생 및 소리 감지
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => {
                console.log(`Adding track to peer connection for ${toUserId}`);
                peerConnection.addTrack(track, localStreamRef.current);
            });
        }

        peerConnection.ontrack = (event) => {
            console.log(`Received remote track from ${toUserId}`);

            // 로그 찍기
            if (event.streams[0]) {
                console.log('Remote audio stream received');
                const audioElement = new Audio();
                audioElement.srcObject = event.streams[0];
                audioElement.play();

                // 자신의 음성 스트림과 비교
                if (event.streams[0] !== localStreamRef.current) {
                    console.log('Remote audio stream is not local stream');
                } else {
                    console.log('Local audio stream received');
                }

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
            }
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
        if (!localStreamRef.current) {
            try {
                localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
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

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        const userId = JSON.parse(localStorage.getItem('userInfo')).username;
        if (!userId) {
            console.error('No username found in localStorage');
            return;
        }

        try {
            const response = await fetch(`https://botox-chat.site/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            const result = await response.json();
            if (result.code === "OK" && result.data) {
                setUserData(result.data);
                setNewNickname(result.data.userNickname || "");
            } else {
                console.error("Failed to fetch user data:", result.message);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    useEffect(() => {
        if (roomInfo && currentUser) {
            const participantIds = roomInfo.participantIds || [];
            const uniqueParticipantIds = Array.from(new Set(participantIds));

            // 참가자 목록 업데이트
            const updatedUsers = uniqueParticipantIds.map(id => ({
                id,
                name: id === currentUser.id ? userData?.userNickname || "내 닉네임" : "Unknown User",
                isCurrentUser: id === currentUser.id
            }));

            setInUsers(updatedUsers);
        }
    }, [currentUser, roomInfo, userData]);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));

        if (userInfo && roomInfo && roomInfo.roomNum) {
            setCurrentUser(userInfo);

            const initialUsers = [
                { id: userInfo.id, nickname: userInfo.nickname }
            ];
            setInUsers(initialUsers);

            joinRoom(roomInfo.roomNum, userInfo.id);

            setEditRoomInfo(roomInfo);

            return () => leaveRoom(roomInfo.roomNum, userInfo.id);
        }
    }, [roomInfo]);

    const joinRoom = async (roomNum, userId) => {
        try {
            const response = await fetch(`https://botox-chat.site/api/rooms/${roomNum}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            await joinSocket(userId.toString(), roomNum.toString());
            if (!response.ok) throw new Error(data.message || '방 입장에 실패했습니다.');

            // 참가자 목록 업데이트
            const participants = data.participantIds || [];

            // 중복 ID를 제거한 참가자 목록 생성
            const uniqueParticipants = Array.from(new Map(participants.map(user => [user.id, user])).values());

            setInUsers(prevUsers => {
                const existingIds = new Set(prevUsers.map(user => user.id));
                const newParticipants = uniqueParticipants.filter(user => !existingIds.has(user.id));
                return [...prevUsers, ...newParticipants];
            });

            // 방 정보 업데이트
            const updatedRoomInfo = {
                ...roomInfo,
                roomUserCount: uniqueParticipants.length,
                participants: uniqueParticipants
            };
            setRoomInfo(updatedRoomInfo);

            // 방 정보를 새로 가져오기
            fetchRoomInfo(); // 방 정보를 가져옵니다.

            return data;
        } catch (error) {
            console.error('Error joining room:', error);
            throw error;
        }
    };

    const leaveRoom = async (roomNum, userId) => {
        try {
            const response = await fetch(`https://botox-chat.site/api/rooms/${roomNum}/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            if (data.code === 'NO_CONTENT') {
                console.log('방을 성공적으로 나갔습니다.');
                await leaveSocket(userId.toString(), roomNum.toString());

                // 참가자 목록에서 제거
                setInUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            }
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    };

    const handleSendMessage = () => {
        if (textareaRef.current) {
            const content = textareaRef.current.value.trim();
            if (content !== "" && currentUser) {
                const newMessage = {
                    id: Date.now(),
                    senderId: currentUser.id,
                    senderName: currentUser?.nickname,
                    content: content,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prevMessages => [...prevMessages, newMessage]);
                textareaRef.current.value = "";

                // 메시지 전송 API 호출 (추후 구현)
            }
        }
    };

    const handleBack = async () => {
        if (isExiting) return; // 이미 진행 중이면 함수 종료
        setIsExiting(true); // 진행 중 상태 설정
        if (currentUser) {
            await leaveRoom(roomInfo.roomNum, currentUser.id);
            setMessages([]);
            setInUsers([]);
        }
        const gameName = roomInfo.roomContent || 'defaultGame'; // gameName이 없을 경우 기본값 설정
        navigate(`/rooms?game=${gameName}`);
        setIsExiting(false); // 진행 완료 상태 설정
    };

    const handleCallEnd = async () => {
        if (isExiting) return; // 이미 진행 중이면 함수 종료
        setIsExiting(true); // 진행 중 상태 설정
        if (currentUser) {
            await leaveRoom(roomInfo.roomNum, currentUser.id);
            setMessages([]);
            setInUsers([]);
        }
        const gameName = roomInfo.roomContent || 'defaultGame'; // gameName이 없을 경우 기본값 설정
        navigate(`/rooms?game=${gameName}`);
        setIsExiting(false); // 진행 완료 상태 설정
    };

    const handleRoomUpdate = async (updatedRoomInfo) => {
        try {
            const response = await fetch(`https://botox-chat.site/api/rooms/${roomNum}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedRoomInfo)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.code === "OK") {
                    console.log("방 정보 업데이트 성공:", data.data);
                    const updatedRoom = data.data;
                    setEditRoomInfo(updatedRoom); // 업데이트된 방 정보를 상태에 반영
                    localStorage.setItem(`room_${updatedRoom.roomNum}`, JSON.stringify(updatedRoom));
                } else {
                    console.error('방 수정 실패:', data.message);
                }
            } else {
                const errorData = await response.json();
                console.error('방 수정 API 호출 실패:', errorData.message);
            }
        } catch (error) {
            console.error('방 수정 중 오류 발생:', error);
        }
    };

    useEffect(() => {
        // 방 정보가 있을 때만 호출
        if (roomNum) {
            fetchRoomInfo(); // 방 정보를 가져옵니다.
        }
    }, [roomNum]);

    const fetchRoomInfo = async () => {
        try {
            const response = await fetch(`https://botox-chat.site/api/rooms?roomNum=${roomNum}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            const result = await response.json();
            console.log('fetchRoomInfo result:', result); // 결과 확인

            if (result.code === "OK" && result.data) {
                const participantIds = result.data.participantIds || [];
                const uniqueParticipantIds = Array.from(new Set(participantIds));

                // 참가자 목록 업데이트
                const updatedUsers = uniqueParticipantIds.map(id => ({
                    id,
                    name: id === currentUser?.id ? userData.userNickname || "내 닉네임" : "Unknown User",
                    isCurrentUser: id === currentUser?.id
                }));

                setInUsers(updatedUsers);
                setRoomInfo(prevRoomInfo => ({
                    ...prevRoomInfo,
                    roomUserCount: uniqueParticipantIds.length,
                    participants: updatedUsers
                }));
            } else {
                console.error("Failed to fetch room data:", result.message);
            }
        } catch (error) {
            console.error("Error fetching room data:", error);
        }
    };

    const handleOpenRoomEditModal = () => {
        setIsRoomEditModalOpen(true);
    };

    const handleSaveRoomInfo = (updatedRoomInfo) => {
        handleRoomUpdate(updatedRoomInfo);
        setIsRoomEditModalOpen(false); // 모달 닫기
    };

    return (
        <div className="h-screen overflow-y-hidden bg-customMainBg text-white mt-5 ml-14">
            <div className="flex p-4">
                <div className="flex items-center">
                    <FaArrowLeft className="w-14 h-14 mr-8 cursor-pointer" onClick={handleBack} />
                    <img width="64" height="64" src="https://img.icons8.com/wired/64/F25081/microphone.png" alt="microphone" />
                </div>
                <div className="ml-4 mt-3 text-2xl">
                    {editRoomInfo.roomTitle || "방 제목 없음"}
                </div>
                {currentUser && roomInfo && currentUser.id === roomInfo.roomMasterId && (
                    <button
                        onClick={handleOpenRoomEditModal}
                        className="bg-green-500 text-white px-4 py-2 mt-4 rounded-lg"
                    >
                        방 정보 수정
                    </button>
                )}
                <RoomEditModal
                    isOpen={isRoomEditModalOpen}
                    onClose={() => setIsRoomEditModalOpen(false)}
                    onSave={handleSaveRoomInfo}
                    currentRoomInfo={roomInfo}
                />

                <div className="flex items-center ml-auto">
                    <div className="text-lg">{inUsers.length}</div>
                    <div className="text-lg">/{editRoomInfo.roomCapacityLimit || 5}</div>
                </div>
            </div>
            <div className="flex-1 p-4 flex flex-col">
                <div className="flex justify-center space-x-36 mb-4">
                    {inUsers.map(user => (
                        <div key={user.id} className="text-center">
                            <div className="w-52 h-52 bg-customIdBg rounded-3xl mb-2"></div>
                            <div className="text-lg">{user.name}</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="fixed bottom-1/2 w-full p-4 bg-customMainBg flex justify-between">
                <div className="flex space-x-10 items-center m-auto">
                    <img width="50%" height="40" src={volume} alt="volume" className="cursor-pointer" />
                    <img width="50%" height="40" src={mute} alt="mute" className="cursor-pointer" />
                    <img width="50%" height="40" src={call} alt="phone" className="cursor-pointer" onClick={handleCallEnd} />
                </div>
                <div className="flex space-x-5 mr-16">
                    <img width="50%" height="40" src={report} alt="siren" className="cursor-pointer" />
                    <img width="50%" height="40" src={friend} alt="friend" className="cursor-pointer" />
                </div>
            </div>
            {isEditing && (
                <div className="fixed top-1/4 left-1/4 bg-gray-800 p-6 rounded-lg shadow-lg z-50">
                    <h2 className="text-2xl mb-4" onClick={handleOpenRoomEditModal}>방 정보 수정</h2>
                    <RoomEditModal
                        isOpen={isRoomEditModalOpen}
                        onClose={() => setIsRoomEditModalOpen(false)}
                        onSave={handleSaveRoomInfo}
                        currentRoomInfo={roomInfo}
                    />
                </div>
            )}
            <div className="flex fixed bottom-0 left-0 w-full p-4 bg-customMainBg items-center">
                <textarea
                    ref={textareaRef}
                    className="flex-1 p-2 rounded-lg border border-gray-600"
                    rows="2"
                    placeholder="메시지를 입력하세요..."
                />
                <button onClick={handleSendMessage} className="ml-2 bg-blue-500 px-4 py-2 rounded-lg text-white">전송</button>
            </div>
        </div>
    );
}

export default VoiceChat;
