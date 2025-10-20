import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from '../components/Header';

function RankingPage() {
    const [rankingType, setRankingType] = useState("character");
    const [rankings, setRankings] = useState([]);

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

    useEffect(() => {
        let endpoint = "";
        if (rankingType === "pvp") endpoint = "/api/ranking/pvp";
        else if (rankingType === "pve") endpoint = "/api/ranking/pve";
        else endpoint = "/api/ranking/character";

        axios.get(endpoint)
            .then(res => setRankings(res.data))
            .catch(err => console.error("랭킹 불러오기 실패:", err));
    }, [rankingType]);

    const renderTable = () => (
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <table className="min-w-full text-center border-collapse">
                <thead className="bg-gray-300 border-b">
                    <tr className="text-gray-700">
                        <th className="py-3 px-4">순위</th>
                        <th className="py-3 px-4">캐릭터명</th>
                        <th className="py-3 px-4">유저명</th>
                        {rankingType === "character" && (
                            <>
                                <th className="py-3 px-4">등급</th>
                                <th className="py-3 px-4">총 스탯 합계</th>
                            </>
                        )}
                        {rankingType === "pvp" && <th className="py-3 px-4">승리 횟수</th>}
                        {rankingType === "pve" && <th className="py-3 px-4">클리어 수</th>}
                    </tr>
                </thead>
                <tbody>
                    {rankings.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="py-6 text-gray-500">랭킹 데이터가 없습니다.</td>
                        </tr>
                    ) : (
                        rankings.map((r, i) => (
                            <tr
                                key={i}
                                className={`border-b transition hover:bg-gray-50 ${i % 2 === 0 ? "bg-gray-50/30" : "bg-white"
                                    }`}
                            >
                                <td className="py-3 px-4 font-semibold text-gray-800">#{i + 1}</td>
                                <td className="py-3 px-4 font-medium text-gray-700">{r.characterName}</td>
                                <td className="py-3 px-4 text-gray-600">{r.userNickname}</td>

                                {rankingType === "character" && (
                                    <>
                                        <td className="py-3 px-4 font-semibold text-blue-600">{getGradeLabel(r.gradeId)}</td>
                                        <td className="py-3 px-4 font-semibold text-gray-800">{r.totalStat}</td>
                                    </>
                                )}
                                {rankingType === "pvp" && (
                                    <td className="py-3 px-4 font-semibold text-green-600">{r.winCount}</td>
                                )}
                                {rankingType === "pve" && (
                                    <td className="py-3 px-4 font-semibold text-indigo-600">{r.clearCount}</td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            <Header />
            <div className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-6 flex-shrink-0">
                {/* 제목 */}
                <h2 className="text-3xl font-bold text-center border-b pb-3">
                    랭킹
                </h2>

                {/* 버튼 영역 */}
                <div className="flex justify-center gap-4 flex-wrap">
                    <button
                        className={`px-5 py-2.5 rounded-lg font-medium transition shadow-sm ${rankingType === "character"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        onClick={() => setRankingType("character")}
                    >
                        캐릭터 스탯
                    </button>
                    <button
                        className={`px-5 py-2.5 rounded-lg font-medium transition shadow-sm ${rankingType === "pvp"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        onClick={() => setRankingType("pvp")}
                    >
                        PVP
                    </button>
                    <button
                        className={`px-5 py-2.5 rounded-lg font-medium transition shadow-sm ${rankingType === "pve"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                        onClick={() => setRankingType("pve")}
                    >
                        PVE
                    </button>
                </div>
            </div>

            {/* 내부 스크롤 영역 */}
            <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-6">
                {renderTable()}
            </div>
        </div>
    );
}

export default RankingPage;
