import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Header from '../components/Header';

function BattleLogList() {
    const [battleLogs, setBattleLogs] = useState([]);
    const [characterMap, setCharacterMap] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL"); // ALL / PVP / PVE
    const navigate = useNavigate();
    const token = localStorage.getItem("gmaking_token");

    let userId = null;
    if (token) {
        try {
            const decoded = jwtDecode(token);
            userId = decoded.userId;
        } catch (e) {
            console.error("토큰 디코딩 실패:", e);
        }
    }

    useEffect(() => {
        if (!userId) return;

        // 전투 로그 불러오기
        axios.get(`/api/logs/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => setBattleLogs(res.data))
            .catch(err => console.error("전투 로그 불러오기 실패:", err));

        // 캐릭터 목록 불러오기 → ID: 이름 매핑
        axios.get(`/api/character/list?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => {
                if (Array.isArray(res.data)) {
                    const map = {};
                    res.data.forEach(c => {
                        map[c.characterId] = c.characterName;
                    });
                    setCharacterMap(map);
                }
            })
            .catch(err => console.error("캐릭터 목록 불러오기 실패:", err));
    }, [userId]);

    const handleClickLog = (battleId) => navigate(`/logs/turns/${battleId}`);

    // 필터링: 타입 + 검색어
    const filteredLogs = battleLogs
        .filter(log => typeFilter === "ALL" || log.battleType === typeFilter)
        .filter(log =>
            (characterMap[log.characterId] || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            <Header />

            {/* 상단 고정 영역 */}
            <div className="w-full max-w-4xl mx-auto p-6 flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-center border-b pb-3">
                    전투 기록
                </h2>

                {/* 필터 버튼 */}
                <div className="flex justify-center gap-3 flex-wrap">
                    {["ALL", "PVP", "PVE"].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-4 py-2 rounded-lg font-medium transition 
                                ${typeFilter === type
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                        >
                            {type === "ALL" ? "전체" : type}
                        </button>
                    ))}
                </div>

                {/* 검색창 */}
                <input
                    type="text"
                    placeholder="캐릭터 이름 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* 로그 목록만 스크롤 */}
            <div className="flex-1 overflow-auto w-full max-w-4xl mx-auto p-6">
                {filteredLogs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        {searchTerm
                            ? "검색 결과가 없습니다."
                            : "전투 기록이 없습니다."}
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {filteredLogs.map((log) => (
                            <li
                                key={log.battleId}
                                onClick={() => handleClickLog(log.battleId)}
                                className={`cursor-pointer p-4 rounded-xl border transition-shadow duration-200 
                                            hover:shadow-lg 
                                            ${log.isWin === "Y" ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-lg">
                                        [{log.battleType}] {characterMap[log.characterId] || `ID: ${log.characterId}`}
                                    </span>
                                    <span className={`font-bold ${log.isWin === "Y" ? "text-green-600" : "text-red-600"}`}>
                                        {log.isWin === "Y" ? "승리" : "패배"}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mt-1">
                                    {log.createdDate}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default BattleLogList;
