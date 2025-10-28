import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Header from "../../../components/Header";

function PveBattlePage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { mapId, characterId } = location.state || {};
    const [mapImageUrl, setMapImageUrl] = useState(null);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [opponentMonster, setOpponentMonster] = useState(null);
    const [logs, setLogs] = useState([]);
    const [isBattle, setIsBattle] = useState(false);
    const logContainerRef = useRef(null);
    const socketRef = useRef(null);
    // TTS 관련 상태 및 함수
    const [isTtsEnabled, setIsTtsEnabled] = useState(false); // 기본 ON
    const ttsRef = useRef(window.speechSynthesis);
    const ttsQueueRef = useRef([]);

    const token = localStorage.getItem("gmaking_token");    

    const styles = [
        { key: "COMIC", label: "코믹 (현재 기본)" },
        { key: "FANTASY", label: "웅장한 판타지" },
        { key: "WUXIA", label: "무협지 스타일" },
        // 필요에 따라 스타일 추가
    ];
    const [noteStyle, setNoteStyle] = useState(styles[0].key);

    // 토큰에서 userId 추출 로직 추가
    let userId = null;
    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            userId = decodedToken.userId;
        } catch (e) {
            console.error("토큰 디코딩 실패:", e);
            // 토큰이 유효하지 않으면 userId는 null로 남습니다.
        }
    }

    // 등급 ID → 문자열 변환 함수
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
        if (!mapId || !characterId) {
            alert("맵 또는 캐릭터가 선택되지 않았습니다.");
            navigate("/pve/maps");
            return;
        }

        // 1. 맵 정보 로드
        axios
            .get(`/api/pve/maps/${mapId}/image`, { withCredentials: true })
            .then(res => {
                setMapImageUrl(res.data.mapImageUrl);
            })
            .catch(err => console.error("맵 이미지/이름 가져오기 실패:", err));

        // 2. 선택된 캐릭터 정보 로드
        if (token && userId) {
            // (권장: 백엔드에 /api/character/{characterId} API가 있다면 그 API를 사용하는 것이 더 효율적입니다.)
            axios.get(`/api/character/list?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    const charList = Array.isArray(res.data) ? res.data : [];
                    const selected = charList.find(c => c.characterId === characterId);
                    if (selected) {
                        setSelectedCharacter(selected);
                    } else {
                        alert("선택된 캐릭터 정보를 찾을 수 없습니다.");
                        navigate("/pve/maps");
                    }
                })
                .catch(err => console.error("캐릭터 정보 로드 실패:", err));
        }

        setOpponentMonster(null);
    }, [mapId, characterId, token, userId, navigate]);

    useEffect(() => {
        // 로그가 추가될 때마다 스크롤을 맨 아래로 이동
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

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

    useEffect(() => {
        if (!isTtsEnabled || logs.length === 0) return;

        const lastLog = logs[logs.length - 1];
        if (!lastLog || lastLog.trim() === "") return;

        // 새 로그를 큐에 추가
        ttsQueueRef.current.push(lastLog);

        // 만약 현재 말하고 있지 않다면, 큐 처리 시작
        if (!ttsRef.current.speaking) {
            speakNextFromQueue();
        }
    }, [logs, isTtsEnabled]);

    // 큐에 쌓인 로그를 순서대로 읽는 함수
    const speakNextFromQueue = () => {
        if (ttsQueueRef.current.length === 0 || !isTtsEnabled) return;

        const nextText = ttsQueueRef.current.shift();
        const utter = new SpeechSynthesisUtterance(nextText);
        utter.lang = "ko-KR";
        utter.rate = 3;
        utter.pitch = 1.2;
        utter.volume = 1.0;

        // 한 문장이 끝나면 다음 문장 읽기
        utter.onend = () => {
            if (ttsQueueRef.current.length > 0) {
                speakNextFromQueue();
            }
        };

        ttsRef.current.speak(utter);
    };

    // TTS ON/OFF 토글 함수
    const toggleTts = () => {
        setIsTtsEnabled(prev => !prev);
        if (ttsRef.current.speaking) {
            ttsRef.current.cancel();
        }
    };

    const startBattle = () => {
        if (!selectedCharacter) {
            alert("캐릭터를 선택하세요!");
            return;
        }

        setLogs([]);
        setIsBattle(true);

        // 토큰 확인 및 연결
        const token = localStorage.getItem("gmaking_token");
        if (!token) {
            alert("로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        // WebSocket 연결
        const socket = new WebSocket(`ws://localhost:8080/battle?token=${token}`);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log("웹소켓 연결 성공:", new Date().toISOString());
            // 서버에 전투 시작 요청 전송
            const payload = {
                type: "start", // 웹소켓 핸들러가 메시지 타입을 구분할 수 있도록 type 추가
                characterId: selectedCharacter.characterId,
                mapId: mapId, // 서버가 DB에서 몬스터 생성
                noteStyle: noteStyle
            };
            socket.send(JSON.stringify(payload));
        };

        socket.onmessage = (event) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch {
                data = { log: event.data }; // 순수 텍스트 로그 처리
            }

            if (data.type === "end") {
                // 전투 종료 시 상태 업데이트
                setIsBattle(false);
                return;
            }

            // 몬스터 조우 메시지 처리 (별도의 상태 업데이트)
            if (data.type === "encounter") {
                // 몬스터 정보 구조에 맞게 상태 업데이트
                setOpponentMonster({
                    monsterId: data.monsterId,
                    monsterName: data.monsterName,
                    imageId: data.imageId,
                    imageOriginalName: data.imageOriginalName,
                    imageUrl: data.imageUrl,
                    monsterHp: data.monsterHp,
                    monsterAttack: data.monsterAttack,
                    monsterDefense: data.monsterDefense,
                    monsterSpeed: data.monsterSpeed,
                    monsterCriticalRate: data.monsterCriticalRate,
                });
                // 몬스터 정보가 화면에 표시되므로, 로그에는 추가 메시지를 보내지 않고 건너뜁니다.
                return;
            }

            // 일반 로그 처리
            const logText = data.log || event.data;
            setLogs(prev => [...prev, logText]);
        };

        socket.onclose = () => {
            console.log("웹소켓 연결 종료");
            setIsBattle(false);
        };

        socket.onerror = (error) => {
            console.error("웹소켓 오류:", error);
            setIsBattle(false);
        };
    };

    const backgroundStyle = {
        backgroundImage: mapImageUrl ? `url(${mapImageUrl})` : 'none',
        backgroundColor: 'transparent',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
    };

    return (
        <div><Header />
            <div className="flex flex-col items-center p-3 h-[calc(100vh-60px)] overflow-hidden" style={backgroundStyle}>

                {/* 캐릭터 및 몬스터 정보 표시 영역 */}
                {(selectedCharacter) ? (
                    <div className="flex justify-around w-full max-w-4xl mb-4 p-4 bg-gray-900/80 rounded-xl shadow-2xl border border-yellow-500/50">

                        {/* 내 캐릭터 정보 */}
                        <div className="text-center w-1/3 p-1 bg-gray-800/50 rounded-lg">
                            <img
                                src={selectedCharacter.imageUrl}
                                alt={selectedCharacter.characterName}
                                className="w-32 h-32 mx-auto mb-2 border border-yellow-400 rounded-lg bg-white/10"
                            />
                            <h2 className="text-2xl font-bold mb-2 text-yellow-400">{selectedCharacter.characterName}({getGradeLabel(selectedCharacter.gradeId)})</h2>
                            <div className="text-l mt-2 text-gray-200">
                                <p>HP: {selectedCharacter.characterStat?.characterHp} / ATK: {selectedCharacter.characterStat?.characterAttack}/ DEF: {selectedCharacter.characterStat?.characterDefense}</p>
                                <p>SPEED: {selectedCharacter.characterStat?.characterSpeed} / CRITICAL: {selectedCharacter.characterStat?.criticalRate}%</p>
                            </div>
                        </div>

                        <div className="flex items-center text-4xl font-extrabold text-red-500 w-1/3 justify-center">
                            VS
                        </div>

                        {/* 몬스터 정보 */}
                        <div className="text-center w-1/3 p-1 bg-gray-800/50 rounded-lg">
                            {opponentMonster ? (
                                <>
                                    <img
                                        src={opponentMonster.imageUrl}
                                        alt={opponentMonster.monsterName}
                                        className="w-32 h-32 mx-auto mb-2 border border-red-400 rounded-lg bg-white/10"
                                    />
                                    <h2 className="text-2xl font-bold mb-2 text-red-400">{opponentMonster.monsterName}</h2>
                                    <div className="text-l mt-2 text-gray-200">
                                        <p>HP: {opponentMonster.monsterHp} / ATK: {opponentMonster.monsterAttack} / DEF: {opponentMonster.monsterDefense}</p>
                                        <p>SPEED: {opponentMonster.monsterSpeed} / CRITICAL: {opponentMonster.monsterCriticalRate}%</p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xl pt-10 text-gray-400">전투 시작 시 몬스터 조우...</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-xl mb-4 text-gray-400">캐릭터 정보를 불러오는 중...</p>
                )}

                {/* GPT 노트 스타일 선택 */}
                <div className="mb-1 text-center">
                    <label className="mr-2 font-bold">해설 스타일 선택:</label>
                    <select
                        value={noteStyle}
                        onChange={(e) => setNoteStyle(e.target.value)}
                        className="bg-gray-700 text-white p-1 rounded"
                    >
                        {styles.map((style) => (
                            <option key={style.key} value={style.key}>
                                {style.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-4 mt-3">
                    <button
                        onClick={toggleTts}
                        className={`${isTtsEnabled ? "bg-green-600 hover:bg-green-500" : "bg-gray-600 hover:bg-gray-500"
                            } px-6 py-3 rounded-xl transition`}
                    >
                        {isTtsEnabled ? "음성 해설 끄기" : "음성 해설 켜기"}
                    </button>

                    <button
                        onClick={startBattle}
                        // 캐릭터 정보가 로드된 후에만 버튼 활성화 (몬스터 정보는 이제 눌렀을 때 가져옴)
                        disabled={isBattle || !selectedCharacter}
                        className="bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-500 disabled:bg-gray-500"
                    >
                        {isBattle ? "전투 중..." : "전투 시작"}
                    </button>

                    <button
                        onClick={() => navigate("/pve/maps")}
                        disabled={isBattle}
                        className="bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-500 disabled:bg-gray-500"
                    >
                        맵 선택
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        disabled={isBattle}
                        className="bg-green-600 px-6 py-3 rounded-xl hover:bg-green-500 disabled:bg-gray-400"
                    >
                        홈으로
                    </button>
                </div>
                <div
                    ref={logContainerRef}
                    className="mt-6 bg-gray-900/80 p-6 rounded-xl w-4/5 flex-grow overflow-y-auto border border-gray-700 whitespace-pre-wrap no-scrollbar"
                >
                    {logs.map((log, i) => (
                        <p
                            key={i}
                            className="text-white text-lg mb-1 font-mono hover:bg-gray-700/50 transition-colors duration-150 break-words"
                        >
                            {log}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PveBattlePage;