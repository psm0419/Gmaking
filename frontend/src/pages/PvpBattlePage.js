import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const commands = ["attack", "defense", "evade", "ultimate"];

function PvpBattlePage() {
    const { state } = useLocation();
    const { myCharacter, enemyCharacter } = state || {};
    const navigate = useNavigate();

    const [myCommand, setMyCommand] = useState(null);
    const [enemyCommand, setEnemyCommand] = useState(null);
    const [battleLogs, setBattleLogs] = useState([]);
    const [turnSummary, setTurnSummary] = useState("");
    const [battleId, setBattleId] = useState(null); // 배틀 ID 상태

    // 배틀 생성
    const startBattle = async () => {
        try {
            const response = await axios.post("/api/pvp/battle", {
                myCharacterId: myCharacter.characterId,
                enemyCharacterId: enemyCharacter.characterId
            });

            // 서버에서 반환한 battleId 저장
            setBattleId(response.data.battleId); // 서버에서 반환된 실제 배틀 ID
            setBattleLogs(response.data.log || []);
        } catch (err) {
            console.error(err);
            alert("배틀 생성 실패");
        }
    };

    const startTurn = async () => {
        if (!myCommand) {
            alert("커맨드를 선택하세요!");
            return;
        }

        try {
            // battleId가 없으면 배틀 자동 생성
            let currentBattleId = battleId;
            if (!battleId) {
                const startResponse = await axios.post("/api/pvp/battle", {
                    myCharacterId: myCharacter.characterId,
                    enemyCharacterId: enemyCharacter.characterId
                });
                currentBattleId = startResponse.data.battleId;
                setBattleId(currentBattleId);
                setBattleLogs(startResponse.data.log || []);
            }

            // 상대 랜덤 커맨드
            const randomEnemyCommand = commands[Math.floor(Math.random() * commands.length)];
            setEnemyCommand(randomEnemyCommand);

            // 중앙 요약 표시
            setTurnSummary(`${myCommand} VS ${randomEnemyCommand}`);

            // 턴 실행
            const turnResponse = await axios.post("/api/pvp/turn", {
                battleId: currentBattleId,
                command: myCommand
            });

            const logs = turnResponse.data.logs || [
                `${myCharacter.characterName}가 ${myCommand} 시도`,
                `${enemyCharacter.characterName}가 ${randomEnemyCommand} 시도`
            ];

            setBattleLogs(prev => [...prev, ...logs]);
            setMyCommand(null); // 선택 초기화

        } catch (err) {
            console.error(err);
            alert("턴 처리 중 오류 발생");
        }
    };


    return (
        <div className="flex flex-col items-center p-8 text-white bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold mb-4">PVP 전투</h1>

            <div className="flex justify-between w-3/4 mb-10">
                {/* 내 캐릭터 */}
                <div className="text-center">
                    <img src={`/images/character/${myCharacter.imageId}.png`} className="w-40 h-40" />
                    <p className="text-lg mt-2">{myCharacter.characterName}</p>
                    <div className="flex gap-2 mt-2 justify-center flex-wrap">
                        {commands.map(cmd => (
                            <button
                                key={cmd}
                                className={`px-3 py-1 rounded ${myCommand === cmd ? "bg-yellow-400 text-black" : "bg-gray-700"}`}
                                onClick={() => setMyCommand(cmd)}
                            >
                                {cmd}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 상대 캐릭터 */}
                <div className="text-center">
                    <img src={`/images/character/${enemyCharacter.imageId}.png`} className="w-40 h-40" />
                    <p className="text-lg mt-2">{enemyCharacter.characterName}</p>
                    <div className="flex gap-2 mt-2 justify-center flex-wrap">
                        {commands.map(cmd => (
                            <button
                                key={cmd}
                                className={`px-3 py-1 rounded ${enemyCommand === cmd ? "bg-red-400 text-black" : "bg-gray-700"}`}
                                disabled
                            >
                                {cmd}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 중앙 턴 요약 */}
            <div className="bg-gray-700 p-4 rounded-xl w-2/3 text-center mb-4">
                {turnSummary || "커맨드를 선택하고 전투 시작 버튼을 눌러주세요."}
            </div>

            {/* GPT 전투 로그 */}
            <div className="bg-gray-800 p-6 rounded-xl w-2/3 text-left min-h-[120px] overflow-y-auto">
                {battleLogs.length > 0 ? (
                    battleLogs.map((log, idx) => <p key={idx}>{log}</p>)
                ) : (
                    <p>전투 로그가 여기에 표시됩니다.</p>
                )}
            </div>

            <div className="flex gap-4 mt-6">
                <button
                    onClick={startTurn}
                    className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-500"
                >
                    턴 실행
                </button>
                <button
                    onClick={() => navigate("/pvp/match")}
                    className="bg-gray-600 px-6 py-3 rounded-xl hover:bg-gray-500"
                >
                    매칭 화면으로
                </button>
            </div>
        </div>
    );
}

export default PvpBattlePage;
