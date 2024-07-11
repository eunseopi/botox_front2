import React, { useState } from 'react';

const CreateRoomModal = ({ onClose, onRoomCreated }) => {
    const [roomData, setRoomData] = useState({
        roomTitle: '',
        roomContent: '',
        roomType: 'voice',
        gameName: '',
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const newRoom = {
            ...roomData,
            roomId: Math.floor(Math.random() * 1000000).toString(),
            roomMasterId: "방장", // 실제 구현에서는 로그인한 사용자의 ID를 사용해야 합니다.
            chatType: roomData.roomType === 'voice' ? 'VoiceChat' : 'TextChat'
        };

        onRoomCreated(newRoom);
        onClose();

        // API 호출 부분은 주석 처리
        /*
        try {
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer <your-token>',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...roomData,
                    roomMasterId: 1,
                    roomStatus: true,
                }),
            });

            if (!response.ok) {
                throw new Error('Room creation failed');
            }

            const result = await response.json();
            onRoomCreated(result);
        } catch (error) {
            console.error('Error creating room:', error);
        }
        */
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
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
                        <option value="voice">음성</option>
                        <option value="text">텍스트</option>
                    </select>
                    <input
                        type="text"
                        name="gameName"
                        value={roomData.gameName}
                        onChange={handleChange}
                        placeholder="게임 이름"
                        className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                        required
                    />
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
        </div>
    );
};

export default CreateRoomModal;