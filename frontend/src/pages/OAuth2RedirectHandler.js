import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react'; 

/**
 * 소셜 로그인 성공/실패 후 백엔드에서 리다이렉트되는 경로를 처리하는 컴포넌트
 * 성공 URL: /oauth/callback?token=...&userId=...&nickname=...&hasCharacter=...
 * 실패 URL: /oauth/callback/failure?error=...
 */
const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { handleOAuth2Login } = useAuth();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        
        // 로그인 성공 처리
        const token = queryParams.get('token');
        const userId = queryParams.get('userId');
        const userNickname = queryParams.get('nickname');
        const role = queryParams.get('role');
        const hasCharacter = queryParams.get('hasCharacter');

        if (token && userId) {
            // 사용자 정보를 객체로 구성
            const userInfo = { userId, userNickname, role, hasCharacter };

            // AuthContext에 토큰 및 사용자 정보 저장
            handleOAuth2Login(token, userInfo);

            // 캐릭터 생성 여부에 따라 페이지 이동
            if (hasCharacter === 'true') {
                navigate('/', { replace: true }); // 캐릭터가 있으면 메인 페이지로
            } else {
                navigate('/create-character', { replace: true }); // 캐릭터가 없으면 생성 페이지로
            }
            return;
        }

        // 로그인 실패 처리
        const error = queryParams.get('error');

        if (error) {
            alert(`소셜 로그인 실패: ${decodeURIComponent(error)}`);
            navigate('/login', { replace: true });
            return;
        }

        // 잘못된 접근
        navigate('/login', { replace: true });

    }, [location, navigate, handleOAuth2Login]);


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-400 mb-4" />
            <p className="text-xl">소셜 로그인 정보를 처리 중입니다...</p>
        </div>
    );
};

export default OAuth2RedirectHandler;