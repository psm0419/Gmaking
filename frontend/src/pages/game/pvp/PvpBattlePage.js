import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../../components/Header";

const commands = ["공격", "방어", "회피", "필살기"];

// 이미지 URL 처리 유틸
const getCharacterImage = (char) =>
    char.imageUrl?.startsWith("http")
        ? char.imageUrl
        : `/images/character/${char.imageId}.png`;

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
    const [specialCooldown, setSpecialCooldown] = useState(0);
    const logContainerRef = useRef(null);

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

        // 필살기 쿨타임 중일 때 사용 불가
        if (myCommand === "필살기" && specialCooldown > 0) {
            alert(`필살기는 ${specialCooldown}턴 후 사용 가능합니다.`);
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

            // 필살기 사용 시 쿨타임 2로 설정
            if (myCommand === "필살기") setSpecialCooldown(3);

            // 턴 종료 시 쿨타임 감소
            setSpecialCooldown(prev => Math.max(0, prev - 1));

            setMyCommand(null);
        } catch (err) {
            console.error(err);
            alert("턴 처리 중 오류 발생");
        } finally {
            setIsProcessing(false);
        }
    };

    // window의 스크롤 내부 컨테이너로 전달
    useEffect(() => {
        const handleWheel = (e) => {
            const container = logContainerRef.current;
            if (!container) return;

            // 기본 스크롤 막기
            e.preventDefault();

            // 내부 스크롤로 전달
            container.scrollTop += e.deltaY;
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        return () => window.removeEventListener("wheel", handleWheel);
    }, []);

    return (
        <div><Header />
            <div className="flex flex-col items-center p-2 text-white bg-gray-900 h-[calc(100vh-60px)]">
                <h1 className="text-3xl font-bold mb-4">PVP 전투</h1>

                <div className="flex justify-between w-3/4 mb-10">
                    {/* 내 캐릭터 */}
                    <div className="text-center">
                        <div className="flex justify-center">
                            <img src={getCharacterImage(myCharacter)} className="w-40 h-40" />
                        </div>
                        <p className="text-xl mt-2 text-yellow-400">{myCharacter.characterName}({getGradeLabel(myCharacter.gradeId)})</p>
                        <p className="text-sm text-gray-400 text-xl">
                            공격력: {myCharacter.characterStat.characterAttack}  방어력: {myCharacter.characterStat.characterDefense}
                        </p>

                        <div className="flex gap-2 mt-2 justify-center flex-wrap">
                            {commands.map(cmd => {
                                const isSpecial = cmd === "필살기";
                                const isDisabled = isProcessing || (isSpecial && specialCooldown > 0);
                                return (
                                    <button
                                        key={cmd}
                                        className={`px-3 py-1 rounded ${myCommand === cmd ? "bg-yellow-400 text-black" :
                                            isDisabled ? "bg-gray-500 cursor-not-allowed text-gray-300" :
                                                "bg-gray-700 hover:bg-gray-600"
                                            }`}
                                        onClick={() => !isDisabled && setMyCommand(cmd)}
                                        disabled={isDisabled}
                                    >
                                        {cmd}
                                        {/* 쿨타임 표시 */}
                                        {isSpecial && specialCooldown > 0 && (
                                            <span className="ml-1 text-sm text-red-400">({specialCooldown})</span>
                                        )}
                                    </button>
                                );
                            })}
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
                            <p>동시 사망시 공격자 승리</p>
                        </div>
                    </div>

                    {/* 상대 캐릭터 */}
                    <div className="text-center">
                        <div className="flex justify-center">
                            <img src={getCharacterImage(enemyCharacter)} className="w-40 h-40" />
                        </div>
                        <p className="text-xl mt-2 text-yellow-400">{enemyCharacter.characterName}({getGradeLabel(enemyCharacter.gradeId)})</p>
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
                <div
                    ref={logContainerRef}
                    className="bg-gray-800 p-6 rounded-xl w-2/3 text-left overflow-y-auto whitespace-pre-wrap max-h-64 no-scrollbar">
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
                    <button
                        onClick={() => navigate("/")}
                        disabled={isProcessing}
                        className="bg-gray-600 px-6 py-3 rounded-xl hover:bg-gray-500"
                    >
                        홈으로
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PvpBattlePage;
