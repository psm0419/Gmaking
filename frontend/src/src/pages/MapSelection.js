// src/pages/MapSelection.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MapSelection = () => {
    const [maps, setMaps] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get("/api/pve/maps", { withCredentials: true })
            .then(res => {
                console.log("맵 응답 데이터:", res.data);
                setMaps(res.data);
            })
            .catch(err => console.error(err));
    }, []);

    const handleSelectMap = (mapId) => {
        // 선택한 맵 ID를 가지고 전투 화면으로 이동
        navigate("/pve/battle", { state: { mapId } });
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>맵을 선택하세요</h2>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                {maps.map((map) => (
                    <div
                        key={map.mapId}
                        style={{
                            border: "1px solid #ccc",
                            padding: "20px",
                            cursor: "pointer",
                            width: "150px",
                            textAlign: "center",
                            borderRadius: "8px",
                        }}
                        onClick={() => handleSelectMap(map.mapId)}
                    >
                        {map.name}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MapSelection;
