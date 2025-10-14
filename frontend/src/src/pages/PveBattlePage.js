// src/pages/PveBattlePage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

function PveBattlePage() {
    const location = useLocation();
    const { mapId } = location.state || {}; // MapSelection에서 전달된 mapId

    const [characters, setCharacters] = useState([]);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isBattle, setIsBattle] = useState(false);
    const [result, setResult] = useState(null);

    // 로그인한 유저 정보 (예: JWT 디코딩 또는 Context)
    const userId = "sumin"; // 예시, 실제 구현시 Context나 Redux에서 가져오기

    // 1️⃣ 로그인 유저 캐릭터 목록 가져오기
    useEffect(() => {
        axios.get("/api/characters", { params: { userId } })
            .then(res => {
                console.log("캐릭터 데이터:", res.data);
                if (Array.isArray(res.data)) setCharacters(res.data);
                else setCharacters([]);
            })
            .catch(err => console.error(err));
    }, [userId]);

    // 2️⃣ 전투 시작
    const startBattle = async () => {
        if (!selectedCharacter) {
            alert("캐릭터를 선택하세요!");
            return;
        }

        setLogs([]);
        setResult(null);
        setIsBattle(true);

        try {
            const params = {
                characterId: selectedCharacter.characterId,
                mapId,
                userId
            };

            const res = await axios.post("/api/pve/battle/start", null, { params });
            const data = res.data;
            const turnLogs = data.turnLogs || [];

            // 턴별 로그 표시
            for (let i = 0; i < turnLogs.length; i++) {
                await new Promise(r => setTimeout(r, 1000));
                setLogs(prev => [...prev, turnLogs[i]]);
            }

            setResult(data.isWin === "Y" ? "승리!" : "패배...");
        } catch (e) {
            console.error("전투 시작 실패:", e);
            setLogs(["전투 시작 실패"]);
        } finally {
            setIsBattle(false);
        }
    };

    return (
        <div className="flex flex-col items-center p-8 text-white bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold mb-6">PVE 전투</h1>

            <div className="mb-4">
                <h2 className="text-xl mb-2">캐릭터 선택</h2>
                <div className="flex gap-4 flex-wrap">
                    {characters.map(char => (
                        <div
                            key={char.characterId}
                            className={`p-4 border rounded-lg cursor-pointer ${selectedCharacter?.characterId === char.characterId ? "border-yellow-400" : "border-gray-500"}`}
                            onClick={() => setSelectedCharacter(char)}
                        >
                            <img src={`/images/${char.imageId}`} alt={char.characterName} className="w-24 h-24 mb-2" />
                            <div>{char.characterName}</div>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={startBattle}
                disabled={isBattle || !selectedCharacter}
                className="bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-500 disabled:bg-gray-500"
            >
                {isBattle ? "전투 중..." : "전투 시작"}
            </button>

            <div className="mt-6 bg-gray-800 p-4 rounded-lg w-2/3 min-h-[300px] overflow-y-auto">
                {logs.map((log, i) => (
                    <p key={i} className="text-lg mb-1">{log}</p>
                ))}
            </div>

            {result && (
                <div className="mt-4 text-2xl font-bold">
                    {result === "승리!" ? "승리!" : "패배..."}
                </div>
            )}
        </div>
    );
}

export default PveBattlePage;
