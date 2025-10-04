import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginApi, withdrawUserApi } from '../api/authApi';


const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCharacter, setHasCharacter] = useState(false); 


    useEffect(() => {
        // 앱 초기 로딩 시 localStorage에 저장된 토큰 확인
        const storedToken = localStorage.getItem('gmaking_token');
        if (storedToken) {
            setToken(storedToken);
            setIsLoggedIn(true);
            
            const dummyUser = { 
                userId: 'LoadedUser', 
                userName: '로딩된 사용자', 
                role: 'USER', 
                hasCharacter: false // 초기에는 false로 설정
            };
            setUser(dummyUser);
            setHasCharacter(dummyUser.hasCharacter);
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

    const withdrawUser = async (userPassword) => {
        if (!token) {
            alert("로그인 상태가 아닙니다.");
            return false;
        }

        try {
            const response = await withdrawUserApi(userPassword, token);

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

    // 캐릭터 생성 후 상태를 true로 변경하는 함수
    const setCharacterStatus = (status) => {
        setHasCharacter(status);
        if (user) {
            setUser(prev => ({ ...prev, hasCharacter: status }));
        }
    };


    const logout = () => {
        setToken(null);
        setUser(null);
        setIsLoggedIn(false);
        setHasCharacter(false);
        localStorage.removeItem('gmaking_token');
    };


    return (
        <AuthContext.Provider value={{ isLoggedIn, token, user, isLoading, hasCharacter, login, logout, setCharacterStatus, withdrawUser }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => useContext(AuthContext);