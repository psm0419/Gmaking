import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Brain, Type } from "lucide-react";
import Header from '../../../components/Header';

function MiniGameList() {
    const navigate = useNavigate();

    const games = [
        {
            id: "reaction",
            title: "반응속도 테스트",
            desc: "순간의 집중력과 반사신경을 시험하세요!",
            icon: <Zap className="w-10 h-10 text-yellow-400" />,
            color: "from-yellow-500 to-yellow-700",
        },
        {
            id: "memory",
            title: "기억력 게임",
            desc: "같은 카드를 찾아 기억력을 증명하세요.",
            icon: <Brain className="w-10 h-10 text-blue-400" />,
            color: "from-blue-500 to-blue-700",
        },
        {
            id: "typing",
            title: "타이핑 배틀",
            desc: "정확하고 빠르게 주문을 입력하세요.",
            icon: <Type className="w-10 h-10 text-green-400" />,
            color: "from-green-500 to-green-700",
        }        
    ];

    return (
        <div>
            <Header />
            <div className="h-[calc(100vh-60px)] bg-gray-900 text-white flex flex-col items-center py-12 px-6">
                <h1 className="text-4xl font-bold mb-10">미니게임 목록</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                    {games.map((game) => (
                        <div
                            key={game.id}
                            onClick={() => navigate(`/minigame/${game.id}`)}
                            className={`bg-gradient-to-br ${game.color} rounded-2xl shadow-lg p-6 cursor-pointer transform hover:scale-105 transition-all duration-300`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>{game.icon}</div>
                                <span className="text-sm bg-black bg-opacity-30 px-3 py-1 rounded-full">
                                    클릭하여 시작
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{game.title}</h2>
                            <p className="text-gray-100">{game.desc}</p>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => navigate("/")}
                    className="mt-12 px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-lg font-semibold shadow-md transition-all duration-300"
                >
                    메인으로 돌아가기
                </button>
            </div>
        </div>
    );
}

export default MiniGameList;
