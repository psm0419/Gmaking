import React, { useEffect, useState } from "react";
import axios from "axios";

function RankingPage() {
    const [rankingType, setRankingType] = useState("character"); // 기본: 캐릭터 총스탯
    const [rankings, setRankings] = useState([]);

    const getGradeLabel = (gradeId) => {
        switch (gradeId) {
            case 1: return "N";
            case 2: return "R";
            case 3: return "SR";
            case 4: return "SSR";
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

    const renderTable = () => {
        if (rankingType === "pvp") {
            return (
                <table className="min-w-full text-center border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th>순위</th><th>캐릭터명</th><th>유저명</th><th>승리 횟수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((r, i) => (
                            <tr key={i} className="border-t">
                                <td>{i + 1}</td>
                                <td>{r.characterName}</td>
                                <td>{r.userNickname}</td>
                                <td>{r.winCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        } else if (rankingType === "pve") {
            return (
                <table className="min-w-full text-center border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th>순위</th><th>캐릭터명</th><th>유저명</th><th>클리어 수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((r, i) => (
                            <tr key={i} className="border-t">
                                <td>{i + 1}</td>
                                <td>{r.characterName}</td>
                                <td>{r.userNickname}</td>
                                <td>{r.clearCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        } else {
            return (
                <table className="min-w-full text-center border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th>순위</th><th>캐릭터명</th><th>유저명</th><th>등급</th><th>총 스탯 합계</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.map((r, i) => (
                            <tr key={i} className="border-t">
                                <td>{i + 1}</td>
                                <td>{r.characterName}</td>
                                <td>{r.userNickname}</td>
                                <td>{getGradeLabel(r.gradeId)}</td>
                                <td>{r.totalStat}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">랭킹</h2>
            <div className="flex justify-center gap-4 mb-6">
                <button className={`px-4 py-2 rounded-lg ${rankingType === "character" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => setRankingType("character")}>캐릭터 스탯</button>
                <button className={`px-4 py-2 rounded-lg ${rankingType === "pvp" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => setRankingType("pvp")}>PVP</button>
                <button className={`px-4 py-2 rounded-lg ${rankingType === "pve" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                    onClick={() => setRankingType("pve")}>PVE</button>
            </div>
            <div className="overflow-x-auto">{renderTable()}</div>
        </div>
    );
}

export default RankingPage;
