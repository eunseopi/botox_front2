import React, { useState } from 'react';
import ReactDOM from "react-dom";

const CreateRoomModal = ({ onClose, onRoomCreated, game, lastRoomNum }) => {
    const [roomData, setRoomData] = useState({
        roomTitle: '',
        roomContent: '',
        roomType: 'VOICE',
        gameName: game,
        roomPassword: '',
        roomCapacityLimit: 2,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setRoomData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const currentDate = new Date().toISOString();
            const requestData = {
                roomNum: lastRoomNum + 1,
                roomTitle: roomData.roomTitle,
                roomContent: roomData.roomContent,
                roomType: roomData.roomType,
                gameName: roomData.gameName,
                roomMasterId: JSON.parse(localStorage.getItem('userInfo')).id,
                roomStatus: 'OPEN',
                roomPassword: roomData.roomPassword,
                roomCapacityLimit: parseInt(roomData.roomCapacityLimit),
                roomUpdateTime: currentDate,
                roomCreateAt: currentDate,
                roomUserCount: 1 // 방장 포함
            };

            const response = await fetch('https://botox-chat.site/api/rooms', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('Room creation failed');
            }

            const result = await response.json();
            if (result.code === 'CREATED') {
                onRoomCreated(result.data);
                onClose();
            } else {
                throw new Error(result.message || 'Room creation failed');
            }
        } catch (error) {
            console.error('Error creating room:', error);
            alert('방 생성에 실패했습니다. 다시 시도해 주세요.');
        }
    };

    return (
        <>
            {ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black bg-opacity-50"></div>,
                document.getElementById('backdrop-root')
            )}
            {ReactDOM.createPortal(
                <div className="fixed inset-0 flex justify-center items-center">
                    <div className="bg-customFriendBg p-6 rounded-lg w-96">
                        <h2 className="text-2xl text-white font-bold mb-4">방 만들기</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="roomTitle"
                                value={roomData.roomTitle}
                                onChange={handleChange}
                                placeholder="방 제목"
                                className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                                required
                            />
                            <textarea
                                name="roomContent"
                                value={roomData.roomContent}
                                onChange={handleChange}
                                placeholder="방 설명"
                                className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                                required
                            />
                            <select
                                name="roomType"
                                value={roomData.roomType}
                                onChange={handleChange}
                                className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                                required
                            >
                                <option value="VOICE">음성</option>
                                <option value="TEXT">텍스트</option>
                            </select>
                            <input
                                type="password"
                                name="roomPassword"
                                value={roomData.roomPassword}
                                onChange={handleChange}
                                placeholder="방 비밀번호 (선택사항)"
                                className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                            />
                            <input
                                type="number"
                                name="roomCapacityLimit"
                                value={roomData.roomCapacityLimit}
                                onChange={handleChange}
                                placeholder="최대 인원"
                                className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                                min="2"
                                required
                            />
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-300 rounded mr-2"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-customIdBg text-white rounded"
                                >
                                    방 만들기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.getElementById('modal-root')
            )}
        </>
    );
};

export default CreateRoomModal;