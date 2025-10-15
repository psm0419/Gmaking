import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const commands = ["공격", "방어", "회피", "필살기"];

function PvpBattlePage() {
    const { state } = useLocation();
    const { myCharacter, enemyCharacter } = state || {};
    const navigate = useNavigate();

    const [myCommand, setMyCommand] = useState(null);
    const [enemyCommand, setEnemyCommand] = useState(null);
    const [battleLogs, setBattleLogs] = useState([]);
    const [turnSummary, setTurnSummary] = useState("");
    const [battleId, setBattleId] = useState(null); // 배틀 ID 상태
    const [playerCurrentHp, setPlayerCurrentHp] = useState(myCharacter.characterStat.characterHp);
    const [enemyCurrentHp, setEnemyCurrentHp] = useState(enemyCharacter.characterStat.characterHp);

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
        // 전투 종료 상태 체크 (HP 0 이하이면 실행 차단)
        if (playerCurrentHp <= 0 || enemyCurrentHp <= 0) {
            alert("전투가 이미 종료되었습니다.");
            return;
        }

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

            // 턴 실행 API 호출
            const turnResponse = await axios.post("/api/pvp/turn", {
                battleId: currentBattleId,
                command: myCommand
            });

            // 서버 응답에서 실제 상대방 커맨드를 가져옵니다.
            const actualEnemyCommand = turnResponse.data.enemyCommand;

            // 상대방 커맨드를 상태에 저장하고 중앙 요약에 사용합니다.
            setEnemyCommand(actualEnemyCommand);
            setTurnSummary(`${myCharacter.characterName}의 ${myCommand} VS ${enemyCharacter.characterName}의 ${actualEnemyCommand}`);

            const logs = turnResponse.data.logs || [
                `${myCharacter.characterName}가 ${myCommand} 시도`,
                `${enemyCharacter.characterName}가 ${actualEnemyCommand} 시도` // 로그의 기본값도 서버 응답을 사용
            ];
            setBattleLogs(logs);

            // 서버 응답에서 최신 HP 반영
            setPlayerCurrentHp(turnResponse.data.playerHp);
            setEnemyCurrentHp(turnResponse.data.enemyHp);

            setMyCommand(null); // 선택 초기화

        } catch (err) {
            console.error(err);
            alert("턴 처리 중 오류 발생");
        }
    };

    // 체력 퍼센트 계산 함수
    const calcHpPercent = (current, max) => Math.max(0, Math.round((current / max) * 100));

    // HP bar 컴포넌트
    const HpBar = ({ current, max }) => {
        const percent = calcHpPercent(current, max);
        const barColor =
            percent > 60 ? "bg-green-500" :
                percent > 30 ? "bg-yellow-500" : "bg-red-500";

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

    return (
        <div className="flex flex-col items-center p-8 text-white bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-bold mb-4">PVP 전투</h1>

            <div className="flex justify-between w-3/4 mb-10">
                {/* 내 캐릭터 */}
                <div className="text-center">
                    <div className="flex justify-center">
                        <img src={`/images/character/${myCharacter.imageId}.png`} className="w-40 h-40" />
                    </div>
                    <p className="text-xl mt-2">{myCharacter.characterName}</p>

                    {/* 내 캐릭터 스탯 표시 */}
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
                    {/* 체력바 표시 */}
                    <div className="flex justify-center">
                        <HpBar
                            current={playerCurrentHp}
                            max={myCharacter.characterStat.characterHp}
                        />
                    </div>
                </div>

                {/* 상대 캐릭터 */}
                <div className="text-center">
                    <div className="flex justify-center">
                        <img src={`/images/character/${enemyCharacter.imageId}.png`} className="w-40 h-40" />
                    </div>
                    <p className="text-xl mt-2">{enemyCharacter.characterName}</p>

                    {/* 상대 스탯 */}
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
                    {/* 체력바 표시 */}
                    <div className="flex justify-center">
                        <HpBar
                            current={enemyCurrentHp}
                            max={enemyCharacter.characterStat.characterHp}
                        />
                    </div>
                </div>
            </div>

            {/* 중앙 턴 요약 */}
            <div className="bg-gray-700 p-4 rounded-xl w-2/3 text-center mb-4">
                {turnSummary || "커맨드를 선택하고 턴 실행 버튼을 눌러주세요."}
            </div>

            {/* GPT 전투 로그 */}
            <div className="bg-gray-800 p-6 rounded-xl w-2/3 text-left min-h-[120px] overflow-y-auto whitespace-pre-wrap">
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
