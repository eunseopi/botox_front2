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
    const roomInfo = location.state?.roomInfo || {};
    const textareaRef = useRef(null);
    const [inUsers, setInUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // 로그인한 사용자 정보 가져오기
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setCurrentUser(userInfo);

        // 방장을 포함한 초기 사용자 목록 설정
        const initialUsers = [
            { id: roomInfo.roomMasterId, nickname: "방장" },
            { id: userInfo.id, nickname: userInfo.nickname }
        ];
        setInUsers(initialUsers);

        // 방 입장 API 호출
        joinRoom(roomInfo.roomNum, userInfo.id);

        // 컴포넌트 언마운트 시 방 나가기 API 호출
        return () => leaveRoom(roomInfo.roomNum, userInfo.id);
    }, [roomInfo.roomNum, roomInfo.roomMasterId]);

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
            // 성공적으로 방에 입장했을 때의 처리
            console.log('방에 성공적으로 입장했습니다.');
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
            if (!response.ok) throw new Error('방 나가기에 실패했습니다.');
            console.log('방을 성공적으로 나갔습니다.');
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    };

    const handleSendMessage = () => {
        const content = textareaRef.current.value.trim();
        if (content !== "") {
            const newMessage = {
                id: Date.now(),
                senderId: currentUser.id,
                senderName: currentUser.nickname,
                content: content,
                timestamp: new Date().toISOString(),
            };
            setMessages(prevMessages => [...prevMessages, newMessage]);
            textareaRef.current.value = "";

            // 메시지 전송 API 호출 (추후 구현)
        }
    };

    const handleBack = () => {
        leaveRoom(roomInfo.roomNum, currentUser.id);
        navigate(`/room/${roomInfo.gameName}`);
    };

    const handleCallEnd = () => {
        leaveRoom(roomInfo.roomNum, currentUser.id);
        navigate(`/room/${roomInfo.gameName}`);
    };

    return (
        <div className="h-screen overflow-y-hidden bg-customMainBg text-white mt-5 ml-14">
            <div className="flex p-4">
                <div className="flex items-center">
                    <FaArrowLeft className="w-14 h-14 mr-8 cursor-pointer" onClick={handleBack} />
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
                            <div className="text-lg">{user.nickname} {user.id === roomInfo.roomMasterId ? "(방장)" : ""}</div>
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
                    <img width="50%" height="40" src={friend} alt="invite" className="cursor-pointer" />
                </div>
            </div>
            <div className="absolute bottom-5 w-11/12 h-1/3 ml-8 bg-customFriendBg p-4 rounded-2xl">
                <div className="h-2/3 overflow-y-auto mb-4">
                    {messages.map(message => (
                        <div key={message.id} className={`mb-2 ${message.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
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