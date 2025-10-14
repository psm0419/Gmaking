import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loginApi, withdrawUserApi, withdrawSocialUserApi } from '../api/authApi';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCharacter, setHasCharacter] = useState(false); 


    useEffect(() => {
        const storedToken = localStorage.getItem('gmaking_token');

        if (storedToken) {
            setToken(storedToken);
            setIsLoggedIn(true);

            // JWT에서 사용자 정보 디코딩
            const userPayload = jwtDecode(storedToken); // jwtDecode 필요
            
            const currentUser = {
                userId: userPayload.userId,
                userName: userPayload.nickname || userPayload.userName,
                role: userPayload.role,
                hasCharacter: !!userPayload.hasCharacter
            };

            setUser(currentUser);
            setHasCharacter(currentUser.hasCharacter);
        }

        setIsLoading(false);
    }, []);


    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        setIsLoggedIn(false);
        setHasCharacter(false);
        localStorage.removeItem('gmaking_token');
        localStorage.removeItem('userId');
    }, []);


    // hasCharacter 상태 업데이트 로직 추가
    const login = async (userId, userPassword) => {
        try {
            const response = await loginApi(userId, userPassword);
            if (response.data && response.data.success) {
                const { token: receivedToken, userInfo } = response.data;
                
                const userWithCharStatus = { 
                    ...userInfo, 
                    hasCharacter: userInfo.hasCharacter || false 
                };

                setToken(receivedToken);
                setUser(userWithCharStatus || null);
                setIsLoggedIn(true);
                setHasCharacter(userWithCharStatus.hasCharacter); // 상태 업데이트
                
                localStorage.setItem('gmaking_token', receivedToken);
                localStorage.setItem('userId', userInfo.userId);
                return true;
            } else {
                const msg = response.data?.message || '로그인 실패';
                alert(msg);
                return false;
            }
        } catch (error) {
            console.error('Login Error:', error);
            const message = error.response?.data?.message || '로그인 중 오류가 발생했습니다.';
            alert(message);
            return false;
        }
    };


    const withdrawUser = useCallback(async (userId, userPassword) => { // <<< 로직 수정
        if (!token) {
            alert("인증 토큰이 없습니다. 다시 로그인 해주세요.");
            return false;
        }

        try {
            let response;
            
            // userPassword가 전달된 경우 (일반 유저)
            if (userPassword) {
                console.log(`[Withdraw] 일반 회원 탈퇴 시도: ${userId}`);
                response = await withdrawUserApi(token, userId, userPassword);
            } 
            // userPassword가 없는 경우 (소셜 유저)
            else {
                console.log(`[Withdraw] 소셜 회원 탈퇴 시도: ${userId}`);
                response = await withdrawSocialUserApi(token);
            }

            if (response.data.success) {
                alert(response.data.message);
                logout();
                return true;
            } else {
                alert(`탈퇴 실패: ${response.data.message}`);
                return false;
            }

        } catch (error) {
            console.error("탈퇴 요청 오류:", error);
            const errorMessage = error.response?.data?.message || '계정 탈퇴 처리 중 오류가 발생했습니다.';
            alert(`탈퇴 실패: ${errorMessage}`);
            return false;
        }
    }, [token, logout]);


    // OAuth2 로그인 처리 함수
    const handleOAuth2Login = useCallback((receivedToken, userInfo) => { 
        const isUserWithCharacter = userInfo.hasCharacter === true || userInfo.hasCharacter === 'true';
        const userWithCharStatus = {
            ...userInfo,
            hasCharacter: isUserWithCharacter
        };

        setToken(receivedToken);
        setUser(userWithCharStatus || null);
        setIsLoggedIn(true);
        setHasCharacter(isUserWithCharacter);

        localStorage.setItem('gmaking_token', receivedToken);
        localStorage.setItem('userId', userInfo.userId);
    }, [setToken, setUser, setIsLoggedIn, setHasCharacter, logout]);


    // 캐릭터 생성 후 상태를 true로 변경하는 함수
    const setCharacterStatus = useCallback((status) => {
        setHasCharacter(status);
        if (user) {
            setUser(prev => ({ ...prev, hasCharacter: status }));
        }
    }, [user, setHasCharacter, setUser]);


    return (
        <AuthContext.Provider value={{ 
            isLoggedIn, token, user, isLoading, 
            hasCharacter, login, logout, setCharacterStatus, 
            withdrawUser, handleOAuth2Login  
        }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => useContext(AuthContext);