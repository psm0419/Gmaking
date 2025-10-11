// src/pages/PveBattlePage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

function PveBattlePage() {
    const location = useLocation();
    const { mapId } = location.state || {};
    const [mapName, setMapName] = useState(null); 
    const [characters, setCharacters] = useState([]);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isBattle, setIsBattle] = useState(false);
    const [result, setResult] = useState(null);
    const [mapImageUrl, setMapImageUrl] = useState(null);

    // localStorage에서 token과 userId 가져오기
    const token = localStorage.getItem("gmaking_token");
    const userId = localStorage.getItem("userId");

    // MAP 이미지 가져오기
    useEffect(() => {
        if (mapId) {
            axios
                .get(`/api/pve/maps/${mapId}/image`, { withCredentials: true })
                .then(res => {
                    setMapImageUrl(res.data.mapImageUrl);
                    // 맵 이름 상태 저장
                    setMapName(res.data.mapName);
                })
                .catch(err => console.error("맵 이미지/이름 가져오기 실패:", err));
        }
    }, [mapId]);

    // 캐릭터 목록 가져오기
    useEffect(() => {
        if (!token || !userId) {
            alert("로그인이 필요합니다.");
            return;
        }

        axios.get(`/api/character/list?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setCharacters(Array.isArray(res.data) ? res.data : []);
                console.log("캐릭터 데이터:", res.data);
            })
            .catch(err => console.error("캐릭터 목록 불러오기 실패:", err));
    }, [token, userId]);

    // 전투 시작
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

            const res = await axios.post("/api/pve/battle/start", null, {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data;
            const turnLogs = data.turnLogs || [];

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

    const backgroundStyle = {
        backgroundImage: mapImageUrl ? `url(${mapImageUrl})` : 'none',
        backgroundColor: 'transparent',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
    };

    return (
        <div className="flex flex-col items-center p-8 min-h-screen" style={backgroundStyle}>
            <h1 className="text-3xl font-bold mb-6">
                PVE 전투 ({mapName ? mapName : `맵 ID: ${mapId}`})
            </h1> 

            <div className="mb-4">
                <h2 className="text-xl mb-2">캐릭터 선택</h2>
                <div className="flex gap-4 flex-wrap">
                    {characters.map(char => (
                        <div
                            key={char.characterId}
                            className={`p-4 border rounded-lg cursor-pointer bg-white ${selectedCharacter?.characterId === char.characterId
                                    ? "border-yellow-400"
                                    : "border-gray-500"
                                }`}
                            onClick={() => setSelectedCharacter(char)}
                        >
                            <div className="flex justify-center mb-2">
                                <img
                                    src={`/images/character/${char.imageId}.png`}
                                    alt={char.characterName}
                                    className="w-24 h-24"
                                />
                            </div>
                            <div className="font-bold text-lg">{char.characterName}</div>
                            {char.characterStat && (
                                <div className="text-sm mt-2 text-black">
                                    HP: {char.characterStat.characterHp} /
                                    ATK: {char.characterStat.characterAttack} /
                                    DEF: {char.characterStat.characterDefense}
                                </div>
                            )}
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

            <div
                className="mt-6 bg-gray-900/80 p-6 rounded-xl w-3/5 min-h-[300px] overflow-y-auto border border-gray-700"
                style={{ maxHeight: '50vh' }} // 화면 높이의 50%를 최대 높이로 제한
            >
                {logs.map((log, i) =>
                    <p key={i} className="text-white text-lg mb-1 font-mono hover:bg-gray-700/50 transition-colors duration-150">
                        {log}
                    </p>
                )}
            </div>

            {result && <div className="mt-4 text-2xl font-bold">{result}</div>}
        </div>
    );
}

export default PveBattlePage;
