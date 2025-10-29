
import { useAuth } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import LoginPage from './pages/account/LoginPage';
import HomePage from './pages/HomePage';
import CharacterCreationPage from './pages/characterCreation/CharacterCreationPage';
import RegisterPage from './pages/account/RegisterPage';
import FindIdPage from './pages/account/FindIdPage';
import FindPasswordPage from './pages/account/FindPasswordPage';
import OAuth2RedirectHandler from './pages/account/OAuth2RedirectHandler';
import ChatPage from './pages/mypage/ChatPage';
import MyPage from './pages/mypage/MyPage';
import PveBattlePage from './pages/game/pve/PveBattlePage';
import MapSelection from './pages/game/pve/MapSelection';
import WithdrawPage from './pages/account/WithdrawPage';
import ShopPage from "./pages/shop/ShopPage";
import ChatEntryPage from './pages/mypage/ChatEntryPage';
import CommunityPage from './pages/community/CommunityPage';
import CreatePostPage from './pages/community/CreatePostPage';
import PostDetailPage from './pages/community/PostDetailPage';
import BattleLogList from './pages/battleLog/BattleLogList';
import TurnLogList from './pages/battleLog/TurnLogList';
import RankingPage from './pages/ranking/RankingPage';
import AiDebatePage from './pages/game/debate/AiDebatePage';
import ProfileEditPage from'./pages/mypage/ProfileEditPage';
import PvpMatchPage from './pages/game/pvp/PvpMatchPage';
import PvpBattlePage from './pages/game/pvp/PvpBattlePage';
import PostEditPage from './pages/community/PostEditPage';
import ReactionGame from './pages/game/minigame/ReactionGame';
import MiniGameList from './pages/game/minigame/MiniGameList';
import BattleModeSelectPage from './pages/game/BattleModeSelectPage';
import MemoryGame from './pages/game/minigame/MemoryGame';
import CharacterAssistant from './components/assistant/CharacterAssistant';
import TermsPage from './pages/footer/TermsPage';
import PrivacyPage from './pages/footer/PrivacyPage';
import LicensePage from './pages/footer/LicensePage';
import GuidePage from './pages/footer/GuidePage';
import AboutPage from './pages/footer/About';
import TeamPage from './pages/footer/TeamPage';
import TypingGame from './pages/game/minigame/TypingGame';
import DailyQuestPage from './pages/quest/DailyQuestPage';
import NoticeListPage from './pages/notice/NoticeListPage';
import NoticeDetailPage from './pages/notice/NoticeDetailPage';
import NoticeManagePage from './pages/notice/NoticeManagePage';
import AdminPage from './pages/admin/AdminPage';
import FaqPage from './pages/footer/FaqPage';

// ProtectedRoute: 로그인 확인
const ProtectedRoute = ({ children }) => {
    const { isLoggedIn, isLoading } = useAuth();

    
    // AuthContext가 토큰 검증 중이라면 로딩 화면을 표시
    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center text-gray-400 text-xl font-medium">
                인증 상태 확인 중...
            </div>
        );
    }

    // 로딩이 끝났는데 비로그인 상태라면 -> 로그인 페이지로 이동
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};


