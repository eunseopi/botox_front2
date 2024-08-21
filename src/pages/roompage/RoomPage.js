import React, { useState, useEffect, useRef, useCallback } from 'react';
import {useNavigate, useLocation} from "react-router-dom";
import menuImage from "../../images/menu.png";
import egg from '../../images/egg.png';
import search from "../../images/search.png";
import CreateRoomModal from './CreateRoomModal';
import PasswordModal from './modal/PassWordModal'; // PasswordModal 임포트 추가
import { AiOutlineUserAdd } from "react-icons/ai";
import {FaClipboard, FaHome, FaLock, FaSignOutAlt, FaUser, FaUserFriends} from 'react-icons/fa';
import ProfileModal from "./modal/ProfileModal";
import FriendSearchModal from "./modal/FriendSearchModal";
import profile from "../../images/profile.jpg";


const GameCard = ({ room, onClick }) => {
    const userCount = typeof room.roomUserCount === 'number'
    ? room.roomUserCount
    : (Array.isArray(room.participantIds) && room.participantIds.length > 0 ? room.participantIds.length : 0);

    return (
    <div className="bg-customBoardBg rounded-lg p-4 mb-4 shadow-lg m-auto w-8/12 cursor-pointer"
         onClick={() => onClick(room)}>
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
                <div className="mr-8">
                    <p className="text-white ml-2 text-center">{room.roomNum}</p>
                </div>
                <div>
                    <div className="flex items-center">
                        <h3 className="font-bold text-white mr-2">{room.roomTitle}</h3>
                        {room.roomPassword && room.roomPassword.trim() !== '' && <FaLock className="text-yellow-500" />}
                    </div>
                    <div className="flex items-center">
                        <img src={egg} alt="Egg" className="w-5 h-3 mr-2"/>
                        <p className="text-customIdBg">{room.roomMasterId}</p>
                    </div>
                </div>
            </div>
            <div className="ml-auto text-white -mt-10">
                <p>{userCount}/{room.roomCapacityLimit}</p>
            </div>
        </div>
    </div>
    );
};

