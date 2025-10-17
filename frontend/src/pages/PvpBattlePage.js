import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const commands = ["공격", "방어", "회피", "필살기"];

// 이미지 URL 처리 유틸
const getCharacterImage = (char) =>
    char.imageUrl?.startsWith("http")
        ? char.imageUrl
        : `/images/character/${char.imageId}.png`;

function PvpBattlePage() {
    const { state } = useLocation();
    const { myCharacter, enemyCharacter } = state || {};
    const navigate = useNavigate();

    const [myCommand, setMyCommand] = useState(null);
    const [enemyCommand, setEnemyCommand] = useState(null);
    const [battleLogs, setBattleLogs] = useState([]);
    const [turnSummary, setTurnSummary] = useState("");
    const [battleId, setBattleId] = useState(null);
    const [playerCurrentHp, setPlayerCurrentHp] = useState(myCharacter.characterStat.characterHp);
    const [enemyCurrentHp, setEnemyCurrentHp] = useState(enemyCharacter.characterStat.characterHp);
    const [isProcessing, setIsProcessing] = useState(false);

    // 체력 퍼센트 계산
    const calcHpPercent = (current, max) => Math.max(0, Math.round((current / max) * 100));

    const HpBar = ({ current, max }) => {
        const percent = calcHpPercent(current, max);
        const barColor = percent > 60 ? "bg-green-500" : percent > 30 ? "bg-yellow-500" : "bg-red-500";

        return (
            <div className="w-40 bg-gray-700 rounded-full h-4 mt-2">
                <div
                    className={`${barColor} h-4 rounded-full transition-all duration-300`}
                    style={{ width: `${percent}%` }}
                />
                <p className="text-sm mt-1">{`${current} / ${max} (${percent}%)`}</p>
            </div>
        );
    };

    // 턴 실행
    const startTurn = async () => {
        if (isProcessing) return;
        if (playerCurrentHp <= 0 || enemyCurrentHp <= 0) {
            alert("전투가 종료되었습니다.");
            return;
        }
        if (!myCommand) {
            alert("커맨드를 선택하세요!");
            return;
        }

        setIsProcessing(true);

        try {
            // 배틀 ID 없으면 생성
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

            // 턴 실행
            const turnResponse = await axios.post("/api/pvp/turn", {
                battleId: currentBattleId,
                command: myCommand
            });

            const actualEnemyCommand = turnResponse.data.enemyCommand;
            setEnemyCommand(actualEnemyCommand);
            setTurnSummary(`${myCharacter.characterName}의 ${myCommand} VS ${enemyCharacter.characterName}의 ${actualEnemyCommand}`);

            setBattleLogs(turnResponse.data.logs || []);
            setPlayerCurrentHp(turnResponse.data.playerHp);
            setEnemyCurrentHp(turnResponse.data.enemyHp);

            setMyCommand(null);
        } catch (err) {
            console.error(err);
            alert("턴 처리 중 오류 발생");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col items-center p-8 text-white bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold mb-4">PVP 전투</h1>

            <div className="flex justify-between w-3/4 mb-10">
                {/* 내 캐릭터 */}
                <div className="text-center">
                    <div className="flex justify-center">
                        <img src={getCharacterImage(myCharacter)} className="w-40 h-40" />
                    </div>
                    <p className="text-xl mt-2">{myCharacter.characterName}</p>
                    <p className="text-sm text-gray-400 text-xl">
                        공격력: {myCharacter.characterStat.characterAttack}  방어력: {myCharacter.characterStat.characterDefense}
                    </p>

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
                    <div className="flex justify-center">
                        <HpBar current={playerCurrentHp} max={myCharacter.characterStat.characterHp} />
                    </div>
                </div>

                {/* 상성표 */}
                <div className="flex flex-col items-center justify-center w-2/5 text-center">
                    <h3 className="text-xl font-bold text-yellow-400 mb-3">상성 규칙 (가위바위보)</h3>
                    <div className="text-sm border border-gray-600 rounded p-3 bg-gray-800/80">
                        <p className="text-green-400 font-semibold">공격 유형</p>
                        <p className="text-gray-200">공격 VS 회피 (기본 피해)<br />필살기 VS 공격/방어 (공격력의 2배 피해)</p>
                        <p className="text-red-400 font-semibold mt-3">방어 유형</p>
                        <p className="text-gray-200">방어 VS 공격 (방어력의 2배 피해)<br />회피 VS 필살기 (방어력의 3배 피해)</p>
                        <p className="text-blue-400 font-semibold mt-3">동일 커맨드</p>
                        <p className="text-gray-200">공격 VS 공격(서로 기본 피해)<br />필살기 VS 필살기(서로 2배 피해)<br />방어 VS 방어, 회피 VS 회피: 피해 없음</p>
                    </div>
                </div>

                {/* 상대 캐릭터 */}
                <div className="text-center">
                    <div className="flex justify-center">
                        <img src={getCharacterImage(enemyCharacter)} className="w-40 h-40" />
                    </div>
                    <p className="text-xl mt-2">{enemyCharacter.characterName}</p>
                    <p className="text-sm text-gray-400 text-xl">
                        공격력: {enemyCharacter.characterStat.characterAttack}  방어력: {enemyCharacter.characterStat.characterDefense}
                    </p>

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
                    <div className="flex justify-center">
                        <HpBar current={enemyCurrentHp} max={enemyCharacter.characterStat.characterHp} />
                    </div>
                </div>
            </div>

            {/* 중앙 턴 요약 */}
            <div className="bg-gray-700 p-4 rounded-xl w-2/3 text-center mb-4">
                {turnSummary || "커맨드를 선택하고 턴 실행 버튼을 눌러주세요."}
            </div>

            {/* 전투 로그 */}
            <div className="bg-gray-800 p-6 rounded-xl w-2/3 text-left min-h-[120px] overflow-y-auto whitespace-pre-wrap">
                {battleLogs.length > 0 ? battleLogs.map((log, idx) => <p key={idx}>{log}</p>) : <p>전투 로그가 여기에 표시됩니다.</p>}
            </div>

            <div className="flex gap-4 mt-6">
                <button
                    onClick={startTurn}
                    disabled={isProcessing || playerCurrentHp <= 0 || enemyCurrentHp <= 0}
                    className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-500"
                >
                    {isProcessing ? "전투 중..." : "턴 실행"}
                </button>
                <button
                    onClick={() => navigate("/pvp/match")}
                    disabled={isProcessing}
                    className="bg-gray-600 px-6 py-3 rounded-xl hover:bg-gray-500"
                >
                    매칭 화면으로
                </button>
            </div>
        </div>
    );
}

export default PvpBattlePage;
