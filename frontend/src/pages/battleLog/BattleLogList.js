import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Header from '../../components/Header';

function BattleLogList() {
    const [battleLogs, setBattleLogs] = useState([]);
    const [characterMap, setCharacterMap] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL"); // ALL / PVP / PVE
    const navigate = useNavigate();
    const token = localStorage.getItem("gmaking_token");
    const myCharacterIds = Object.keys(characterMap).map(id => Number(id));

    let userId = null;
    const logContainerRef = useRef(null);
    if (token) {
        try {
            const decoded = jwtDecode(token);
            userId = decoded.userId;
        } catch (e) {
            console.error("토큰 디코딩 실패:", e);
        }
    }

    useEffect(() => {
        if (!token || !userId) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

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
        .filter(log =>
            typeFilter === "ALL" || log.battleType.toUpperCase() === typeFilter.toUpperCase()
        )
        .filter(log => {
            const lower = searchTerm.toLowerCase();
            // 내 캐릭터 이름, 상대 이름 모두 검색 대상에 포함
            return (
                (log.characterName && log.characterName.toLowerCase().includes(lower)) ||
                (log.opponentName && log.opponentName.toLowerCase().includes(lower))
            );
        });
    useEffect(() => {
        console.log("현재 필터:", typeFilter);
    }, [typeFilter]);

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
        <div className="h-screen flex flex-col bg-gray-900">
            <Header />

            {/* 상단 고정 영역 */}
            <div className="w-full max-w-4xl mx-auto p-6 flex flex-col gap-4">
                <h2 className="text-3xl font-bold text-center border-b pb-3 text-white">
                    전투 기록
                </h2>

                {/* 필터 버튼 */}
                <div className="flex justify-center gap-3 flex-wrap">
                    {["ALL", "PVP", "PVE"].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`px-5 py-2 rounded-xl font-medium transition duration-200 shadow-md
                                ${typeFilter === type
                                    ? "bg-blue-500 text-white shadow-blue-600"
                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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
                    className="w-full border border-gray-700 bg-gray-800 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
            </div>

            {/* 로그 목록만 스크롤 */}
            <div
                ref={logContainerRef}
                className="flex-1 overflow-auto w-full max-w-4xl mx-auto px-6 pb-6 mb-5 no-scrollbar">
                {filteredLogs.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                        {searchTerm
                            ? "검색 결과가 없습니다."
                            : "전투 기록이 없습니다."}
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {filteredLogs.map((log, index) => {
                            const isWin = log.isWin === "Y";
                            const isPVE = log.battleType?.toUpperCase() === "PVE";
                            const isAttack = isPVE ? true : myCharacterIds.includes(log.characterId);
                            const roleLabel = isAttack ? "공격" : "방어";

                            const safeCharName = (name) => name || "삭제된 캐릭터";

                            const myCharName = isAttack
                                ? safeCharName(log.characterName)
                                : safeCharName(log.opponentName);
                            const opponentName = isAttack
                                ? safeCharName(log.opponentName)
                                : safeCharName(log.characterName);

                            return (
                                <li
                                    key={`${log.battleId}-${index}`}
                                    onClick={() => handleClickLog(log.battleId)}
                                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 
                            hover:shadow-xl hover:scale-[1.01] shadow-lg
                            ${isWin
                                            ? "bg-green-900/30 border-green-700 hover:border-green-500" // 승리
                                            : "bg-red-900/30 border-red-700 hover:border-red-500" // 패배
                                        }`}
                                >
                                    <div className="flex justify-between items-center text-white">
                                        <span className="font-semibold text-lg">
                                            [{log.battleType}] {myCharName} ({roleLabel}) vs {opponentName}
                                        </span>
                                        <span className={`font-bold ${isWin ? "text-green-400" : "text-red-400"}`}>
                                            {isWin ? "승리" : "패배"}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-1">
                                        {log.createdDate}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}


export default BattleLogList;
