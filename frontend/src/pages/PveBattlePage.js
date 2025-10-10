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
    const [mapImageUrl, setMapImageUrl] = useState(null); 

    // 로그인한 유저 정보 (예: JWT 디코딩 또는 Context)
    const userId = "sumin"; // 예시, 실제 구현시 Context나 Redux에서 가져오기

    // MAP_IMAGE_URL을 가져오는 로직 추가
    useEffect(() => {
        if (mapId) {
            // mapId를 이용해 맵 이미지 URL을 가져오는 API 호출 (백엔드 구현 필요)
            // 예시 API 경로: /api/pve/maps/1/image
            axios.get(`/api/pve/maps/${mapId}/image`, { withCredentials: true })
                .then(res => {
                    console.log("맵 이미지 URL 응답:", res.data);                                      
                    setMapImageUrl(res.data.mapImageUrl);
                })
                .catch(err => {
                    console.error("맵 이미지 가져오기 실패:", err);
                    // 실패 시 기본 배경 등을 설정할 수 있습니다.
                });
        }
    }, [mapId]); // mapId가 변경될 때마다 실행됩니다.

    // 로그인 유저 캐릭터 목록 가져오기    
    useEffect(() => {
        axios.get("/api/characte/list", { params: { userId } })
                    .then(res => {
                            console.log("캐릭터  스탯 데이터:", res.data);
                            if (Array.isArray(res.data)) setCharacters(res.data);
                            else setCharacters([]);
                        })
                    .catch(err => console.error("캐릭터 목록 불러오기 실패:", err));
        }, [userId]);
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
                characterStatId: selectedCharacter.characterStat?.characterStatId,
                mapId,
                userId
            };

            const res = await axios.post("/api/pve/battle/start", null, { params });
            const data = res.data;
            const turnLogs = data.turnLogs || [];

            // 턴별 로그 표시
            for (let i = 0; i < turnLogs.length; i) {
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

    // 배경 스타일 정의 (mapImageUrl 상태 사용)
    const backgroundStyle = {
        // 이미지가 있을 경우 배경 이미지 설정
        backgroundImage: mapImageUrl ? `url(${mapImageUrl})` : 'none',

        backgroundColor: 'transparent', // 흰색 배경 대신 이미지가 나타나게 함
        // 이미지가 로드되면 배경이 보이도록 cover 설정은 유지
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        // 배경 이미지를 뷰포트에 고정하여 스크롤해도 배경이 움직이지 않게 합니다.
        backgroundAttachment: 'fixed'
    };

    return (
        // 최상위 div에 backgroundStyle 적용
        <div
            className="flex flex-col items-center p-8 text-white min-h-screen"
            style={backgroundStyle} // 배경 스타일 적용
        >
            <h1 className="text-3xl font-bold mb-6">PVE 전투 (맵 ID: {mapId})</h1>

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
                    {characters.map(char => (
                    <div
                        key={char.characterId}
                        className={`p-4 border rounded-lg cursor-pointer ${
                            selectedCharacter?.characterId === char.characterId
                                ? "border-yellow-400"
                                : "border-gray-500"
                        }`}
                        onClick={() => setSelectedCharacter(char)}
                    >
                        <img
                            src={`/images/${char.imageId}`}
                            alt={char.characterName}
                            className="w-24 h-24 mb-2"
                        />
                        <div className="font-bold text-lg">{char.characterName}</div>
                        {char.characterStat && (
                            <div className="text-sm mt-2 text-gray-300">
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