import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/index.css';  // 스타일 시트
import userIcon from '../../images/user-icon.png';  // 사용자 아이콘
import menuImage from "../../images/menu.png";
import roomIcon from '../../images/roomIcon.png';
import egg from '../../images/egg.png';
import search from "../../images/search.png";
import CreateRoomModal from './CreateRoomModal';
import PasswordModal from './modal/PassWordModal'; // PasswordModal 임포트 추가
import { AiOutlineUserAdd } from "react-icons/ai";
import { FaClipboard, FaHome, FaLock, FaSignOutAlt, FaUser, FaUserFriends } from 'react-icons/fa';
import ProfileModal from "./modal/ProfileModal";
import FriendSearchModal from "./modal/FriendSearchModal"; // FriendSearchModal 임포트 추가

const RoomPage = () => {
    const { game } = useParams();  // URL 파라미터에서 game 읽기
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [friendsModalOpen, setFriendsModalOpen] = useState(false);
    const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false); // 비밀번호 모달 상태 추가
    const [selectedRoom, setSelectedRoom] = useState(null); // 선택된 방 상태 추가
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showFriendSearchModal, setShowFriendSearchModal] = useState(false);
    const [userData, setUserData] = useState(null);
    const modalBackground = useRef(null);
    const friendsModalBackground = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserData();
        fetchRoomData(game);
    }, [game]);

    const fetchUserData = async () => {
        const userId = JSON.parse(localStorage.getItem('userInfo')).username;
        if (!userId) {
            console.error('No username found in localStorage');
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`https://botox-chat.site/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setUserData({
                ...data.data,
                nickname: data.data.userNickname,
                status: data.data.status
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchRoomData = async (game) => {
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:8080/api/rooms/${game}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.code === "OK") {
                setRooms(data.data);
            } else {
                setError(data.message);
            }
        } catch (error) {
            setError('Error fetching room data.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoomClick = (room) => {
        if (room.roomPassword && room.roomPassword.trim() !== '') {
            setSelectedRoom(room);
            setPasswordModalOpen(true);
        } else {
            enterRoom(room);
        }
    };

    const enterRoom = (room) => {
        if (room.roomType === 'voice') {
            navigate(`/voicechat/${room.roomNum}`, { state: { roomInfo: room } });
        } else {
            navigate(`/textchat/${room.roomNum}`, { state: { roomInfo: room } });
        }
    };

    const handlePasswordConfirm = (enteredPassword) => {
        if (enteredPassword === selectedRoom.roomPassword) {
            enterRoom(selectedRoom);
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
    };

    const handleCreateRoom = () => {
        setCreateRoomModalOpen(true);
    };

    const handleCloseCreateRoomModal = () => {
        setCreateRoomModalOpen(false);
    };

    const handleRoomCreated = (newRoom) => {
        const updatedRooms = [newRoom, ...rooms];
        setRooms(updatedRooms);
        localStorage.setItem('rooms', JSON.stringify(updatedRooms));
        setCreateRoomModalOpen(false);
    };

    const handleClickOutside = useCallback((e) => {
        if (modalOpen && modalBackground.current && !modalBackground.current.contains(e.target)) {
            setModalOpen(false);
        }
        if (friendsModalOpen && friendsModalBackground.current && !friendsModalBackground.current.contains(e.target)) {
            setFriendsModalOpen(false);
        }
    }, [modalOpen, friendsModalOpen]);

    const handleFriendClick = () => {
        setFriendsModalOpen(true);
        setModalOpen(false);
    };

    const handleBoardClick = () => {
        navigate('/board');
    };

    const handleClickHome = () => {
        navigate('/');
    };

    const handleLogoutBtn = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleMyPageClick = () => {
        setShowProfileModal(true);
        setModalOpen(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="w-full bg-customTopNav h-10">
                <nav className="flex items-center justify-between px-4">
                    <button type="button" onClick={() => setModalOpen(!modalOpen)}>
                        <img src={menuImage} alt="Menu" className="w-10 h-10 p-2 mr-2" />
                    </button>
                    <h1 className="text-white text-2xl font-bold">{game} Rooms</h1>
                    {modalOpen && userData && (
                        <div className="fixed top-10 left-10 flex justify-center items-start">
                            <div ref={modalBackground} className="bg-white p-4 w-64 rounded-xl shadow-lg">
                                <div className="flex items-center mb-4">
                                    <img src={userData.profilePicUrl} alt="Profile" className="w-16 h-16 rounded-full mr-4" />
                                    <div>
                                        <p className="text-xl font-semibold">{userData.nickname}</p>
                                        <p className="text-sm text-gray-500">{userData.status}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <button onClick={handleMyPageClick} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
                                        <FaUser className="inline-block mr-2" /> 마이페이지
                                    </button>
                                    <button onClick={handleClickHome} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
                                        <FaHome className="inline-block mr-2" /> 홈
                                    </button>
                                    <button onClick={handleBoardClick} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
                                        <FaClipboard className="inline-block mr-2" /> 게시판
                                    </button>
                                    <button onClick={handleFriendClick} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded">
                                        <FaUserFriends className="inline-block mr-2" /> 친구목록
                                    </button>
                                    <button onClick={handleLogoutBtn} className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded text-red-500">
                                        <FaSignOutAlt className="inline-block mr-2" /> 로그아웃
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {friendsModalOpen && (
                        <div className="fixed top-10 left-10 flex justify-center items-start z-1">
                            <div ref={friendsModalBackground} className="bg-customFriendBg p-4 w-96 h-80 rounded-xl shadow-lg">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-white text-xl mb-4">친구 목록</h2>
                                    <AiOutlineUserAdd className="w-10 h-10 mb-2" onClick={() => setShowFriendSearchModal(true)} />
                                </div>
                                <div className="text-center text-white">
                                    {/* 친구 목록을 여기 렌더링 */}
                                    친구 목록이 여기에 표시됩니다.
                                </div>
                            </div>
                        </div>
                    )}
                </nav>
            </div>
            <div className="flex-grow bg-customMainBg p-4">
                <div className="text-center mb-4">
                    <h2 className="text-3xl text-white font-light">Available Rooms</h2>
                </div>
                <div className="flex flex-wrap justify-center">
                    {rooms.length > 0 ? (
                        rooms.map(room => (
                            <div
                                key={room.roomNum}
                                className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 p-2"
                                onClick={() => handleRoomClick(room)}
                            >
                                <div className="bg-white rounded-lg shadow-lg p-4 cursor-pointer hover:bg-gray-100">
                                    <h3 className="text-lg font-semibold">{room.roomTitle}</h3>
                                    <p className="text-sm text-gray-600">{room.roomContent}</p>
                                    <div className="flex items-center mt-2">
                                        <img src={userIcon} alt="User" className="w-4 h-4 mr-1" />
                                        <span>{room.roomUserCount} / {room.roomCapacityLimit}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-white">No rooms available</div>
                    )}
                </div>
            </div>
            <div className="fixed bottom-0 right-0 m-4">
                <button
                    className="bg-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
                    onClick={handleCreateRoom}
                >
                    +
                </button>
            </div>
            {createRoomModalOpen && (
                <CreateRoomModal onClose={handleCloseCreateRoomModal} onRoomCreated={handleRoomCreated} />
            )}
            {passwordModalOpen && selectedRoom && (
                <PasswordModal onClose={() => setPasswordModalOpen(false)} onPasswordConfirm={handlePasswordConfirm} />
            )}
            {showProfileModal && (
                <ProfileModal onClose={() => setShowProfileModal(false)} userData={userData} />
            )}
            {showFriendSearchModal && (
                <FriendSearchModal onClose={() => setShowFriendSearchModal(false)} />
            )}
        </div>
    );
}

export default RoomPage;