const RoomPage = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [rooms, setRooms] = useState([]);
    const [friendsModalOpen, setFriendsModalOpen] = useState(false);
    const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showFriendSearchModal, setShowFriendSearchModal] = useState(false);
    const [userData, setUserData] = useState(null);
    const modalBackground = useRef(null);
    const friendsModalBackground = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [friendList, setFriendList] = useState([]);
    const postsPerPage = 5;
    const navigate = useNavigate();
    const location = useLocation();
    const roomInfo = location.state?.roomInfo || {};
    const [lastRoomNums, setLastRoomNums] = useState({});
    const query = new URLSearchParams(location.search);
    const game = query.get('game');

    useEffect(() => {
        const storedLastRoomNum = localStorage.getItem(`lastRoomNum_${game}`);
        if (storedLastRoomNum) {
            setLastRoomNums(prevNums => ({
                ...prevNums,
                [game]: parseInt(storedLastRoomNum, 10)
            }));
        } else {
            setLastRoomNums(prevNums => ({
                ...prevNums,
                [game]: 0
            }));
        }
        fetchRoomData();
    }, [game]);


    // useEffect에서 마지막 방 번호 로드
    useEffect(() => {
        const storedLastRoomNums = JSON.parse(localStorage.getItem('lastRoomNums')) || {};
        setLastRoomNums(storedLastRoomNums);
    }, []);

    useEffect(() => {
        fetchUserData();
        fetchFriendList();
    }, []);

    const fetchFriendList = async () => {
        try {
            const token = localStorage.getItem('token');
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));

            if (!token || !userInfo || !userInfo.id) {
                console.error('User information or token is missing');
                return;
            }

            const userId = userInfo.id;

            const response = await fetch(`https://botox-chat.site/api/friendship/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch friend list');
            }

            const data = await response.json();
            console.log('Friend list data:', data);
            if (Array.isArray(data)) {
                const filteredData = data.filter(friend =>
                    friend.receiverId === userId && friend.status === 'ACCEPTED'
                );
                setFriendList(filteredData);
            } else {
                setFriendList([]);
            }
        } catch (error) {
            console.error('Error fetching friend list:', error);
            setFriendList([]);
        }
    };

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
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }

            const response = await fetch(`https://botox-chat.site/api/rooms?roomContent=${game}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Authentication failed');
                }
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const result = await response.json();
            console.log('Server response:', result);

            if (!result.data || !Array.isArray(result.data)) {
                throw new Error('Invalid data received from server');
            }

            const processedRooms = result.data.map(room => ({
                ...room,
                roomParticipantIds: [...new Set(room.roomParticipantIds)]
            }));

            const sortedRooms = processedRooms.sort((a, b) => a.roomNum - b.roomNum);
            setRooms(sortedRooms);
            setFilteredPosts(sortedRooms);

            const maxRoomNum = sortedRooms.length > 0
                ? Math.max(...sortedRooms.map(room => room.roomNum))
                : 0;

            setLastRoomNums(prevNums => ({
                ...prevNums,
                [game]: maxRoomNum
            }));
            localStorage.setItem(`lastRoomNum_${game}`, maxRoomNum.toString());
        } catch (error) {
            console.error('Error fetching room data:', error);
            setRooms([]);
            setFilteredPosts([]);
        }
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

    const handleLogoutBtn = () => {
        localStorage.removeItem('token');
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
            navigate(`/rooms/${room.roomNum}`, { state: { roomInfo: room } });
        }
    };

    const enterRoom = async (room) => {
        try {
            const token = localStorage.getItem('token');
            const userId = JSON.parse(localStorage.getItem('userInfo')).id; // 사용자 ID 가져오기

            const response = await fetch(`https://botox-chat.site/api/rooms/${room.roomNum}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: userId })
            });

            if (!response.ok) {
                throw new Error('Failed to join room');
            }

            const result = await response.json();
            if (result.code === 'NO_CONTENT') {
                // 방 입장 성공
                navigate(`/rooms/${room.roomNum}`, { state: { roomInfo: room } });
            } else {
                throw new Error(result.message || 'Failed to join room');
            }
        } catch (error) {
            console.error('Error joining room:', error);
            alert('방 입장에 실패했습니다. 다시 시도해주세요.');
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
        if (!filteredPosts || filteredPosts.length === 0) {
            return [];
        }
        const indexOfLastPost = currentPage * postsPerPage;
        const indexOfFirstPost = indexOfLastPost - postsPerPage;
        return filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
    };

    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const totalPages = filteredPosts ? Math.ceil(filteredPosts.length / postsPerPage) : 0;

    const pageNumbers = [];
    for (let i = 1; i <= Math.min(10, totalPages); i++) {
        pageNumbers.push(i);
    }

    const handleRoomCreated = (newRoom) => {
        const updatedRoom = {
            ...newRoom,
            roomContent: newRoom.roomContent
        };

        const updatedRooms = [updatedRoom, ...rooms];
        setRooms(updatedRooms);
        setFilteredPosts(updatedRooms);

        setCreateRoomModalOpen(false);

        navigate(`/rooms/${updatedRoom.roomNum}`, { state: { roomInfo: updatedRoom } });
    };

    const handlePasswordSubmit = (enteredPassword) => {
        if (enteredPassword === selectedRoom.roomPassword) {
            navigate(`/rooms/${selectedRoom.roomNum}`, { state: { roomInfo: selectedRoom } });
            setPasswordModalOpen(false);
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
    };

    const handlePasswordModalClose = () => {
        setPasswordModalOpen(false);
        setSelectedRoom(null);
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
                        <img src={menuImage} alt="Menu" className="w-10 h-10 p-2 mr-2"/>
                    </button>
                    {modalOpen && userData && (
                        <div className="fixed top-10 left-10 flex justify-center items-start z-10">
                            <div ref={modalBackground} className="bg-white p-4 w-64 rounded-xl shadow-lg">
                                <div className="flex items-center mb-4">
                                    <img src={userData.userProfilePic || profile} alt="Profile" className="w-16 h-16 rounded-full mr-4"/>
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
                        <div className="fixed top-10 left-10 flex justify-center items-start z-10">
                            <div ref={friendsModalBackground}
                                 className="bg-customFriendBg p-4 w-96 h-80 rounded-xl shadow-lg overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-white text-xl mb-4">친구 목록</h2>
                                    <AiOutlineUserAdd className="w-10 h-10 mb-2 cursor-pointer"
                                                      onClick={() => setShowFriendSearchModal(true)}/>
                                </div>
                                <hr className="mb-4"/>
                                <div className="space-y-2">
                                    {friendList && friendList.length > 0 ? (
                                        friendList.map((friend) => (
                                            <div key={friend.requestId} className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>
                                                    <span className="flex justify-between text-white">
                                                        {friend.senderId}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-white">친구 목록이 비어 있습니다.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </nav>
            </div>
            <div className="text-white text-4xl mb-6 mt-8 px-4 sm:px-8 md:px-16 lg:px-24 xl:px-80">
                <h1 className="text-center sm:text-left">방 목록</h1>
            </div>
            <div className="flex-1 p-8 bg-customMainBg overflow-y-auto">
                <div className="flex justify-end sm:mr-60 lg:mr-60 xl:mr-72 mb-4">
                    <button
                        onClick={handleCreateRoom}
                        className="text-xl text-white bg-customBoardBg p-2 rounded-xl w-48"
                    >방 만들기
                    </button>
                </div>
                <div className="mb-8">
                    {getCurrentPosts().map((room, index) => (
                        <GameCard
                            key={index}
                            room={room}
                            onClick={handleRoomClick}
                        />
                    ))}
                </div>
                <div className="flex items-center justify-center px-4">
                    <div className="relative w-full max-w-lg">
                        <input
                            type="text"
                            id="text"
                            value={roomName}
                            onChange={(e) => {
                                setRoomName(e.target.value)
                            }}
                            placeholder="제목을 입력해 주세요."
                            className="w-full p-2 pl-10 mb-3 border-0 rounded"
                        />
                        <img
                            src={search}
                            alt="Search"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        />
                    </div>
                </div>
                <div className="flex justify-center text-white">
                    {pageNumbers.map((num) => (
                        <button
                            key={num}
                            className={`mx-1 px-3 py-1 rounded hover:bg-gray-700 ${currentPage === num ? 'bg-gray-700' : ''}`}
                            onClick={() => handlePageClick(num)}
                        >
                            {num}
                        </button>
                    ))}
                    {totalPages > 10 && (
                        <button
                            className="ml-2 px-3 py-1 rounded hover:bg-gray-700"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                            다음 &gt;
                        </button>
                    )}
                </div>
            </div>
            {createRoomModalOpen && (
                <CreateRoomModal
                    onClose={handleCloseCreateRoomModal}
                    onRoomCreated={handleRoomCreated}
                    game={game}
                />
            )}
            {passwordModalOpen && (
                <PasswordModal
                    onClose={() => setPasswordModalOpen(false)}
                    onConfirm={handlePasswordConfirm}
                />
            )}
            {showFriendSearchModal && ( // 추가된 코드
                <FriendSearchModal
                    onClose={() => setShowFriendSearchModal(false)}
                />
            )}
            {showProfileModal && (
                <ProfileModal onClose={() => setShowProfileModal(false)}/>
            )}
        </div>
    );
};

export default RoomPage;
