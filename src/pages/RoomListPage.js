import React from 'react';
import Sidebar from '../components/Sidebar';

const GameCard = ({ title, number, message }) => (
    <div className="bg-gray-700 rounded-lg p-4 mb-4 shadow-lg">
        <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-gray-600 rounded-lg mr-4"></div>
            <div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-sm text-gray-400">No. {number}</p>
            </div>
        </div>
        <p>{message}</p>
    </div>
);

const RoomListPage = () => {
    return (
        <div className="flex h-full">
            <Sidebar />
            <div className="flex-1 p-8 bg-gray-900 overflow-y-auto">
                <div className="mb-8">
                    <GameCard
                        title="League of Legends"
                        number="101909"
                        message="같이 5대5해요!!"
                    />
                    <GameCard
                        title="League of Legends"
                        number="101919"
                        message="같이해요!!"
                    />
                    <GameCard
                        title="League of Legends"
                        number="101929"
                        message="!!"
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

export default RoomListPage