function App() {
    const { isLoading } = useAuth();

    const [assistantOpen, setAssistantOpen] = useState(false);

    useEffect(() => {
        const onToggle = () => setAssistantOpen(v => !v);
        const onOpen   = () => setAssistantOpen(true);
        const onClose  = () => setAssistantOpen(false);

        window.addEventListener('assistant:toggle', onToggle);
        window.addEventListener('assistant:open', onOpen);
        window.addEventListener('assistant:close', onClose);
        return () => {
          window.removeEventListener('assistant:toggle', onToggle);
          window.removeEventListener('assistant:open', onOpen);
          window.removeEventListener('assistant:close', onClose);
        };
      }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                앱 로딩 중...
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                {/* 비보호 경로 */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/oauth/callback" element={<OAuth2RedirectHandler />} />
                <Route path="/oauth/callback/failure" element={<OAuth2RedirectHandler />} />
                <Route path="/find-id" element={<FindIdPage />} />
                <Route path="/find-password" element={<FindPasswordPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/license" element={<LicensePage />} />
                <Route path="/guide" element={<GuidePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/quest" element={<DailyQuestPage />} />
                <Route path="/notice" element={<NoticeListPage />} />
                <Route path="/notice/:noticeId" element={<NoticeDetailPage />} />
                <Route path="/faq" element={<FaqPage />} />

                {/* 보호 경로 */}
                <Route path="/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
                <Route path="/create-character" element={<ProtectedRoute><CharacterCreationPage /></ProtectedRoute>} />
                <Route path="/chat-entry" element={<ProtectedRoute><ChatEntryPage/></ProtectedRoute>}/>
                <Route path="/chat-entry/:characterId" element={<ProtectedRoute><ChatEntryPage/></ProtectedRoute>} />
                <Route path="/chat/:characterId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/my-page" element={<ProtectedRoute><MyPage/></ProtectedRoute>} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/pve/maps" element={<MapSelection />} />
                <Route path="/pve/battle" element={<PveBattlePage />} />  
                <Route path="/pvp/match" element={<PvpMatchPage />} />
                <Route path="/pvp/battle" element={<PvpBattlePage />} />
                <Route path="/my-page/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
                <Route path="/logs" element={<BattleLogList />} />
                <Route path="/logs/turns/:battleId" element={<TurnLogList />} />
                <Route path="/ranking" element={<RankingPage />} />
                <Route path="/debate" element={<AiDebatePage />} />
                <Route path="/minigame/reaction" element={<ReactionGame />} />
                <Route path="/minigame" element={<MiniGameList />} />
                <Route path="/battlemode" element={<BattleModeSelectPage />} />
                <Route path="/minigame/memory" element={<MemoryGame />} />
                <Route path="/minigame/typing" element={<TypingGame />} />
                <Route path="/admin/notice/new" element={<ProtectedRoute><NoticeManagePage /></ProtectedRoute>} />
                <Route path="/admin/notice/:noticeId/edit" element={<ProtectedRoute><NoticeManagePage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

                {/* 그 외 모든 경로를 메인으로 이동 */}
                <Route path="*" element={<Navigate to="/" replace />} />

                {/* 커뮤니티 페이지 */}
                <Route path="/community" element={<ProtectedRoute><CommunityPage/></ProtectedRoute>} />
                <Route path="/create-post" element={<ProtectedRoute><CreatePostPage/></ProtectedRoute>} />
                <Route path="/community/:postId" element={<ProtectedRoute><PostDetailPage/></ProtectedRoute>} /> 
                <Route path="/community/edit/:postId" element={<ProtectedRoute><PostEditPage/></ProtectedRoute>} /> 
                
                {/* 그 외 모든 경로를 메인으로 이동 */}
                <Route path="*" element={<Navigate to="/" replace />} />  
            </Routes>

            {assistantOpen && (
              <CharacterAssistant

                introOnMount={true}
                playIntroOnEveryOpen={false}
                introImages={[
                  "/images/assistant/intro1.png",
                  "/images/assistant/intro2.png",
                  "/images/assistant/intro3.png",
                ]}
                introFrameMs={120}
                images={[
                    "/images/assistant/idle1.png",
                    "/images/assistant/idle2.png",
                    "/images/assistant/idle3.png",
                    "/images/assistant/idle4.png",
                  ]}
                frameMs={350}
                name="겜만중 도우미"
                options={["인사하기","겜만중이 뭐야?","AI가 뭐야?", "오늘의 퀘스트" ,"이 페이지에 대해 알려줄래?"]}
              />
            )}


        </Router>
    );
}

export default App;