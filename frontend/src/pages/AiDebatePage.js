import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

function AiDebatePage() {
    const token = localStorage.getItem("gmaking_token");
    let userId = null;
    try { userId = jwtDecode(token)?.userId; } catch { }

    const [chars, setChars] = useState([]);
    const [aId, setAId] = useState(null);
    const [bId, setBId] = useState(null);
    const [topic, setTopic] = useState("누가 더 설득력 있는 영웅인가?");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;
        axios.get(`/api/character/list?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setChars(res.data || []));
    }, [userId, token]);

    const start = async () => {
        if (!aId || !bId || aId === bId) { alert("서로 다른 두 캐릭터를 선택하세요."); return; }
        setLoading(true); setResult(null);
        try {
            const res = await axios.post("/api/debate/start", {
                characterAId: aId,
                characterBId: bId,
                topic,
                turnsPerSide: 3
            });
            setResult(res.data);
        } catch (e) {
            console.error(e);
            alert("디베이트 요청 실패");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto text-white">
            <h1 className="text-2xl font-bold mb-4">AI 말싸움 배틀</h1>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <select className="bg-gray-700 p-2 rounded" value={aId || ""} onChange={e => setAId(Number(e.target.value) || null)}>
                    <option value="">캐릭터 A 선택</option>
                    {chars.map(c => <option key={c.characterId} value={c.characterId}>{c.characterName}</option>)}
                </select>
                <select className="bg-gray-700 p-2 rounded" value={bId || ""} onChange={e => setBId(Number(e.target.value) || null)}>
                    <option value="">캐릭터 B 선택</option>
                    {chars.map(c => <option key={c.characterId} value={c.characterId}>{c.characterName}</option>)}
                </select>
            </div>

            <input
                className="w-full bg-gray-700 p-2 rounded mb-3"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="주제를 입력하세요"
            />

            <button onClick={start} disabled={loading} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded">
                {loading ? "생성 중..." : "시작"}
            </button>

            {result && (
                <div className="mt-6 bg-gray-900 p-4 rounded">
                    <div className="mb-2 font-semibold">주제: {result.topic}</div>
                    {result.dialogue.map((d, i) => (
                        <div key={i}><span className="text-yellow-400">{d.speaker}</span>: {d.line}</div>
                    ))}
                    <div className="mt-4">
                        <div className="font-bold mb-1">심사 결과:</div>
                        {Object.entries(result.judgeVotes || {}).map(([k, v]) => (
                            <div key={k} className="ml-2">
                                {k.toUpperCase()} ➜ {v}
                                <div className="text-gray-400 text-sm">판정평: {result.judgeComments?.[k]}</div>
                            </div>
                        ))}
                    </div>
                    <div className="text-lg font-bold mt-2">최종 승자: {result.winner}</div>
                </div>
            )}
        </div>
    );
}

export default AiDebatePage;
