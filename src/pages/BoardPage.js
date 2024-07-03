import React, {useEffect, useRef} from 'react';
import menuImage from "../images/menu.png";
import roomIcon from '../images/roomIcon.png';
import egg from '../images/egg.png';
import good from '../images/good.jpeg';
import profile from '../images/profile.jpg'
import {useNavigate} from "react-router-dom";

const GameCard = ({ title, number, id }) => (
    <div className="bg-customBoardBg rounded-lg p-4 mb-4 shadow-lg m-auto w-8/12">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
                <div className="mr-8">
                    <img src={roomIcon} alt="Room" className="w-3 h-3 ml-5 mr-3 mt-2 mb-2 "/>
                    <p className="text-white mt-2">{number}</p>
                </div>
                <div>
                    <h3 className="font-bold text-white">{title}</h3>
                    <div className="flex items-center">
                        <img src={egg} alt="Egg" className="w-5 h-3 mr-2"/>
                        <p className="text-customIdBg">{id}</p>
                    </div>
                </div>
            </div>
            <div className="ml-auto">
                <img src={good} alt="Good" className="w-44 h-24"/>
            </div>
        </div>
    </div>
);

const BoardPage = () => {
    const [modalOpen, setModalOpen] = React.useState(false);
    const modalBackground = useRef(null);
    const navigate = useNavigate();

    const handleClickOutside = (e) => {
        if (modalBackground.current && !modalBackground.current.contains(e.target)) {
            setModalOpen(false);
        }
    };

    const handleClickHome = () => {
        navigate('/');
    }

    useEffect(() => {
        if (modalOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [modalOpen]);

    return (
        <div className="flex flex-col h-full">
            <div className="w-full bg-customTopNav h-10">
                <nav className="flex items-center justify-between px-4">
                    <button type="button" onClick={() => setModalOpen(!modalOpen)}>
                        <img src={menuImage} alt="Menu" className="w-10 h-10 p-2 mr-2"/>
                    </button>
                    {modalOpen && (
                        <div className="fixed top-10 left-10 flex justify-center items-start">
                            <div ref={modalBackground} className="bg-white opacity-70 p-4 w-60 h-60 inline-block rounded-xl shadow-lg">
                                <div className="flex items-center">
                                    <img src={profile} alt="Profile" className="w-20 h-20 p-2 mr-2 rounded-full opacity-100"/>
                                    <div>
                                    <p className="text-xl text-center mb-2">뜨끈한 두유님</p>
                                    <p className="ml-14 text-gray-500">로그아웃</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="bg-gray-200 mb-2">마이페이지</p>
                                    <p className="bg-gray-200 mb-2 cursor-pointer" onClick={handleClickHome}>홈</p>
                                    <p className="bg-gray-200 mb-2">게시판</p>
                                    <p className="bg-gray-200">친구목록</p>
                                </div>
                            </div>
                        </div>
                    )}
                </nav>
            </div>
            <div className="text-white text-4xl mb-6 mt-8 px-4 sm:px-8 md:px-16 lg:px-24 xl:px-80">
                <h1 className="text-center sm:text-left">자유 게시판</h1>
            </div>
            <div className="flex-1 p-8 bg-customMainBg overflow-y-auto">
                <div className="mb-8">
                    <GameCard
                        title="쵸비 VS 에디 후기 ㄷㄷㄷㄷㄷㄷㄷㄷ .JPG"
                        number="101909"
                        id="동욱"
                    />
                    <GameCard
                        title="쵸비 VS 에디 후기 ㄷㄷㄷㄷㄷㄷㄷㄷ .JPG"
                        number="101919"
                        id="은섭"
                    />
                    <GameCard
                        title="쵸비 VS 에디 후기 ㄷㄷㄷㄷㄷㄷㄷㄷ .JPG"
                        number="101929"
                        id="동렬"
                    />
                </div>
                <div className="flex justify-center text-white">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button key={num} className="mx-1 px-3 py-1 rounded hover:bg-gray-700">
                            {num}
                        </button>
                    ))}
                    <button className="ml-2 px-3 py-1 rounded hover:bg-gray-700">다음 &gt;</button>
                </div>
            </div>
        </div>
    );
};

export default BoardPage;
