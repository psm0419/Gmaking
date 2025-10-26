import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from '../../components/Header';

function BattleTurnLog() {
    const { battleId } = useParams();
    const [turnLogs, setTurnLogs] = useState([]);
    const token = localStorage.getItem("gmaking_token");
    const navigate = useNavigate();
    const logContainerRef = useRef(null);

    useEffect(() => {
        if (!battleId) return;
        axios.get(`/api/logs/turns/${battleId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => setTurnLogs(res.data))
            .catch(err => console.error("턴 로그 불러오기 실패:", err));
    }, [battleId]);

    // window의 스크롤 내부 컨테이너로 전달
    useEffect(() => {
        const handleWheel = (e) => {
            const container = logContainerRef.current;
            if (!container) return;

            // 기본 스크롤 막기
            e.preventDefault();

            // 내부 스크롤로 전달
            container.scrollTop += e.deltaY;
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        return () => window.removeEventListener("wheel", handleWheel);
    }, []);

    return (        
        <div className="h-screen bg-gray-900">
            <Header />
            {/* 중앙 컨테이너 배경을 bg-gray-800으로 변경 */}
            <div className="max-w-3xl mx-auto bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-8 mt-10">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-3">
                    {/* 제목 텍스트 색상을 흰색으로 변경 */}
                    <h2 className="text-3xl font-bold text-white">전투 상세 로그</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium transition-all duration-200 shadow-md"
                    >
                        뒤로가기
                    </button>
                </div>
                {turnLogs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        로그가 없습니다.
                    </p>
                ) : (
                        <ul
                            ref={logContainerRef}
                            className="space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                        {turnLogs.map((log, idx) => (
                            <li
                                key={idx}
                                // * 로그 항목 배경을 bg-gray-700으로 변경, 테두리 색상 조정
                                className="relative p-4 bg-gray-700/70 rounded-xl border-l-4 border-blue-400 shadow-lg transition hover:bg-gray-700"
                            >
                                <div className="absolute -left-3 top-4 w-2.5 h-2.5 bg-blue-400 rounded-full ring-2 ring-gray-800"></div>
                                <div className="font-extrabold mb-1 text-blue-300">
                                    턴 {log.turnNumber}
                                </div>
                                {/* 내용 텍스트 색상을 밝은 톤으로 변경 */}
                                <div className="text-gray-300 whitespace-pre-line text-sm">
                                    {log.actionDetail}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default BattleTurnLog;
