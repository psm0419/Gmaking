import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginApi } from '../api/authApi';


const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        // 앱 초기 로딩 시 localStorage에 저장된 토큰 확인
        const storedToken = localStorage.getItem('gmaking_token');
        if (storedToken) {
            setToken(storedToken);
            setIsLoggedIn(true);
            setUser({ userId: 'LoadedUser', userName: '로딩된 사용자', role: 'USER' });
        }
        setIsLoading(false);
    }, []);


    const login = async (userId, userPassword) => {
        try {
            const response = await loginApi(userId, userPassword);
            if (response.data && response.data.success) {
                const { token: receivedToken, userInfo } = response.data;
                setToken(receivedToken);
                setUser(userInfo || null);
                setIsLoggedIn(true);
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


    const logout = () => {
        setToken(null);
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('gmaking_token');
    };


    return (
        <AuthContext.Provider value={{ isLoggedIn, token, user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => useContext(AuthContext);


export default AuthContext;