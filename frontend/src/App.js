import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/account/LoginPage';
import HomePage from './pages/HomePage';
import CharacterCreationPage from './pages/CharacterCreationPage';
import RegisterPage from './pages/account/RegisterPage';
import FindIdPage from './pages/account/FindPasswordPage';
import FindPasswordPage from './pages/account/FindPasswordPage';
import OAuth2RedirectHandler from './pages/account/OAuth2RedirectHandler';
import ChatPage from './pages/ChatPage';
import MyPage from './pages/MyPage';
import PveBattlePage from './pages/PveBattlePage';
import MapSelection from './pages/MapSelection';
import WithdrawPage from './pages/account/WithdrawPage';
import ShopPage from "./pages/ShopPage";
import ChatEntryPage from './pages/ChatEntryPage';
import ProfileEditPage from'./pages/ProfileEditPage';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PvpMatchPage from './pages/PvpMatchPage';
import PvpBattlePage from './pages/PvpBattlePage';
import CommunityPage from './pages/CommunityPage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailPage from './pages/PostDetailPage';


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
                
                {/* 보호 경로 */}
                <Route path="/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
                <Route path="/create-character" element={<ProtectedRoute><CharacterCreationPage /></ProtectedRoute>} />
                <Route path="/chat-entry/:characterId" element={<ProtectedRoute><ChatEntryPage/></ProtectedRoute>} />
                <Route path="/chat/:characterId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                <Route path="/my-page" element={<ProtectedRoute><MyPage/></ProtectedRoute>} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/pve/maps" element={<MapSelection />} />
                <Route path="/pve/battle" element={<PveBattlePage />} />  
                <Route path="/pvp/match" element={<PvpMatchPage />} />
                <Route path="/pvp/battle" element={<PvpBattlePage />} />
                <Route path="/my-page/profile/edit" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
                       
                {/* 그 외 모든 경로를 메인으로 이동 */}
                <Route path="*" element={<Navigate to="/" replace />} />

                {/* 커뮤니티 페이지 */}
                <Route
                    path="/community"
                    element={
                        <ProtectedRoute>
                            <CommunityPage/>
                        </ProtectedRoute>
                    } 
                />

                {/* 새 게시글 작성 페이지 */}
                <Route
                    path="/create-post"
                    element={
                        <ProtectedRoute>
                            <CreatePostPage/>
                        </ProtectedRoute>
                    } 
                />

                {/* 게시글 상세 페이지 */}
                <Route
                    path="/community/:postId"
                    element={
                        <ProtectedRoute>
                            <PostDetailPage/>
                        </ProtectedRoute>
                    } 
                />

            </Routes>
        </Router>
    );
}

export default App;