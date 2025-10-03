import React from 'react';
import { User, ChevronRight, Wand2 } from 'lucide-react'; 
import { useAuth } from '../context/AuthContext';
import Header from './common/Header'; 
import Footer from './common/Footer';
import { useNavigate } from 'react-router-dom'; 

// 가이드 링크를 위한 서브 컴포넌트
const GuideLink = ({ title }) => (
    <div className="flex justify-between items-center p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition cursor-pointer">
        <span className="text-gray-200 font-medium">{title}</span>
        <ChevronRight className="w-5 h-5 text-yellow-400" />
    </div>
);

const HomePage = () => {
    const { user, hasCharacter } = useAuth(); 
    const navigate = useNavigate(); 

    // 표시될 사용자 이름/닉네임
    const displayName = user?.userNickname || user?.userName || user?.userId;
    const roleColor = user?.role === 'ADMIN' ? 'text-red-400' : 'text-yellow-400';

    // 슬라이드 배너 및 이벤트 더미 데이터 
    const slideBanner = {
        title: "겜만중 오픈 준비중",
        description: "더미",
    };

    const events = [
        { title: "[이벤트] 7일 접속 보상!", date: "10.01 ~ 10.07" },
        { title: "[업데이트] 신규 코스튬 출시", date: "2025.10.01" },
        { title: "[공지] 점검 완료 및 보상 지급", date: "2025.09.30" },
        { title: "[이벤트] 출석 체크 보상 UP", date: "2025.09.28" },
    ];

    // ---

    // 사용자 정보 요약 또는 캐릭터 생성 유도
    const renderCentralSection = () => {
        if (!hasCharacter) {
            // 캐릭터가 없을 경우: 생성 버튼 표시
            return (
                <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border-2 border-red-500 transform transition duration-500 hover:scale-105">
                    <div className="text-center">
                        <Wand2 className="mx-auto w-16 h-16 text-red-400 mb-4 animate-bounce" />
                        <h3 className="text-3xl font-extrabold text-white mb-2">
                            캐릭터가 없습니다!
                        </h3>
                        <p className="text-md text-gray-400 mb-6">
                            AI 기반 캐릭터 생성을 시작하고 게임에 접속하세요.
                        </p>
                        
                        <button 
                            onClick={() => navigate('/create-character')} // 캐릭터 생성 페이지로 이동
                            className="mt-4 w-full py-3 bg-red-600 text-white text-lg font-bold rounded-lg shadow-lg hover:bg-red-700 transition"
                        >
                            캐릭터 생성
                        </button>
                    </div>
                </div>
            );
        }

        // 캐릭터가 있을 경우: 기존 사용자 정보 표시
        return (
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border-2 border-yellow-400">
                <div className="text-center">
                    <div className="mx-auto w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-3 border-4 border-yellow-500">
                        <User className="w-12 h-12 text-yellow-400" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-white mb-1">
                        {displayName}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                        역할: <span className={roleColor}>{user?.role}</span> | UID: {user?.userId}
                    </p>
                    
                    <div className="text-left bg-gray-700 p-4 rounded-lg space-y-2 text-sm">
                        <p>접속 시간: 124시간</p>
                        <p>보유 코인: 99,999</p>
                        <p>최고 랭크: 다이아몬드 III</p>
                    </div>
                    <button className="mt-4 w-full py-2 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition">
                        내 정보 보기
                    </button>
                </div>
            </div>
        );
    };

    // ------------------------------------------------------------------

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow">
                
                {/* 2-1. 슬라이드 배너 (Slide Banner) */}
                <div 
                    className={`h-[400px] rounded-xl shadow-2xl p-10 flex flex-col justify-center bg-center bg-cover`}
                    style={{backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://source.unsplash.com/random/1200x400/?space,galaxy,game')`}}
                >
                    <div className="max-w-xl">
                        <h2 className="text-5xl font-extrabold mb-3 leading-tight text-white">
                            {slideBanner.title}
                        </h2>
                        <p className="text-gray-300 text-lg mb-6">
                            {slideBanner.description}
                        </p>
                        <button className="px-8 py-3 bg-yellow-400 text-gray-900 text-xl font-bold rounded-lg shadow-lg hover:bg-yellow-500 transition duration-300">
                            자세히 보기
                        </button>
                    </div>
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

                    {/* 중앙: 사용자 정보 요약 */}
                    {renderCentralSection()}

                    {/* 오른쪽: 가이드 보기 */}
                    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                        <h3 className="text-2xl font-bold mb-4 text-white border-b border-yellow-400 pb-2">
                            초보자 가이드
                        </h3>
                        <div className="space-y-3">
                            <GuideLink title="게임 시작하기 (필독)" />
                            <GuideLink title="기본 조작법 익히기" />
                            <GuideLink title="자주 묻는 질문 (FAQ)" />
                            <GuideLink title="최신 패치 노트 확인" />
                            <GuideLink title="실시간 고객 지원 연결" />
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default HomePage;