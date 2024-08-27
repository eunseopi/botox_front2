import React, { useState, useEffect } from "react";
import FriendSearchModal from "./FriendSearchModal";
import FriendRequestList from "./FriendRequestList";

const ParentComponent = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]);

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setCurrentUser(userInfo);
        fetchFriendRequests(userInfo.id);
    }, []);

    const fetchFriendRequests = async (userId) => {
        try {
            const response = await fetch(`https://botox-chat.site/api/friendship/requests/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFriendRequests(data);
            } else {
                console.error('Failed to fetch friend requests');
            }
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    };

    const handleAcceptRequest = async (requestId) => {
        try {
            const response = await fetch(`https://botox-chat.site/api/friendship/requests/${requestId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                alert('친구 요청이 수락되었습니다.');
                fetchFriendRequests(currentUser.id); // 수락 후 친구 요청 목록 갱신
            } else {
                console.error('Failed to accept friend request');
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const handleDeclineRequest = async (requestId) => {
        try {
            const response = await fetch(`https://botox-chat.site/api/friendship/requests/${requestId}/decline`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                alert('친구 요청이 거절되었습니다.');
                fetchFriendRequests(currentUser.id); // 거절 후 친구 요청 목록 갱신
            } else {
                console.error('Failed to decline friend request');
            }
        } catch (error) {
            console.error('Error declining friend request:', error);
        }
    };

    return (
        <div>
            <FriendSearchModal onClose={() => {/* handle modal close */}} />
            <FriendRequestList
                userId={currentUser?.id}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
            />
        </div>
    );
};

export default ParentComponent;
