// import React, {useState, useEffect, useRef, useCallback} from 'react';
// import { useNavigate, useLocation } from "react-router-dom";
// import menuImage from "../../images/menu.png";
// import roomIcon from '../../images/roomIcon.png';
// import egg from '../../images/egg.png';
// import good from '../../images/good.jpeg';
// import profile from '../../images/profile.jpg'
// import search from "../../images/search.png";
//
// const GameCard = ({ post, onClick }) => (
//     <div className="bg-customBoardBg rounded-lg p-4 mb-4 shadow-lg m-auto w-8/12 cursor-pointer"
//          onClick={() => onClick(post)}>
//         <div className="flex items-center justify-between mb-2">
//             <div className="flex items-center">
//                 <div className="mr-8">
//                     <img src={roomIcon} alt="Room" className="w-3 h-3 ml-5 mr-3 mt-2 mb-2 "/>
//                     <p className="text-white mt-2">{post.number}</p>
//                 </div>
//                 <div>
//                     <h3 className="font-bold text-white">{post.title}</h3>
//                     <div className="flex items-center">
//                         <img src={egg} alt="Egg" className="w-5 h-3 mr-2"/>
//                         <p className="text-customIdBg">{post.id}</p>
//                     </div>
//                 </div>
//             </div>
//             <div className="ml-auto">
//                 {post.image ? (
//                     <img src={post.image} alt="게시글 이미지" className="w-44 h-24 object-cover"/>
//                 ) : (
//                     <img src={good} alt="Good" className="w-44 h-24"/>
//                 )}
//             </div>
//         </div>
//     </div>
// );
//
// const BoardPage = () => {
//     const [modalOpen, setModalOpen] = useState(false);
//     const [roomName, setRoomName] = useState('');
//     const [posts, setPosts] = useState([]);
//     const [friendsModalOpen, setFriendsModalOpen] = useState(false);
//     const modalBackground = useRef(null);
//     const friendsModalBackground = useRef(null);
//     const navigate = useNavigate();
//     const location = useLocation();
//
//     useEffect(() => {
//         // 로컬 스토리지에서 게시글 목록 가져오기
//         const storedPostsString = localStorage.getItem('posts');
//         let storedPosts = [];
//
//         if (storedPostsString) {
//             try {
//                 storedPosts = JSON.parse(storedPostsString);
//             } catch (error) {
//                 console.error('에러 이유:', error);
//             }
//         }
//
//         if (storedPosts.length > 0) {
//             setPosts(storedPosts);
//         } else {
//             // 초기 게시글이 없을 경우에만 더미 데이터 사용
//             const initialPosts = [
//                 { title: "쵸비 VS 에디 후기 ㄷㄷㄷㄷㄷㄷㄷㄷ .JPG", number: "101909", id: "동욱" },
//             ];
//             setPosts(initialPosts);
//             localStorage.setItem('posts', JSON.stringify(initialPosts));
//         }
//
//         // 새 게시글이 있다면 추가
//         if (location.state?.newPost) {
//             const updatedPosts = [location.state.newPost, ...storedPosts];
//             setPosts(updatedPosts);
//             localStorage.setItem('posts', JSON.stringify(updatedPosts));
//         }
//     }, [location]);
//
//     const handleClickOutside = useCallback((e) => {
//         if (modalOpen && modalBackground.current && !modalBackground.current.contains(e.target)) {
//             setModalOpen(false);
//         }
//         if (friendsModalOpen && friendsModalBackground.current && !friendsModalBackground.current.contains(e.target)) {
//             setFriendsModalOpen(false);
//         }
//     }, [modalOpen, friendsModalOpen]);
//
//     const handleFriendClick = () => {
//         setFriendsModalOpen(true);
//         setModalOpen(false);
//     }
//
//     const handleBoardClick = () => {
//         navigate('/board');
//     }
//
//     const handleClickHome = () => {
//         navigate('/');
//     }
//
//     const handleWrite = () => {
//         navigate('/write')
//     }
//
//     const handlePostClick = (post) => {
//         navigate(`/post/${post.number}`, { state: { post } });
//     };
//
//     useEffect(() => {
//         document.addEventListener('mousedown', handleClickOutside);
//         return () => {
//             document.removeEventListener('mousedown', handleClickOutside);
//         };
//     }, [handleClickOutside]);
//
//     return (
//         <div className="flex flex-col h-full">
//             <div className="w-full bg-customTopNav h-10">
//                 <nav className="flex items-center justify-between px-4">
//                     <button type="button" onClick={() => setModalOpen(!modalOpen)}>
//                         <img src={menuImage} alt="Menu" className="w-10 h-10 p-2 mr-2"/>
//                     </button>
//                     {modalOpen && (
//                         <div className="fixed top-10 left-10 flex justify-center items-start">
//                             <div ref={modalBackground} className="bg-white opacity-70 p-4 w-60 h-60 inline-block rounded-xl shadow-lg">
//                                 <div className="flex items-center">
//                                     <img src={profile} alt="Profile" className="w-20 h-20 p-2 mr-2 rounded-full opacity-100"/>
//                                     <div>
//                                         <p className="text-xl text-center mb-2">뜨끈한 두유님</p>
//                                         <p className="ml-14 text-gray-500">로그아웃</p>
//                                     </div>
//                                 </div>
//                                 <div className="text-center">
//                                     <p className="bg-gray-200 mb-2">마이페이지</p>
//                                     <p className="bg-gray-200 mb-2 cursor-pointer" onClick={handleClickHome}>홈</p>
//                                     <p className="bg-gray-200 mb-2 cursor-pointer" onClick={handleBoardClick}>게시판</p>
//                                     <p className="bg-gray-200 cursor-pointer" onClick={handleFriendClick}>친구목록</p>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                     {friendsModalOpen && (
//                         <div className="fixed top-10 left-10 flex justify-center items-start z-1">
//                             <div ref={friendsModalBackground} className="bg-gray-800 p-4 w-96 h-80 rounded-xl shadow-lg">
//                                 <h2 className="text-white text-xl mb-4">친구 목록</h2>
//                                 <div className="space-y-2">
//                                     <div className="flex items-center justify-between">
//                                         <div className="flex items-center">
//                                             <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>
//                                             <span className="text-white">인간성기삽니다123</span>
//                                         </div>
//                                         <button className="bg-green-500 text-white px-2 py-1 rounded">참여</button>
//                                     </div>
//                                     <div className="flex items-center justify-between">
//                                         <div className="flex items-center">
//                                             <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>
//                                             <span className="text-white">와일드 맨들 9999</span>
//                                         </div>
//                                         <button className="bg-blue-500 text-white px-2 py-1 rounded">로비</button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </nav>
//             </div>
//             <div className="text-white text-4xl mb-6 mt-8 px-4 sm:px-8 md:px-16 lg:px-24 xl:px-80">
//                 <h1 className="text-center sm:text-left">자유 게시판</h1>
//             </div>
//             <div className="flex-1 p-8 bg-customMainBg overflow-y-auto">
//                 <div className="flex justify-end sm:mr-80 lg:mr-80 xl:mr-80 mb-4">
//                     <button
//                         onClick={handleWrite}
//                         className="text-xl text-white bg-customBoardBg p-2 rounded-xl w-48"
//                     >게시글 쓰기</button>
//                 </div>
//                 <div className="mb-8">
//                     {posts.map((post, index) => (
//                         <GameCard
//                             key={index}
//                             post={post}
//                             onClick={handlePostClick}
//                         />
//                     ))}
//                 </div>
//                 <div className="flex items-center justify-center px-4">
//                     <div className="relative w-full max-w-lg">
//                         <input
//                             type="text"
//                             id="text"
//                             value={roomName}
//                             onChange={(e) => {
//                                 setRoomName(e.target.value)
//                             }}
//                             placeholder="제목을 입력해 주세요."
//                             className="w-full p-2 pl-10 mb-3 border-0 rounded"
//                         />
//                         <img
//                             src={search}
//                             alt="Search"
//                             className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
//                         />
//                     </div>
//                 </div>
//                 <div className="flex justify-center text-white">
//                     {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
//                         <button key={num} className="mx-1 px-3 py-1 rounded hover:bg-gray-700">
//                             {num}
//                         </button>
//                     ))}
//                     <button className="ml-2 px-3 py-1 rounded hover:bg-gray-700">다음 &gt;</button>
//                 </div>
//             </div>
//         </div>
//     );
// };
//
// export default BoardPage;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import menuImage from "../../images/menu.png";
import roomIcon from '../../images/roomIcon.png';
import egg from '../../images/egg.png';
import good from '../../images/good.jpeg';
import profile from '../../images/profile.jpg'
import search from "../../images/search.png";
import axios from 'axios';

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
    const modalBackground = useRef(null);
    const navigate = useNavigate();
    const location = useLocation(); // useLocation 추가

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            // 로컬 스토리지에서 게시글 가져오기
            const storedPostsString = localStorage.getItem('posts');
            let storedPosts = [];
            if (storedPostsString) {
                storedPosts = JSON.parse(storedPostsString);
            }

            // API에서 게시글 가져오기
            const response = await axios.get('https://9e85f3f1-e5cc-4710-921a-f55a2229fcd7.mock.pstmn.io/api/posts');
            const apiPosts = Array.isArray(response.data) ? response.data : [];

            // 로컬 스토리지의 게시글을 우선으로 하여 모든 게시글 병합
            const allPosts = [...storedPosts, ...apiPosts.filter(apiPost =>
                !storedPosts.some(storedPost => storedPost.postId === apiPost.postId)
            )];

            console.log('All posts:', allPosts); // 디버깅용
            setPosts(allPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setError('게시글을 불러오는데 실패했습니다. 다시 시도해 주세요.');
            // 에러 시 로컬 스토리지의 게시글만 표시
            const storedPosts = JSON.parse(localStorage.getItem('posts') || '[]');
            setPosts(storedPosts);
        } finally {
            setIsLoading(false);
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



    const handleClickOutside = (e) => {
        if (modalBackground.current && !modalBackground.current.contains(e.target)) {
            setModalOpen(false);
        }
    };

    const handleClickHome = () => {
        navigate('/');
    }

    const handleWrite = () => {
        navigate('/write');
    }

    const handlePostClick = (post) => {
        navigate(`/post/${post.postId}`, { state: { post } });
    };

    useEffect(() => {
        if (modalOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [modalOpen]);

    return (
        <div className="flex flex-col h-full">
            <div className="w-full bg-customTopNav h-10">
                <nav className="flex items-center justify-between px-4">
                    <button type="button" onClick={() => setModalOpen(!modalOpen)}>
                        <img src={menuImage} alt="Menu" className="w-10 h-10 p-2 mr-2"/>
                    </button>
                    {modalOpen && (
                        <div className="fixed top-10 left-10 flex justify-center items-start">
                            <div ref={modalBackground} className="bg-white opacity-70 p-4 w-60 h-60 inline-block rounded-xl shadow-lg">
                                <div className="flex items-center">
                                    <img src={profile} alt="Profile" className="w-20 h-20 p-2 mr-2 rounded-full opacity-100"/>
                                    <div>
                                        <p className="text-xl text-center mb-2">뜨끈한 두유님</p>
                                        <p className="ml-14 text-gray-500">로그아웃</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="bg-gray-200 mb-2">마이페이지</p>
                                    <p className="bg-gray-200 mb-2 cursor-pointer" onClick={handleClickHome}>홈</p>
                                    <p className="bg-gray-200 mb-2">게시판</p>
                                    <p className="bg-gray-200">친구목록</p>
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
                    <p className="text-white text-center">Loading posts...</p>
                ) : error ? (
                    <p className="text-red-500 text-center">{error}</p>
                ) : (
                    <div className="mb-8">
                        {posts.map((post) => (
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
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button key={num} className="mx-1 px-3 py-1 rounded hover:bg-gray-700">
                            {num}
                        </button>
                    ))}
                    <button className="ml-2 px-3 py-1 rounded hover:bg-gray-700">다음 &gt;</button>
                </div>
            </div>
        </div>
    );
};

export default BoardPage;
