import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import title from '../../../images/title.png';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import RoomEditModal from "../modal/RoomEditModal";

const TextChat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [textWsClient, setTextWsClient] = useState(null);
    const [userData, setUserData] = useState(null);
    const [newNickname, setNewNickname] = useState("");
    const [RoomInfo, setRoomInfo] = useState(null);
    const [stompClient, setStompClient] = useState(null);
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const roomInfo = location.state?.roomInfo || {}; // Ensure roomInfo is an object
    const [currentUser, setCurrentUser] = useState(null);
    const [inUsers, setInUsers] = useState([]);
    const { roomNum } = useParams();
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
            const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
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
        const socket = new WebSocket('ws://localhost:8080/ws'); // WebSocket 서버 URL을 확인하세요.
        const stompClient = Stomp.over(socket);

        stompClient.connect({}, (frame) => {
            console.log('Connected:', frame);
            stompClient.subscribe(`/sub/chatroom/${roomNum}`, (message) => {
                console.log('Received message:', message.body); // 수신된 메시지 로그 추가
                const newMessage = JSON.parse(message.body);
                setMessages((prevMessages) => [...prevMessages, newMessage]);
            });
            setStompClient(stompClient);
            setIsConnected(true);
        }, (error) => {
            console.error('Error connecting to WebSocket:', error);
        });

        return () => {
            if (stompClient) {
                stompClient.disconnect();
                setIsConnected(false);
            }
        };
    }, [roomNum]);

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
            const participants = roomInfo.participants || []; // Default to an empty array if participants is undefined

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

    const handleSendMessage = () => {
        console.log('STOMP Client:', stompClient);
        console.log('STOMP Client Connected:', stompClient && stompClient.connected);

        if (stompClient && stompClient.connected && newMessage.trim()) {
            const message = {
                chatRoomId: roomNum,
                name: userData.name || '익명',
                message: newMessage,
                timestamp: new Date().toISOString()
            };
            console.log('Sending message:', message); // 로그 추가
            stompClient.send('/pub/message', {}, JSON.stringify(message));
            setNewMessage('');
        } else {
            console.error('STOMP 클라이언트가 연결되지 않았거나 메시지가 비어 있습니다.');
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
            const response = await fetch(`http://localhost:8080/api/rooms/${roomNum}/leave`, {
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
            const response = await fetch(`http://localhost:8080/api/rooms/${roomNum}`, {
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
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button
                            onClick={() => {
                                console.log('버튼 클릭됨');
                                handleSendMessage();
                            }}
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
