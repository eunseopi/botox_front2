import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import io from 'socket.io-client';
import volume from '../../../images/volume.png';
import mute from '../../../images/mute.png';
import call from '../../../images/call.png';
import report from '../../../images/report.png';
import friend from '../../../images/friend.png';
import { FaArrowLeft } from 'react-icons/fa';

// RoomEditModal 컴포넌트 정의 (방 정보 수정 모달)
const RoomEditModal = ({ isOpen, onClose, onSave, currentRoomInfo }) => {
    const [roomTitle, setRoomTitle] = useState(currentRoomInfo.roomTitle);
    const [roomType, setRoomType] = useState(currentRoomInfo.roomType);
    const [roomPassword, setRoomPassword] = useState(currentRoomInfo.roomPassword);
    const [roomCapacityLimit, setRoomCapacityLimit] = useState(currentRoomInfo.roomCapacityLimit);

    // 현재 방 정보가 변경될 때마다 모달의 입력 필드 초기화
    useEffect(() => {
        if (currentRoomInfo) {
            setRoomTitle(currentRoomInfo.roomTitle);
            setRoomType(currentRoomInfo.roomType);
            setRoomPassword(currentRoomInfo.roomPassword);
            setRoomCapacityLimit(currentRoomInfo.roomCapacityLimit);
        }
    }, [currentRoomInfo]);

    // 저장 버튼 클릭 시 호출
    const handleSave = () => {
        const updatedRoomInfo = {
            roomTitle,
            roomType,
            roomPassword,
            roomCapacityLimit
        };
        onSave(updatedRoomInfo); // 수정된 방 정보 저장
        onClose(); // 모달 닫기
    };

    // 모달 UI 렌더링
    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex z-10 justify-center items-center">
                    <div className="bg-customFriendBg p-6 rounded-lg w-96">
                        <h2 className="text-2xl text-white font-bold mb-4">방 정보 수정</h2>
                        <input
                            type="text"
                            value={roomTitle}
                            onChange={(e) => setRoomTitle(e.target.value)}
                            placeholder="방 제목"
                            className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                        />
                        <select
                            value={roomType}
                            onChange={(e) => setRoomType(e.target.value)}
                            className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                        >
                            <option value="VOICE">음성</option>
                            <option value="TEXT">텍스트</option>
                        </select>
                        <input
                            type="password"
                            value={roomPassword}
                            onChange={(e) => setRoomPassword(e.target.value)}
                            placeholder="방 비밀번호 (선택사항)"
                            className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                        />
                        <input
                            type="number"
                            value={roomCapacityLimit}
                            onChange={(e) => setRoomCapacityLimit(e.target.value)}
                            placeholder="최대 인원"
                            className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                            min="2"
                        />
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 rounded mr-2"
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-4 py-2 bg-customIdBg text-white rounded"
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const VoiceChat = () => {
    const navigate = useNavigate(); // 페이지 이동을 위한 hook
    const location = useLocation(); // 현재 경로의 상태를 가져오는 hook
    const { roomNum } = useParams(); // URL 파라미터에서 방 번호 가져오기
    const roomInfo = location.state?.roomInfo || {}; // 전달받은 방 정보
    const [userData, setUserData] = useState(null); // 현재 사용자 데이터 상태
    const textareaRef = useRef(null); // 채팅 입력 필드에 대한 참조
    const [newNickname, setNewNickname] = useState(""); // 사용자가 설정한 새 닉네임
    const [inUsers, setInUsers] = useState([]); // 방에 참가한 사용자 목록
    const [messages, setMessages] = useState([]); // 채팅 메시지 목록
    const [currentUser, setCurrentUser] = useState(null); // 현재 사용자 정보
    const [isRoomEditModalOpen, setIsRoomEditModalOpen] = useState(false); // 방 정보 수정 모달 열기 상태
    const [RoomInfo, setRoomInfo] = useState(null); // 현재 방 정보 상태
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

    const [isEditing, setIsEditing] = useState(false); // 방 정보 수정 상태

    // WebRTC 관련 상태 변수들
    const [myStream, setMyStream] = useState(null); // 현재 사용자의 미디어 스트림
    const [pcObj, setPcObj] = useState({}); // PeerConnection 객체를 저장할 객체
    const socket = useRef(null); // 소켓 객체를 참조하는 변수
    const myAudioRef = useRef(); // 자신의 오디오 스트림을 참조하는 변수

    // 컴포넌트가 마운트되면 사용자 데이터를 가져옴
    useEffect(() => {
        fetchUserData();
    }, []);

    // 사용자 데이터를 가져오는 함수
    const fetchUserData = async () => {
        const userId = JSON.parse(localStorage.getItem('userInfo')).username;
        if (!userId) {
            console.error('No username found in localStorage');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            const result = await response.json();
            if (result.code === "OK" && result.data) {
                setUserData(result.data); // 사용자 데이터 상태 업데이트
                setNewNickname(result.data.userNickname || ""); // 새 닉네임 설정
            } else {
                console.error("Failed to fetch user data:", result.message);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    // 현재 사용자 정보와 방 정보를 기반으로 사용자 목록 업데이트
    useEffect(() => {
        if (roomInfo && currentUser) {
            const participants = roomInfo.participants || [];
            const updatedUsers = participants.map(user => ({
                id: user.id,
                name: user.id === currentUser.id ? userData?.userNickname || "내 닉네임" : user.userNickname,
                isCurrentUser: user.id === currentUser.id
            }));

            if (currentUser.id && !participants.some(user => user.id === currentUser.id)) {
                updatedUsers.push({
                    id: currentUser.id,
                    name: userData?.userNickname || "내 닉네임",
                    isCurrentUser: true
                });
            }

            setInUsers(updatedUsers); // 사용자 목록 상태 업데이트
        }
    }, [currentUser, roomInfo, userData]);

    // 방 번호가 변경되면 실행되는 효과
    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setCurrentUser(userInfo);

        if (userInfo) {
            const initialUsers = [
                { id: userInfo.id, nickname: userInfo.nickname }
            ];
            setInUsers(initialUsers); // 초기 사용자 목록 설정

            joinRoom(roomInfo.roomNum, userInfo.id); // 방에 참가

            setEditRoomInfo(roomInfo);

            return () => leaveRoom(roomInfo.roomNum, userInfo.id); // 컴포넌트가 언마운트될 때 방 나가기
        }
    }, [roomInfo.roomNum]);

    // 로컬 스토리지에서 방 정보 가져오기
    useEffect(() => {
        const storedRoomInfo = localStorage.getItem(`room_${roomNum}`);
        if (storedRoomInfo) {
            setRoomInfo(JSON.parse(storedRoomInfo)); // 방 정보 상태 업데이트
        } else {
            console.error('로컬 스토리지에서 방 정보를 찾을 수 없습니다.');
        }
    }, [roomNum]);

    // 소켓 연결 설정
    useEffect(() => {
        const token = localStorage.getItem('token');

        socket.current = io('http://localhost:8081', {
            query: { token }
        });

        // 소켓 이벤트 리스너 설정
        socket.current.on('reject_join', handleRejectJoin);
        socket.current.on('accept_join', handleAcceptJoin);
        socket.current.on('offer', handleOffer);
        socket.current.on('answer', handleAnswer);
        socket.current.on('ice', handleIce);
        socket.current.on('leave_room', handleLeaveRoom);

        return () => {
            socket.current.off('reject_join', handleRejectJoin);
            socket.current.off('accept_join', handleAcceptJoin);
            socket.current.off('offer', handleOffer);
            socket.current.off('answer', handleAnswer);
            socket.current.off('ice', handleIce);
            socket.current.off('leave_room', handleLeaveRoom);
            socket.current.disconnect();  // 컴포넌트 언마운트 시 소켓 연결 해제
        };
    }, [roomNum]);

    // 소켓 연결과 사용자 데이터가 모두 준비되면 호출
    useEffect(() => {
        if (socket.current && userData) {
            initCall();
        }
    }, [socket.current, userData]);

    // 방에 참가하는 함수
    const joinRoom = async (roomNum, userId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/rooms/${roomNum}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId })
            });
            if (!response.ok) throw new Error('방 입장에 실패했습니다.');
            const data = await response.json();
            setRoomInfo(data); // 방 정보 상태 업데이트
            localStorage.setItem(`room_${data.roomNum}`, JSON.stringify(data)); // 로컬 스토리지에 방 정보 저장
            console.log('방에 성공적으로 입장했습니다.', data);

            if (data.participantIds && currentUser) {
                const updatedUsers = data.participantIds.map(id => ({
                    id,
                    name: id === roomInfo.roomMasterId ? "방장" :
                        id === currentUser.id ? currentUser.nickname : `사용자 ${id}`,
                    isCurrentUser: id === currentUser.id
                }));
                setInUsers(updatedUsers); // 사용자 목록 상태 업데이트
                console.log('방 입장 후 참가자 목록:', updatedUsers);
            }
        } catch (error) {
            console.error('Error joining room:', error);
        }
    };

    // 방에서 나가는 함수
    const leaveRoom = async (roomNum, userId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/rooms/${roomNum}/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId })
            });
            if (!response.ok) throw new Error('방 나가기에 실패했습니다.');
            const data = await response.json();
            console.log('방을 성공적으로 나갔습니다.', data);
            if (data.participantIds) {
                setInUsers(data.participantIds.map(id => ({ id, nickname: `사용자 ${id}` }))); // 사용자 목록 업데이트
            }
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    };

    // WebRTC 호출 초기화 함수
    const initCall = async () => {
        await getMedia(); // 미디어 장치 접근
        if (myStream) {
            socket.current.emit('join_room', {
                roomNum,
                userId: userData.id,
                token: localStorage.getItem('token')
            }); // 소켓을 통해 방 입장 이벤트 전송
        } else {
            console.error("오디오 스트림 초기화 실패");
        }
    };

    // 오디오 스트림 가져오기
    const getMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            myAudioRef.current.srcObject = stream; // 오디오 스트림을 UI에 설정
            myAudioRef.current.muted = true; // 자신의 오디오를 음소거
            setMyStream(stream); // 스트림 상태 업데이트
        } catch (error) {
            console.error('Error accessing media devices.', error);
        }
    };

    // 방 입장 거부 처리
    const handleRejectJoin = () => {
        alert('Sorry, The room is already full.');
        navigate('/'); // 메인 페이지로 이동
    };

    // 방 입장 수락 처리
    const handleAcceptJoin = async (userObjArr) => {
        if (!myStream) {
            console.error("오디오 스트림이 아직 초기화되지 않았습니다.");
            return;
        }
        console.log('방 입장 수락:', userObjArr);

        userObjArr.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log(`  User ID: ${user.id}`);
            console.log(`  Nickname: ${user.userNickname}`);
            console.log(`  Other Info:`, user);
        });

        if (userObjArr.length === 1) {
            console.log('방에 혼자 있습니다. 연결을 생성하지 않습니다.');
            console.log("사용자 데이터: ", userObjArr);
            return;
        }

        for (let i = 0; i < userObjArr.length - 1; i++) {
            try {
                console.log(`PeerConnection을 생성합니다. 사용자 ID: ${userObjArr[i].id}`);
                const newPC = createConnection(userObjArr[i].id); // PeerConnection 생성
                const offer = await newPC.createOffer(); // Offer 생성
                await newPC.setLocalDescription(offer); // Local Description 설정
                console.log(`offer를 생성하고 전송합니다. 사용자 ID: ${userObjArr[i].id}`);
                socket.current.emit('offer', { sdp: offer, userId: userObjArr[i].id, roomNum }); // 소켓을 통해 Offer 전송
            } catch (err) {
                console.error('Offer 생성 중 오류:', err);
            }
        }

        const newUsers = userObjArr.map(user => ({
            id: user.id,
            name: user.userNickname || `사용자 ${user.id}`,
            isCurrentUser: false
        }));

        // 중복 체크하여 사용자 목록 업데이트
        setInUsers(prevUsers => {
            const userIds = new Set(prevUsers.map(user => user.id));
            return [
                ...prevUsers,
                ...newUsers.filter(user => !userIds.has(user.id))
            ];
        });
    };

    // Offer 처리 함수
    const handleOffer = async ({ sdp, userId }) => {
        console.log(`Offer를 받았습니다. 사용자 ID: ${userId}`);
        const newPC = createConnection(userId); // 새로운 PeerConnection 생성
        await newPC.setRemoteDescription(new RTCSessionDescription(sdp)); // Remote Description 설정
        const answer = await newPC.createAnswer(); // Answer 생성
        await newPC.setLocalDescription(answer); // Local Description 설정
        console.log(`Answer를 생성하고 전송합니다. 사용자 ID: ${userId}`);
        socket.current.emit('answer', { sdp: answer, userId, roomNum }); // 소켓을 통해 Answer 전송
    };

    // PeerConnection 정보 로그 출력
    const logAllPeerConnections = () => {
        console.log('현재 활성화된 PeerConnections:');
        Object.keys(pcObj).forEach((key) => {
            const pc = pcObj[key];
            console.log(`  PeerConnection for User ID: ${key}`);
            console.log('  Local Description:', pc.localDescription);
            console.log('  Remote Description:', pc.remoteDescription);
        });
    };

    // Answer 처리 함수
    const handleAnswer = async ({ sdp, userId }) => {
        console.log(`Answer를 받았습니다. 사용자 ID: ${userId}`);
        const pc = pcObj[userId];
        await pc.setRemoteDescription(new RTCSessionDescription(sdp)); // Remote Description 설정
        logAllPeerConnections(); // 모든 PeerConnection 정보 로그 출력
    };

    // ICE Candidate 처리 함수
    const handleIce = async ({ candidate, userId }) => {
        console.log(`ICE Candidate를 받았습니다. 사용자 ID: ${userId}`);
        const pc = pcObj[userId];
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)); // ICE Candidate 추가
        }
    };

    // PeerConnection 생성 함수
    const createConnection = (remoteSocketId) => {
        console.log(`새로운 PeerConnection을 생성합니다. 상대방 소켓 ID: ${remoteSocketId}`);
        const newPC = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // ICE Candidate 이벤트 처리
        newPC.addEventListener('icecandidate', (event) => {
            if (event.candidate) {
                console.log('ICE Candidate를 전송합니다.');
                socket.current.emit('ice', { candidate: event.candidate, userId: remoteSocketId, roomNum });
            }
        });

        // 스트림 추가 이벤트 처리
        newPC.addEventListener('addstream', (event) => {
            const peerStream = event.stream;
            paintPeerAudio(peerStream, remoteSocketId); // 추가된 스트림을 UI에 표시
        });

        // 오디오 분석 및 볼륨 체크
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(myStream);

        source.connect(analyser);
        analyser.fftSize = 2048;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const userElement = document.getElementById(`user-${remoteSocketId}`);

            if (volume > 50) {
                userElement.style.borderColor = 'green'; // 볼륨이 일정 수준 이상일 때 테두리 색 변경
            } else {
                userElement.style.borderColor = 'gray'; // 볼륨이 낮을 때 테두리 색 변경
            }

            requestAnimationFrame(checkVolume); // 볼륨 체크 반복
        };

        checkVolume(); // 볼륨 체크 시작

        myStream.getTracks().forEach((track) => newPC.addTrack(track, myStream)); // 모든 트랙 추가
        setPcObj((prev) => ({ ...prev, [remoteSocketId]: newPC })); // PeerConnection 객체 저장

        return newPC;
    };

    // 다른 사용자의 오디오 스트림을 UI에 표시하는 함수
    const paintPeerAudio = (peerStream, id) => {
        if (id === userData.id) {
            return; // 자신의 스트림은 표시하지 않음
        }

        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.controls = true;
        audio.srcObject = peerStream;
        audio.id = id;

        const existingAudio = document.getElementById(id);
        if (existingAudio) {
            existingAudio.srcObject = peerStream; // 기존 스트림 업데이트
        } else {
            document.querySelector('#streams').appendChild(audio); // 새로운 스트림 추가
        }
    };

    // 방에서 나간 사용자의 스트림 제거
    const handleLeaveRoom = (leavedSocketId) => {
        const audio = document.getElementById(leavedSocketId);
        if (audio) audio.remove(); // 오디오 요소 제거
    };

    // 메시지 전송 함수
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
                setMessages(prevMessages => [...prevMessages, newMessage]); // 메시지 목록 업데이트
                textareaRef.current.value = ""; // 입력 필드 초기화
            }
        }
    };

    // 뒤로가기 버튼 클릭 시 방 나가기
    const handleBack = async () => {
        if (currentUser) {
            await leaveRoom(roomInfo.roomNum, currentUser.id);
        }
        navigate(`/room/${roomInfo.gameName}`); // 이전 페이지로 이동
    };

    // 통화 종료 버튼 클릭 시 방 나가기
    const handleCallEnd = async () => {
        if (currentUser) {
            await leaveRoom(roomInfo.roomNum, currentUser.id);
        }
        navigate(`/room/${roomInfo.gameName}`); // 이전 페이지로 이동
    };

    // 방 정보 수정 함수
    const handleRoomUpdate = async (updatedRoomInfo) => {
        if (!currentUser || currentUser.id !== roomInfo.roomMasterId) {
            console.error('방장만 방 정보를 수정할 수 있습니다.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/rooms/${roomNum}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updatedRoomInfo),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.code === 'OK') {
                    const updatedRoom = data.data;
                    setEditRoomInfo(updatedRoom); // 방 정보 업데이트
                    localStorage.setItem(`room_${updatedRoom.roomNum}`, JSON.stringify(updatedRoom));
                    console.log('방 수정 완료:', updatedRoom);
                    setIsEditing(false); // 수정 상태 종료
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

    // 방 정보 수정 모달 열기
    const handleOpenRoomEditModal = () => {
        setIsRoomEditModalOpen(true);
    };

    // 방 정보 저장 및 모달 닫기
    const handleSaveRoomInfo = (updatedRoomInfo) => {
        handleRoomUpdate(updatedRoomInfo);
        setIsRoomEditModalOpen(false);
    };

    // UI 렌더링
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
            <div id="streams" className="flex flex-col items-center mb-4">
                {/* 오디오 스트림을 위한 컨테이너 */}
                <audio ref={myAudioRef} autoPlay controls />
            </div>
            <div className="fixed bottom-2/5 w-full p-4 bg-customMainBg flex justify-between">
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
};

export default VoiceChat;
