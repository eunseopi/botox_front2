import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import menuImage from "../../images/menu.png";
import roomIcon from '../../images/roomIcon.png';
import egg from '../../images/egg.png';
import search from "../../images/search.png";
import CreateRoomModal from './CreateRoomModal';
import PasswordModal from './modal/PassWordModal';
import { AiOutlineUserAdd } from "react-icons/ai";
import { FaClipboard, FaHome, FaLock, FaSignOutAlt, FaUser, FaUserFriends } from 'react-icons/fa';
import ProfileModal from "./modal/ProfileModal";
import FriendSearchModal from "./FriendSearchModal";

const GameCard = ({ room, onClick }) => (
    <div className="bg-customBoardBg rounded-lg p-4 mb-4 shadow-lg m-auto w-8/12 cursor-pointer"
         onClick={() => onClick(room)}>
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
                <div className="mr-8">
                    <img src={roomIcon} alt="Room" className="w-3 h-3 ml-5 mr-3 mt-2 mb-2 " />
                    <p className="text-white text-center">{room.roomNum}</p>
                </div>
                <div>
                    <div className="flex items-center">
                        <h3 className="font-bold text-white mr-2">{room.roomTitle}</h3>
                        {room.roomPassword && room.roomPassword.trim() !== '' && <FaLock className="text-yellow-500" />}
                    </div>
                    <div className="flex items-center">
                        <img src={egg} alt="Egg" className="w-5 h-3 mr-2" />
                        <p className="text-customIdBg">{room.roomMasterId}</p>
                    </div>
                </div>
            </div>
            <div className="ml-auto text-white -mt-10">
                <p>{room.roomParticipantIds ? room.roomParticipantIds.length : 0}/{room.roomCapacityLimit}</p>
            </div>
        </div>
    </div>
);

const RoomPage = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [friendsModalOpen, setFriendsModalOpen] = useState(false);
    const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [nickname, setNickname] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showFriendSearchModal, setShowFriendSearchModal] = useState(false);
    const [userData, setUserData] = useState(null);
    const modalBackground = useRef(null);
    const friendsModalBackground = useRef(null);
    const { game } = useParams();  // URL 파라미터에서 game 읽기
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => {
        fetchRoomData();
    }, []);

    useEffect(() => {
        filterRoomsByGame();
    }, [rooms, game]);

    useEffect(() => {
        fetchUserData();
    }, []);

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

    const fetchRoomData = async () => {
        try {
            const response = await fetch('https://botox-chat.site/api/rooms', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                console.error('HTTP error:', response.status, response.statusText);
                return;
            }

            const responseData = await response.text();
            let data;

            try {
                data = JSON.parse(responseData);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError, responseData);
                return;
            }

            if (data.code === "OK") {
                setRooms(data.data);
            } else {
                console.error('Error fetching room data:', data.message);
            }
        } catch (error) {
            console.error('Error fetching room data:', error);
        }
    };

    const filterRoomsByGame = () => {
        if (!game) return;
        const filtered = rooms.filter(room => room.gameName === game);
        setFilteredRooms(filtered);
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
    }

    const handleBoardClick = () => {
        navigate('/board');
    }

    const handleClickHome = () => {
        navigate('/');
    }

    const handleWrite = () => {
        navigate('/write');
    }

    const handleLogoutBtn = () => {
        navigate('/login');
    }

    const handleMyPageClick = () => {
        setShowProfileModal(true);
        setModalOpen(false);
    }

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

    const getCurrentPosts = () => {
        const indexOfLastPost = currentPage * postsPerPage;
        const indexOfFirstPost = indexOfLastPost - postsPerPage;
        return filteredRooms.slice(indexOfFirstPost, indexOfLastPost);
    };

    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const totalPages = Math.ceil(filteredRooms.length / postsPerPage);

    const pageNumbers = [];
    for (let i = 1; i <= Math.min(10, totalPages); i++) {
        pageNumbers.push(i);
    }

    const handleRoomCreated = (newRoom) => {
        const updatedRooms = [
            ...rooms,
            newRoom
        ];
        setRooms(updatedRooms);
        filterRoomsByGame();
        setCreateRoomModalOpen(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    return (
        <div className="flex flex-col h-full">
            <div className="w-full bg-customTopNav h-10">
                <nav className="flex items-center justify-between px-4">
                    <button type="button" onClick={() => setModalOpen(!modalOpen)}>
                        <img src={menuImage} alt="Menu" className="w-10 h-10 p-2 mr-2" />
                    </button>
                    <button type="button" onClick={handleClickHome}>
                        <FaHome className="text-white text-3xl" />
                    </button>
                    <button type="button" onClick={handleWrite}>
                        <AiOutlineUserAdd className="text-white text-3xl" />
                    </button>
                </nav>
            </div>

            {modalOpen && (
                <div className="absolute top-0 left-0 right-0 bottom-0 bg-gray-800 bg-opacity-50 flex items-center justify-center" ref={modalBackground}>
                    <div className="bg-white rounded-lg p-6 shadow-lg w-1/3">
                        <h2 className="text-xl font-bold mb-4">Menu</h2>
                        <ul>
                            <li>
                                <button onClick={handleMyPageClick} className="flex items-center text-gray-700">
                                    <FaUser className="mr-2" />
                                    <span>My Page</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={handleFriendClick} className="flex items-center text-gray-700">
                                    <FaUserFriends className="mr-2" />
                                    <span>Friends</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={handleCreateRoom} className="flex items-center text-gray-700">
                                    <FaClipboard className="mr-2" />
                                    <span>Create Room</span>
                                </button>
                            </li>
                            <li>
                                <button onClick={handleLogoutBtn} className="flex items-center text-gray-700">
                                    <FaSignOutAlt className="mr-2" />
                                    <span>Logout</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {createRoomModalOpen && (
                <CreateRoomModal onCreate={handleRoomCreated} onClose={handleCloseCreateRoomModal} />
            )}

            {passwordModalOpen && (
                <PasswordModal onConfirm={handlePasswordConfirm} onClose={() => setPasswordModalOpen(false)} />
            )}

            {showProfileModal && (
                <ProfileModal
                    profileImage={profileImage}
                    nickname={nickname}
                    onClose={() => setShowProfileModal(false)}
                />
            )}

            {showFriendSearchModal && (
                <FriendSearchModal
                    onClose={() => setShowFriendSearchModal(false)}
                />
            )}

            <div className="flex flex-col items-center mt-4">
                <input
                    type="text"
                    placeholder="Search..."
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="p-2 border rounded"
                />
                <img src={search} alt="Search" className="w-8 h-8 cursor-pointer" />
            </div>

            <div className="flex flex-col items-center mt-4">
                {getCurrentPosts().map(room => (
                    <GameCard key={room.roomNum} room={room} onClick={handleRoomClick} />
                ))}
            </div>

            <div className="flex justify-center mt-4">
                <ul className="flex">
                    {pageNumbers.map(number => (
                        <li key={number} className="mx-1">
                            <button
                                onClick={() => handlePageClick(number)}
                                className={`p-2 border rounded ${number === currentPage ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}
                            >
                                {number}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default RoomPage;
