// src/pages/MapSelection.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MapSelection = () => {
    const [maps, setMaps] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        // 맵 목록을 가져올 때, 모든 맵의 mapImageUrl은 절대 경로(http://localhost:8080/...)여야 합니다.
        axios.get("/api/pve/maps", { withCredentials: true })
            .then(res => {
                // console.log("맵 응답 데이터:", res.data); // 디버깅 로그 유지
                setMaps(res.data);
            })
            .catch(err => console.error(err));
    }, []);

    const handleSelectMap = (mapId) => {
        // 선택한 맵 ID를 가지고 전투 화면으로 이동
        navigate("/pve/battle", { state: { mapId } });
    };

    return (
        // 전체 배경을 어둡게, 최소 높이를 화면 크기로 설정
        <div className="bg-gray-900 min-h-screen text-white p-8">

            <h1 className="text-4xl font-extrabold mb-10 text-center text-yellow-400 border-b-2 border-yellow-400 pb-2">
                PVE 전투 지역 선택
            </h1>

            {/* 맵 카드 컨테이너 */}
            <div className="flex justify-center gap-6 flex-wrap">
                {maps.map((map) => (
                    <div
                        key={map.mapId}
                        onClick={() => handleSelectMap(map.mapId)}
                        className={`
                            relative w-64 h-40 overflow-hidden rounded-xl shadow-2xl transition-transform duration-300 transform hover:scale-105 hover:shadow-yellow-500/50 cursor-pointer
                            border border-gray-700
                        `}
                        // 맵 이미지를 배경으로 설정
                        style={{
                            backgroundImage: map.mapImageUrl ? `url(${map.mapImageUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            // 이미지가 로드되지 않을 경우 대비
                            backgroundColor: map.mapImageUrl ? 'rgba(0,0,0,0.5)' : '#374151', // bg-gray-700
                            // backgroundBlendMode: 'darken' // 이미지를 살짝 어둡게 만들어 텍스트 가독성 높임
                        }}
                    >
                        {/* 맵 이름 오버레이 */}
                        <div className="absolute inset-0 flex flex-col justify-end items-center p-4 bg-gradient-to-t from-gray-900/80 to-transparent">
                            <h3 className="text-2xl font-bold mb-1 text-shadow-lg">
                                {map.mapName}
                            </h3>                    
                        </div>

                        {/* 맵 설명 (선택 사항)*/}
                        <p className="absolute top-2 right-2 text-xs bg-gray-800/80 px-2 py-1 rounded">
                            일반 지역
                        </p>                        
                    </div>
                ))}
            </div>

            {/* 맵 데이터 로딩 상태 피드백 */}
            {maps.length === 0 && (
                <p className="text-center mt-10 text-gray-400">
                    맵 정보를 불러오는 중이거나 맵이 없습니다...
                </p>
            )}
            <div className="flex gap-4 mt-4 flex-col items-center">                
                <button
                    onClick={() => navigate("/")}
                    className="bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-500">                
                    홈으로
                </button>
            </div>

        </div>
        
    );
};

export default MapSelection;