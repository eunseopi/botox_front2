import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 사용자 프로필 데이터 가져오는 함수
const fetchUserProfile = async (username) => {
    try {
        const response = await axios.get(`https://botox-chat.site/api/users/${username}/profile`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response.data.data;
    } catch (error) {
        console.error('사용자 프로필 불러오기 오류:', error.response?.data || error.message);
        throw error;
    }
};

const UserProfile = ({ username }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getUserProfile = async () => {
            try {
                const data = await fetchUserProfile(username);
                setProfile(data);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };

        getUserProfile();
    }, [username]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div className="profile-container">
            {profile && (
                <div className="profile">
                    <img src={profile.userProfilePic || 'default-profile-pic.png'} alt="Profile" className="profile-pic"/>
                    <h2>{profile.userNickname}</h2>
                    <p>{profile.bio || 'No bio available'}</p>
                    {/* 더 많은 프로필 정보가 필요하면 여기에 추가 */}
                </div>
            )}
        </div>
    );
};

export default UserProfile;
