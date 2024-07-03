import React from 'react';
import '../styles/index.css';
import {useNavigate} from 'react-router-dom'

function Sidebar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/login');
    }

    return (
        <div className="w-64 h-full bg-gray-800 p-6">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4"></div>
                <p>???님</p>
            </div>
            <nav>
                <ul>
                    <li className="mb-4 cursor-pointer hover:text-gray-300">홈</li>
                    <li className="mb-4 cursor-pointer hover:text-gray-300">게시판</li>
                    <button onClick={handleLogout} className="mb-4 cursor-pointer hover:text-gray-300">로그아웃</button>
                </ul>
            </nav>
        </div>
    )
}

export default Sidebar;