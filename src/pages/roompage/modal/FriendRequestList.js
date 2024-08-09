import React, { useEffect, useState } from 'react';

const FriendRequestList = ({ userId, onAccept, onDecline }) => {
    const [friendRequests, setFriendRequests] = useState([]);

    useEffect(() => {
        const fetchFriendRequests = async () => {
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

        fetchFriendRequests();
    }, [userId]);

    return (
        <div>
            <h2>받은 친구 요청 목록</h2>
            {friendRequests.length === 0 ? (
                <p>받은 친구 요청이 없습니다.</p>
            ) : (
                <ul>
                    {friendRequests.map(request => (
                        <li key={request.requestId}>
                            요청자: {request.senderId}, 상태: {request.status}, 요청 시간: {new Date(request.requestTime).toLocaleString()}
                            <button onClick={() => onAccept(request.requestId)} className="bg-green-500 text-white p-2 rounded ml-2">수락</button>
                            <button onClick={() => onDecline(request.requestId)} className="bg-red-500 text-white p-2 rounded ml-2">거절</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default FriendRequestList;
