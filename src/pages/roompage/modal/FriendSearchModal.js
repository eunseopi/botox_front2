import React, { useState, useEffect } from "react";
import { AiOutlineUserAdd } from "react-icons/ai";

const FriendSearchModal = ({ onClose }) => {
    const [searchInput, setSearchInput] = useState('');
    const [receiverId, setReceiverId] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [friendRequests, setFriendRequests] = useState([]);
    const uniqueRequests = Array.from(new Set(friendRequests.map(r => r.requestId)))
        .map(id => friendRequests.find(r => r.requestId === id));

    useEffect(() => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        setCurrentUser(userInfo);
    }, []);

    const handleSendFriendRequest = async (senderId, receiverId) => {
        try {
            const response = await fetch('http://localhost:8080/api/friendship/request', {
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

    const fetchFriendRequests = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/friendship/requests/${currentUser.id}`, {
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
        console.log('수락 버튼 클릭됨, requestId:', requestId);
        try {
            const response = await fetch(`http://localhost:8080/api/friendship/requests/${requestId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('API 응답:', response);

            if (response.ok) {
                alert('친구 요청이 수락되었습니다.');
                fetchFriendRequests(); // 수락 후 친구 목록 갱신
            } else {
                console.error('Failed to accept friend request');
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const handleDeclineRequest = async (requestId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/friendship/requests/${requestId}/decline`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                alert('친구 요청이 거절되었습니다.');
                fetchFriendRequests(); // 거절 후 친구 목록 갱신
            } else {
                console.error('Failed to decline friend request');
            }
        } catch (error) {
            console.error('Error declining friend request:', error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            fetchFriendRequests();
        }
    }, [currentUser]);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-customIdBg p-8 rounded shadow-md">
                <h2 className="text-2xl text-white mb-4">친구 추가</h2>
                <input
                    type="text"
                    value={receiverId}
                    onChange={handleInputChange}
                    placeholder="친구의 아이디를 입력하세요"
                    className="border p-2 mb-4 w-full"
                />
                <button
                    onClick={() => handleSendFriendRequest(currentUser.id, receiverId)}
                    className="bg-customFriendBg text-white p-2 mr-3 rounded"
                >
                    친구 추가
                </button>
                <button
                    onClick={onClose}
                    className="bg-gray-500 text-white w-1/4 p-2 rounded mt-1"
                >
                    닫기
                </button>

                <div className="mt-2 text-white">
                    <h2>친구 요청 목록</h2>
                    {uniqueRequests.length === 0 ? (
                        <p>받은 친구 요청이 없습니다.</p>
                    ) : (
                        <ul>
                            {uniqueRequests.map(request => (
                                <li key={request.requestId}>
                                    요청자: {request.senderId}, 상태: {request.status}
                                    <button
                                        onClick={() => handleAcceptRequest(request.requestId)}
                                        className="bg-green-500 text-white p-2 w-1/6 rounded ml-3"
                                    >
                                        수락
                                    </button>
                                    <button
                                        onClick={() => handleDeclineRequest(request.requestId)}
                                        className="bg-red-500 text-white p-2 w-1/6 rounded ml-2"
                                    >
                                        거절
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendSearchModal;
