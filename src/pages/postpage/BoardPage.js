import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import menuImage from "../../images/menu.png";
import roomIcon from '../../images/roomIcon.png';
import egg from '../../images/egg.png';
import good from '../../images/good.jpeg';
import profile from '../../images/profile.jpg';
import search from "../../images/search.png";
import axios from 'axios';
import { FaClipboard, FaHome, FaSignOutAlt, FaUser, FaUserFriends } from "react-icons/fa";
import ProfileModal from "../roompage/modal/ProfileModal";
import { AiOutlineUserAdd } from "react-icons/ai";

const FriendSearchModal = ({ onClose }) => {
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = async () => {
        // Placeholder for search logic
        // Implement the search functionality as needed
    };

    const handleSendFriendRequest = async (receiverId) => {
        try {
            const response = await fetch('https://botox-chat.site/api/friendship/request', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer <your-token>',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senderId: 1, // Replace with actual user ID
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
                    <img src={roomIcon} alt="Room" className="w-3 h-3 ml-5 mr-3 mt-2 mb-2"/>
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
    const location = useLocation();

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('https://botox-chat.site/api/posts', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (Array.isArray(response.data)) {
                setPosts(response.data);
                setFilteredPosts(response.data);
            } else {
                console.error('Unexpected response format', response.data);
            }
        } catch (error) {
            console.error('Fetching posts error', error);
            setError('게시글을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchPosts();
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const userId = userInfo && userInfo.username;

        if (!userId) {
            console.error('No userId found in localStorage');
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`https://botox-chat.site/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUserData({
                    ...data.data,
                    nickname: data.data.userNickname,
                    status: data.data.status
                });
            } else {
                console.error('Failed to fetch user data:', response.status);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        if (location.state && location.state.newPost) {
            console.log('New post received:', location.state.newPost);
            setPosts(prevPosts => [location.state.newPost, ...prevPosts]);
            navigate('/board', { replace: true, state: {} });
        }
    }, [location.state, navigate]);

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

    const handleLogoutBtn = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        navigate('/');
    };

    const closeModal = (e) => {
        if (modalBackground.current === e.target) {
            setModalOpen(false);
        }
    };

    const closeFriendsModal = (e) => {
        if (friendsModalBackground.current === e.target) {
            setFriendsModalOpen(false);
        }
    };

    return (
        <div className="relative flex">
            <div className="w-64 h-screen bg-customDarkBg border-r-2 border-gray-200 flex flex-col">
                <div className="flex items-center justify-center h-16">
                    <img src={menuImage} alt="Menu" className="w-8 h-8" />
                </div>
                <div className="flex-1">
                    <ul className="p-2">
                        <li className="mb-4">
                            <button onClick={() => navigate('/main')} className="flex items-center w-full p-2 text-white hover:bg-gray-700">
                                <FaHome className="mr-2" />
                                메인화면
                            </button>
                        </li>
                        <li className="mb-4">
                            <button onClick={() => navigate('/profile')} className="flex items-center w-full p-2 text-white hover:bg-gray-700">
                                <FaUser className="mr-2" />
                                프로필
                            </button>
                        </li>
                        <li className="mb-4">
                            <button onClick={() => setFriendsModalOpen(true)} className="flex items-center w-full p-2 text-white hover:bg-gray-700">
                                <FaUserFriends className="mr-2" />
                                친구 목록
                            </button>
                        </li>
                        <li className="mb-4">
                            <button onClick={handleLogoutBtn} className="flex items-center w-full p-2 text-white hover:bg-gray-700">
                                <FaSignOutAlt className="mr-2" />
                                로그아웃
                            </button>
                        </li>
                        <li className="mb-4">
                            <button onClick={() => setShowFriendSearchModal(true)} className="flex items-center w-full p-2 text-white hover:bg-gray-700">
                                <AiOutlineUserAdd className="mr-2" />
                                친구 추가
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="flex-1 flex flex-col items-center overflow-y-auto">
                <h1 className="text-4xl font-bold mt-8 text-white">게시판</h1>
                <div className="relative mt-4 w-6/12">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="검색어를 입력하세요"
                        className="w-full p-2 pl-10 border rounded-lg"
                    />
                    <img
                        src={search}
                        alt="Search"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                    />
                    <button
                        onClick={handleSearchTitle}
                        className="ml-2 p-2 bg-blue-500 text-white rounded-lg"
                    >
                        검색
                    </button>
                </div>
                {isLoading ? (
                    <p className="mt-8 text-white">게시글을 불러오는 중...</p>
                ) : error ? (
                    <p className="mt-8 text-red-500">{error}</p>
                ) : (
                    <div className="mt-8 w-full flex flex-col items-center">
                        {filteredPosts.map((post) => (
                            <GameCard key={post.postId} post={post} onClick={() => navigate(`/posts/${post.postId}`)} />
                        ))}
                    </div>
                )}
            </div>

            {modalOpen && (
                <div ref={modalBackground} onClick={closeModal} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                        <h2 className="text-2xl mb-4">프로필</h2>
                        {/* 프로필 모달 내용 */}
                        <button onClick={() => setModalOpen(false)} className="w-full bg-gray-500 text-white p-2 rounded">닫기</button>
                    </div>
                </div>
            )}

            {friendsModalOpen && (
                <div ref={friendsModalBackground} onClick={closeFriendsModal} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                        <h2 className="text-2xl mb-4">친구 목록</h2>
                        {/* 친구 목록 모달 내용 */}
                        <button onClick={() => setFriendsModalOpen(false)} className="w-full bg-gray-500 text-white p-2 rounded">닫기</button>
                    </div>
                </div>
            )}

            {showFriendSearchModal && <FriendSearchModal onClose={() => setShowFriendSearchModal(false)} />}
        </div>
    );
};

export default BoardPage;
