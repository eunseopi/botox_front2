import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PostDetailPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { post } = location.state || {};

    if (!post) {
        return <div>게시글을 찾을 수 없습니다.</div>;
    }

    return (
        <div className="bg-customMainBg min-h-screen p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
                <h1 className="text-2xl font-bold text-customDarkBlue mb-4">{post.title}</h1>
                <div className="mb-4">
                    <span className="text-gray-600 mr-4">작성자: {post.id}</span>
                    <span className="text-gray-600">번호: {post.number}</span>
                </div>
                {post.image && (
                    <img src={post.image} alt="게시글 이미지" className="w-full mb-4 rounded-lg"/>
                )}
                <p className="text-gray-800 mb-6">{post.content}</p>
                <button
                    onClick={() => navigate('/board')}
                    className="px-4 py-2 bg-customBoardBg text-white rounded-md hover:bg-gray-600"
                >
                    목록으로 돌아가기
                </button>
            </div>
        </div>
    );
};

export default PostDetailPage;