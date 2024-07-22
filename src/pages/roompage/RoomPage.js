import React, { useState, useEffect, useRef, useCallback } from 'react';
import {useNavigate, useLocation, useParams} from "react-router-dom";
import menuImage from "../../images/menu.png";
import roomIcon from '../../images/roomIcon.png';
import egg from '../../images/egg.png';
import search from "../../images/search.png";
import CreateRoomModal from './CreateRoomModal';
import PasswordModal from './modal/PassWordModal'; // PasswordModal 임포트 추가
import { AiOutlineUserAdd } from "react-icons/ai";
import {FaClipboard, FaHome, FaLock, FaSignOutAlt, FaUser, FaUserFriends} from 'react-icons/fa';
import ProfileModal from "./modal/ProfileModal";

const FriendSearchModal = ({ onClose }) => {
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = async () => {
        // 검색 로직 나중에 추가.
        // 예를 들어, API를 호출하여 검색 결과를 가져오기
        // setSearchResults(apiResponse);
    };

    const handleSendFriendRequest = async (receiverId) => {
        try {
            const response = await fetch('/api/friendship/request', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer <your-token>',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senderId: 1, // 실제 사용자 ID로 대체해야 합니다
                    receiverId: receiverId
                })
            });
            const data = await response.json();
            alert(data.message);
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl mb-4">친구 추가</h2>
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="닉네임을 입력하세요"
                    className="w-full p-2 border rounded mb-4"
                />
                <button onClick={handleSearch} className="w-full bg-blue-500 text-white p-2 rounded mb-4">검색</button>
                <div>
                    {searchResults.map((result) => (
                        <div key={result.id} className="flex items-center justify-between mb-2">
                            <span>{result.nickname}</span>
                            <button onClick={() => handleSendFriendRequest(result.id)} className="bg-green-500 text-white p-2 rounded">추가</button>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="w-full bg-gray-500 text-white p-2 rounded">닫기</button>
            </div>
        </div>
    );
};


const GameCard = ({ room, onClick }) => (
    <div className="bg-customBoardBg rounded-lg p-4 mb-4 shadow-lg m-auto w-8/12 cursor-pointer"
         onClick={() => onClick(room)}>
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
                <div className="mr-8">
                    <img src={roomIcon} alt="Room" className="w-3 h-3 ml-5 mr-3 mt-2 mb-2 "/>
                    <p className="text-white text-center">{room.roomNum}</p>
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
                <p>{room.roomParticipantIds ? room.roomParticipantIds.length : 0}/{room.roomCapacityLimit}</p>
            </div>
        </div>
    </div>
);

const RoomPage = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [rooms, setRooms] = useState([]);
    const [friendsModalOpen, setFriendsModalOpen] = useState(false);
    const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false); // 비밀번호 모달 상태 추가
    const [selectedRoom, setSelectedRoom] = useState(null); // 선택된 방 상태 추가
    // const [friendSearchInput, setFriendSearchInput] = useState('');
    // const [friendSearchResults, setFriendSearchResults] = useState([]);
    const [nickname, setNickname] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showFriendSearchModal, setShowFriendSearchModal] = useState(false);
    const [userData, setUserData] = useState(null);
    const modalBackground = useRef(null);
    const friendsModalBackground = useRef(null);
    const { game } = useParams();  // URL 파라미터에서 game 읽기
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [lastRoomNum, setLastRoomNum] = useState(0);
    const postsPerPage = 5;
    const navigate = useNavigate();
    const location = useLocation();


    useEffect(() => {
        fetchUserData();
        fetchRoomData();
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
            const response = await fetch(`https://botox-chat.site/api/rooms/${game}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.code === "OK") {
                setRooms(data.data);
                // 가장 큰 roomNum 찾기
                const maxRoomNum = Math.max(...data.data.map(room => room.roomNum), 0);
                setLastRoomNum(maxRoomNum);
            } else {
                console.error('Error fetching room data:', data.message);
            }
        } catch (error) {
            console.error('Error fetching room data:', error);
        }
    };



    useEffect(() => {
        // LocalStorage에서 방 목록 가져오기
        const storedRoomsString = localStorage.getItem('rooms');
        let storedRooms = [];

        if (storedRoomsString) {
            try {
                storedRooms = JSON.parse(storedRoomsString);
            } catch (error) {
                console.error('Error parsing stored rooms:', error);
            }
        }

        if (storedRooms.length > 0) {
            setRooms(storedRooms);
        } else {
            // 초기 방이 없을 경우 더미 데이터 사용
            const initialRooms = [
                { roomNum: 101909, roomTitle: "쵸비 VS 에디 대전", roomMasterId: "동욱" },
            ];
            setRooms(initialRooms);
            localStorage.setItem('rooms', JSON.stringify(initialRooms));
        }
    }, []);

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
        navigate('/write')
    }

    const handleLogoutBtn = () => {
        // localStorage.removeItem('token');
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
        return filteredPosts.slice(indexOfFirstPost, indexOfLastPost);
    };

    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

    const pageNumbers = [];
    for (let i = 1; i <= Math.min(10, totalPages); i++) {
        pageNumbers.push(i);
    }

    const handleRoomCreated = (newRoom) => {
        const updatedRooms = [
            {
                ...newRoom,
                roomContent: game  // 게임 정보를 roomContent에 저장
            },
            ...rooms
        ];
        setRooms(updatedRooms);
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
                        <img src={menuImage} alt="Menu" className="w-10 h-10 p-2 mr-2"/>
                    </button>
                    {modalOpen && userData && (
                        <div className="fixed top-10 left-10 flex justify-center items-start">
                            <div ref={modalBackground} className="bg-white p-4 w-64 rounded-xl shadow-lg">
                                <div className="flex items-center mb-4">
                                    <img src={userData.profilePicUrl} alt="Profile" className="w-16 h-16 rounded-full mr-4"/>
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
                                    <AiOutlineUserAdd className="w-10 h-10 mb-2" onClick={() => setShowFriendSearchModal(true)}/>
                                </div>
                                <hr className="mb-4"/>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>
                                            <span className="text-white">인간성기삽니다123</span>
                                        </div>
                                        <button className="bg-green-500 text-white px-2 py-1 rounded">참여</button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>
                                            <span className="text-white">와일드 맨들 9999</span>
                                        </div>
                                        <button className="bg-blue-500 text-white px-2 py-1 rounded">로비</button>
                                    </div>
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
                    lastRoomNum={lastRoomNum}
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
