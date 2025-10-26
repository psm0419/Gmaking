import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Header from '../../components/Header';

function RankingPage() {
    const [rankingType, setRankingType] = useState("character");
    const [rankings, setRankings] = useState([]);
    const logContainerRef = useRef(null);

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
        <div className="bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-700">
            <table className="min-w-full text-center border-collapse">
                <thead className="bg-gray-700 border-b border-gray-600">
                    <tr className="text-gray-200">
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
                            <td colSpan="5" className="py-6 text-gray-400">랭킹 데이터가 없습니다.</td>
                        </tr>
                    ) : (
                        rankings.map((r, i) => (
                            <tr
                                key={i}
                                className={`border-b border-gray-700 transition ${i % 2 === 0
                                    ? "bg-gray-900 hover:bg-gray-700"
                                    : "bg-gray-850 hover:bg-gray-700"
                                    }`}
                            >
                                <td className="py-3 px-4 font-semibold text-gray-200">#{i + 1}</td>
                                <td className="py-3 px-4 font-medium text-gray-100">{r.characterName}</td>
                                <td className="py-3 px-4 text-gray-400">{r.userNickname}</td>

                                {rankingType === "character" && (
                                    <>
                                        <td className="py-3 px-4 font-semibold text-blue-400">
                                            {getGradeLabel(r.gradeId)}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-200">{r.totalStat}</td>
                                    </>
                                )}
                                {rankingType === "pvp" && (
                                    <td className="py-3 px-4 font-semibold text-green-400">{r.winCount}</td>
                                )}
                                {rankingType === "pve" && (
                                    <td className="py-3 px-4 font-semibold text-indigo-400">{r.clearCount}</td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

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
        <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
            <Header />
            <div className="w-full max-w-5xl mx-auto p-6 flex flex-col gap-6 flex-shrink-0">
                {/* 제목 */}
                <h2 className="text-3xl font-bold text-center border-b pb-3 text-white">
                    랭킹
                </h2>

                {/* 버튼 영역 */}
                <div className="flex justify-center gap-4 flex-wrap">
                    {[
                        { type: "character", label: "캐릭터 스탯" },
                        { type: "pvp", label: "PVP" },
                        { type: "pve", label: "PVE" },
                    ].map(({ type, label }) => (
                        <button
                            key={type}
                            onClick={() => setRankingType(type)}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md border 
                ${rankingType === type
                                    ? "bg-blue-500 text-white border-blue-400 shadow-blue-600/40 scale-105"
                                    : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-white"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 내부 스크롤 영역 */}
            <div
                ref={logContainerRef}
                className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto p-6 mb-5 no-scrollbar">
                {renderTable()}
            </div>
        </div>
    );
}

export default RankingPage;
