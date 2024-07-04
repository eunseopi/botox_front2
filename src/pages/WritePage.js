import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function WritePage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [previews, setPreview] = useState([]);
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        const files = e.target.files;
        setImage(Array.from(files));

        const previewPromises = Array.from(files).map(file => {
            return new Promise((resolve) => {
                const fileReader = new FileReader();
                fileReader.onload = (e) => resolve(e.target.result);
                fileReader.readAsDataURL(file);
            });
        });

        Promise.all(previewPromises).then(previews => {
            setPreview(previews);
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newPost = {
            title,
            content,
            image: previews,
            id: '작성자', // 실제 사용 시 로그인한 사용자 정보로 대체
            number: `${Math.floor(Math.random() * 100000)}`,
        };

        // 로컬 스토리지에서 기존 게시글 가져오기
        const storedPostsString = localStorage.getItem('posts');
        let storedPosts = [];

        if (storedPostsString) {
            try {
                storedPosts = JSON.parse(storedPostsString);
            } catch (error) {
                console.error('에러 이유:', error);
            }
        }

        // 새 게시글 추가
        const updatedPosts = [newPost, ...storedPosts];

        // 로컬 스토리지 업데이트
        localStorage.setItem('posts', JSON.stringify(updatedPosts));

        // BoardPage로 이동
        navigate('/board');
    };

    return (
        <div className="bg-customMainBg min-h-screen mt-40 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6">
                    <h2 className="text-2xl font-bold text-customDarkBlue mb-6">새 글 작성</h2>
                    <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            제목
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-customDarkBlue focus:border-customDarkBlue"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                            내용
                        </label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="10"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-customDarkBlue focus:border-customDarkBlue"
                            required
                        ></textarea>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                            이미지 업로드
                        </label>
                        <input
                            type="file"
                            multiple
                            id="image"
                            onChange={handleImageChange}
                            accept="image/*"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-customDarkBlue focus:border-customDarkBlue"
                        />
                        {previews.map((preview, index) => (
                            <img key={index} src={preview} alt={`Preview ${index}`} className="mt-2 max-w-full h-auto"/>
                        ))}
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate('/board')}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-customBoardBg text-white rounded-md hover:bg-gray-600"
                        >
                            글 등록
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default WritePage;