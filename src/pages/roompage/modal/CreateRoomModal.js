import React, { useState } from 'react';

const CreateRoomModal = ({ onClose, onRoomCreated, game }) => {
    const [newRoom, setNewRoom] = useState({
        roomTitle: '',
        roomContent: game || '',
        roomPassword: '',
        roomCapacityLimit: 10
    });

    const handleCreate = async () => {
        try {
            const response = await fetch('https://botox-chat.site/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newRoom)
            });

            const result = await response.json();
            if (result.code === 'CREATED') {
                onRoomCreated(result.data);
            } else {
                alert('방 생성 실패: ' + result.message);
            }
        } catch (error) {
            console.error('방 생성 중 오류 발생:', error);
            alert('방 생성 중 오류 발생');
        }
    };

    return (
        <div className="fixed top-0 left-0 w-full h-full bg-gray-800 bg-opacity-75 flex justify-center items-center">
            <div className="bg-white rounded-lg p-4 shadow-lg">
                <h2 className="text-lg font-bold mb-4">방 만들기</h2>
                <input
                    type="text"
                    placeholder="방 제목"
                    value={newRoom.roomTitle}
                    onChange={(e) => setNewRoom({ ...newRoom, roomTitle: e.target.value })}
                    className="mb-2 p-2 border border-gray-300 rounded w-full"
                />
                <input
                    type="password"
                    placeholder="방 비밀번호 (옵션)"
                    value={newRoom.roomPassword}
                    onChange={(e) => setNewRoom({ ...newRoom, roomPassword: e.target.value })}
                    className="mb-2 p-2 border border-gray-300 rounded w-full"
                />
                <input
                    type="number"
                    placeholder="방 인원 수 제한"
                    value={newRoom.roomCapacityLimit}
                    onChange={(e) => setNewRoom({ ...newRoom, roomCapacityLimit: parseInt(e.target.value) })}
                    className="mb-2 p-2 border border-gray-300 rounded w-full"
                />
                <button
                    onClick={handleCreate}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    방 만들기
                </button>
                <button
                    onClick={onClose}
                    className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
                >
                    닫기
                </button>
            </div>
        </div>
    );
};

export default CreateRoomModal;
