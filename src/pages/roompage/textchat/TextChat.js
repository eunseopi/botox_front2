import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import title from '../../../images/title.png';

const TextChat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [textWsClient, setTextWsClient] = useState(null);
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const roomInfo = location.state?.roomInfo || {};
    const [inUsers, setInUsers] = useState([]);
    const WS_SERVER_URL = 'wss://botox-chat.site/ws';

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
    }, [WS_SERVER_URL, roomInfo.roomNum]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const dummyUsers = Array(roomInfo.roomCapacityLimit).fill().map((_, index) => ({
            id: index + 1,
            name: index === 0 ? "방장" : `사용자${index + 1}`
        }));
        setInUsers(dummyUsers.slice(0, Math.floor(Math.random() * roomInfo.roomCapacityLimit) + 1));
    }, [roomInfo.roomCapacityLimit]);

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

    const handleExit = () => {
        navigate(`/room/${roomInfo.gameName}`);
    };

    const handleReport = () => {
        alert("신고가 접수되었습니다.");
    };

    return (
        <div className="bg-customMainBg text-white h-screen flex flex-col">
            <div className="bg-customMainBg p-4 flex items-center">
                <FaArrowLeft className="text-2xl mr-4" onClick={handleExit} />
                <div className="text-xl font-bold flex-grow text-center">{roomInfo.roomTitle || "방 제목 없음"}</div>
                <div className="flex items-center ml-auto">
                    <div className="text-lg">{inUsers.length}</div>
                    <div className="text-lg">/{roomInfo.roomCapacityLimit || 5}</div>
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
                    </div>
                </div>

                <div className="w-1/4 p-4">
                    <div className="bg-customIdBg rounded-2xl p-4 mb-4">
                        <h3 className="font-bold mb-2">참가 중인 유저</h3>
                        {inUsers.map((user) => (
                            <div key={user.id} className="flex items-center mb-2">
                                <FaUser className="mr-2" />
                                <span>{user.name}</span>
                            </div>
                        ))}
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
