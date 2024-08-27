import React, { useState, useEffect } from 'react';
import { FaEdit, FaCheck } from 'react-icons/fa';

const ProfileModal = ({ onClose, username }) => {
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newNickname, setNewNickname] = useState("");
    const [newProfileImage, setNewProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState('default-profile-image-url');

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`https://botox-chat.site/api/users/${username}/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const result = await response.json();
                setUserData(result.data);
                setNewNickname(result.data.userNickname || "");
                setPreviewImage(result.data.userProfilePic || 'default-profile-image-url');
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        if (username) {
            fetchUserProfile();
        }
    }, [username]);

    const handleNicknameChange = (e) => {
        setNewNickname(e.target.value);
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files[0];
        setNewProfileImage(file);
        setPreviewImage(URL.createObjectURL(file)); // Preview the selected image
    };

    const handleSave = async () => {
        const formData = new FormData();
        const token = localStorage.getItem('token');

        if (!username || !token) {
            console.error('No username or token found.');
            alert('Invalid login information. Please log in again.');
            return;
        }

        formData.append('userNickname', newNickname); // Append new nickname
        formData.append('username', username);

        if (newProfileImage) {
            formData.append('file', newProfileImage); // Append new profile image
        }

        try {
            const response = await fetch(`https://botox-chat.site/api/users/${username}/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();

            if (result.code === "OK") {
                if (newProfileImage) {
                    setPreviewImage(result.data.userProfilePic || 'default-profile-image-url'); // Update image URL
                }
                alert('Profile has been updated.');
                setIsEditing(false);
            } else {
                throw new Error(result.message || 'Profile update failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`An error occurred while updating the profile: ${error.message}`);
        }
    };

    if (!userData) {
        return <div>Loading...</div>;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Friend Profile</h2>
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
                    <p className="text-gray-600 mt-2">{userData.userProfile || 'No profile set.'}</p>
                </div>
                <div className="mb-6">
                    <h4 className="font-semibold mb-2">Status</h4>
                    <p className="text-green-500">{userData.status}</p>
                </div>
                <div className="mb-6">
                    <h4 className="font-semibold mb-2">Temperature</h4>
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
                            <FaCheck className="inline-block mr-1" /> Save
                        </button>
                        <button onClick={() => setIsEditing(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="w-full bg-blue-500 text-white p-2 rounded">
                        <FaEdit className="inline-block mr-1" /> Edit Profile
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProfileModal;
