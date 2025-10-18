// BattleLogList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function BattleLogList() {
    const [battleLogs, setBattleLogs] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem("gmaking_token");

    // 토큰에서 userId 추출
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
        if (!userId) {
            console.warn("userId 없음. 로그를 불러올 수 없습니다.");
            return;
        }

        axios.get(`/api/logs/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setBattleLogs(res.data))
            .catch(err => console.error("전투 로그 불러오기 실패:", err));
    }, [userId]);

    const handleClickLog = (battleId) => {
        navigate(`/logs/turns/${battleId}`);
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <h2 className="text-xl font-semibold mb-3">전투 기록</h2>
            <ul className="border rounded-lg">
                {battleLogs.map(log => (
                    <li
                        key={log.battleId}
                        className="p-3 border-b last:border-0 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleClickLog(log.battleId)}
                    >
                        [{log.battleType}] {log.createdDate} - {log.isWin === 'Y' ? '승리' : '패배'}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default BattleLogList;
