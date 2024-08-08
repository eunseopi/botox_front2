import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import title from '../../../images/title.png';

const RoomEditModal = ({ isOpen, onClose, onSave, currentRoomInfo }) => {
    const [roomTitle, setRoomTitle] = useState(currentRoomInfo.roomTitle);
    const [roomType, setRoomType] = useState(currentRoomInfo.roomType);
    const [roomPassword, setRoomPassword] = useState(currentRoomInfo.roomPassword);
    const [roomCapacityLimit, setRoomCapacityLimit] = useState(currentRoomInfo.roomCapacityLimit);


    useEffect(() => {
        if (currentRoomInfo) {
            setRoomTitle(currentRoomInfo.roomTitle);
            setRoomType(currentRoomInfo.roomType);
            setRoomPassword(currentRoomInfo.roomPassword);
            setRoomCapacityLimit(currentRoomInfo.roomCapacityLimit);
        }
    }, [currentRoomInfo]);


    const handleSave = () => {
        const updatedRoomInfo = {
            roomTitle,
            roomType,
            roomPassword,
            roomCapacityLimit
        };
        onSave(updatedRoomInfo);
        onClose();
    };

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
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


const TextChat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [textWsClient, setTextWsClient] = useState(null);
    const [userData, setUserData] = useState(null);
    const [newNickname, setNewNickname] = useState("");
    const [RoomInfo, setRoomInfo] = useState(null);
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const roomInfo = location.state?.roomInfo || {};
    const [currentUser, setCurrentUser] = useState(null);
    const [inUsers, setInUsers] = useState([]);
    const {roomNum} = useParams();
    const WS_SERVER_URL = 'wss://botox-chat.site/ws';
    const [isRoomEditModalOpen, setIsRoomEditModalOpen] = useState(false);
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

        const textClient = new W3CWebSocket(WS_SERVER_URL);

        textClient.onopen = () => {
            console.log('텍스트 WebSocket 클라이언트 연결됨');
            setTextWsClient(textClient);
            // 연결 후 방 정보 전송
            textClient.send(JSON.stringify({
                type: 'join',
                roomNum: roomInfo.roomNum
            }));
        };

        textClient.onmessage = (message) => {
            const data = JSON.parse(message.data.toString());
            handleTextMessage(data);
        };

        textClient.onclose = () => {
            console.log('텍스트 WebSocket 클라이언트 연결 종료');
            setTextWsClient(null);
        };

        textClient.onerror = (error) => {
            console.error('텍스트 WebSocket 오류:', error);
        };

        return () => {
            textClient.close();
        };
    }, [WS_SERVER_URL]);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setCurrentUser(userInfo);

        if (userInfo) {
            const initialUsers = [
                { id: userInfo.id, nickname: userInfo.nickname }
            ];
            setInUsers(initialUsers);

            joinRoom(roomInfo.roomNum, userInfo.id);

            setEditRoomInfo(roomInfo);

            return () => leaveRoom(roomInfo.roomNum, userInfo.id);
        }
    }, [roomInfo.roomNum]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const storedRoomInfo = localStorage.getItem(`room_${roomNum}`);
        if (storedRoomInfo) {
            setRoomInfo(JSON.parse(storedRoomInfo));
        } else {
            console.error('로컬 스토리지에서 방 정보를 찾을 수 없습니다.');
        }
    }, [roomNum]);

    useEffect(() => {
        console.log('현재 방 참가자:', inUsers);
    }, [inUsers]);

    useEffect(() => {
        if (roomInfo && currentUser) {
            // participants가 정의되어 있는지 확인
            const participants = roomInfo.participants || [];

            // 참가자 목록 업데이트
            const updatedUsers = participants.map(user => ({
                id: user.id,
                name: user.id === currentUser.id ? userData?.userNickname || "내 닉네임" : user.nickname,
                isCurrentUser: user.id === currentUser.id
            }));

            // 현재 사용자의 닉네임을 포함시킬 수 있는 경우 처리
            if (currentUser.id && !participants.some(user => user.id === currentUser.id)) {
                updatedUsers.push({
                    id: currentUser.id,
                    name: userData?.userNickname || "내 닉네임",
                    isCurrentUser: true
                });
            }

            setInUsers(updatedUsers);
        }
    }, [currentUser, roomInfo, userData]);

    const handleTextMessage = (data) => {
        if (data.type === 'message') {
            setMessages(prevMessages => [...prevMessages, { isMyMessage: false, content: `${data.nickName}: ${data.message}` }]);
        }
    };

    const handleSendMessage = () => {
        if (textareaRef.current) {
            const message = textareaRef.current.value.trim();
            if (message !== "" && textWsClient?.readyState === WebSocket.OPEN) {
                textWsClient.send(JSON.stringify({
                    type: 'message',
                    roomNum: roomInfo.roomNum,
                    message: message
                }));
                setMessages(prevMessages => [...prevMessages, { isMyMessage: true, content: message }]);
                textareaRef.current.value = "";
            } else {
                console.error('텍스트 WebSocket이 열려있지 않습니다');
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

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
            if (!response.ok) throw new Error('방 입장에 실패했습니다.');
            const data = await response.json();
            setRoomInfo(data);
            localStorage.setItem(`room_${data.roomNum}`, JSON.stringify(data));
            console.log('방에 성공적으로 입장했습니다.', data);
            // 서버로부터 받은 최신 참가자 목록으로 상태 업데이트
            if (data.participantIds && currentUser) {
                const updatedUsers = data.participantIds.map(id => ({
                    id,
                    name: id === roomInfo.roomMasterId ? "방장" :
                        id === currentUser.id ? currentUser.nickname : `사용자 ${id}`,
                    isCurrentUser: id === currentUser.id
                }));
                setInUsers(updatedUsers);
                console.log('방 입장 후 참가자 목록:', updatedUsers);
            }
        } catch (error) {
            console.error('Error joining room:', error);
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
                // 방을 나간 후 상태를 업데이트합니다.
                // setRoomInfo(null);
                setMessages([]);
                setInUsers([]);
            } else {
                console.error('방 나가기에 실패했습니다.', data.message);
            }
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    };

    const handleExit = async () => {
        if (currentUser) {
            await leaveRoom(roomInfo.roomNum, currentUser.id);
            // 방이 삭제된 경우를 대비하여 상태를 리셋합니다.
            // setRoomInfo(null);
            setMessages([]);
            setInUsers([]);
        }
        navigate(`/room/${roomInfo.gameName}`);
    };

    const handleReport = () => {
        alert("신고가 접수되었습니다.");
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

            if(response.ok) {
                const data = await response.json();
                if (data.code === "OK") {
                    console.log("방 정보 업데이트 성공:", data.data);
                    const updatedRoom = data.data
                    setEditRoomInfo(updatedRoom); // 업데이트된 방 정보를 상태에 반영
                    localStorage.setItem(`room_${updatedRoom.roomNum}`, JSON.stringify(updatedRoom));
                } else {
                    console.error('방 수정 실패:', data.message);
                }
            }else {
                    const errorData = await response.json();
                    console.error('방 수정 API 호출 실패:', errorData.message);
                }
            } catch (error) {
                console.error('방 수정 중 오류 발생:', error);
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
        <div className="bg-customMainBg text-white h-screen flex flex-col">
            <div className="bg-customMainBg p-4 flex items-center">
                <FaArrowLeft className="text-2xl mr-4" onClick={handleExit} />
                <div className="text-xl font-bold flex-grow text-center">{editRoomInfo.roomTitle || "방 제목 없음"}</div>
                <div className="flex items-center ml-auto">
                    <div className="text-lg">{inUsers.length}</div>
                    <div className="text-lg">/{editRoomInfo.roomCapacityLimit || 5}</div>
                </div>
            </div>

            <div className="flex flex-grow">
                <div className="w-3/4 p-4">
                    <div className="bg-customIdBg rounded-2xl p-4 mb-4">
                        <div className="flex items-center mb-2">
                            <img src={title} alt="Title" className="w-8 h-8 mr-2" />
                            <span className="font-bold">공지사항</span>
                        </div>
                        <p>비매너시 신고 신고 누적 시 정지</p>
                    </div>

                    <div className="bg-customIdBg rounded-2xl p-4 h-3/4 overflow-y-auto" ref={chatContainerRef}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`mb-4 flex ${msg.isMyMessage ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-3/4 p-2 text-black rounded-lg ${msg.isMyMessage ? 'bg-yellow-200' : 'bg-white'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex">
                        <textarea
                            ref={textareaRef}
                            className="flex-grow bg-customChatBg text-white rounded-2xl p-2 mr-2"
                            placeholder="메시지를 입력하세요..."
                            rows="1"
                            onKeyPress={handleKeyPress}
                        />
                        <button
                            onClick={handleSendMessage}
                            className="bg-yellow-500 text-black px-4 w-20 rounded-2xl"
                        >
                            전송
                        </button>
                        <button
                            onClick={handleOpenRoomEditModal}
                            className="bg-green-500 text-white px-4 py-2 mt-4 rounded-lg"
                        >
                            방 정보 수정
                        </button>
                        <RoomEditModal
                        isOpen={isRoomEditModalOpen}
                        onClose={() => setIsRoomEditModalOpen(false)}
                        onSave={handleSaveRoomInfo}
                        currentRoomInfo={roomInfo}
                    />
                    </div>
                </div>

                <div className="w-1/4 p-4">
                    <div className="bg-customIdBg rounded-2xl p-4 mb-4">
                        <h3 className="font-bold mb-2">참가 중인 유저</h3>
                        <ul>
                            {inUsers.map(user => (
                                <li key={user.id} className={`mb-2 flex items-center ${user.isCurrentUser ? 'font-bold' : ''}`}>
                                    <FaUser className="mr-2" />
                                    {user.name}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button onClick={handleReport} className="bg-yellow-200 text-black py-2 px-4 rounded-lg w-full mb-2">
                        신고하기
                    </button>
                    <button onClick={handleExit} className="bg-red-500 text-white py-2 px-4 rounded-lg w-full">
                        나가기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TextChat;
