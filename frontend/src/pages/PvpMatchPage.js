import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function PvpMatchPage() {
    const navigate = useNavigate();
    // const userId = localStorage.getItem("userId"); //토큰에서 추출
    const token = localStorage.getItem("gmaking_token");

    const [myCharacters, setMyCharacters] = useState([]);
    const [opponentCharacters, setOpponentCharacters] = useState([]);
    const [selectedMyChar, setSelectedMyChar] = useState(null);
    const [selectedEnemyChar, setSelectedEnemyChar] = useState(null);

    // 토큰에서 userId 추출
    let userId = null;
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            // 'userId' 클레임 이름으로 사용자 ID를 추출합니다.
            userId = decodedToken.userId;
        } catch (e) {
            console.error("JWT 토큰 디코딩 오류:", e);
            // 토큰이 유효하지 않거나 만료되었을 경우 userId는 null로 유지됩니다.
        }
    }

    useEffect(() => {

        // 토큰과 userId가 유효한지 확인합니다.
        if (!token || !userId) {
            alert("로그인이 필요합니다.");
            navigate("/login"); // 로그인 페이지로 리디렉션
            return;
        }

        axios.get(`/api/character/list?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setMyCharacters(res.data))
            .catch(err => {
                console.error("캐릭터 목록 불러오기 실패:", err);
                // 토큰 만료 등 인증 문제 시 처리 로직 추가 가능
            });
    }, [token, userId, navigate]);

    const findOpponent = () => {
        axios.get(`/api/pvp/match?userId=${userId}`)
            .then(res => {
                setOpponentCharacters(res.data.characters);
            })
            .catch(() => alert("매칭 실패. 다시 시도해주세요."));
    };

    const startBattle = () => {
        if (!selectedMyChar || !selectedEnemyChar) {
            alert("양쪽 캐릭터를 모두 선택하세요!");
            return;
        }
        navigate("/pvp/battle", {
            state: {
                myCharacter: selectedMyChar,
                enemyCharacter: selectedEnemyChar
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center text-white p-10">
            <h1 className="text-4xl font-extrabold mb-8 tracking-wider text-yellow-300 drop-shadow-lg">
                PVP 매칭
            </h1>

            <button
                onClick={() => navigate("/")}
                className="bg-blue-600 hover:bg-blue-500 px-8 py-2 rounded-2xl mb-5 font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105"
            >
                홈으로
            </button>

            <button
                onClick={findOpponent}
                className="bg-green-600 hover:bg-green-500 px-7 py-2 rounded-2xl mb-5 font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105"
            >
                상대방 찾기
            </button>
            
            <div className="flex flex-col lg:flex-row gap-10 w-full max-w-6xl justify-center">
                {/* 내 캐릭터 */}
                <div className="bg-gray-800/70 p-6 rounded-2xl shadow-lg border border-gray-700 w-full lg:w-1/2">
                    <h2 className="text-2xl font-semibold mb-4 text-yellow-400 text-center">
                        내 캐릭터
                    </h2>
                    <div className="flex gap-4 flex-wrap justify-center">
                        {myCharacters.map(char => (
                            <div
                                key={char.characterId}
                                onClick={() => setSelectedMyChar(char)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-105 shadow-md ${selectedMyChar?.characterId === char.characterId
                                        ? "border-yellow-400 bg-yellow-500/10"
                                        : "border-gray-700 hover:border-yellow-300/50"
                                    }`}
                            >
                                <img
                                    src={`/images/character/${char.imageId}.png`}
                                    alt={char.characterName}
                                    className="w-24 h-24 object-contain mx-auto mb-2"
                                />
                                <div className="text-center text-sm font-medium">{char.characterName}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 상대 캐릭터 */}
                <div className="bg-gray-800/70 p-6 rounded-2xl shadow-lg border border-gray-700 w-full lg:w-1/2">
                    <h2 className="text-2xl font-semibold mb-4 text-red-400 text-center">
                        상대 캐릭터
                    </h2>
                    <div className="flex gap-4 flex-wrap justify-center">
                        {/* 상대 캐릭터 목록이 비어있을 때 메시지 표시 */}
                        {opponentCharacters.length === 0 ? (
                            <div className="text-center w-full py-10">
                                <p className="text-gray-400 text-lg">
                                    상대방 찾기 버튼을 눌러주세요.
                                </p>
                                {/* 매칭 시도 후 캐릭터가 없는 경우 */}
                                {opponentCharacters === null ? null : (
                                    <p className="text-red-300 mt-2 font-semibold">
                                        매칭 가능한 상대 캐릭터가 없습니다.
                                    </p>
                                )}
                            </div>
                        ) : (
                            // 상대 캐릭터 목록이 있을 때 기존 렌더링 로직 사용 
                            opponentCharacters.map(char => (
                                <div
                                    key={char.characterId}
                                    onClick={() => setSelectedEnemyChar(char)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-105 shadow-md ${selectedEnemyChar?.characterId === char.characterId
                                        ? "border-red-400 bg-red-500/10"
                                        : "border-gray-700 hover:border-red-300/50"
                                        }`}
                                >
                                    <img
                                        src={`/images/character/${char.imageId}.png`}
                                        alt={char.characterName}
                                        className="w-24 h-24 object-contain mx-auto mb-2"
                                    />
                                    <div className="text-center text-sm font-medium">{char.characterName}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <button
                onClick={startBattle}
                className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-2xl mt-10 text-lg font-semibold shadow-lg transition-all duration-300 hover:scale-105"
            >
                전투 시작
            </button>
        </div>
    );
}

export default PvpMatchPage;
