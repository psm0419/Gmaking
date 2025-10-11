import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loginApi, withdrawUserApi } from '../api/authApi';
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

    const withdrawUser = async (userId, userPassword) => {
        if (!token) {
            console.error("오류: 현재 토큰 상태가 null이므로 회원 탈퇴 요청을 보낼 수 없습니다.");
            return { success: false, message: '인증 정보가 없습니다. 다시 로그인 해주세요.' };
        }

        // 디버깅
        console.log("전송되는 JWT 토큰:", token);

        try {
            const response = await withdrawUserApi(token, userId, userPassword);

            if (response.data.success) {
                alert('성공적으로 계정 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
                logout();
                return true;
            } else {
                alert(response.data?.message || '탈퇴 처리 중 오류가 발생했습니다.');
                return false;
            }
        } catch (error) {
            console.error('Withdraw Error:', error);
            const message = error.response?.data?.message || '계정 탈퇴 중 오류가 발생했습니다.';
            alert(message);
            return false;
        }
    };


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
    }, [setToken, setUser, setIsLoggedIn, setHasCharacter]);

    // 캐릭터 생성 후 상태를 true로 변경하는 함수
    const setCharacterStatus = useCallback((status) => {
        setHasCharacter(status);
        if (user) {
            setUser(prev => ({ ...prev, hasCharacter: status }));
        }
    }, [user, setHasCharacter, setUser]);


    const logout = () => {
        setToken(null);
        setUser(null);
        setIsLoggedIn(false);
        setHasCharacter(false);
        localStorage.removeItem('gmaking_token');
    };


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