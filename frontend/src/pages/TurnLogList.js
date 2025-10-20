import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from '../components/Header';

function BattleTurnLog() {
    const { battleId } = useParams();
    const [turnLogs, setTurnLogs] = useState([]);
    const token = localStorage.getItem("gmaking_token");
    const navigate = useNavigate();

    useEffect(() => {
        if (!battleId) return;
        axios.get(`/api/logs/turns/${battleId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => setTurnLogs(res.data))
            .catch(err => console.error("턴 로그 불러오기 실패:", err));
    }, [battleId]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 mt-10">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h2 className="text-2xl font-bold">전투 상세 로그</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    >
                        뒤로가기
                    </button>
                </div>

                {turnLogs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        로그가 없습니다.
                    </p>
                ) : (
                    <ul className="space-y-4 max-h-[600px] overflow-y-auto">
                        {turnLogs.map((log, idx) => (
                            <li
                                key={idx}
                                className="relative p-4 bg-gray-100 rounded-xl border-l-4 border-blue-500 shadow-sm"
                            >
                                <div className="absolute -left-3 top-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div className="font-semibold mb-1">
                                    턴 {log.turnNumber}
                                </div>
                                <div className="text-gray-700 whitespace-pre-line">
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
