import React, {useState, useEffect} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from "axios";

const updatePost = async (postId, updatedPost) => {
    const response = await axios.put(`https://botox-chat.site/api/api/posts/${postId}`, updatedPost, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

const deletePost = async (postId) => {
    const response = await axios.delete(`https://botox-chat.site/api/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
    const [post, setPost] = useState(location.state?.post);

    useEffect(() => {
        if (post) {
            setEditTitle(post.title);
            setEditContent(post.content);
        }
    }, [post]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleUpdate = async () => {
        try {
            const updatedPost = await updatePost(post.postId, {
                title: editTitle,
                content: editContent,
                postType: post.postType
            });
            setPost(updatedPost.data);
            setIsEditing(false);
        } catch (err) {
            console.error('게시글 수정에 실패했습니다.');
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
            try {
                await deletePost(post.postId);
                navigate('/board');
            } catch (err) {
                console.error('게시글 삭제에 실패했습니다.');
                console.error(err);
            }
        }
    };

    useEffect(() => {
        // LocalStorage에서 댓글 불러오기
        const storedComments = JSON.parse(localStorage.getItem(`comments_${post.number}`) || '[]');
        setComments(storedComments);
    }, [post.number]);

    if (!post) {
        return <div>게시글을 찾을 수 없습니다.</div>;
    }

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (newComment.trim()) {
            const comment = {
                id: Date.now(),
                text: newComment,
                author: '익명',
                likesCount: 0,
            };
            const updatedComments = [...comments, comment];
            setComments(updatedComments);
            setNewComment('');
            // LocalStorage에 댓글 저장
            localStorage.setItem(`comments_${post.number}`, JSON.stringify(updatedComments));
        }
    }

    const handleCommentDelete = (commentId) => {
        const updatedComments = comments.filter(comment => comment.id !== commentId);
        setComments(updatedComments);
        // LocalStorage 업데이트
        localStorage.setItem(`comments_${post.number}`, JSON.stringify(updatedComments));
    }

    const handleLike = (commentId) => {
        const updatedComments = comments.map(comment =>
            comment.id === commentId
                ? { ...comment, likesCount: (comment.likesCount || 0) + 1 }
                : comment
        );
        setComments(updatedComments);
        // LocalStorage 업데이트
        localStorage.setItem(`comments_${post.number}`, JSON.stringify(updatedComments));
    }



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
                        <h1 className="text-2xl font-bold text-customDarkBlue mb-4">{post.title}</h1>
                        <div className="flex text-right mb-4">
                            <button onClick={handleEdit} className="mr-10 text-blue-500 hover:text-blue-700">글 수정</button>
                            <button onClick={handleDelete} className="text-red-500 hover:text-red-700">글 삭제</button>
                        </div>
                        <div className="mb-4">
                            <span className="text-gray-600 mr-4">작성자: {post.userNickName}</span>
                            <span className="text-gray-600">번호: {post.postId}</span>
                        </div>
                        {post.image && (
                            <img src={post.image} alt="게시글 이미지" className="w-full mb-4 rounded-lg"/>
                        )}
                        <p className="text-gray-800 mb-6">{post.content}</p>
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
                        <button type="submit" className="mt-2 ml-2 px-2 py-2 bg-customBoardBg text-white rounded-md hover:bg-gray-600">작성</button>
                    </form>

                    {comments.map(comment => (
                        <div key={comment.id} className="bg-gray-100 p-3 rounded-md mb-2 flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{comment.author}</p>
                                <p>{comment.text}</p>
                                <button
                                    onClick={() => handleLike(comment.id)}
                                    className="text-blue-500 hover:text-blue-700 mr-2"
                                >
                                    좋아요 ({comment.likesCount || 0})
                                </button>
                            </div>
                            <button
                                onClick={() => handleCommentDelete(comment.id)}
                                className="text-red-500 hover:text-red-700"
                            >삭제</button>
                        </div>
                    ))}
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

// 이 아래는 나중에 api 불러올 때 쓸게요
// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import axios from 'axios';
//
// // API 호출 함수들

//
/*
const handleLike = async (commentId) => {
    try {
        const response = await fetch(`/api/comments/${commentId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer <your-token>',
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to like comment');
        const updatedComment = await response.json();

        const updatedComments = comments.map(comment =>
            comment.id === commentId ? updatedComment : comment
        );
        setComments(updatedComments);
    } catch (error) {
        console.error('Error liking comment:', error);
    }
};
*/
// const api = axios.create({
//     baseURL: 'https://your-api-url.com',
// });
//
// const getComments = async (postId) => {
//     const response = await api.get(`/api/posts/${postId}/comments`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//     });
//     return response.data;
// };
//
// const createComment = async (authorId, postId, content) => {
//     const response = await api.post('/api/comments', {
//         authorId,
//         postId,
//         content
//     }, {
//         headers: {
//             Authorization: `Bearer ${localStorage.getItem('token')}`,
//             'Content-Type': 'application/json'
//         }
//     });
//     return response.data;
// };
//
// const deleteComment = async (commentId) => {
//     const response = await api.delete(`/api/comments/${commentId}`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//     });
//     return response.data;
// };
//
// const PostDetailPage = () => {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const { post } = location.state || {};
//     const [comments, setComments] = useState([]);
//     const [newComment, setNewComment] = useState('');
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);
//
//     useEffect(() => {
//         if (post) {
//             fetchComments();
//         }
//     }, [post]);
//
//     const fetchComments = async () => {
//         try {
//             setIsLoading(true);
//             const fetchedComments = await getComments(post.id);
//             setComments(fetchedComments);
//         } catch (err) {
//             setError('댓글을 불러오는 데 실패했습니다.');
//             console.error(err);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     const handleCommentSubmit = async (e) => {
//         e.preventDefault();
//         if (newComment.trim()) {
//             try {
//                 const result = await createComment(1, post.id, newComment); // 1은 임시 authorId
//                 setComments([...comments, { ...result, content: newComment }]);
//                 setNewComment('');
//             } catch (err) {
//                 setError('댓글 작성에 실패했습니다.');
//                 console.error(err);
//             }
//         }
//     };
//
//     const handleCommentDelete = async (commentId) => {
//         try {
//             await deleteComment(commentId);
//             setComments(comments.filter(comment => comment.commentId !== commentId));
//         } catch (err) {
//             setError('댓글 삭제에 실패했습니다.');
//             console.error(err);
//         }
//     };
//
//     if (!post) {
//         return <div>게시글을 찾을 수 없습니다.</div>;
//     }
//
//     return (
//         <div className="bg-customMainBg min-h-screen p-8">
//             <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
//                 <h1 className="text-2xl font-bold text-customDarkBlue mb-4">{post.title}</h1>
//                 <div className="mb-4">
//                     <span className="text-gray-600 mr-4">작성자: {post.id}</span>
//                     <span className="text-gray-600">번호: {post.number}</span>
//                 </div>
//                 {post.image && (
//                     <img src={post.image} alt="게시글 이미지" className="w-full mb-4 rounded-lg"/>
//                 )}
//                 <p className="text-gray-800 mb-6">{post.content}</p>
//
//                 {/* 댓글 섹션 */}
//                 <div className="mt-8">
//                     <h2 className="text-xl font-semibold mb-4">댓글</h2>
//                     {error && <p className="text-red-500 mb-4">{error}</p>}
//                     <form onSubmit={handleCommentSubmit} className="mb-4">
//                         <textarea
//                             value={newComment}
//                             onChange={(e) => setNewComment(e.target.value)}
//                             className="w-full p-2 border rounded-md"
//                             placeholder="댓글을 입력하세요..."
//                             rows="3"
//                         />
//                         <button type="submit" className="mt-2 px-4 py-2 bg-customBoardBg text-white rounded-md hover:bg-gray-600">
//                             댓글 작성
//                         </button>
//                     </form>
//
//                     {isLoading ? (
//                         <p>댓글을 불러오는 중...</p>
//                     ) : (
//                         comments.map(comment => (
//                             <div key={comment.commentId} className="bg-gray-100 p-3 rounded-md mb-2 flex justify-between items-start">
//                                 <div>
//                                     <p className="font-semibold">작성자 ID: {comment.authorId}</p>
//                                     <p>{comment.content}</p>
//                                     <p className="text-sm text-gray-500">좋아요: {comment.likesCount}</p>
//                                 </div>
//                                 <button
//                                     onClick={() => handleCommentDelete(comment.commentId)}
//                                     className="text-red-500 hover:text-red-700"
//                                 >
//                                     삭제
//                                 </button>
//                             </div>
//                         ))
//                     )}
//                 </div>
//
//                 <button
//                     onClick={() => navigate('/board')}
//                     className="mt-6 px-4 py-2 bg-customBoardBg text-white rounded-md hover:bg-gray-600"
//                 >
//                     목록으로 돌아가기
//                 </button>
//             </div>
//         </div>
//     );
// };
//
// export default PostDetailPage;