import React from 'react';
import {useNavigate} from "react-router-dom";
import BotoxImage from '../images/white.png'
import menuImage from "../images/menu.png";

const LoginPage = () => {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/');
    }


    return (
        <div className="bg-customMainBg flex flex-col items-center justify-center">
            <div className="w-full bg-customTopNav h-10 mb-60">
                <nav className="flex items-center px-4">
                    <img src={menuImage} alt="Menu" className="w-10 h-10 p-2 mr-2"/>
                </nav>
            </div>
            <div className="bg-customLoginBg p-8 rounded-lg shadow-2xl w-1/3 h-1/2">
                <h1 className="text-3xl font-bold mb-6 flex items-center justify-center">
                    <img src={BotoxImage} alt="Botox" className="w-8 h-8 mr-3"/>
                    B o t o x
                </h1>
                <h3 className="text-customDarkBlue text-sm mb-2">이메일 또는 아이디</h3>
                <input
                    type="text"
                    className="w-full p-2 mb-4 border-0 rounded"
                />
                <h3 className="text-customDarkBlue text-sm mb-2">비밀번호</h3>
                <input
                    type="password"
                    className="w-full p-2 mb-6 border-0 rounded"
                />
                <button
                    onClick={handleLogin}
                    className="w-full bg-gray-300 p-2 rounded hover:bg-gray-400 transition duration-300">
                    로그인
                </button>
                <p className="mt-4 text-center">
                    계정이 없으시다면?{' '}
                    <a href="#" className="text-blue-500 font-bold hover:underline">
                        회원가입
                    </a>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;