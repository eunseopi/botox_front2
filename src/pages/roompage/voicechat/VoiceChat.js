import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import volume from '../../../images/volume.png';
import mute from '../../../images/mute.png';
import call from '../../../images/call.png';
import report from '../../../images/report.png';
import friend from '../../../images/friend.png';
import { FaArrowLeft } from 'react-icons/fa';

function VoiceChat() {
    const navigate = useNavigate();
    const location = useLocation();
    const roomInfo = location.state?.roomInfo || {};  // 방 정보 가져오기
    const textareaRef = useRef(null);
    const [inUsers, setInUsers] = useState([]);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        // 방에 들어갔을 때 더미 사용자 설정
        const dummyUsers = Array(roomInfo.roomCapacityLimit).fill().map((_, index) => ({
            id: index + 1,
            name: index === 0 ? "방장" : `사용자${index + 1}`
        }));
        setInUsers(dummyUsers.slice(0, Math.floor(Math.random() * roomInfo.roomCapacityLimit) + 1));
    }, [roomInfo.roomCapacityLimit]);

    const handleSendMessage = () => {
        const content = textareaRef.current.value.trim();
        if (content !== "") {
            const newMessage = {
                id: Date.now(),
                senderId: 1,
                senderName: "나",
                content: content,
                timestamp: new Date().toISOString(),
            };
            setMessages(prevMessages => [...prevMessages, newMessage]);
            textareaRef.current.value = "";

            // 나중에 API 호출 할 코드
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
        }
    };

    const handleBack = () => {
        navigate(`/room/${roomInfo.gameName}`);
    };

    return (
        <div className="h-screen overflow-y-hidden bg-customMainBg text-white mt-5 ml-14">
            <div className="flex p-4">
                <div className="flex items-center">
                    <FaArrowLeft className="w-14 h-14 mr-8" onClick={handleBack} />
                    <img width="64" height="64" src="https://img.icons8.com/wired/64/F25081/microphone.png" alt="microphone" />
                </div>
                <div className="ml-4 mt-3 text-2xl">
                    {roomInfo.roomTitle || "방 제목 없음"}
                </div>
                <div className="flex items-center ml-auto">
                    <div className="text-lg">{inUsers.length}</div>
                    <div className="text-lg">/{roomInfo.roomCapacityLimit || 5}</div>
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
            <div className="flex justify-center mt-4">
                {/* <voiceChatRoomUserContent /> */}
            </div>
            <div className="fixed bottom-1/2 w-full p-4 bg-customMainBg flex justify-between">
                <div className="flex space-x-10 items-center m-auto">
                    <img width="50%" height="40" src={volume} alt="volume" />
                    <img width="50%" height="40" src={mute} alt="mute" />
                    <img width="50%" height="40" src={call} alt="phone" />
                </div>
                <div className="flex space-x-5 mr-16">
                    <img width="50%" height="40" src={report} alt="siren" />
                    <img width="50%" height="40" src={friend} alt="invite" />
                </div>
            </div>
            <div className="absolute bottom-5 w-11/12 h-1/3 ml-8 bg-customFriendBg p-4 rounded-2xl">
                <div className="h-2/3 overflow-y-auto mb-4">
                    {messages.map(message => (
                        <div key={message.id} className={`mb-2 ${message.senderId === 1 ? 'text-right' : 'text-left'}`}>
                            <span className="font-bold mr-5">{message.senderName}</span>
                            <span>{message.content}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4">
                    <div className="flex-1">
                        <textarea ref={textareaRef}
                                  placeholder="채팅을 입력해주세요."
                                  className="absolute w-11/12 h-1/6 p-2 bottom-2 rounded-lg bg-customIdBg text-white border-none border-gray-600"
                                  onKeyPress={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleSendMessage();
                                      }
                                  }}
                        ></textarea>
                    </div>
                    <div className="flex items-center">
                        <button onClick={handleSendMessage} className="absolute right-5 h-14 w-20 bottom-2 bg-yellow-400 opacity-70 text-black py-2 px-4 rounded-lg">전송
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VoiceChat;
