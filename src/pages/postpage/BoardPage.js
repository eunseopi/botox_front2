import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import menuImage from "../../images/menu.png";
import egg from '../../images/egg.png';
import profile from '../../images/profile.jpg';
import search from "../../images/search.png";
import axios from 'axios';
import { FaClipboard, FaHome, FaSignOutAlt, FaUser, FaUserFriends } from "react-icons/fa";
import ProfileModal from "../roompage/modal/ProfileModal";
import { AiOutlineUserAdd } from "react-icons/ai";
import FriendSearchModal from "../roompage/modal/FriendSearchModal";

const GameCard = ({ post, onClick, isHot }) => (
    <div className="bg-customBoardBg rounded-lg p-4 mb-4 shadow-lg mx-auto max-w-3xl cursor-pointer"
         onClick={() => onClick(post)}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-2">
            <div className="flex items-center mb-4 sm:mb-0">
                <p className="text-white sm:text-xl  mr-4">{post.postId}</p>
                <h3 className={`sm:text-xl ${isHot ? 'text-red-500' : 'text-white'}`}>
                    {post.title}
                </h3>
            </div>
            <div className="flex items-center mt-2 md:mt-0">
                <img src={egg} alt="Egg" className="w-6 h-4 mr-2"/>
                <p className="text-white text-sm sm:text-base">{post.authorNickname}</p>
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
    const [friendList, setFriendList] = useState([]);
    const [hotPosts, setHotPosts] = useState([]);
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
                const fetchedPosts = response.data.data.content.map(post=>({
                    ...post,
                    title: post.title || '제목 없음'
                }))
                setPosts(fetchedPosts);
                setFilteredPosts(fetchedPosts);

                // 인기 게시글 선정
                const postsWithLikes = await Promise.all(
                    fetchedPosts.map(async (post) => {
                        const likesCount = await fetchLikesCount(post.postId);
                        return { ...post, likesCount };
                    })
                );

                const sortedPosts = postsWithLikes.sort((a, b) => b.likesCount - a.likesCount);
                const topHotPosts = sortedPosts.slice(0, 1); // 좋아요 수가 가장 많은 1개 게시글
                setHotPosts(topHotPosts);

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
            // data가 배열 형태인 경우
            if (Array.isArray(data)) {
                // 셀프 추가 방지 및 수락된 친구만 필터링
                const filteredData = data.filter(friend =>
                    friend.receiverId === userId && friend.status === 'ACCEPTED'
                );
                setFriendList(filteredData); // 상태 업데이트
            } else {
                setFriendList([]); // 빈 배열로 초기화
            }
        } catch (error) {
            console.error('Error fetching friend list:', error);
            setFriendList([]);
        }
    };

    const fetchLikesCount = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`https://botox-chat.site/api/posts/${postId}/likes`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            if (response.data.status === 'OK') {
                return response.data.data;
            } else {
                console.error('Failed to fetch likes count');
                return 0;
            }
        } catch (error) {
            console.error('Error fetching likes count:', error);
            return 0;
        }
    };



    useEffect(() => {
        fetchPosts();
        fetchUserData();
    }, []);

    useEffect(() => {
        if (friendsModalOpen) {
            console.log("About to fetch friend list"); // 추가된 로그
            fetchFriendList();
        }
    }, [friendsModalOpen]);

    useEffect(() => {
        console.log('Friend list:', friendList); // 렌더링 시 상태 로그
    }, [friendList]);



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
                post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())
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
        const nonHotPosts = filteredPosts.filter(post => !hotPosts.some(hotPost => hotPost.postId === post.postId));
        const indexOfLastPost = currentPage * postsPerPage;
        const indexOfFirstPost = indexOfLastPost - postsPerPage;
        return nonHotPosts.slice(indexOfFirstPost, indexOfLastPost);
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
                        <div className="fixed top-10 left-10 flex justify-center items-start z-10">
                            <div ref={friendsModalBackground} className="bg-customFriendBg p-4 w-96 h-80 rounded-xl shadow-lg overflow-y-auto">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-white text-xl mb-4">친구 목록</h2>
                                    <AiOutlineUserAdd className="w-10 h-10 mb-2 cursor-pointer" onClick={() => setShowFriendSearchModal(true)}/>
                                </div>
                                <hr className="mb-4"/>
                                <div className="space-y-2">
                                    {friendList && friendList.length > 0 ? (
                                        friendList.map((friend) => (
                                            <div key={friend.requestId || `friend-${Math.random()}`} className="flex items-center justify-between">
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
                <h1 className="text-center sm:text-left">자유 게시판</h1>
            </div>
            <div className="flex-1 p-8 bg-customMainBg overflow-y-auto">
                <div className="flex justify-end sm:mr-60 lg:mr-20 xl:mr-80 mb-4">
                    <button
                        onClick={handleWrite}
                        className="text-xl text-white bg-customBoardBg p-2 rounded-xl w-48"
                    >게시글 쓰기</button>
                </div>
                {/* 인기 게시글을 첫 페이지에만 표시 */}
                {currentPage === 1 && hotPosts.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-white text-2xl text-center mb-4">🔥 인기 게시글</h2>
                        {hotPosts.map((post, index) => (
                            <GameCard
                                key={`${post.postId}-${index}`}
                                post={post}
                                onClick={handlePostClick}
                                isHot={true}
                            />
                        ))}
                    </div>
                )}
                {/* 일반 게시글 목록 */}
                <div className="mb-8">
                    <h2 className="text-white text-2xl text-center mb-4">일반 게시글</h2>
                    {getCurrentPosts().map((post, index) => (
                        <GameCard
                            key={`${post.postId}-${index}`}
                            post={post}
                            onClick={handlePostClick}
                            isHot={false}  // 일반 게시글
                        />
                    ))}
                </div>
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
                            key={`page-${num}`}
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
                    onClose={() => {
                        setShowFriendSearchModal(false);
                        fetchFriendList();  // 친구 추가 후 목록 갱신
                    }}
                />
            )}
            {showProfileModal && (
                <ProfileModal onClose={() => setShowProfileModal(false)}/>
            )}
        </div>
    );
};

export default BoardPage;
