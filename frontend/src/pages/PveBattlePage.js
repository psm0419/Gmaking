// src/pages/PveBattlePage.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function PveBattlePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { mapId, characterId } = location.state || {};

    const [mapName, setMapName] = useState(null);
    const [mapImageUrl, setMapImageUrl] = useState(null);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [opponentMonster, setOpponentMonster] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isBattle, setIsBattle] = useState(false);
    const logContainerRef = useRef(null);

    const token = localStorage.getItem("gmaking_token");

    // 토큰에서 userId와 characterImageUrl 추출
    let userId = null;
    let characterImageUrl = null;
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            userId = decodedToken.userId;
            characterImageUrl = decodedToken.characterImageUrl;
            console.log("decodedToken:", decodedToken);
        } catch (e) {
            console.error("토큰 디코딩 실패:", e);
        }
    }

    useEffect(() => {
        if (!mapId || !characterId) {
            alert("맵 또는 캐릭터가 선택되지 않았습니다.");
            navigate("/pve/maps");
            return;
        }

        // 맵 정보 로드
        axios.get(`/api/pve/maps/${mapId}/image`, { withCredentials: true })
            .then(res => {
                setMapImageUrl(res.data.mapImageUrl);
                setMapName(res.data.mapName);
            })
            .catch(err => console.error("맵 이미지/이름 가져오기 실패:", err));

        // 선택된 캐릭터 정보 로드
        if (token && userId) {
            axios.get(`/api/character/list?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    const charList = Array.isArray(res.data) ? res.data : [];
                    const selected = charList.find(c => c.characterId === characterId);
                    if (selected) {
                        setSelectedCharacter(selected);
                    } else {
                        alert("선택된 캐릭터 정보를 찾을 수 없습니다.");
                        navigate("/pve/maps");
                    }
                })
                .catch(err => console.error("캐릭터 정보 로드 실패:", err));
        }

        setOpponentMonster(null);
    }, [mapId, characterId, token, userId, navigate]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const startBattle = () => {
        if (!selectedCharacter) {
            alert("캐릭터를 선택하세요!");
            return;
        }
        setLogs([]);
        setIsBattle(true);
        // WebSocket 연결 및 로직은 이전 코드 그대로
    };

    const backgroundStyle = {
        backgroundImage: mapImageUrl ? `url(${mapImageUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };
    const selectedImageUrl = selected?.imageUrl || characterImageUrl;
    return (
        <div className="flex flex-col items-center p-8 min-h-screen" style={backgroundStyle}>
            <h1 className="text-3xl font-bold mb-6">
                PVE 전투 ({mapName || `맵 ID: ${mapId}`})
            </h1>
            
            {/* 캐릭터 및 몬스터 정보 */}
            {selectedCharacter ? (
                <div className="flex justify-around w-full max-w-4xl mb-6 p-6 bg-gray-900/80 rounded-xl shadow-2xl border border-yellow-500/50">

                    {/* 내 캐릭터 */}
                    <div className="text-center w-1/3 p-4 bg-gray-800/50 rounded-lg">
                        <h2 className="text-2xl font-bold mb-3 text-yellow-400">{selectedCharacter.characterName}</h2>
                        <div className="w-32 h-32 mx-auto mb-2 border border-yellow-400 rounded-lg bg-white/10 overflow-hidden">
                            {characterImageUrl ? (
                                <img
                                    src={characterImageUrl}
                                    alt={selectedCharacter.characterName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-yellow-400 font-bold">
                                    이미지 없음
                                </div>
                            )}
                        </div>
                        <div className="text-l mt-2 text-gray-200">
                            <p>HP: {selectedCharacter.characterStat?.characterHp} / ATK: {selectedCharacter.characterStat?.characterAttack}/ DEF: {selectedCharacter.characterStat?.characterDefense}</p>
                            <p>SPEED: {selectedCharacter.characterStat?.characterSpeed} / CRITICAL: {selectedCharacter.characterStat?.criticalRate}%</p>
                        </div>
                    </div>

                    <div className="flex items-center text-4xl font-extrabold text-red-500 w-1/3 justify-center">
                        VS
                    </div>

                    {/* 몬스터 */}
                    <div className="text-center w-1/3 p-4 bg-gray-800/50 rounded-lg">
                        {opponentMonster ? (
                            <>
                                <h2 className="text-2xl font-bold mb-3 text-red-400">{opponentMonster.monsterName}</h2>
                                <img
                                    src={`/images/monster/${opponentMonster.imageOriginalName}`}
                                    alt={opponentMonster.monsterName}
                                    className="w-32 h-32 mx-auto mb-2 border border-red-400 rounded-lg bg-white/10"
                                />
                                <div className="text-l mt-2 text-gray-200">
                                    <p>HP: {opponentMonster.monsterHp} / ATK: {opponentMonster.monsterAttack} / DEF: {opponentMonster.monsterDefense}</p>
                                    <p>SPEED: {opponentMonster.monsterSpeed} / CRITICAL: {opponentMonster.monsterCriticalRate}%</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-xl pt-10 text-gray-400">전투 시작 시 몬스터 조우...</p>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-xl mb-6 text-gray-400">캐릭터 정보를 불러오는 중...</p>
            )}

            <div className="flex gap-4 mt-4">
                <button
                    onClick={startBattle}
                    disabled={isBattle || !selectedCharacter}
                    className="bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-500 disabled:bg-gray-500"
                >
                    {isBattle ? "전투 중..." : "전투 시작"}
                </button>

                <button
                    onClick={() => navigate("/pve/maps")}
                    disabled={isBattle}
                    className="bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-500 disabled:bg-gray-500"
                >
                    맵 선택
                </button>
            </div>

            <div
                className="mt-6 bg-gray-900/80 p-6 rounded-xl w-4/5 min-h-[300px] overflow-y-auto border border-gray-700"
                style={{ maxHeight: '50vh' }}
                ref={logContainerRef}
            >
                {logs.map((log, i) => (
                    <p
                        key={i}
                        className="text-white text-lg mb-1 font-mono hover:bg-gray-700/50 transition-colors duration-150 whitespace-pre-wrap"
                    >
                        {log}
                    </p>
                ))}
            </div>
        </div>
    );
}

export default PveBattlePage;
