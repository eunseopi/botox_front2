import React, {useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/index.css'
import menuImage from '../../images/menu.png'
import mainLogo from '../../images/MainLogo.png'
import search from '../../images/search.png'
import lol from '../../images/lol.png'
import sudden from '../../images/sudden.png'
import userIcon from '../../images/user-icon.png'
import gta from '../../images/gta.png'
import {Link} from "react-router-dom";


const MainPage = () => {
    const [userCount, setUserCount] = React.useState(0);
    const [gameName, setGameName] = React.useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // 나중에 서버에서 불러올 코드 작성할게요!
        const intervalId = setInterval(() => {
            const randomCount = Math.floor(Math.random() * 500);
            setUserCount(randomCount);
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    const handleInRoom = () => {
        navigate('/room');
    }

    return (
        <div className="flex flex-col min-h-screen">
            <div className="w-full bg-customTopNav h-10">
                <nav className="flex items-center justify-between px-4">
                    <img src={menuImage} alt="Menu" className="w-10 h-10 p-2 mr-2" />
                    <div className="flex items-center">
                        <a href="/login" className="text-white mr-4 hover:text-gray-300">로그인</a>
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
                            onChange={(e) => {setGameName(e.target.value)}}
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
                    <div className="w-full sm:w-1/2 md:w-1/3 p-2 relative">
                        <img src={lol} alt="MenuLoL" className="w-auto h-auto object-cover rounded" onClick={handleInRoom}/>
                            <div className="absolute top-5 right-7 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full flex items-center">
                                <img src={userIcon} alt="User" className="w-3 h-3 sm:w-4 sm:h-4 mr-1"/>
                                <span>{userCount}</span>
                            </div>
                    </div>
                    <div className="w-full sm:w-1/2 md:w-1/3 p-2 relative">
                        <img src={sudden} alt="MenuSudden" className="w-auto h-auto object-cover rounded"/>
                        <div
                            className="absolute top-4 right-7 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full flex items-center">
                            <img src={userIcon} alt="User" className="w-4 h-4 mr-1"/>
                            <span>{userCount}</span>
                        </div>
                    </div>
                    <div className="w-full sm:w-1/2 md:w-1/3 p-2 relative">
                        <img src={gta} alt="MenuGta" className="w-auto h-auto object-cover rounded"/>
                        <div
                            className="absolute top-4 right-7 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full flex items-center">
                            <img src={userIcon} alt="User" className="w-4 h-4 mr-1"/>
                            <span>{userCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MainPage;