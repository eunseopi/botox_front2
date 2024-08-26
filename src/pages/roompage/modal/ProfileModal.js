import React, { useState, useEffect } from "react";
import { FaEdit, FaCheck } from 'react-icons/fa';

const ProfileModal = ({ onClose }) => {
    const [userData, setUserData] = useState(null);
    const [newNickname, setNewNickname] = useState("");
    const [newProfileImage, setNewProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

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
                setNewNickname(result.data.userNickname);
                setPreviewImage(result.data.userProfilePic || 'default-profile-image-url'); // 초기 미리보기 이미지 설정
            } else {
                console.error("Failed to fetch user data:", result.message);
            }
        } catch (error) {
            console.error("에러 이유:", error);
        }
    };

    const handleNicknameChange = (e) => {
        setNewNickname(e.target.value);
    }

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        setNewProfileImage(file);
        setPreviewImage(URL.createObjectURL(file)); // 미리보기 이미지 설정
    }

    const handleSave = async () => {
        const formData = new FormData();
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = localStorage.getItem('token');

        if (!userInfo || !userInfo.username || !token) {
            console.error('사용자 정보 또는 토큰이 없습니다.');
            alert('로그인 정보가 유효하지 않습니다. 다시 로그인해 주세요.');
            return;
        }

        formData.append('userProfile', userData.userProfile); // 현재 프로필 설정 유지
        formData.append('userNickname', newNickname); // 새 닉네임 추가
        formData.append('username', userInfo.username);

        if (newProfileImage) {
            formData.append('file', newProfileImage); // 새 프로필 이미지 추가
        }

        try {
            const response = await fetch(`https://botox-chat.site/api/users/${userInfo.username}/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status}`);
            }

            const result = await response.json();

            if (result.code === "OK") {
                if (newProfileImage) {
                    setPreviewImage(result.data.userProfilePic || 'default-profile-image-url'); // 업데이트된 이미지 URL
                }
                // 사용자 데이터 재호출
                await fetchUserData(); // 최신 데이터로 업데이트
                alert('프로필이 업데이트되었습니다.');
                setIsEditing(false);
            } else {
                throw new Error(result.message || '프로필 업데이트 실패');
            }
        } catch (error) {
            console.error('에러 이유:', error);
            alert(`프로필 업데이트 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    if (!userData) {
        return <div>Loading...</div>
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">마이 프로필</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                        <img
                            src={previewImage || 'default-profile-image-url'}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover mb-4"
                        />
                        {isEditing && (
                            <label htmlFor="profile-upload" className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer">
                                <FaEdit />
                                <input
                                    id="profile-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfileImageChange}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                    {isEditing ? (
                        <input
                            type="text"
                            value={newNickname}
                            onChange={handleNicknameChange}
                            className="text-xl font-semibold text-center border-b-2 border-blue-500 focus:outline-none"
                        />
                    ) : (
                        <h3 className="text-xl font-semibold">{userData.userNickname}</h3>
                    )}
                    <p className="text-gray-600 mt-2">{userData.userProfile || '프로필이 설정되지 않았습니다.'}</p>
                </div>
                <div className="mb-6">
                    <h4 className="font-semibold mb-2">상태</h4>
                    <p className="text-green-500">{userData.status}</p>
                </div>
                <div className="mb-6">
                    <h4 className="font-semibold mb-2">온도</h4>
                    <div className="bg-gray-200 h-4 rounded-full">
                        <div
                            className="bg-red-500 h-4 rounded-full"
                            style={{ width: `${userData.userTemperatureLevel || 0}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{userData.userTemperatureLevel || 0}°C</p>
                </div>
                {isEditing ? (
                    <div className="flex justify-end">
                        <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
                            <FaCheck className="inline-block mr-1" /> 저장
                        </button>
                        <button onClick={() => setIsEditing(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">
                            취소
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="w-full bg-blue-500 text-white p-2 rounded">
                        <FaEdit className="inline-block mr-1" /> 프로필 수정
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfileModal;
