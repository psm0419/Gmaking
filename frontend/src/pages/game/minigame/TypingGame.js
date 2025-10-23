import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from '../../../components/Header';

const commands = [
    "Fire Slash!",
    "Ice Shield!",
    "Thunder Bolt!",
    "Wind Cutter!",
    "Earth Smash!",
    "Healing Light!",
    "Shadow Strike!",
    "Holy Guard!",
];

function TypingGame() {
    const navigate = useNavigate();
    const [currentCmd, setCurrentCmd] = useState("");
    const [userInput, setUserInput] = useState("");
    const [message, setMessage] = useState("게임을 시작하세요!");
    const [round, setRound] = useState(0);
    const [success, setSuccess] = useState(0);
    const [fail, setFail] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [inProgress, setInProgress] = useState(false);
    const [gameOver, setGameOver] = useState(false); // 새로 추가

    const timerRef = useRef(null);

    const generateCommand = () => {
        const cmd = commands[Math.floor(Math.random() * commands.length)];
        setCurrentCmd(cmd);
        setUserInput("");
        setTimeLeft(5);
    };

    const startTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    handleFail();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
    };

    const startGame = () => {
        setRound(0);
        setSuccess(0);
        setFail(0);
        setInProgress(true);
        setGameOver(false); // 새로 추가
        setMessage("명령어를 정확히 입력하세요!");
        nextRound();
    };

    const nextRound = () => {
        setRound((r) => r + 1);
        generateCommand();
        startTimer();
    };

    const handleChange = (e) => {
        const value = e.target.value;
        setUserInput(value);
        if (value === currentCmd) {
            handleSuccess();
        }
    };

    const handleSuccess = () => {
        clearInterval(timerRef.current);
        setSuccess((s) => s + 1);
        setMessage("성공! 다음 주문으로 이동!");
        setTimeout(nextRound, 1000);
    };

    const handleFail = () => {
        clearInterval(timerRef.current);
        const correct = currentCmd; // 현재 명령을 즉시 보관

        setFail((f) => f + 1);
        setMessage(`실패! 정답은 "${correct}" 입니다.`); // 보관한 값 사용

        setTimeout(nextRound, 1500);
    };

    // 10라운드 후 자동 종료
    useEffect(() => {
        if (round > 0 && round > 10) {
            endGame();
        }
    }, [round]);

    const endGame = () => {
        clearInterval(timerRef.current);
        setInProgress(false);
        setGameOver(true); // 결과 표시 상태로 전환
        setMessage("게임 종료! 수고하셨습니다.");
    };

    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);

    // 결과 요약 컴포넌트
    const GameResult = () => (
        <div className="text-center mt-6">
            <h2 className="text-2xl font-bold mb-3 text-yellow-300">결과 요약</h2>
            <p className="text-lg text-green-400">성공 횟수: {success}</p>
            <p className="text-lg text-red-400">실패 횟수: {fail}</p>
            <p className="text-lg text-gray-300 mt-2">
                성공률:{" "}
                {((success / (success + fail || 1)) * 100).toFixed(0)}%
            </p>
            <div className="mt-6">
                <button
                    onClick={startGame}
                    className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-lg transition-all"
                >
                    다시 시작
                </button>
            </div>
        </div>
    );

    return (
        <div><Header />
            <div className="min-h-[calc(100vh-60px)] bg-gray-900 text-white flex flex-col items-center justify-center p-8">
                <h1 className="text-4xl font-bold mb-6">타이핑 배틀</h1>

                {/* 게임이 진행 중일 때 */}
                {inProgress && (
                    <>
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold mb-4 text-yellow-300">{currentCmd}</h2>
                            <p className="text-gray-300 mb-2">제한 시간: {timeLeft}초</p>
                            <input
                                type="text"
                                value={userInput}
                                onChange={handleChange}
                                className="px-4 py-2 text-lg text-gray-900 rounded-md focus:outline-none"
                                placeholder="명령어를 입력하세요..."
                                autoFocus
                            />
                        </div>

                        <p className="text-lg mb-4">{message}</p>

                        <div className="flex gap-6 text-lg">
                            <p>라운드: {round} / 10</p>
                            <p className="text-green-400">성공: {success}</p>
                            <p className="text-red-400">실패: {fail}</p>
                        </div>
                    </>
                )}

                {/* 게임이 종료된 후 결과 표시 */}
                {!inProgress && gameOver && <GameResult />}

                {/* 게임 시작 전 초기 화면 */}
                {!inProgress && !gameOver && (
                    <button
                        onClick={startGame}
                        className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-lg transition-all"
                    >
                        게임 시작
                    </button>
                )}
            </div>
        </div>
    );
}

export default TypingGame;
