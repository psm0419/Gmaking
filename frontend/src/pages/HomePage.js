import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserCharacterSummary from '../components/home/UserCharacterSummary';
import CharacterCreationPrompt from '../components/home/CharacterCreationPrompt';
import { useNavigate } from 'react-router-dom';


const GuideLink = ({ title, href = "/guide" }) => (
    <a
        href={href}
        className="flex justify-between items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
        style={{ textDecoration: 'none' }}
    >
        <span className="text-gray-200 font-medium">{title}</span>
        <ChevronRight className="w-5 h-5 text-yellow-400" />
    </a>
);

const HomePage = () => {
    const { user, characterCount } = useAuth();
    const hasCharacter = !!user?.hasCharacter;
    const characterImageUrl = user?.characterImageUrl || null;
    const displayName = user?.userNickname || user?.userName || user?.userId;
    const incubatorCount = Number.isFinite(Number(user?.incubatorCount))
        ? Number(user.incubatorCount)
        : 0;
    const isAdFree = !!user?.isAdFree;
    const navigate = useNavigate();

    useEffect(() => {
        const t = localStorage.getItem('gmaking_token');
        if (!t) {
            console.log('[JWT] no token in localStorage');
            return;
        }
        try {
            const payload = jwtDecode(t);
            console.log('[JWT payload]', payload);
            console.log('[JWT] incubatorCount:', payload.incubatorCount, 'isAdFree:', payload.isAdFree);
        } catch (e) {
            console.error('[JWT] decode failed:', e);
        }
    }, []);

    // 슬라이드 배너 및 이벤트 더미 데이터
    const slideBanner = {
        img: process.env.PUBLIC_URL + "/GmakingMain.png",
        title: "겜만중 오픈 준비중",
        description: "더미",
    };

    const events = [
        { title: "[이벤트] 7일 접속 보상!", date: "10.01 ~ 10.07" },
        { title: "[업데이트] 신규 코스튬 출시", date: "2025.10.01" },
        { title: "[공지] 점검 완료 및 보상 지급", date: "2025.09.30" },
        { title: "[이벤트] 출석 체크 보상 UP", date: "2025.09.28" },
    ];

    React.useEffect(() => {
      document.body.classList.add('no-scrollbar');
      document.documentElement.classList.add('no-scrollbar');
      return () => {
        document.body.classList.remove('no-scrollbar');
        document.documentElement.classList.remove('no-scrollbar');
      };
    }, []);
    
    // 게임 시작 버튼 클릭 핸들러
    const handleGameStartClick = () => {
        console.log("Game Start Clicked! Navigating to /battlemode");
        navigate('/battlemode');
    };
    
    return (
        <div><Header />
            <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow relative">

                    {/* 슬라이드 배너 - 원본 크기 그대로 표시 */}
                    <div className="relative z-0">
                        <img
                            src={slideBanner.img}
                            alt="슬라이드 배너"
                            className="block mx-auto w-full"
                        />
                    </div>
                    
                    {/* 👇 GAME START 버튼 (겹치기 위해 absolute 포지셔닝 적용) */}
                    <div 
                        className="absolute z-10" 
                        style={{ 
                            top: '60%', 
                            left: '50%', 
                            transform: 'translate(-3.3rem, -35%)'
                        }} 
                    >
                        <button
                            onClick={handleGameStartClick}
                            className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-red-500 text-gray-900 font-extrabold text-2xl flex items-center justify-center
                                       shadow-xl shadow-yellow-500/50 hover:shadow-blue-400/70 transform hover:scale-105 transition-all duration-300 ease-in-out
                                       active:scale-90 active:ring-4 active:ring-yellow-400 active:ring-opacity-75 focus:outline-none overflow-hidden"
                        >
                            <span className="relative z-10 leading-none">
                                GAME<br/>START
                            </span>
                            <span className="absolute inset-0 rounded-full bg-white opacity-0 animate-ripple"></span>
                        </button>
                    </div>


                    {/* 2-2. 배너 아래 3단 섹션: 이벤트 | 사용자 정보 | 가이드 */}
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* 왼쪽: 이벤트 목록 및 업데이트 정보 */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h3 className="text-2xl font-bold mb-4 text-white border-b border-yellow-400 pb-2">
                                이벤트 / 업데이트
                            </h3>
                            <div className="space-y-3">
                                {events.map((item, index) => (
                                    <p key={index} className="text-gray-300 text-sm flex justify-between hover:text-yellow-400 transition cursor-pointer">
                                        <span className="truncate">{item.title}</span>
                                        <span className="text-gray-500 ml-4 flex-shrink-0">[{item.date}]</span>
                                    </p>
                                ))}
                            </div>
                        </div>

                        {/* 중앙: 사용자 정보 요약 -> 분리된 컴포넌트로 대체 */}
                        <div className="relative">
                            {hasCharacter ? (
                                <UserCharacterSummary
                                    user={user}
                                    displayName={displayName}
                                    characterImageUrl={characterImageUrl}
                                    incubatorCount={incubatorCount}
                                    isAdFree={isAdFree}
                                    characterCount={characterCount}
                                />
                            ) : (
                                <CharacterCreationPrompt />
                            )}
                        </div>

                        {/* 오른쪽: 가이드 보기 */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h3 className="text-2xl font-bold mb-4 text-white border-b border-yellow-400 pb-2">
                                초보자 가이드
                            </h3>
                            <div className="space-y-3">
                                <GuideLink title="플랫폼 소개" />
                                <GuideLink title="캐릭터 생성" />
                                <GuideLink title="주요 콘텐츠" />
                                <GuideLink title="AI 대화 기능" />
                                <GuideLink title="랭킹 및 로그 조회" />
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default HomePage;