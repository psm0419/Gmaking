import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { loginApi, withdrawUserApi, withdrawSocialUserApi } from '../api/authApi';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCharacter, setHasCharacter] = useState(false); 


    const logout = useCallback(() => {
        // localStorage 비우기
        localStorage.removeItem('gmaking_token');        

        // 상태 초기화
        setToken(null);
        setUser(null);
        setIsLoggedIn(false);
        setHasCharacter(false);
    }, []);


    useEffect(() => {
        const storedToken = localStorage.getItem('gmaking_token');

        if (!storedToken) {
            setIsLoading(false);
            return;
        }

        try {
            const userPayload = jwtDecode(storedToken);

            // JWT 만료시간 검증
            const now = Date.now() / 1000;
            if (userPayload.exp && userPayload.exp < now) {
                console.log('🔸 JWT expired — clearing token');
                localStorage.removeItem('gmaking_token');
                setIsLoggedIn(false);
                setToken(null);
                setUser(null);
                setHasCharacter(false);
            } else {
                // 토큰은 유효하지만, 사용자 객체 생성 시 오류 방지
                try {
                    setToken(storedToken);
                    setIsLoggedIn(true);

                    const currentUser = {
                        userId: userPayload.userId,
                        userEmail: userPayload.userEmail,
                        role: userPayload.role,
                        userName: userPayload.userName || userPayload.name,
                        userNickname: userPayload.userNickname || userPayload.nickname,
                        
                        hasCharacter: userPayload.hasCharacter === true || userPayload.hasCharacter === 'true',
                    };
                    
                    // 필수 필드 검증
                    if (!currentUser.userId) {
                        throw new Error("JWT payload is missing a critical userId.");
                    }
                    
                    setUser(currentUser);
                    setHasCharacter(currentUser.hasCharacter);
                    
                } catch (e) {
                    console.error('Failed to construct user from valid token. Resetting state:', e);
                    localStorage.removeItem('gmaking_token');
                    setIsLoggedIn(false);
                    setToken(null);
                    setUser(null);
                    setHasCharacter(false);
                }
            }
        } catch (error) {
            console.error('JWT 디코딩 실패:', error);
            localStorage.removeItem('gmaking_token');
            setIsLoggedIn(false);
            setToken(null);
            setUser(null);
            setHasCharacter(false);
        } finally {
            setIsLoading(false);
        }
    }, [logout]);


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