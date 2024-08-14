import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PiBellSimpleRingingFill } from "react-icons/pi";
import axios from "axios";

const updatePost = async (postId, updatedPost) => {
    const response = await axios.put(`http://localhost:8080/api/posts/${postId}`, updatedPost, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

const deletePost = async (postId) => {
    const response = await axios.delete(`http://localhost:8080/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
};

const fetchCommentsByPostId = async (postId) => {
    try {
        const response = await axios.get(`http://localhost:8080/api/posts/${postId}/comments`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        return response.data;
    } catch (error) {
        console.error('댓글 불러오기 오류:', error.response?.data || error.message);
        throw error;
    }
};

const reportComment = async (commentId, reportData) => {
    const response = await axios.post(`http://localhost:8080/api/comments/${commentId}/report`, reportData, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

const reportPost = async (postId, reportData) => {
    const response = await axios.post(`http://localhost:8080/api/posts/${postId}/report`, reportData, {
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
                    setComments(response.data);
                }
            }).catch(err => {
                console.error('댓글 불러오기에 실패했습니다:', err.response?.data || err.message);
            });
        }
    }, [post?.postId]);



    useEffect(() => {
        if (post) {
            // LocalStorage에서 댓글 불러오기
            const storedComments = JSON.parse(localStorage.getItem(`comments_${post.postId}`) || '[]');
            setComments(storedComments);
        }
    }, [post]);

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

    useEffect(() => {
        // LocalStorage에서 댓글 불러오기
        const storedComments = JSON.parse(localStorage.getItem(`comments_${post.postId}`) || '[]');
        setComments(storedComments);
    }, [post.postId]);

    if (!post) {
        return <div>게시글을 찾을 수 없습니다.</div>;
    }

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            try {
                const response = await axios.post('http://localhost:8080/api/comments', {
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
            const response = await axios.delete(`http://localhost:8080/api/comments/${commentId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.status === 200) { // 또는 200으로 변경해 확인
                const updatedComments = comments.filter(comment => comment.commentId !== commentId);
                setComments(updatedComments);
                setCommentCount(commentCount - 1);
                localStorage.setItem(`comments_${post.postId}`, JSON.stringify(updatedComments));

                // // 디버깅용 콘솔 로그
                // console.log('댓글 삭제 후 업데이트된 comments:', updatedComments);
                // console.log('로컬 스토리지에 저장된 comments:', localStorage.getItem(`comments_${post.postId}`));
            } else {
                console.error('댓글 삭제에 실패했습니다.');
            }
        } catch (err) {
            console.error('댓글 삭제에 실패했습니다.');
            console.error(err);
        }
    };

    const handleLike = async (commentId) => {
        try {
            const response = await axios.post(`http://localhost:8080/api/comments/${commentId}/like`, {
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


    const handleWriteLike = () => {
        const updatedLikesCount = likesCount + 1;
        setLikesCount(updatedLikesCount);
        localStorage.setItem(`likes_${post.postId}`, JSON.stringify(updatedLikesCount));

        // 게시글의 전체 데이터 업데이트
        setPost(prevPost => ({
            ...prevPost,
            likesCount: updatedLikesCount
        }));
    };

    const handleReport = async (commentId) => {
        try {
            const reportData = {
                reportingUserId: currentUser?.id,
                reportingUserNickname: currentUser?.nickname,
                reportedUserId: post.authorId, // 또는 댓글 작성자의 ID
                reportedUserNickname: currentUser.nickname, // 또는 댓글 작성자의 닉네임
                reportedContentId: commentId,
                feedbackResult: 'Inappropriate language',
                reasonForReport: 'The comment contains inappropriate language.',
                reportType: 'WARNING'
            };

            const response = await reportComment(commentId, reportData);

            if (response.status === 'OK') {
                alert('댓글이 성공적으로 신고되었습니다.');
            } else {
                alert('댓글 신고에 실패했습니다.');
            }
        } catch (err) {
            console.error('댓글 신고에 실패했습니다.');
            console.error(err);
        }
    };

    const handleReportPost = async () => {
        try {
            const reportData = {
                reportingUserId: currentUser?.id,
                reportingUserNickname: currentUser?.nickname,
                reportedUserId: post.authorId,
                reportedUserNickname: currentUser.nickname,
                reportedPostId: post.postId,
                feedbackResult: 'Inappropriate language',
                reasonForReport: 'The post contains inappropriate language.',
                reportType: 'WARNING'
            };

            const response = await reportPost(post.postId, reportData);

            if (response.status === 'OK') {
                alert('게시글이 성공적으로 신고되었습니다.');
            } else {
                alert('게시글 신고에 실패했습니다.');
            }
        } catch (err) {
            console.error('게시글 신고에 실패했습니다.');
            console.error(err);
        }
    };

    return (
        <div className="bg-customMainBg min-h-screen p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
                {isEditing ? (
                    <>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-2xl font-bold mb-4 p-2 border rounded"
                        />
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border rounded mb-4"
                            rows="5"
                        />
                        <div>
                            <button onClick={handleUpdate} className="px-4 py-2 bg-blue-500 text-white rounded mr-2">저장</button>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-500 text-white rounded">취소</button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-2xl font-bold text-customDarkBlue">{post.title}</h1>
                            <div>
                                <button onClick={handleReportPost}
                                        className="mr-2 text-red-500 hover:text-red-700">신고
                                </button>
                                {currentUser && currentUser.id === post.authorId && (
                                    <button onClick={handleDelete}
                                            className="text-red-500 hover:text-red-700">삭제</button>
                                )}
                                {currentUser && currentUser.id === post.authorId && (
                                    <button onClick={() => setIsEditing(true)} className="ml-2 text-blue-500 hover:text-blue-700">
                                        수정
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="mb-4">
                            <span className="text-gray-600 mr-4">작성자: {post.authorId}</span>
                            <span className="text-gray-600">번호: {post.postId}</span>
                        </div>
                        {post.image && (
                            <img src={post.image} alt="게시글 이미지" className="w-full mb-4 rounded-lg"/>
                        )}
                        <p className="text-gray-800 mb-6">{post.content}</p>
                        <div className="flex items-center mb-4">
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
                    </>
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
                            <div key={comment.commentId} className="mb-4 p-4 bg-gray-100 rounded-md">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600">작성자: {comment.authorId}</span>
                                    {currentUser && currentUser.id === comment.authorId && (
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => handleCommentDelete(comment.commentId)}
                                                className="text-black hover:text-gray-900 flex items-center mr-2"
                                            >
                                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor"
                                                     viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                          d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5-4h4m-4 0H8m4 0h2m-6 0h8m-8 4h10m-2 0v8m-2-8v8m-2-8v8m-2-8v8"></path>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleReport(comment.commentId)}
                                                className="text-red-500 hover:text-red-700 flex items-center"
                                            >
                                                <PiBellSimpleRingingFill className="w-5 h-5 mr-1"/>

                                            </button>
                                        </div>
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
                        ))
                    ) : (
                        <p className="text-gray-600">댓글이 없습니다.</p>
                    )}

                </div>

                <button
                    onClick={() => navigate('/board')}
                    className="mt-4 px-4 py-2 bg-customBoardBg text-white rounded-md hover:bg-gray-600"
                >
                    목록으로 돌아가기
                </button>
            </div>
        </div>
    );
};

export default PostDetailPage;
