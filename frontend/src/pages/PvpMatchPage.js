import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function PvpMatchPage() {
    const navigate = useNavigate();
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("gmaking_token");

    const [myCharacters, setMyCharacters] = useState([]);
    const [opponentCharacters, setOpponentCharacters] = useState([]);
    const [selectedMyChar, setSelectedMyChar] = useState(null);
    const [selectedEnemyChar, setSelectedEnemyChar] = useState(null);

    useEffect(() => {
        axios.get(`/api/character/list?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setMyCharacters(res.data));
    }, []);

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
        <div className="flex flex-col items-center p-8">
            <h1 className="text-3xl font-bold mb-4">PVP 매칭</h1>

            <button onClick={findOpponent} className="bg-blue-600 text-white px-6 py-3 rounded-xl mb-4">
                상대방 찾기
            </button>

            <div className="flex gap-10">
                {/* 내 캐릭터 */}
                <div>
                    <h2 className="text-xl font-bold mb-2">내 캐릭터</h2>
                    <div className="flex gap-3 flex-wrap">
                        {myCharacters.map(char => (
                            <div
                                key={char.characterId}
                                onClick={() => setSelectedMyChar(char)}
                                className={`p-3 rounded-xl border cursor-pointer ${selectedMyChar?.characterId === char.characterId
                                        ? "border-yellow-400"
                                        : "border-gray-500"
                                    }`}
                            >
                                <img src={`/images/character/${char.imageId}.png`} alt={char.characterName} className="w-20 h-20" />
                                <div>{char.characterName}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 상대 캐릭터 */}
                <div>
                    <h2 className="text-xl font-bold mb-2">상대 캐릭터</h2>
                    <div className="flex gap-3 flex-wrap">
                        {opponentCharacters.map(char => (
                            <div
                                key={char.characterId}
                                onClick={() => setSelectedEnemyChar(char)}
                                className={`p-3 rounded-xl border cursor-pointer ${selectedEnemyChar?.characterId === char.characterId
                                        ? "border-red-400"
                                        : "border-gray-500"
                                    }`}
                            >
                                <img src={`/images/character/${char.imageId}.png`} alt={char.characterName} className="w-20 h-20" />
                                <div>{char.characterName}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={startBattle}
                className="bg-green-600 text-white px-8 py-3 rounded-xl mt-6 hover:bg-green-500"
            >
                전투 시작
            </button>
        </div>
    );
}

export default PvpMatchPage;
