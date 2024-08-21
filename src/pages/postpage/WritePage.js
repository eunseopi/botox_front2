import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

function WritePage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
        }
    }, [navigate]);

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
    };

    const uploadImageToS3 = async (file) => {
        const fileName = `${Date.now()}_${file.name}`;
        const params = {
            // Bucket: s3BucketName,
            Key: fileName,
            Body: file,
            ContentType: file.type,
            ACL: 'public-read',
        };

        try {
            const { Location } = await s3.upload(params).promise();
            return Location; // S3에 업로드된 이미지의 URL을 반환
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('이미지 업로드에 실패했습니다.');
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const userId = userInfo.id;

        if (!token || !userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        let response;
        if (image) {
            const imageUrl = await uploadImageToS3(image);
            if (!imageUrl) {
                return;
            }

            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('userId', userId);
            formData.append('postType', 'GENERAL');
            formData.append('imageUrl', imageUrl);

            response = await fetch('https://botox-chat.site/api/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });
        } else {
            const postData = {
                title: title,
                content: content,
                userId: userId,
                postType: 'GENERAL',
            };

            response = await fetch('https://botox-chat.site/api/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            });
        }

        if (!response.ok) {
            if (response.status === 403) {
                alert('권한이 없습니다. 로그인 상태를 확인해주세요.');
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                navigate('/login');
            } else if (response.status === 401) {
                alert('인증이 만료되었습니다. 다시 로그인해주세요.');
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                navigate('/login');
            } else {
                alert(`게시물을 저장하는 데 실패했습니다. 오류 코드: ${response.status}`);
            }
            return;
        }

        const data = await response.json().catch(() => {
            console.error('Failed to parse JSON response');
            alert('서버 응답을 처리하는 중 오류가 발생했습니다.');
        });

        if (data?.status === "OK" && data.data.postId) {
            console.log('New post added:', data.data);
            alert(data.message);
            navigate('/board', { state: { newPost: data.data } });
        } else {
            alert('게시글 작성에 실패했습니다. 다시 시도해 주세요.');
        }
    };

    return (
        <div className="bg-customMainBg min-h-screen mt-40 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6" encType="multipart/form-data">
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
                            id="image"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-customDarkBlue focus:border-customDarkBlue"
                        />
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
