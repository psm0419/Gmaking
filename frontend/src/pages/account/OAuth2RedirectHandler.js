import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { handleOAuth2Login } = useAuth();

    useEffect(() => {
        let isCancelled = false;

        const processOAuth2Redirect = () => {
            const queryParams = new URLSearchParams(location.search);
            const token = queryParams.get('token');
            const userId = queryParams.get('userId');
            const userNickname = queryParams.get('nickname');
            const role = queryParams.get('role');
            const hasCharacter = queryParams.get('hasCharacter');
            const userEmail = queryParams.get('userEmail');
            const characterImageUrl = queryParams.get('characterImageUrl');
            const incubatorCount = queryParams.get('incubatorCount');
            const isAdFree = queryParams.get('isAdFree');
            const characterCount = queryParams.get('characterCount');
            try {
                if (token && userId) {
                    const userInfo = {
                        userId,
                        userName: userNickname,
                        role,
                        hasCharacter: hasCharacter === 'true' || hasCharacter === true,
                        userEmail,
                        characterImageUrl,
                        incubatorCount,
                        isAdFree,
                        characterCount
                    };

                    if (!isCancelled) {
                        handleOAuth2Login(token, userInfo);
                        navigate('/', { replace: true });
                    }
                    return;
                }

                const error = queryParams.get('error');
                if (error) {
                    alert(`소셜 로그인 실패: ${decodeURIComponent(error)}`);
                    if (!isCancelled) {
                        navigate('/login', { replace: true });
                    }
                    return;
                }

                console.log('잘못된 접근 또는 매개변수 누락. 로그인 페이지로 리다이렉트합니다.');
                if (!isCancelled) {
                    navigate('/login', { replace: true });
                }

            } catch (e) {
                console.error("OAuth2RedirectHandler 처리 중 예기치 않은 DOM 오류 발생:", e);
                if (!isCancelled) {
                    navigate('/login', { replace: true });
                }
            }
        };

        processOAuth2Redirect();

        return () => {
            isCancelled = true;
        };

    }, [location, handleOAuth2Login, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-400 mb-4" />
            <p className="text-xl">소셜 로그인 정보를 처리 중입니다...</p>
        </div>
    );
};

export default OAuth2RedirectHandler;
