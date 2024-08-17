import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import volume from '../../../images/volume.png';
import mute from '../../../images/mute.png';
import call from '../../../images/call.png';
import report from '../../../images/report.png';
import friend from '../../../images/friend.png';
import { FaArrowLeft } from 'react-icons/fa';

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
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const roomInfo = location.state?.roomInfo || {};
    const [userData, setUserData] = useState(null);
    const textareaRef = useRef(null);
    const [newNickname, setNewNickname] = useState("");
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
        const storedRoomInfo = localStorage.getItem(`room_${roomNum}`);
        if (storedRoomInfo) {
            setRoomInfo(JSON.parse(storedRoomInfo));
        } else {
            console.error('로컬 스토리지에서 방 정보를 찾을 수 없습니다.');
        }
    }, [roomNum]);

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
            if (!response.ok) throw new Error('방 나가기에 실패했습니다.');
            const data = await response.json();
            console.log('방을 성공적으로 나갔습니다.', data);
            if (data.participantIds) {
                setInUsers(data.participantIds.map(id => ({ id, nickname: `사용자 ${id}` })));
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
        }
        navigate(`/room/${roomInfo.gameName}`);
    };

    const handleCallEnd = async () => {
        if (currentUser) {
            await leaveRoom(roomInfo.roomNum, currentUser.id);
        }
        navigate(`/room/${roomInfo.gameName}`);
    };

    const handleRoomUpdate = async (updatedRoomInfo) => {
        if (!currentUser || currentUser.id !== roomInfo.roomMasterId) {
            console.error('방장만 방 정보를 수정할 수 있습니다.');
            return;
        }

        try {
            const response = await fetch(`https://botox-chat.site/api/rooms/${roomNum}`, {
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
                    setEditRoomInfo(updatedRoom);
                    localStorage.setItem(`room_${updatedRoom.roomNum}`, JSON.stringify(updatedRoom));
                    console.log('방 수정 완료:', updatedRoom);
                    setIsEditing(false);
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