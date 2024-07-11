import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import menuImage from "../../images/menu.png";
import roomIcon from '../../images/roomIcon.png';
import egg from '../../images/egg.png';
import good from '../../images/good.jpeg';
import profile from '../../images/profile.jpg'
import search from "../../images/search.png";
import CreateRoomModal from './CreateRoomModal';
import { AiOutlineUserAdd } from "react-icons/ai";


const GameCard = ({ room, onClick }) => (
    <div className="bg-customBoardBg rounded-lg p-4 mb-4 shadow-lg m-auto w-8/12 cursor-pointer"
         onClick={() => onClick(room)}>
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
                <div className="mr-8">
                    <img src={roomIcon} alt="Room" className="w-3 h-3 ml-5 mr-3 mt-2 mb-2 "/>
                    <p className="text-white mt-2">{room.roomId}</p>
                </div>
                <div>
                    <h3 className="font-bold text-white">{room.roomTitle}</h3>
                    <div className="flex items-center">
                        <img src={egg} alt="Egg" className="w-5 h-3 mr-2"/>
                        <p className="text-customIdBg">{room.roomMasterId}</p>
                    </div>
                </div>
            </div>
            <div className="ml-auto">
                <img src={good} alt="Good" className="w-44 h-24"/>
            </div>
        </div>
    </div>
);

const RoomPage = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [rooms, setRooms] = useState([]);
    const [friendsModalOpen, setFriendsModalOpen] = useState(false);
    const [createRoomModalOpen, setCreateRoomModalOpen] = useState(false);
    const modalBackground = useRef(null);
    const friendsModalBackground = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // LocalStorage에서 방 목록 가져오기
        const storedRoomsString = localStorage.getItem('rooms');
        let storedRooms = [];

        if (storedRoomsString) {
            try {
                storedRooms = JSON.parse(storedRoomsString);
            } catch (error) {
                console.error('Error parsing stored rooms:', error);
            }
        }

        if (storedRooms.length > 0) {
            setRooms(storedRooms);
        } else {
            // 초기 방이 없을 경우 더미 데이터 사용
            const initialRooms = [
                { roomId: 101909, roomTitle: "쵸비 VS 에디 대전", roomMasterId: "동욱" },
            ];
            setRooms(initialRooms);
            localStorage.setItem('rooms', JSON.stringify(initialRooms));
        }
    }, []);

    const handleClickOutside = useCallback((e) => {
        if (modalOpen && modalBackground.current && !modalBackground.current.contains(e.target)) {
            setModalOpen(false);
        }
        if (friendsModalOpen && friendsModalBackground.current && !friendsModalBackground.current.contains(e.target)) {
            setFriendsModalOpen(false);
        }
    }, [modalOpen, friendsModalOpen]);

    const handleFriendClick = () => {
        setFriendsModalOpen(true);
        setModalOpen(false);
    }

    const handleBoardClick = () => {
        navigate('/board');
    }

    const handleClickHome = () => {
        navigate('/');
    }

    const handleWrite = () => {
        navigate('/write')
    }

    const handleRoomClick = (room) => {
        navigate(`/room/${room.roomId}`, { state: { room } });
    };

    const handleCreateRoom = () => {
        setCreateRoomModalOpen(true);
    };

    const handleCloseCreateRoomModal = () => {
        setCreateRoomModalOpen(false);
    };

    const handleRoomCreated = (newRoom) => {
        const updatedRooms = [
            {
                roomId: newRoom.roomId,
                roomTitle: newRoom.roomTitle,
                roomMasterId: newRoom.roomMasterId,
                // 필요한 다른 속성들도 여기에 추가
            },
            ...rooms
        ];
        setRooms(updatedRooms);
        localStorage.setItem('rooms', JSON.stringify(updatedRooms));
        setCreateRoomModalOpen(false);
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

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
                                    <p className="bg-gray-200 mb-2 cursor-pointer" onClick={handleBoardClick}>게시판</p>
                                    <p className="bg-gray-200 cursor-pointer" onClick={handleFriendClick}>친구목록</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {friendsModalOpen && (
                        <div className="fixed top-10 left-10 flex justify-center items-start z-1">
                            <div ref={friendsModalBackground} className="bg-customFriendBg p-4 w-96 h-80 rounded-xl shadow-lg">
                                <div className="flex items-center justify-between">
                                <h2 className="text-white text-xl mb-4">친구 목록</h2>
                                    <AiOutlineUserAdd className="w-10 h-10 mb-2"/>
                                </div>
                                <hr className="mb-4"/>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>
                                            <span className="text-white">인간성기삽니다123</span>
                                        </div>
                                        <button className="bg-green-500 text-white px-2 py-1 rounded">참여</button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 bg-gray-500 rounded-full mr-2"></div>
                                            <span className="text-white">와일드 맨들 9999</span>
                                        </div>
                                        <button className="bg-blue-500 text-white px-2 py-1 rounded">로비</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </nav>
            </div>
            <div className="text-white text-4xl mb-6 mt-8 px-4 sm:px-8 md:px-16 lg:px-24 xl:px-80">
                <h1 className="text-center sm:text-left">방 목록</h1>
            </div>
            <div className="flex-1 p-8 bg-customMainBg overflow-y-auto">
                <div className="flex justify-end sm:mr-80 lg:mr-80 xl:mr-80 mb-4">
                    <button
                        onClick={handleCreateRoom}
                        className="text-xl text-white bg-customBoardBg p-2 rounded-xl w-48 mr-4"
                    >방 만들기</button>
                    <button
                        onClick={handleWrite}
                        className="text-xl text-white bg-customBoardBg p-2 rounded-xl w-48"
                    >게시글 쓰기</button>
                </div>
                <div className="mb-8">
                    {rooms.map((room, index) => (
                        <GameCard
                            key={index}
                            room={room}
                            onClick={handleRoomClick}
                        />
                    ))}
                </div>
                <div className="flex items-center justify-center px-4">
                    <div className="relative w-full max-w-lg">
                        <input
                            type="text"
                            id="text"
                            value={roomName}
                            onChange={(e) => {
                                setRoomName(e.target.value)
                            }}
                            placeholder="제목을 입력해 주세요."
                            className="w-full p-2 pl-10 mb-3 border-0 rounded"
                        />
                        <img
                            src={search}
                            alt="Search"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        />
                    </div>
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
            {createRoomModalOpen && (
                <CreateRoomModal
                    onClose={handleCloseCreateRoomModal}
                    onRoomCreated={handleRoomCreated}
                />
            )}
        </div>
    );
};

export default RoomPage;