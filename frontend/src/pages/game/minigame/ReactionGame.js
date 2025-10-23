import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from '../../../components/Header';

function ReactionGame({ userId }) {
    const [message, setMessage] = useState("시작 버튼을 눌러주세요(400이하 성공)");
    const [waiting, setWaiting] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [reactionTime, setReactionTime] = useState(null);
    const [disabled, setDisabled] = useState(false);

    const navigate = useNavigate();

    const startGame = () => {
        setMessage("준비...");
        setDisabled(true);
        const delay = Math.random() * 2000 + 1000; // 1~3초 랜덤
        setWaiting(false);
        setReactionTime(null);

        setTimeout(() => {
            setMessage("CLICK!");
            setWaiting(true);
            setStartTime(Date.now());
            setDisabled(false);
        }, delay);
    };

    const handleClick = async () => {
        if (!waiting) return;
        const time = Date.now() - startTime;
        setReactionTime(time);
        setMessage(`반응속도: ${time}ms`);
        setWaiting(false);
        setDisabled(true);

        // 나중에 서버와 연결
        // try {
        //     await axios.post("/api/minigame/reaction/result", {
        //         userId,
        //         characterId,
        //         reactionTime: time
        //     });
        //     console.log("결과 전송 완료");
        // } catch (err) {
        //     console.error("결과 전송 실패:", err);
        // }
    };

    return (
        <div><Header />
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] bg-gray-900 text-white">
                <h1 className="text-3xl font-bold mb-10">⚡ 반응속도 테스트 ⚡</h1>

                <div
                    className="w-[400px] h-[200px] flex items-center justify-center bg-gray-700 rounded-xl cursor-pointer text-2xl font-semibold select-none"
                    onClick={handleClick}
                >
                    {message}
                </div>

                <button
                    onClick={startGame}
                    disabled={disabled}
                    className={`mt-8 px-6 py-3 rounded-lg text-lg font-semibold transition-all ${disabled
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-yellow-400 hover:bg-yellow-500 text-black"
                        }`}
                >
                    게임 시작
                </button>

                {reactionTime && (
                    <p className="mt-4 text-lg">
                        {reactionTime < 400
                            ? "성공! 스피드 스탯이 상승합니다!"
                            : "실패! 조금 더 집중하세요!"}
                    </p>
                )}
            </div>
        </div>
    );
}

export default ReactionGame;
