import React from "react";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CharacterCreationPage from "./pages/CharacterCreationPage";
import RegisterPage from "./pages/RegisterPage";
import FindIdPage from "./pages/FindIdPage";
import FindPasswordPage from "./pages/FindPasswordPage";
import OAuth2RedirectHandler from "./pages/OAuth2RedirectHandler";
import ChatPage from "./pages/ChatPage";
import MyPage from "./pages/MyPage";
import ShopPage from "./pages/ShopPage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import CharacterCreationPage from './pages/CharacterCreationPage';
import RegisterPage from './pages/RegisterPage';
import FindIdPage from './pages/FindIdPage';
import FindPasswordPage from './pages/FindPasswordPage';
import WithdrawPage from './pages/WithdrawPage';
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


// ProtectedRoute: 로그인 확인
const ProtectedRoute = ({ children }) => {
    const { isLoggedIn } = useAuth();
    
    // 비로그인 상태 -> 로그인 페이지로 이동
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }
    
    // 로그인 상태 -> 요청한 페이지 (HomePage 또는 다른 인증된 페이지) 표시
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
                {/* 로그인 페이지 */}
                <Route 
                    path="/login" 
                    element={<LoginPage />} 
                />

                {/* 회원가입 페이지 */}
                <Route 
                    path="/register" 
                    element={<RegisterPage />} 
                />

                {/* OAuth2 리다이렉션 처리 페이지 및 소셜 로그인 실패 리다이렉션 */}
                <Route 
                    path="/oauth/callback" 
                    element={<OAuth2RedirectHandler />} 
                />

                <Route 
                    path="/oauth/callback/failure" 
                    element={<OAuth2RedirectHandler />} 
                />


                {/* 아이디 찾기 페이지 */}
                <Route
                    path="/find-id"
                    element={<FindIdPage />}
                />

                {/* 비밀번호 찾기 페이지 */}
                <Route
                    path="/find-password"
                    element={<FindPasswordPage />}
                />

                <Route
                    path="/withdraw"
                    element={
                        <ProtectedRoute>
                            <WithdrawPage />
                        </ProtectedRoute>
                    }
                />

                {/* 캐릭터 생성 페이지 */}
                <Route
                    path="/create-character"
                    element={
                        <ProtectedRoute>
                            <CharacterCreationPage />
                        </ProtectedRoute>
                    }
                />

                {/* 메인 페이지 (보호된 경로) */}
                <Route l
                    path="/" 
                    element={
                        <ProtectedRoute>
                            <HomePage />
                        </ProtectedRoute>
                    } 
                />

        {/* chat 페이지 test */}
        <Route path="/chat_test" element={<ChatPage />} />

        {/* 마이 페이지 test */}
        <Route path="/my_page" element={<MyPage />} />

        {/* 상점 페이지 */}
        <Route path="/shop" element={<ShopPage />} />

        {/* 그 외 모든 경로를 메인으로 이동 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;