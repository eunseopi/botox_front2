import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function WritePage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [previews, setPreview] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
        }
    }, [navigate]);

    const handleImageChange = (e) => {
        const files = e.target.files;
        setImage(files);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('username');
        if (!userId) {
            console.error('No username found in localStorage');
            return;
        }
        if (!token || !userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        const postData = {
            userId: parseInt(userId), // API가 숫자를 기대한다면 문자열을 숫자로 변환
            title: title,
            content: content,
            postType: 'GENERAL'
        };

        try {
            const response = await axios.post('https://botox-chat.site/api/posts', postData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status === "OK" && response.data.data.postId) {
                console.log('New post added:', response.data.data);
                alert(response.data.message);
                navigate('/board', { state: { newPost: response.data.data } });
            } else {
                alert('게시글 작성에 실패했습니다. 다시 시도해 주세요.');
            }
        } catch (error) {
            console.error('Error posting new content:', error);
            if (error.response) {
                console.log('Error response:', error.response);
                if (error.response.status === 403) {
                    alert('권한이 없습니다. 로그인 상태를 확인해주세요.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    navigate('/login');
                } else if (error.response.status === 401) {
                    alert('인증이 만료되었습니다. 다시 로그인해주세요.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    navigate('/login');
                } else {
                    alert(`게시물을 저장하는 데 실패했습니다. 오류 코드: ${error.response.status}`);
                }
            } else if (error.request) {
                alert('서버로부터 응답이 없습니다. 네트워크 연결을 확인해주세요.');
            } else {
                alert('요청 설정 중 오류가 발생했습니다.');
            }
        }
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
