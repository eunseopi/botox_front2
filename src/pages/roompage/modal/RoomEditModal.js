import React, { useEffect, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';

const RoomEditModal = ({ isOpen, onClose, onSave, currentRoomInfo }) => {
    const [roomTitle, setRoomTitle] = useState(currentRoomInfo.roomTitle);
    const [roomType, setRoomType] = useState(currentRoomInfo.roomType);
    const [roomPassword, setRoomPassword] = useState(currentRoomInfo.roomPassword);
    const [roomCapacityLimit, setRoomCapacityLimit] = useState(currentRoomInfo.roomCapacityLimit);

    useEffect(() => {
        if (currentRoomInfo) {
            setRoomTitle(currentRoomInfo.roomTitle);
            setRoomType(currentRoomInfo.roomType);
            setRoomPassword(currentRoomInfo.roomPassword);
            setRoomCapacityLimit(currentRoomInfo.roomCapacityLimit);
        }
    }, [currentRoomInfo]);

    const handleSave = () => {
        const updatedRoomInfo = {
            roomTitle,
            roomType,
            roomPassword,
            roomCapacityLimit
        };
        onSave(updatedRoomInfo);
        onClose();
    };

    return isOpen ? (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-customFriendBg p-6 rounded-lg w-96">
                <h2 className="text-2xl text-white font-bold mb-4">방 정보 수정</h2>
                <input
                    type="text"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="방 제목"
                    className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                />
                <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                >
                    <option value="VOICE">음성</option>
                    <option value="TEXT">텍스트</option>
                </select>
                <input
                    type="password"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="방 비밀번호 (선택사항)"
                    className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                />
                <input
                    type="number"
                    value={roomCapacityLimit}
                    onChange={(e) => setRoomCapacityLimit(e.target.value)}
                    placeholder="최대 인원"
                    className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
                    min="2"
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
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 bg-customIdBg text-white rounded"
                    >
                        저장
                    </button>
                </div>
            </div>
        </div>
    ) : null;
};

export default RoomEditModal;
