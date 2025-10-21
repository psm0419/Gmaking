import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

function AiDebatePage() {
    const token = localStorage.getItem("gmaking_token");
    let userId = null;
    try { userId = jwtDecode(token)?.userId; } catch { }

    const [chars, setChars] = useState([]);
    const [aId, setAId] = useState(null);
    const [bId, setBId] = useState(null);
    const [topic, setTopic] = useState("주제를 입력해 주세요");
    const [dialogues, setDialogues] = useState([]);
    const [loading, setLoading] = useState(false);
    const logRef = useRef(null);

    useEffect(() => {
        if (!userId) return;
        axios.get(`/api/character/list?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setChars(res.data || []));
    }, [userId, token]);

    useEffect(() => {
        if (logRef.current)
            logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [dialogues]);

    const startDebate = async () => {
        if (!aId || !bId || aId === bId)
            return alert("서로 다른 캐릭터를 선택하세요.");

        setDialogues([]);
        setLoading(true);

        const ws = new WebSocket("ws://localhost:8080/debate");

        ws.onopen = () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    characterAId: aId,
                    characterBId: bId,
                    topic,
                    turnsPerSide: 3
                }));
            }
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.type === "end") {
                ws.close();
                setLoading(false);
                return;
            }

            if (data.type === "verdict") {
                const resultMsg = {
                    speaker: "심사 결과",
                    type: "verdict",
                    line:
                        `승자: ${data.winner}\n\n` +
                        Object.entries(data.votes || {})
                            .map(([k, v]) => `${k.toUpperCase()} → ${v} (${data.comments?.[k] || "-"})`)
                            .join("\n")
                };
                setDialogues(prev => [...prev, resultMsg]);
                return;
            }

            setDialogues(prev => [...prev, data]);
        };

        ws.onclose = () => setLoading(false);
        ws.onerror = () => {
            alert("서버 연결 오류");
            setLoading(false);
        };
    };

    const getImage = (id) => chars.find(c => c.characterId === id)?.imageUrl;
    const getName = (id) => chars.find(c => c.characterId === id)?.characterName;

    return (
        <div className="min-h-screen bg-gray-900 p-8 text-gray-100">
            <div className="max-w-5xl mx-auto font-sans">
                {/* 제목 */}
                <h1 className="text-3xl font-extrabold mb-6 text-center text-yellow-400 drop-shadow-lg">
                    AI 토론 배틀
                </h1>

                {/* 선택 영역 */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <select
                        className="bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none p-3 rounded-lg transition"
                        value={aId || ""}
                        onChange={(e) => setAId(Number(e.target.value) || null)}
                    >
                        <option value="">캐릭터 A 선택</option>
                        {chars.map(c => (
                            <option key={c.characterId} value={c.characterId}>
                                {c.characterName}
                            </option>
                        ))}
                    </select>

                    <select
                        className="bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none p-3 rounded-lg transition"
                        value={bId || ""}
                        onChange={(e) => setBId(Number(e.target.value) || null)}
                    >
                        <option value="">캐릭터 B 선택</option>
                        {chars.map(c => (
                            <option key={c.characterId} value={c.characterId}>
                                {c.characterName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 주제 입력 */}
                <input
                    className="w-full bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none p-3 rounded-lg mb-4 placeholder-gray-400"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />

                {/* 시작 버튼 */}
                <div className="text-center">
                    <button
                        onClick={startDebate}
                        disabled={loading}
                        className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg
                        ${loading
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-blue-600 to-green-600 hover:scale-105 hover:shadow-yellow-500/40"
                            }`}
                    >
                        {loading ? "진행 중..." : "토론 시작"}
                    </button>
                </div>

                {/* 로그 영역 */}
                <div
                    ref={logRef}
                    className="mt-8 bg-gray-900/90 backdrop-blur-md p-6 rounded-2xl h-[500px] overflow-y-auto border border-gray-700 shadow-inner"
                >
                    {dialogues
                        .filter(d => d.line && d.line.trim() !== "")
                        .map((d, i) => {
                            if (d.type === "verdict" || d.speaker === "심사 결과") {
                                return (
                                    <div key={i} className="flex justify-center my-8">
                                        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-5 rounded-2xl text-center max-w-[80%] animate-pulse">
                                            <div className="font-bold text-lg mb-2">🏆 심사 결과 🏆</div>
                                            <pre className="whitespace-pre-line text-sm">{d.line}</pre>
                                        </div>
                                    </div>
                                );
                            }

                            const isA = d.speaker === getName(aId);
                            return (
                                <div
                                    key={i}
                                    className={`flex items-start mb-5 transition-all duration-300 ${isA ? "justify-start" : "justify-end"}`}
                                >
                                    {isA && (
                                        <img
                                            src={getImage(aId)}
                                            alt="A"
                                            className="w-14 h-14 rounded-full mr-3 border-2 border-blue-400 shadow-md"
                                        />
                                    )}
                                    <div
                                        className={`max-w-[70%] p-4 rounded-2xl shadow-md text-white leading-relaxed ${isA
                                            ? "bg-blue-700/80 border border-blue-400"
                                            : "bg-green-700/80 border border-green-400"
                                            }`}
                                    >
                                        <div className="font-bold mb-1 text-yellow-300">{d.speaker}</div>
                                        <div className="whitespace-pre-line text-sm">{d.line}</div>
                                    </div>
                                    {!isA && (
                                        <img
                                            src={getImage(bId)}
                                            alt="B"
                                            className="w-14 h-14 rounded-full ml-3 border-2 border-green-400 shadow-md"
                                        />
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
}

export default AiDebatePage;
