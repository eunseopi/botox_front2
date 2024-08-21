import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PiBellSimpleRingingFill } from "react-icons/pi";
import { MdMoreVert } from "react-icons/md";
import axios from "axios";
import profile from "../../images/profile.jpg";

const updatePost = async (postId, updatedPost) => {
    const response = await axios.put(`https://botox-chat.site/api/posts/${postId}`, updatedPost, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

const deletePost = async (postId) => {
    const response = await axios.delete(`https://botox-chat.site/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
};

const fetchCommentsByPostId = async (postId) => {
    try {
        const response = await axios.get(`https://botox-chat.site/api/posts/${postId}/comments`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        return response.data;
    } catch (error) {
        console.error('댓글 불러오기 오류:', error.response?.data || error.message);
        throw error;
    }
};

const reportComment = async (commentId, reportData) => {
    const response = await axios.post(`https://botox-chat.site/api/comments/${commentId}/report`, reportData, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

const reportPost = async (postId, reportData) => {
    const response = await axios.post(`https://botox-chat.site/api/posts/${postId}/report`, reportData, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
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
    const [post, setPost] = useState(location.state?.post);
    const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
    const [commentCount, setCommentCount] = useState(post?.commentCnt || 0);
    const [isLiked, setIsLiked] = useState(false);
    const [showMenu, setShowMenu] = useState(null); // 새로운 상태 추가

    useEffect(() => {
        // 현재 로그인한 사용자 정보 가져오기
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setCurrentUser(userInfo);

        // 로컬에서 댓글 불러오기
        const storedComments = JSON.parse(localStorage.getItem(`comments_${post?.postId}`) || '[]');
        setComments(storedComments);
    }, [post?.postId]);

    useEffect(() => {
        if (post) {
            setEditTitle(post.title);
            setEditContent(post.content);
            setLikesCount(post.likesCount || 0);
            setCommentCount(post.commentCnt || 0);
        }
    }, [post]);

    useEffect(() => {
        const fetchPostData = async () => {
            try {
                const storedPost = localStorage.getItem(`post_${post?.postId}`);
                if (storedPost) {
                    setPost(JSON.parse(storedPost));
                }
            } catch (error) {
                console.error('게시글 데이터 로드 실패:', error);
            }
        };

        if (post?.postId) {
            fetchPostData();
            fetchCommentsByPostId(post.postId).then(response => {
                if (response.status === 'OK') {
                    setComments(response.data.map(comment => ({
                        ...comment,
                        isLiked: comment.likes.some(like => like.userId === currentUser?.id) // 사용자가 좋아요를 눌렀는지 확인
                    })));
                }
            }).catch(err => {
                console.error('댓글 불러오기에 실패했습니다:', err.response?.data || err.message);
            });
        }
    }, [post?.postId, currentUser?.id]);

    const handleUpdate = async () => {
        try {
            const response = await updatePost(post.postId, {
                title: editTitle,
                content: editContent,
                postType: post.postType
            });

            if (response.status === 'OK') {
                // 서버에서 받은 데이터로 상태를 업데이트
                const updatedPost = response.data;
                setPost(updatedPost);
                setIsEditing(false);

                // LocalStorage에 업데이트된 게시글 저장
                localStorage.setItem(`post_${updatedPost.postId}`, JSON.stringify(updatedPost));
            } else {
                console.error('게시글 수정에 실패했습니다.');
            }
        } catch (err) {
            console.error('게시글 수정에 실패했습니다.');
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            try {
                const response = await deletePost(post.postId);
                if (response.status === 'NO_CONTENT') {
                    navigate('/board');
                } else {
                    alert('게시글 삭제에 실패했습니다.');
                }
            } catch (err) {
                console.error('게시글 삭제에 실패했습니다.');
                console.error(err);
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

    const handleWriteLike = async () => {
        try {
            const response = await fetch(`https://botox-chat.site/api/posts/${post.postId}/like`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const updatedLikesCount = likesCount + 1;
                setLikesCount(updatedLikesCount);
                setIsLiked(true);
                const updatedPost = { ...post, likesCount: updatedLikesCount };
                setPost(updatedPost);
                localStorage.setItem(`post_${updatedPost.postId}`, JSON.stringify(updatedPost));
            } else {
                console.error('좋아요 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('좋아요 처리에 실패했습니다.', error);
        }
    };

    const handleReport = async (commentId) => {
        try {
            const reportData = {
                reportingUserId: currentUser?.id,
                reportingUserNickname: currentUser?.nickname,
                reportedUserId: post.authorId, // 또는 댓글 작성자의 ID
                reportedUserNickname: currentUser?.nickname, // 또는 댓글 작성자의 닉네임
                reportedContentId: commentId,
            };

            const response = await axios.post(`https://botox-chat.site/api/comments/${commentId}/report`, reportData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                // 서버에서 성공 메시지 수신
                alert('댓글이 성공적으로 신고되었습니다.');
            } else {
                // 서버에서 실패 메시지 수신
                alert('댓글 신고에 실패했습니다.');
            }
        } catch (err) {
            // 예외 처리
            console.error('댓글 신고에 실패했습니다.');
            console.error(err);
        }
    };

    const CommentMenu = ({ commentId }) => {
        const handleToggleMenu = () => {
            setShowMenu(prev => prev === commentId ? null : commentId);
        };

        return (
            <div className="relative">
                <MdMoreVert onClick={handleToggleMenu} className="w-6 h-6 cursor-pointer" />
                {showMenu === commentId && (
                    <div className="absolute right-3 -mt-5 mr-2 w-24 bg-white border rounded shadow-lg z-50">
                        <button onClick={() => handleCommentDelete(commentId)} className="block w-full px-4 py-2 text-center hover:bg-gray-200">삭제</button>
                        <button onClick={() => handleReport('comment', commentId)} className="block w-full px-4 py-2 text-center hover:bg-gray-200">신고</button>
                    </div>
                )}
            </div>
        );
    };

    const Comment = ({ comment }) => (
        <div key={comment.commentId} className="mb-4 p-4 bg-gray-100 rounded-md">
            <div className="flex justify-between items-center mb-2">
                <div className="flex">
                    <img src={profile} className="w-8 h-8 rounded-full" alt="Profile" />
                    <span className="text-gray-600 ml-3">{comment.authorId}</span>
                </div>
                {currentUser && currentUser.id === comment.authorId && (
                    <CommentMenu commentId={comment.commentId} />
                )}
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
                    <h1 className="text-2xl font-bold">{post?.title}</h1>
                    {currentUser && currentUser.id === post?.authorId && (
                        <div className="flex space-x-2">
                            <button onClick={() => setIsEditing(!isEditing)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">수정
                            </button>
                            <button onClick={handleDelete}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">삭제
                            </button>
                            <button onClick={() => handleReport('post')}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">신고
                            </button>
                        </div>
                    )}
                </div>

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
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            저장
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-800 mb-4">{post?.content}</p>
                        <button
                            onClick={handleWriteLike}
                            className="flex items-center text-blue-500 hover:text-blue-700"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path>
                            </svg>
                            좋아요 ({likesCount})
                        </button>
                    </div>
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
};

export default PostDetailPage;
