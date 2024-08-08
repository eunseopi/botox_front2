import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import TextChat from './textchat/TextChat';
import VoiceChat from './voicechat/VoiceChat';

const Room = () => {
    const { roomNum } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [roomInfo, setRoomInfo] = useState(location.state?.roomInfo || null);

    useEffect(() => {
        if (!roomInfo) {
            fetchRoomInfo(roomNum);
        }
    }, [roomNum, roomInfo]);

    const fetchRoomInfo = async (roomNum) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://botox-chat.site/api/rooms/${roomNum}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch room info');
            }

            const data = await response.json();
            setRoomInfo(data.roomInfo);
        } catch (error) {
            console.error('Error fetching room info:', error);
        }
    };

    if (!roomInfo) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {roomInfo.roomType === 'TEXT' ? (
                <TextChat roomInfo={roomInfo} />
            ) : (
                <VoiceChat roomInfo={roomInfo} />
            )}
        </div>
    );
};

export default Room;
