import React, {useState, useEffect, useRef, useCallback} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import menuImage from "../../images/menu.png";
import roomIcon from '../../images/roomIcon.png';
import egg from '../../images/egg.png';
import good from '../../images/good.jpeg';
import profile from '../../images/profile.jpg'
import search from "../../images/search.png";
import axios from 'axios';
import {FaClipboard, FaHome, FaSignOutAlt, FaUser, FaUserFriends} from "react-icons/fa";
import ProfileModal from "../roompage/modal/ProfileModal";
import {AiOutlineUserAdd} from "react-icons/ai";

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

const GameCard = ({ post, onClick }) => (
    <div className="bg-customBoardBg rounded-lg p-4 mb-4 shadow-lg m-auto w-8/12 cursor-pointer"
         onClick={() => onClick(post)}>
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
                <div className="mr-8">
                    <img src={roomIcon} alt="Room" className="w-3 h-3 ml-5 mr-3 mt-2 mb-2 "/>
                    <p className="text-white mt-2">{post.postId}</p>
                </div>
                <div>
                    <h3 className="font-bold text-white">{post.title}</h3>
                    <div className="flex items-center">
                        <img src={egg} alt="Egg" className="w-5 h-3 mr-2"/>
                        <p className="text-customIdBg">{post.userId}</p>
                    </div>
                </div>
            </div>
            <div className="ml-auto">
                {post.image ? (
                    <img src={post.image} alt="게시글 이미지" className="w-44 h-24 object-cover"/>
                ) : (
                    <img src={good} alt="Good" className="w-44 h-24"/>
                )}
            </div>
        </div>
    </div>
);

const BoardPage = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [friendsModalOpen, setFriendsModalOpen] = useState(false);
    const [showFriendSearchModal, setShowFriendSearchModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredPosts, setFilteredPosts] = useState([]);
    const modalBackground = useRef(null);
    const friendsModalBackground = useRef(null);
    const navigate = useNavigate();
    const location = useLocation(); // useLocation 추가

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://43.203.238.195:8080/api/posts', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            setPosts(response.data);
            setFilteredPosts(response.data);
        } catch(error){
            console.error('fetching error', error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            // const response = await fetch(`/api/users/${userId}`, {
            //     headers: {
            //         'Authorization': `Bearer ${localStorage.getItem('token')}`
            //     }
            // });
            // const data = await response.json();
            // setUserData(data);

            // 임시 더미 데이터
            setUserData({
                id: 1,
                userId: "user123",
                nickname: "쿨한두유",
                profile: "안녕하세요! 게임을 좋아하는 쿨한두유입니다.",
                profilePicUrl: "https://example.com/profile.jpg",
                temperatureLevel: 36,
                status: "online"
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const handleSearchTitle = () => {
        if (!searchTerm.trim()) {
            setFilteredPosts(posts);
        } else {
            const filtered = posts.filter(post =>
                post.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredPosts(filtered);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    useEffect(() => {
        if (location.state && location.state.newPost) {
            console.log('New post received:', location.state.newPost); // 디버깅용
            setPosts(prevPosts => [location.state.newPost, ...prevPosts]);
            // state 초기화
            navigate('/board', { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    const handleLogoutBtn = () => {
        // localStorage.removeItem('token');
        navigate('/login');
    }

    const handleMyPageClick = () => {
        setShowProfileModal(true);
        setModalOpen(false);
    }

    const handleClickOutside = useCallback((e) => {
        if (modalOpen && modalBackground.current && !modalBackground.current.contains(e.target)) {
            setModalOpen(false);
        }
        if (friendsModalOpen && friendsModalBackground.current && !friendsModalBackground.current.contains(e.target)) {
            setFriendsModalOpen(false);
        }
    }, [modalOpen, friendsModalOpen]);

    const handleClickHome = () => {
        navigate('/');
    }

    const handleFriendClick = () => {
        setFriendsModalOpen(true);
        setModalOpen(false);
    }

    const handleBoardClick = () => {
        navigate('/board');
    }

    const handleWrite = () => {
        navigate('/write');
    }

    const handlePostClick = (post) => {
        navigate(`/post/${post.postId}`, { state: { post } });
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
                <h1 className="text-center sm:text-left">자유 게시판</h1>
            </div>
            <div className="flex-1 p-8 bg-customMainBg overflow-y-auto">
                <div className="flex justify-end sm:mr-80 lg:mr-80 xl:mr-80 mb-4">
                    <button
                        onClick={handleWrite}
                        className="text-xl text-white bg-customBoardBg p-2 rounded-xl w-48"
                    >게시글 쓰기</button>
                </div>
                {isLoading ? (
                    <p className="text-white text-center">게시글 불러오는중...</p>
                ) : error ? (
                    <p className="text-red-500 text-center">{error}</p>
                ) : (
                    <div className="mb-8">
                        {filteredPosts.map((post) => (
                            <GameCard
                                key={post.postId}
                                post={post}
                                onClick={handlePostClick}
                            />
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-center px-4">
                    <div className="relative w-full max-w-lg">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchTitle()}
                            placeholder="제목을 입력해 주세요."
                            className="w-full p-2 pl-10 mb-3 border-0 rounded"
                        />
                        <img
                            src={search}
                            alt="Search"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                            onClick={handleSearchTitle}
                        />
                    </div>
                </div>
                <div className="flex justify-center text-white">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button key={num} className="mx-1 px-3 py-1 rounded hover:bg-gray-700">
                            {num}
                        </button>
                    ))}
                    <button className="ml-2 px-3 py-1 rounded hover:bg-gray-700">다음 &gt;</button>
                </div>
            </div>
            {showFriendSearchModal && ( // 추가된 코드
                <FriendSearchModal
                    onClose={() => setShowFriendSearchModal(false)}
                />
            )}
            {showProfileModal && (
                <ProfileModal onClose={() => setShowProfileModal(false)} />
            )}
        </div>
    );
};

export default BoardPage;