import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import menuImage from "../../images/menu.png";
import roomIcon from '../../images/roomIcon.png';
import egg from '../../images/egg.png';
import good from '../../images/good.jpeg';
import profile from '../../images/profile.jpg'
import search from "../../images/search.png";
import axios from 'axios';
import { FaClipboard, FaHome, FaSignOutAlt, FaUser, FaUserFriends } from "react-icons/fa";
import ProfileModal from "../roompage/modal/ProfileModal";
import { AiOutlineUserAdd } from "react-icons/ai";

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
            const response = await fetch('https://botox-chat.site/api/api/friendship/request', {
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
                    {Array.isArray(searchResults) && searchResults.length > 0 ? (
                        searchResults.map((result) => (
                            <div key={result.id} className="flex items-center justify-between mb-2">
                                <span>{result.nickname}</span>
                                <button onClick={() => handleSendFriendRequest(result.id)} className="bg-green-500 text-white p-2 rounded">추가</button>
                            </div>
                        ))
                    ) : (
                        <p>검색 결과가 없습니다.</p>
                    )}
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
                    <img src={roomIcon} alt="Room" className="w-3 h-3 ml-5 mr-3 mt-2 mb-2" />
                    <p className="text-white mt-2">{post.postId}</p>
                </div>
                <div>
                    <h3 className="font-bold text-white">{post.title}</h3>
                    <div className="flex items-center">
                        <img src={egg} alt="Egg" className="w-5 h-3 mr-2" />
                        <p className="text-customIdBg">{post.userId}</p>
                    </div>
                </div>
            </div>
            <div className="ml-auto">
                {post.image ? (
                    <img src={post.image} alt="게시글 이미지" className="w-44 h-24 object-cover" />
                ) : (
                    <img src={good} alt="Good" className="w-44 h-24" />
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
            const response = await axios.get('https://botox-chat.site/api/posts', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (Array.isArray(response.data)) {
                setPosts(response.data);
                setFilteredPosts(response.data);
            } else {
                console.error('응답 데이터가 배열이 아닙니다.', response.data);
            }
        } catch (error) {
            console.error('fetching error', error);
            setError('게시글을 가져오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        const userId = localStorage.getItem('username');
        if (!userId) {
            console.error('No username found in localStorage');
            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setUserData(data);
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
                        <img src={menuImage} alt="menu" className="w-7 h-7" />
                    </button>
                    <h1 className="text-white text-xl">커뮤니티</h1>
                    <button onClick={handleLogoutBtn} className="text-white">
                        <FaSignOutAlt size={24} />
                    </button>
                </nav>
            </div>
            {modalOpen && (
                <div ref={modalBackground} className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <button onClick={() => setModalOpen(false)} className="absolute top-2 right-2 text-gray-700">&times;</button>
                        <button onClick={handleClickHome} className="block mb-2">홈</button>
                        <button onClick={handleBoardClick} className="block mb-2">게시판</button>
                        <button onClick={handleWrite} className="block mb-2">글 작성</button>
                        <button onClick={handleFriendClick} className="block mb-2">친구 관리</button>
                        <button onClick={handleMyPageClick} className="block mb-2">마이페이지</button>
                    </div>
                </div>
            )}
            {friendsModalOpen && (
                <div ref={friendsModalBackground} className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <button onClick={() => setFriendsModalOpen(false)} className="absolute top-2 right-2 text-gray-700">&times;</button>
                        <button onClick={() => setShowFriendSearchModal(true)} className="block mb-2">친구 추가</button>
                        {/* 친구 목록 컴포넌트 추가 필요 */}
                    </div>
                </div>
            )}
            {showFriendSearchModal && (
                <FriendSearchModal onClose={() => setShowFriendSearchModal(false)} />
            )}
            {showProfileModal && (
                <ProfileModal onClose={() => setShowProfileModal(false)} />
            )}
            <div className="flex-grow bg-customBoardBg p-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="제목으로 검색"
                    className="w-full p-2 border rounded mb-4"
                />
                <button onClick={handleSearchTitle} className="w-full bg-blue-500 text-white p-2 rounded">검색</button>
                {isLoading ? (
                    <p className="text-white text-center">로딩 중...</p>
                ) : error ? (
                    <p className="text-red-500 text-center">{error}</p>
                ) : (
                    <div className="mb-8">
                        {Array.isArray(filteredPosts) && filteredPosts.length > 0 ? (
                            filteredPosts.map((post) => (
                                <GameCard
                                    key={post.postId}
                                    post={post}
                                    onClick={handlePostClick}
                                />
                            ))
                        ) : (
                            <p className="text-white text-center">게시글이 없습니다.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BoardPage;
