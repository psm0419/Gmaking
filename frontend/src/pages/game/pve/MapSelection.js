import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Header from '../../../components/Header';

const MapSelection = () => {
    const [maps, setMaps] = useState([]);
    const [characters, setCharacters] = useState([]); // 캐릭터 목록
    const [selectedCharacterId, setSelectedCharacterId] = useState(null); // 선택된 캐릭터 ID
    const navigate = useNavigate();
    const token = localStorage.getItem("gmaking_token");

    // 토큰에서 userId 추출
    let userId = null;
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            userId = decodedToken.userId;
        } catch (e) {
            console.error("토큰 디코딩 실패:", e);
        }
    }

    // 등급 ID → 문자열 변환 함수
    const getGradeLabel = (gradeId) => {
        switch (gradeId) {
            case 1: return "N";
            case 2: return "R";
            case 3: return "SR";
            case 4: return "SSR";
            case 5: return "UR";
            default: return "-";
        }
    };

    useEffect(() => {
        if (!token || !userId) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }
        // 맵 목록 로드
        axios.get("/api/pve/maps", { withCredentials: true })
            .then(res => setMaps(res.data))
            .catch(err => console.error("맵 로드 실패:", err));

        // 캐릭터 목록 로드
        if (token && userId) {
            axios.get(`/api/character/list?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    const loadedCharacters = Array.isArray(res.data) ? res.data : [];
                    setCharacters(loadedCharacters);
                    // 캐릭터가 1개일 경우 자동 선택
                    if (loadedCharacters.length === 1) {
                        setSelectedCharacterId(loadedCharacters[0].characterId);
                    }
                })
                .catch(err => console.error("캐릭터 목록 불러오기 실패:", err));
        }
    }, [token, userId]);

    const handleSelectMap = (mapId) => {
        if (!selectedCharacterId) {
            alert("전투에 사용할 캐릭터를 먼저 선택해주세요!");
            return;
        }
        // 선택한 맵 ID와 캐릭터 ID를 함께 전투 화면으로 이동
        navigate("/pve/battle", { state: { mapId, characterId: selectedCharacterId } });
    };

    return (
        <div><Header />
            <div className="bg-gray-900 min-h-[calc(100vh-60px)] text-white p-5">
                {/* 캐릭터 선택 영역 */}
                <div className="mb-5 text-center">
                    <h2 className="text-2xl font-bold mb-4">내 캐릭터 선택</h2>
                    <div className="flex justify-center gap-4 flex-wrap">
                        {characters.map(char => (
                            <div
                                key={char.characterId}
                                onClick={() => setSelectedCharacterId(char.characterId)}
                                className={`p-4 border border-gray-800 rounded-lg cursor-pointer transition-colors duration-200 bg-gray-800/50 shadow-md
                                ${selectedCharacterId === char.characterId
                                        ? "border-yellow-400 ring-4 ring-yellow-400/50"
                                        : "border-gray-300 hover:bg-gray-700"
                                    }`}
                            >
                                <img
                                    src={char.imageUrl}
                                    alt={char.characterName}
                                    className="w-24 h-24 mx-auto"
                                />
                                <div className="font-bold text-lg mt-2 text-yellow-400">{char.characterName}({getGradeLabel(char.gradeId)})</div>

                                {/* 스탯 포함 */}
                                {char.characterStat && (
                                    <div className="text-l mt-1 text-gray-300">
                                        HP: {char.characterStat.characterHp} / ATK: {char.characterStat.characterAttack} / DEF: {char.characterStat.characterDefense}<br></br>
                                        Speed: {char.characterStat.characterSpeed} / CRITICAL: {char.characterStat?.criticalRate}%
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <h2 className="mb-10 text-center text-2xl font-bold mb-4">맵 선택</h2>
                {/* 맵 카드 컨테이너 */}
                <div className="flex justify-center gap-6 flex-wrap">
                    {maps.map((map) => (
                        <div
                            key={map.mapId}
                            onClick={() => handleSelectMap(map.mapId)}
                            className={`
                            relative w-64 h-40 overflow-hidden rounded-xl shadow-2xl transition-transform duration-300 transform hover:scale-105 hover:shadow-yellow-500/50 cursor-pointer
                            border border-gray-700
                        `}
                            // 맵 이미지를 배경으로 설정
                            style={{
                                backgroundImage: map.mapImageUrl ? `url(${map.mapImageUrl})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                // 이미지가 로드되지 않을 경우 대비
                                backgroundColor: map.mapImageUrl ? 'rgba(0,0,0,0.5)' : '#374151', // bg-gray-700
                                // backgroundBlendMode: 'darken' // 이미지를 살짝 어둡게 만들어 텍스트 가독성 높임
                            }}
                        >
                            {/* 맵 이름 오버레이 */}
                            <div className="absolute inset-0 flex flex-col justify-end items-center p-4 bg-gradient-to-t from-gray-900/80 to-transparent">
                                <h3 className="text-2xl font-bold mb-1 text-shadow-lg">
                                    {map.mapName}
                                </h3>
                            </div>

                            {/* 맵 설명 (선택 사항)*/}
                            <p className="absolute top-2 right-2 text-xs bg-gray-800/80 px-2 py-1 rounded">
                                일반 지역
                            </p>
                        </div>
                    ))}
                </div>

                {/* 맵 데이터 로딩 상태 피드백 */}
                {maps.length === 0 && (
                    <p className="text-center mt-10 text-gray-400">
                        맵 정보를 불러오는 중이거나 맵이 없습니다...
                    </p>
                )}
            </div>
        </div>

    );
};

export default MapSelection;