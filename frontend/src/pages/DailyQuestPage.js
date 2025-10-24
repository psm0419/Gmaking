import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Header from '../components/Header';

export default function DailyQuestPage() {
    const { user } = useAuth();
    const [quests, setQuests] = useState([]);

    useEffect(() => {
        if (!user?.userId) return;
        axios
            .get(`/api/quest/daily`, { params: { userId: user.userId } })
            .then((res) => setQuests(res.data))
            .catch((err) => console.error("퀘스트 불러오기 실패:", err));
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

    return (
        <div><Header />
            <div className="min-h-[calc(100vh-60px)] bg-gray-900 p-6 text-gray-100">
                <h1 className="text-2xl font-bold mb-6 text-yellow-400">오늘의 퀘스트</h1>

                {quests.length === 0 ? (
                    <p className="text-gray-400">진행 중인 퀘스트가 없습니다.</p>
                ) : (
                    <div className="space-y-4">
                        {quests.map((q) => {
                            const percent = getProgressPercent(q.currentCount, q.targetCount);
                            return (
                                <div
                                    key={q.questId}
                                    className="bg-gray-800 rounded-xl p-4 shadow-md border border-gray-700"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h2 className="text-lg font-semibold">{q.questName}</h2>
                                        <span
                                            className={`px-3 py-1 text-sm rounded-full ${getStatusColor(
                                                q.status
                                            )}`}
                                        >
                                            {q.status === "IN_PROGRESS" && "진행 중"}
                                            {q.status === "COMPLETED" && "완료"}
                                            {q.status === "REWARDED" && "보상받음"}
                                        </span>
                                    </div>

                                    <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                                        <div
                                            className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>

                                    <p className="text-sm text-gray-400">
                                        {q.currentCount} / {q.targetCount} 완료
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
