import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { MdMoreVert } from "react-icons/md";
import axios from "axios";
import profile from "../../images/profile.jpg";


const fetchCommentsByPostId = async (postId) => {
    try {
        const response = await axios.get(`https://botox-chat.site/api/posts/${postId}/comments`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log(response);
        return response.data;
    } catch (error) {
        console.error('댓글 불러오기 오류:', error.response?.data || error.message);
        throw error;
    }
};

const PostDetailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [post, setPost] = useState(location.state?.post || null);
    const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
    const [commentCount, setCommentCount] = useState(post?.commentCnt || 0);
    const [isLiked, setIsLiked] = useState(post?.isLiked || false);
    const [showMenu, setShowMenu] = useState(null); // 새로운 상태 추가
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        console.log('userData:', userData);
    }, [userData]);

    const fetchUserData = async () => {
        const userId = JSON.parse(localStorage.getItem('userInfo')).username;
        if (!userId) {
            console.error('No username found in localStorage');
            return;
        }

        try {
            const response = await fetch(`https://botox-chat.site/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            const result = await response.json();
            if (result.code === "OK" && result.data) {
                setUserData(result.data);
                console.log(userData)
            } else {
                console.error("Failed to fetch user data:", result.message);
            }
        } catch (error) {
            console.error("에러 이유:", error);
        }
    };

    useEffect(() => {
        if (post?.postId) {
            const storedPost = localStorage.getItem(`post_${post.postId}`);
            if (storedPost) {
                const parsedPost = JSON.parse(storedPost);
                setPost(parsedPost);
                setLikesCount(parsedPost.likesCount);
                setIsLiked(parsedPost.isLiked);
            } else {
                setLikesCount(post.likesCount || 0);
                setIsLiked(post.isLiked || false);
            }
        }
    }, [post?.postId]);

    useEffect(() => {
        fetchUserData();
    }, [])

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setCurrentUser(userInfo);

        if (post?.postId) {
            fetchCommentsByPostId(post.postId).then(response => {
                if (response.status === 'OK') {
                    setComments(response.data);  // 서버에서 받아온 댓글 데이터 설정
                }
            }).catch(err => {
                console.error('댓글 불러오기에 실패했습니다:', err.response?.data || err.message);
            });
        }
    }, [post?.postId]);

    const isPostAuthor = userData?.userNickname === post?.authorNickname;

    useEffect(() => {
        if (post) {
            setEditTitle(post.title || '');
            setEditContent(post.content || '');
            setLikesCount(post.likesCount || 0);
            setCommentCount(post.commentCnt || 0);
        }
    }, [post]);

    const handleUpdate = async () => {
        try {
            const response = await axios.put(
                `https://botox-chat.site/api/posts/${post.postId}?userId=${currentUser.id}`,
                {
                    title: editTitle,
                    content: editContent,
                    postType: post.postType
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                    }
                }
            );

            const {code, message} = response.data;

            if (code === 'OK') {
                setPost(prevPost => ({
                    ...prevPost,
                    title: editTitle,
                    content: editContent
                }));
                setIsEditing(false);
                alert(message);
            } else {
                alert(message);
            }
        } catch (error) {
            console.error('게시글 수정에 실패했습니다.', error);
            alert('게시글 수정 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            try {
                // 게시글 삭제 API 호출
                const response = await axios.delete(`https://botox-chat.site/api/posts/${post.postId}?userId=${currentUser.id}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                // 응답 상태 확인
                if (response.data.code === 'NO_CONTENT') {
                    // 게시글 삭제 성공 시
                    alert('게시글이 삭제되었습니다.');
                    navigate('/board'); // 게시판 페이지로 이동
                } else {
                    // 다른 상태일 경우
                    alert('게시글 삭제에 실패했습니다.');
                }
            } catch (err) {
                // 에러 처리
                console.error('게시글 삭제에 실패했습니다.', err);
                alert('게시글 삭제 중 오류가 발생했습니다.');
            }
        }
    };


    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            try {
                const response = await axios.post('https://botox-chat.site/api/comments', {
                    authorId: currentUser?.id,
                    postId: post.postId,
                    commentContent: newComment,
                    likesCount: 0
                }, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                const newCommentData = response.data.data;
                const updatedComments = [...comments, newCommentData];
                setComments(updatedComments);
                setNewComment('');
                setCommentCount(commentCount + 1);

                // LocalStorage에 댓글 저장
                localStorage.setItem(`comments_${post.postId}`, JSON.stringify(updatedComments));
            } catch (err) {
                console.error('댓글 등록에 실패했습니다.');
                console.error(err);
            }
        }
    };

    const handleCommentDelete = async (commentId) => {
        try {
            const response = await axios.delete(`https://botox-chat.site/api/comments/${commentId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.status === 200) {
                const updatedComments = comments.filter(comment => comment.commentId !== commentId);
                setComments(updatedComments);
                setCommentCount(commentCount - 1);
                localStorage.setItem(`comments_${post.postId}`, JSON.stringify(updatedComments));
            } else {
                console.error('댓글 삭제에 실패했습니다.');
            }
        } catch (err) {
            console.error('댓글 삭제에 실패했습니다.');
            console.error(err);
        }
    };

    const handleLike = async (commentId) => {
        const comment = comments.find(c => c.commentId === commentId);
        if (comment?.isLiked) {
            console.log('이미 좋아요를 누른 댓글입니다.');
            return;
        }

        try {
            const response = await axios.post(`https://botox-chat.site/api/comments/${commentId}/like`, {
                userId: currentUser.id
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                const updatedComment = response.data.data;
                const updatedComments = comments.map(comment =>
                    comment.commentId === updatedComment.commentId
                        ? updatedComment
                        : comment
                );
                setComments(updatedComments);
                localStorage.setItem(`comments_${post.postId}`, JSON.stringify(updatedComments));
            } else {
                console.error('댓글 좋아요 처리에 실패했습니다.');
            }
        } catch (err) {
            console.error('댓글 좋아요 처리에 실패했습니다.');
            console.error(err);
        }
    };

    const handleWriteLikes = async () => {
        try {
            const response = await axios.post(`https://botox-chat.site/api/posts/${post.postId}/like?userId=${currentUser.id}`, null, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('좋아요 응답:', response.data);

            const { code, message } = response.data;

            if (code === 'OK') {
                // 서버에서 새로운 좋아요 상태를 반환하지 않으므로, 현재 상태를 토글합니다.
                const newIsLiked = !isLiked;
                const newLikesCount = isLiked ? likesCount - 1 : likesCount + 1;

                console.log('새로운 좋아요 상태:', newIsLiked);
                console.log('새로운 좋아요 수:', newLikesCount);

                setLikesCount(newLikesCount);
                setIsLiked(newIsLiked);
                setPost(prevPost => ({
                    ...prevPost,
                    likesCount: newLikesCount,
                    isLiked: newIsLiked,
                }));

                // LocalStorage 업데이트
                const updatedPost = { ...post, likesCount: newLikesCount, isLiked: newIsLiked };
                localStorage.setItem(`post_${post.postId}`, JSON.stringify(updatedPost));

                console.log(message); // "게시글에 좋아요를 눌렀습니다." 메시지 출력
            } else {
                console.error('좋아요 처리 실패:', message);
            }
        } catch (error) {
            console.error('좋아요 처리에 실패했습니다.', error);
        }
    };




    // 수정 모드 시작
    const handleEditClick = () => {
        setEditTitle(post.title);
        setEditContent(post.content);
        setIsEditing(true);
    };

    // 수정 취소
    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleReport = async (commentId, postId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('토큰이 없습니다.');
                return;
            }

            // 댓글 데이터를 가져옵니다
            const commentsResponse = await axios.get(`https://botox-chat.site/api/posts/${postId}/comments`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // 댓글 데이터를 확인합니다
            const commentsData = commentsResponse.data;
            console.log('댓글 데이터:', commentsData);

            // 댓글 데이터에서 해당 댓글을 찾습니다
            const commentData = commentsData.data.find(comment => comment.commentId === commentId);
            if (!commentData) {
                throw new Error('해당 댓글을 찾을 수 없습니다.');
            }

            // 댓글 작성자의 ID와 닉네임을 가져옵니다
            const reportedUserId = commentData.authorId;

            // 신고 데이터를 구성합니다
            const reportData = {
                reportingUserId: currentUser?.id || null,
                reportingUserNickname: userData?.userNickname || '알 수 없음',
                reportedUserId: reportedUserId,
                reportedUserNickname: reportedUserId,
                reportedContentId: commentId,
                feedbackResult: "부적절한 내용",
                reasonForReport: "이 게시글은 불쾌감을 주는 내용을 포함하고 있습니다.",
                reportType: "WARNING"
            };

            console.log('Report data being sent:', reportData);

            // 서버로 신고 데이터를 전송합니다
            const response = await axios.post(`https://botox-chat.site/api/comments/${commentId}/report`, reportData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Server response:', response);
            if (response.status === 200) {
                alert('댓글이 성공적으로 신고되었습니다.');
            } else {
                alert('댓글 신고에 실패했습니다.');
            }
        } catch (err) {
            console.error('댓글 신고에 실패했습니다.');
            console.error(err);
        }
    };


    const handleWriteReport = async () => {
        try {
            const reportData = {
                reportingUserId: currentUser?.id,
                reportingUserNickname: currentUser?.nickname,
                reportedUserId: post.authorId, // 게시글 작성자 ID
                reportedUserNickname: post.authorNickname, // 게시글 작성자 닉네임
                feedbackResult: "부적절한 내용",
                reasonForReport: "이 게시글은 불쾌감을 주는 내용을 포함하고 있습니다.",
                reportType: "WARNING" // 서버에서 기대하는 값으로 수정
            };

            const response = await axios.post(`https://botox-chat.site/api/posts/${post.postId}/report`, reportData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                alert('게시글이 성공적으로 신고되었습니다.');
            } else {
                alert('게시글 신고에 실패했습니다.');
            }
        } catch (err) {
            console.error('게시글 신고에 실패했습니다.');
            console.error(err);
        }
    };


    const CommentMenu = ({commentId, authorId}) => {
        const handleToggleMenu = () => {
            setShowMenu(prev => prev === commentId ? null : commentId);
        };

        return (
            <div className="relative">
                <MdMoreVert onClick={handleToggleMenu} className="w-6 h-6 cursor-pointer"/>
                {showMenu === commentId && (
                    <div className="absolute right-3 -mt-5 mr-2 w-24 bg-white border rounded shadow-lg z-50">
                        {currentUser && currentUser.id === authorId ? (
                            // 본인 댓글일 때만 '수정' 버튼 표시
                            <button onClick={() => handleCommentDelete(commentId)}
                                    className="block w-full px-4 py-2 text-center hover:bg-gray-200">삭제</button>
                        ) : (
                            // 다른 사람 댓글일 때만 '신고' 버튼 표시
                            <button onClick={() => handleReport(commentId, post.postId)}
                                    className="block w-full px-4 py-2 text-center hover:bg-gray-200">신고</button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const handleExit = async () => {
        navigate(`/board`);
    };


    const Comment = ({comment}) => (
        <div key={comment.commentId} className="mb-4 p-4 bg-gray-100 rounded-md">
            <div className="flex justify-between items-center mb-2">
                <div className="flex">
                    <img src={comment.userProfilePic || profile} className="w-8 h-8 rounded-full" alt="Profile"/>
                    <span className="text-gray-600 ml-3">{comment.authorId}</span>
                </div>
                <CommentMenu commentId={comment.commentId} authorId={comment.authorId}/>
            </div>
            <p className="text-gray-800 mb-2">{comment.commentContent}</p>
            <button
                onClick={() => handleLike(comment.commentId)}
                className="flex items-center text-blue-500 hover:text-blue-700"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                </svg>
                좋아요 ({comment.likesCount})
            </button>
        </div>
    );


    return (
        <div className="bg-customMainBg min-h-screen p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
                <div className="flex justify-between items-center mb-4">
                    <FaArrowLeft className="text-2xl mr-4" onClick={handleExit}/>
                    <h1 className="text-2xl font-bold">{post?.title}</h1>
                    <div className="flex space-x-2">
                        {isPostAuthor && (
                            <>
                                <button onClick={handleEditClick}
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">수정
                                </button>
                                <button onClick={handleDelete}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">삭제
                                </button>
                            </>
                        )}
                        {!isPostAuthor && (
                            <button onClick={handleWriteReport}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">신고</button>
                        )}
                    </div>
                </div>
                {post.imageUrl && (
                    <img src={post.imageUrl} alt="게시글 이미지" className="max-w-full h-auto"/>
                )}
                <p>{post.content}</p>
                {isEditing ? (
                    <div className="mb-4">
                        <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full p-2 border rounded mb-2"
                            placeholder="제목"
                        />
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border rounded"
                            rows="4"
                            placeholder="내용"
                        />
                        <button
                            onClick={handleUpdate}
                            className="mt-2 mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            저장
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >취소
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleWriteLikes}
                        className={`flex items-center ${isLiked ? 'text-red-500' : 'text-black'}`}
                    >
                        <svg
                            className="w-5 h-5 mr-1"
                            fill={isLiked ? 'currentColor' : 'none'}
                            stroke={isLiked ? 'none' : 'currentColor'}
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d={isLiked
                                    ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                    : "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"}
                            />
                        </svg>
                        좋아요 ({likesCount})
                    </button>
                )}

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">댓글</h2>
                    <form onSubmit={handleCommentSubmit} className="mb-4 flex h-14">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-11/12 p-2 border rounded-md"
                        rows="3"
                    />
                        <button type="submit"
                                className="mt-2 ml-2 px-2 py-2 bg-customBoardBg text-white rounded-md hover:bg-gray-600">작성
                        </button>
                    </form>

                    {comments.length > 0 ? (
                        comments.map((comment) => (
                            <Comment
                                key={comment.commentId}
                                comment={comment}
                            />
                        ))
                    ) : (
                        <p className="text-gray-600">댓글이 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PostDetailPage;
