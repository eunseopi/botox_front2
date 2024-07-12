import React, { useState } from 'react';

const PasswordModal = ({ onClose, onConfirm }) => {
    const [password, setPassword] = useState('');

    const handleChange = (e) => {
        setPassword(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(password);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-customFriendBg p-6 rounded-lg w-96">
                <h2 className="text-2xl text-white font-bold mb-4">비밀번호 입력</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={handleChange}
                        placeholder="비밀번호를 입력해 주세요."
                        className="w-full text-white bg-customMainBg p-2 mb-2 border rounded"
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
                            확인
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordModal;
