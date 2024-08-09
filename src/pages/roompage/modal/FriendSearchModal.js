import React, { useState, useEffect } from "react";
import FriendRequestList from './FriendRequestList'; // 추가

const FriendSearchModal = ({ onClose }) => {
    const [searchInput, setSearchInput] = useState('');
    const [receiverId, setReceiverId] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setCurrentUser(userInfo);
    }, []);

    const handleSendFriendRequest = async (senderId, receiverId) => {
        try {
            const response = await fetch('https://botox-chat.site/api/friendship/request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senderId: senderId,
                    receiverId: parseInt(receiverId, 10) // receiverId를 정수로 변환
                })
            });
            const responseText = await response.text();
            try {
                const data = JSON.parse(responseText);
                alert(data.message);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                alert(responseText);
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const handleInputChange = (e) => {
        setReceiverId(e.target.value);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded shadow-md">
                <h2 className="text-2xl mb-4">친구 추가</h2>
                <input
                    type="text"
                    value={receiverId}
                    onChange={handleInputChange}
                    placeholder="친구의 아이디를 입력하세요"
                    className="border p-2 mb-4 w-full"
                />
                <button
                    onClick={() => handleSendFriendRequest(currentUser.id, receiverId)}
                    className="bg-green-500 text-white p-2 rounded"
                >
                    친구 추가
                </button>
                <button
                    onClick={onClose}
                    className="bg-gray-500 text-white p-2 rounded mt-4"
                >
                    닫기
                </button>

                {currentUser && <FriendRequestList userId={currentUser.id} />} {/* 추가 */}
            </div>
        </div>
    );
};

export default FriendSearchModal;
