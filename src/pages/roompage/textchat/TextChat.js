import React, { useEffect, useRef, useState } from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import title from '../..//../images/title.png'

const TextChat = () => {
    const [messages, setMessages] = useState([]);
    const chatContainerRef = useRef(null);
    const textareaRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const roomInfo = location.state?.roomInfo || {};
    const [inUsers, setInUsers] = useState([]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        // 실제 사용할 때 API 가져와서 바꾸기.
        const dummyUsers = Array(roomInfo.roomCapacityLimit).fill().map((_, index) => ({
            id: index + 1,
            name: index === 0 ? "방장" : `사용자${index + 1}`
        }));
        setInUsers(dummyUsers.slice(0, Math.floor(Math.random() * roomInfo.roomCapacityLimit) + 1));
    }, [roomInfo.roomCapacityLimit]);

    const handleSendMessage = () => {
        if (textareaRef.current) {
            const message = textareaRef.current.value.trim();
            if (message !== "") {
                setMessages(prevMessages => [...prevMessages, { isMyMessage: true, content: message }]);
                textareaRef.current.value = "";
                simulateResponse();
            }
        }
    };

    // 나중에 API 호출 할 코드.
    /*
    fetch('/api/chats', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer <your-token>',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            roomId: roomInfo.id,
            senderId: 1, // 실제 사용자 ID로 대체해야 합니다
            content: content
        })
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
    */

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const simulateResponse = () => {
        setTimeout(() => {
            const responses = [
                "네, 알겠습니다.",
                "좋아요!",
                "그렇군요.",
                "알겠습니다.",
                "네, 그렇게 하죠.",
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            setMessages(prevMessages => [...prevMessages, { isMyMessage: false, content: randomResponse }]);
        }, 1000);
    };


    // const handleSendMessage = () => {
    //     if (textareaRef.current) {
    //         const message = textareaRef.current.value.trim();
    //         if (message !== "") {
    //             const newMessage = {
    //                 id: Date.now(),
    //                 senderId: 1, // 임시로 고정된 senderId 사용
    //                 senderName: "나", // 임시로 고정된 이름 사용
    //                 content: message,
    //                 timestamp: new Date().toISOString(),
    //             };
    //             setMessages(prevMessages => [...prevMessages, newMessage]);
    //             textareaRef.current.value = "";
    //         }
    //     }
    // };
    const handleExit = (game) => {
        navigate(`/room/${game}`);
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
}

export default TextChat;