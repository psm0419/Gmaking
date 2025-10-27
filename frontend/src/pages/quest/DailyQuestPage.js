import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import Header from '../../components/Header';

export default function DailyQuestPage() {
    const { user, token, applyNewToken } = useAuth();
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.userId) return;
        axios
            .get(`/api/quest/daily`, { params: { userId: user.userId } })
            .then((res) => setQuests(res.data))
            .catch((err) => console.error("퀘스트 불러오기 실패:", err));
    }, [user]);

    // 퀘스트 불러오기
    const fetchQuests = () => {
        if (!user?.userId) return;
        axios
            .get(`/api/quest/daily`, { params: { userId: user.userId } })
            .then((res) => setQuests(res.data))
            .catch((err) => console.error("퀘스트 불러오기 실패:", err));
    };

    useEffect(() => {
        fetchQuests();
    }, [user]);

    const getProgressPercent = (current, target) =>
        Math.min(100, Math.round((current / target) * 100));

    const getStatusColor = (status) => {
        switch (status) {
            case "IN_PROGRESS": return "bg-yellow-400 text-gray-900";
            case "COMPLETED": return "bg-green-500 text-white";
            case "REWARDED": return "bg-gray-500 text-gray-300";
            default: return "bg-gray-700 text-gray-300";
        }
    };

    // 보상 수령 요청
    const handleReward = async (questId) => {
        if (!user?.userId) return;
        if (loading) return;

        try {
            setLoading(true);
            
            // 1. 보상 API 호출
            const response = await axios.post(`/api/quest/reward`, null, {
                params: { userId: user.userId, questId },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // 2. 서버 응답에서 새로운 토큰(newToken) 확인 및 적용
            const result = response.data;
            
            if (result && typeof result === 'object' && result.newToken) {
                applyNewToken(result.newToken);
                alert(`${result.message || "보상 수령 완료!"} 부화권 개수가 추가되었습니다.`);
            } else {
                alert(`${result || "보상을 수령했습니다."} 상태 갱신을 위해 퀘스트 목록을 다시 불러옵니다.`);
            }
            
            // 3. 퀘스트 목록 갱신 (REWARDED로 상태 변경을 반영)
            fetchQuests();
            
        } catch (err) {
            console.error("보상 수령 실패:", err);
            alert("보상 수령 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Header />
            <div className="min-h-[calc(100vh-60px)] bg-gray-900 py-10 px-4 text-gray-100">
                <h1 className="text-3xl font-bold mb-10 text-center text-yellow-400">
                    오늘의 퀘스트
                </h1>

                {quests.length === 0 ? (
                    <p className="text-gray-400 text-center">진행 중인 퀘스트가 없습니다.</p>
                ) : (
                    <div className="max-w-2xl mx-auto flex flex-col items-center space-y-6">
                        {quests.map((q) => {
                            const percent = getProgressPercent(q.currentCount, q.targetCount);
                            const isCompleted = q.status === "COMPLETED";
                            const isRewarded = q.status === "REWARDED";

                            return (
                                <div
                                    key={q.questId}
                                    className="w-full bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-700 hover:border-yellow-400 transition-all"
                                >
                                    {/* 상단: 이름 + 상태 */}
                                    <div className="flex justify-between items-center mb-3">
                                        <h2 className="text-xl font-semibold text-white">{q.questName}</h2>
                                        <span
                                            className={`px-3 py-1 text-sm rounded-full ${getStatusColor(q.status)}`}
                                        >
                                            {q.status === "IN_PROGRESS" && "진행 중"}
                                            {q.status === "COMPLETED" && "완료"}
                                            {q.status === "REWARDED" && "보상받음"}
                                        </span>
                                    </div>

                                    {/* 진행도 바 */}
                                    <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                                        <div
                                            className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>

                                    {/* 하단: 진행상황 + 버튼 */}
                                    <div className="flex items-center">
                                        <p className="text-sm text-gray-400">
                                            {q.currentCount} / {q.targetCount} 완료
                                        </p>

                                        {isCompleted && !isRewarded && (
                                            <button
                                                onClick={() => handleReward(q.questId)}
                                                disabled={loading}
                                                className={`ml-auto px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all
                                                ${loading
                                                        ? "bg-gray-500 cursor-not-allowed"
                                                        : "bg-green-600 hover:bg-green-700"
                                                    }`}
                                            >
                                                {loading ? "처리 중..." : "보상 수령"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
