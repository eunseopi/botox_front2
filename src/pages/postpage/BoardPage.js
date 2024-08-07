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
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const userId = userInfo.id;

    const handleSearch = async () => {
        // Placeholder for search logic
        // Implement the search functionality as needed
    };

    const handleSendFriendRequest = async (receiverId) => {
        try {
            const response = await fetch('https://botox-chat.site/api/friendship/request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senderId: userId,
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
                    <p className="flex text-white ml-2 mt-2">{post.postId}</p>
                </div>
                <div className="flex">
                    <h3 className="font-bold text-white mt-2">{post.title}</h3>
                    <div className="flex mt-3 fixed right-80">
                        <img src={egg} alt="Egg" className="w-5 h-3 mt-2 mr-2"/>
                        <p className="text-white">{post.authorId}</p>
                    </div>
                </div>
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
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 5;
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
            if (response.data && response.data.data && Array.isArray(response.data.data.content)) {
                console.log('Posts data:', response.data.data.content); // 추가된 로그
                setPosts(response.data.data.content);
                setFilteredPosts(response.data.data.content);
            } else {
                console.error('Unexpected response format', response.data);
            }
        } catch (error) {
            console.error('Fetching posts error', error);
            setError('게시글을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
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

    const handlePostClick = async (post) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`https://botox-chat.site/api/posts/${post.postId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            const postData = response.data.data;
            navigate(`/post/${post.postId}`, { state: { post: postData } });
        } catch (error) {
            console.error('Error fetching post data:', error);
            alert('게시글 정보를 불러오는 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        if (location.state && location.state.newPost) {
            console.log('New post received:', location.state.newPost);
            setPosts(prevPosts => [location.state.newPost, ...prevPosts]);
            navigate('/board', { replace: true, state: {} });
        }
    }, [location.state, navigate]);

    const handleLogoutBtn = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleMyPageClick = () => {
        setShowProfileModal(true);
        setModalOpen(false);
    };

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
    };

    const handleFriendClick = () => {
        setFriendsModalOpen(true);
        setModalOpen(false);
    };

    const handleBoardClick = () => {
        navigate('/board');
    };

    const handleWrite = () => {
        navigate('/write');
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
                        {getCurrentPosts().map((post) => (
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
                            onChange={(e) => setSearchTerm(e.target.value)}
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
            {showFriendSearchModal && (
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

export default BoardPage;
