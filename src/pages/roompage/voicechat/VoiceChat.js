import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
            const participants = roomInfo.participants || [];
            const updatedUsers = participants.map(user => ({
                id: user.id,
                name: user.id === currentUser.id ? userData?.userNickname || "내 닉네임" : user.nickname,
                isCurrentUser: user.id === currentUser.id
            }));

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
            console.log(`Attempting to join room ${roomNum} with user ${userId}`);
            const response = await fetch(`https://botox-chat.site/api/rooms/${roomNum}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await response.json();
            console.log('Join room response:', data);
            if (!response.ok) throw new Error(data.message || '방 입장에 실패했습니다.');

            // 중복된 참가자 ID 제거
            const uniqueParticipantIds = [...new Set(data.participantIds)];
            if (data.participantIds && currentUser) {
                const updatedUsers = uniqueParticipantIds.map(id => ({
                    id,
                    name: id === roomInfo.roomMasterId ? "방장" :
                        id === currentUser.id ? currentUser.nickname : `사용자 ${id}`,
                    isCurrentUser: id === currentUser.id
                }));
                setInUsers(updatedUsers);
                console.log('중복 제거 후 참가자 목록:', updatedUsers);
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
                setMessages([]);
                setInUsers([]);

                // 방 목록에서 해당 방을 제거
                setRooms(prevRooms => prevRooms.filter(room => room.roomNum !== roomNum));
                setFilteredPosts(prevRooms => prevRooms.filter(room => room.roomNum !== roomNum));
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
        if (currentUser) {
            await leaveRoom(roomInfo.roomNum, currentUser.id);
            setMessages([]);
            setInUsers([]);
        }
        const gameName = roomInfo.roomContent || 'defaultGame'; // gameName이 없을 경우 기본값 설정
        navigate(`/rooms?game=${gameName}`);
    };

    const handleCallEnd = async () => {
        if (currentUser) {
            await leaveRoom(roomInfo.roomNum, currentUser.id);
            setMessages([]);
            setInUsers([]);
        }
        const gameName = roomInfo.roomContent || 'defaultGame'; // gameName이 없을 경우 기본값 설정
        navigate(`/rooms?game=${gameName}`);
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
        const fetchRoomInfo = async () => {
            try {
                console.log(`Fetching info for room ${roomNum}`);
                const response = await fetch(`https://botox-chat.site/api/rooms?roomNum=${roomNum}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    }
                });
                const result = await response.json();
                console.log("Room info API response:", result);
                if (result.code === "OK" && result.data) {
                    setRoomInfo(result.data);
                } else {
                    console.error("Failed to fetch room data:", result.message);
                }
            } catch (error) {
                console.error("Error fetching room data:", error);
            }
        };

        fetchRoomInfo();
    }, [roomNum]);

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
