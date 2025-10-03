import React from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import CharacterCreationPage from './components/CharacterCreationPage';
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


// CharacterCreationRoute: 캐릭터가 이미 있다면 생성 페이지 접근을 막음
const CharacterCreationRoute = ({ children }) => {
    const { isLoggedIn, hasCharacter } = useAuth();
    
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }
    
    // 이미 캐릭터가 있다면 메인 페이지로 이동 (생성 페이지를 볼 필요 없음)
    if (hasCharacter) {
        return <Navigate to="/" replace />;
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
                {/* 로그인 페이지: 로그인 상태면 메인으로 리다이렉트 */}
                <Route 
                    path="/login" 
                    element={<LoginPage />} 
                />
                
                {/* 캐릭터 생성 페이지: 로그인 필수, 캐릭터 있으면 메인으로 리다이렉트 */}
                <Route 
                    path="/create-character" 
                    element={
                        <CharacterCreationRoute>
                            <CharacterCreationPage />
                        </CharacterCreationRoute>
                    } 
                />
                
                {/* 메인 페이지 (보호된 경로): 로그인만 필수. 캐릭터 유무와 관계없이 HomePage 표시 */}
                <Route 
                    path="/" 
                    element={
                        <ProtectedRoute>
                            <HomePage />
                        </ProtectedRoute>
                    } 
                />

                {/* 그 외 모든 경로를 메인으로 이동 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;