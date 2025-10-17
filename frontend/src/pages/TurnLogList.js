// BattleTurnLog.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function BattleTurnLog() {
    const { battleId } = useParams();
    const [turnLogs, setTurnLogs] = useState([]);
    const token = localStorage.getItem("gmaking_token");

    useEffect(() => {
        if (!battleId) return;

        axios.get(`/api/logs/turns/${battleId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setTurnLogs(res.data))
            .catch(err => console.error("턴 로그 불러오기 실패:", err));
    }, [battleId]);

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <h2 className="text-xl font-semibold mb-3">전투 상세 로그</h2>
            <ul className="border rounded-lg">
                {turnLogs.map((log, idx) => (
                    <li key={idx} className="p-3 border-b last:border-0">
                        <div><strong>턴 {log.turnNumber}</strong></div>
                        <div>{log.actionDetail}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default BattleTurnLog;
