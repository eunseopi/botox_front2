import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/index.css';
import menuImage from '../../images/menu.png';
import mainLogo from '../../images/MainLogo.png';
import search from '../../images/search.png';
import lol from '../../images/lol.png';
import sudden from '../../images/sudden.png';
import userIcon from '../../images/user-icon.png';
import gta from '../../images/gta.png';

const MainPage = () => {
    const [userCounts, setUserCounts] = useState({ lol: 0, sudden: 0, gta: 0 });
    const [gameName, setGameName] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // 로그인 상태를 localStorage에서 가져옴
        const userInfo = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token');
        if (userInfo && token) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, []); // 빈 배열로 dependency 설정하여 컴포넌트 마운트 시 한 번만 실행

    const fetchUserCount = async (game) => {
        try {
            const response = await fetch(`https://botox-chat.site/api/rooms/${game}/count`);
            const data = await response.json();
            return data.count || 0; // 데이터가 없으면 0으로 설정
        } catch (error) {
            console.error('Failed to fetch user count', error);
            return 0;
        }
    };

    useEffect(() => {
        const updateUserCounts = async () => {
            const lolCount = await fetchUserCount('lol');
            const suddenCount = await fetchUserCount('sudden');
            const gtaCount = await fetchUserCount('gta');
            setUserCounts({ lol: lolCount, sudden: suddenCount, gta: gtaCount });
        };

        updateUserCounts();

        // Interval 설정하여 주기적으로 유저 수를 업데이트
        const intervalId = setInterval(updateUserCounts, 30000); // 30초마다 업데이트

        return () => clearInterval(intervalId);
    }, []);

    const handleAuth = () => {
        if (isLoggedIn) {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('token');
            setIsLoggedIn(false);
        } else {
            navigate('/login');
        }
    };

    const handleInRoom = (game) => {
        navigate(`/rooms?game=${game}`);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <div className="w-full bg-customTopNav h-10">
                <nav className="flex items-center justify-end mt-2 px-4">
                    <div className="flex items-center">
                        <a
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleAuth();
                            }}
                            className="text-white mr-4 hover:text-gray-300"
                        >
                            {isLoggedIn ? '로그아웃' : '로그인'}
                        </a>
                        <a href="/board" className="text-white hover:text-gray-300">게시글</a>
                    </div>
                </nav>
            </div>
            <div className="bg-customSearchBg py-8">
                <img src={mainLogo} alt="MenuLogo" className="mx-auto mb-4 max-w-full h-auto" />
                <div className="flex items-center justify-center px-4">
                    <div className="relative w-full max-w-lg">
                        <input
                            type="text"
                            id="text"
                            value={gameName}
                            onChange={(e) => { setGameName(e.target.value); }}
                            placeholder="검색어를 입력해 주세요."
                            className="w-full p-2 pl-10 border-0 rounded"
                        />
                        <img
                            src={search}
                            alt="Search"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        />
                    </div>
                </div>
            </div>
            <div className="flex-grow bg-customMainBg">
                <div className="text-center">
                    <h1 className="text-4xl text-white font-light p-10">Select Game!</h1>
                </div>
                <div className="flex flex-wrap justify-center px-4 sm:px-6 lg:px-64">
                    {/* LoL */}
                    <div className="w-full sm:w-1/2 md:w-1/3 p-2 relative">
                        <img src={lol} alt="MenuLoL" className="w-full h-auto object-cover rounded" onClick={() => handleInRoom('lol')} />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full flex items-center space-x-1 md:space-x-2">
                            <img src={userIcon} alt="User" className="w-4 h-4" />
                            <span className="text-sm md:text-base">{userCounts.lol}</span>
                        </div>
                    </div>
                    {/* Sudden */}
                    <div className="w-full sm:w-1/2 md:w-1/3 p-2 relative">
                        <img src={sudden} alt="MenuSudden" className="w-full h-auto object-cover rounded" onClick={() => handleInRoom('sudden')} />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full flex items-center space-x-1 md:space-x-2">
                            <img src={userIcon} alt="User" className="w-4 h-4" />
                            <span className="text-sm md:text-base">{userCounts.sudden}</span>
                        </div>
                    </div>
                    {/* GTA */}
                    <div className="w-full sm:w-1/2 md:w-1/3 p-2 relative">
                        <img src={gta} alt="MenuGta" className="w-full h-auto object-cover rounded" onClick={() => handleInRoom('gta')} />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full flex items-center space-x-1 md:space-x-2">
                            <img src={userIcon} alt="User" className="w-4 h-4" />
                            <span className="text-sm md:text-base">{userCounts.gta}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MainPage;
