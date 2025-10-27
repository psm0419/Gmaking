import React, { useEffect, useState } from 'react';
import { ChevronRight, List } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserCharacterSummary from '../components/home/UserCharacterSummary';
import CharacterCreationPrompt from '../components/home/CharacterCreationPrompt';
import { useNavigate } from 'react-router-dom';
import { getNotices } from '../api/notice/noticeApi';

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
    const [recentNotices, setRecentNotices] = useState([]);

    const fetchRecentNotices = async () => {
        try {
            // 공지사항 나타낼 개수 결정
            const data = await getNotices(1, 8);
            setRecentNotices(data.noticeList || []);
        } catch (error) {
            console.error("최신 공지사항 목록 조회 실패:", error);
        }
    };

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

    useEffect(() => {
        fetchRecentNotices();
    }, []);

    // 슬라이드 배너 및 이벤트 더미 데이터
    const slideBanner = {
        img: process.env.PUBLIC_URL + "/GmakingMain.png",
    };

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
            <div className="min-h-screen bg-gray-900 text-white flex flex-col">
                <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow relative">

                    {/* 슬라이드 배너 - 원본 크기 그대로 표시 */}
                    <div className="relative">
                        <img
                            src={slideBanner.img}
                            alt="슬라이드 배너"
                            className="block mx-auto w-full"
                        />
                        <button
                            onClick={handleGameStartClick}
                            className="absolute top-[92%] left-1/2 transform -translate-x-1/2 -translate-y-1/2
                            w-[6.7rem] h-[6.7rem] rounded-full bg-gradient-to-br from-blue-400 to-red-500
                            text-gray-900 font-extrabold text-xl flex items-center justify-center
                            shadow-[0_0_25px_0_rgba(253,224,71,0.3)]
                            hover:shadow-[0_0_30px_0_rgba(147,197,253,0.3)]
                            hover:scale-105 active:scale-90 active:ring-4 active:ring-yellow-400
                            transition-all duration-300 ease-in-out focus:outline-none overflow-hidden"
                        >
                            <span className="relative z-10 leading-none">
                                GAME<br />START
                            </span>
                            <span className="absolute inset-0 rounded-full bg-white opacity-0 animate-ripple"></span>
                        </button>
                    </div>


                    {/* 2-2. 배너 아래 3단 섹션: 이벤트 | 사용자 정보 | 가이드 */}
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* 왼쪽: 이벤트 목록 및 업데이트 정보 */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <div className="flex justify-between items-center mb-4 border-b border-yellow-400 pb-2">
                                <h3 className="text-2xl font-bold text-white flex items-center">
                                     <List className="w-6 h-6 mr-2 text-yellow-400" />
                                    공지사항
                                </h3>
                                {/* 전체 목록 보기 버튼 */}
                                <a 
                                    href="/notice"
                                    className="text-sm text-yellow-400 hover:text-yellow-300 transition font-medium flex items-center"
                                    onClick={(e) => { e.preventDefault(); navigate('/notice'); }}
                                >
                                    더보기 <ChevronRight className="w-4 h-4 ml-1" />
                                </a>
                            </div>
                            <div className="space-y-3">
                                {recentNotices.length > 0 ? (
                                    recentNotices.map((notice) => (
                                        <p 
                                            key={notice.noticeId} 
                                            className="text-gray-300 text-sm flex justify-between hover:text-yellow-400 transition cursor-pointer"
                                            onClick={() => navigate(`/notice/${notice.noticeId}`)}
                                        >
                                            <span className={`truncate ${notice.isPinned ? 'font-bold text-red-400' : ''}`}>
                                                [{notice.isPinned ? '공지' : '일반'}] {notice.noticeTitle}
                                            </span>
                                            <span className="text-gray-500 ml-4 flex-shrink-0">
                                                [{new Date(notice.createdDate).toLocaleDateString().slice(0, -1)}]
                                            </span>
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center py-5">
                                        등록된 공지사항이 없습니다.
                                    </p>
                                )}
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