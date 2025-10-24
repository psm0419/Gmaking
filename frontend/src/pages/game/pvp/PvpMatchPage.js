import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import Header from "../../../components/Header";

function PvpMatchPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("gmaking_token");
    const location = useLocation();
    const { rematch, opponent } = location.state || {};
    const [myCharacters, setMyCharacters] = useState([]);
    const [opponentCharacters, setOpponentCharacters] = useState([]);
    const [selectedMyChar, setSelectedMyChar] = useState(null);
    const [selectedEnemyChar, setSelectedEnemyChar] = useState(null);
    

    // 토큰에서 userId 추출
    let userId = null;
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            userId = decodedToken.userId;
        } catch (e) {
            console.error("JWT 토큰 디코딩 오류:", e);
        }
    }

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

        axios.get(`/api/character/list?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => setMyCharacters(res.data))
            .catch(err => {
                console.error("캐릭터 목록 불러오기 실패:", err);
            });
    }, [token, userId, navigate]);

    // 재대결 상태면 상대 고정 세팅
    useEffect(() => {
        if (rematch && opponent) {
            setOpponentCharacters([{
                characterId: opponent.characterId,
                userId: opponent.userId,
                characterName: opponent.characterName,
                imageUrl: opponent.imageUrl,
                gradeId: opponent.gradeId,
                characterStat: {
                    characterHp: opponent.stat.hp,
                    characterAttack: opponent.stat.atk,
                    characterDefense: opponent.stat.def,
                    characterSpeed: opponent.stat.spd,
                    criticalRate: opponent.stat.crit,
                },
            }]);
        }
    }, [rematch, opponent]);

    const findOpponent = () => {
        axios.get(`/api/pvp/match?userId=${userId}`)
            .then(res => setOpponentCharacters(res.data.characters))
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
                enemyCharacter: selectedEnemyChar,
            },
        });
    };

    React.useEffect(() => {
      document.body.classList.add('no-scrollbar');
      document.documentElement.classList.add('no-scrollbar');
      return () => {
        document.body.classList.remove('no-scrollbar');
        document.documentElement.classList.remove('no-scrollbar');
      };
    }, []);

    return (
        <div><Header />
            <div className="min-h-[calc(100vh-60px)] bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center text-white p-8">
                <div className="flex justify-center gap-4 mb-8">
                    <button
                        onClick={findOpponent}
                        className="bg-green-600 hover:bg-green-500 px-8 py-2 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        상대방 찾기
                    </button>

                    <button
                        onClick={startBattle}
                        className="bg-green-600 hover:bg-green-500 px-8 py-2 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        전투 시작
                    </button>

                    <button
                        onClick={() => navigate("/")}
                        className="bg-blue-600 hover:bg-blue-500 px-8 py-2 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        홈으로
                    </button>
                </div>
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
                                        src={
                                            char.imageUrl?.startsWith("http")
                                                ? char.imageUrl
                                                : `/images/character/${char.imageId}.png`
                                        }
                                        alt={char.characterName}
                                        className="w-24 h-24 object-contain mx-auto mb-2"
                                    />
                                    <div className="text-center text-l font-medium text-yellow-400">{char.characterName}({getGradeLabel(char.gradeId)})</div>
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
                            {opponentCharacters.length === 0 ? (
                                <div className="text-center w-full py-10">
                                    <p className="text-gray-400 text-lg">
                                        상대방 찾기 버튼을 눌러주세요.
                                    </p>
                                    {opponentCharacters === null ? null : (
                                        <p className="text-red-300 mt-2 font-semibold">
                                            매칭 가능한 상대 캐릭터가 없습니다.
                                        </p>
                                    )}
                                </div>
                            ) : (
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
                                            src={
                                                char.imageUrl?.startsWith("http")
                                                    ? char.imageUrl
                                                    : `/images/character/${char.imageId}.png`
                                            }
                                            alt={char.characterName}
                                            className="w-24 h-24 object-contain mx-auto mb-2"
                                        />
                                        <div className="text-center text-l font-medium text-yellow-400">{char.characterName}({getGradeLabel(char.gradeId)})</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PvpMatchPage;
