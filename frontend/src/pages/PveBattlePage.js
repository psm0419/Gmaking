// src/pages/PveBattlePage.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

function PveBattlePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { mapId } = location.state || {};
    const [mapName, setMapName] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isBattle, setIsBattle] = useState(false);    
    const [mapImageUrl, setMapImageUrl] = useState(null);
    const logContainerRef = useRef(null);
    const socketRef = useRef(null);

    const token = localStorage.getItem("gmaking_token");
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        if (mapId) {
            axios
                .get(`/api/pve/maps/${mapId}/image`, { withCredentials: true })
                .then(res => {
                    setMapImageUrl(res.data.mapImageUrl);
                    setMapName(res.data.mapName);
                })
                .catch(err => console.error("맵 이미지/이름 가져오기 실패:", err));
        }
    }, [mapId]);

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

    useEffect(() => {
        // 로그가 추가될 때마다 스크롤을 맨 아래로 이동
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

        // WebSocket 연결
        const socket = new WebSocket("ws://localhost:8080/battle");
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("웹소켓 연결 성공:", new Date().toISOString());
            // 서버에 전투 시작 요청 전송
            const payload = {
                characterId: selectedCharacter.characterId,
                userId: userId,
                mapId: mapId // 서버가 DB에서 몬스터 생성
            };
            socket.send(JSON.stringify(payload));
        };

        socket.onmessage = (event) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch {
                data = { log: event.data }; // 순수 텍스트 로그 처리
            }

            if (data.type === "end") {
                // 전투 종료 시 상태 업데이트
                setIsBattle(false);                
                return;
            }

            // 일반 로그 처리
            const logText = data.log || event.data;
            setLogs(prev => [...prev, logText]);
        };

        socket.onclose = () => {
            console.log("웹소켓 연결 종료");
            setIsBattle(false);
        };

        socket.onerror = (error) => {
            console.error("웹소켓 오류:", error);
            setIsBattle(false);
        };
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
                                    <div>
                                        HP: {char.characterStat.characterHp} /
                                        ATK: {char.characterStat.characterAttack} /
                                        DEF: {char.characterStat.characterDefense}
                                    </div>
                                    <div>
                                        SPEED: {char.characterStat.characterSpeed} /
                                        CRITICAL: {char.characterStat.criticalRate}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            
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
                className="mt-6 bg-gray-900/80 p-6 rounded-xl w-3/5 min-h-[300px] overflow-y-auto border border-gray-700"
                style={{ maxHeight: '50vh' }}
            >
                {logs.map((log, i) => (
                    <pre
                        key={i}
                        className="text-white text-lg mb-1 font-mono hover:bg-gray-700/50 transition-colors duration-150 whitespace-pre-wrap"
                    >
                        {log}
                    </pre>
                ))}
            </div>            
        </div>
    );
}

export default PveBattlePage;