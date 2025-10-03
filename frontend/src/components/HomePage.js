import React, { useEffect, useState } from 'react';
import { Home, LogOut, User, Lock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { securedTestApi } from '../api/authApi';

const HomePage = () => {
    const { user, token, logout } = useAuth();
    const [testMessage, setTestMessage] = useState({ status: 'pending', message: 'JWT 인증 테스트 대기 중...' });


    const fetchSecuredData = async () => {
        setTestMessage({ status: 'loading', message: '보호된 API 호출 중...' });
        try {
            if (!token) throw new Error('토큰이 없습니다.');
            const response = await securedTestApi(token);
            setTestMessage({ status: 'success', message: response.data?.message || '보호된 API 호출 성공! JWT가 정상 작동합니다.' });
        } catch (error) {
            console.error('Secured API Call Error:', error);
            const errorMessage = error.response?.data?.message || String(error.message) || '보호된 API 호출 실패: JWT 인증 오류!';
            setTestMessage({ status: 'error', message: errorMessage });
        }
    };


    useEffect(() => {
        if (token) fetchSecuredData();
    }, [token]);


    const statusStyle = {
        pending: 'bg-yellow-800 border-yellow-500 text-yellow-300',
        loading: 'bg-blue-800 border-blue-500 text-blue-300 animate-pulse',
        success: 'bg-green-800 border-green-500 text-green-300',
        error: 'bg-red-800 border-red-500 text-red-300',
    };


    const StatusIcon = testMessage.status === 'success' ? CheckCircle :
        testMessage.status === 'error' ? XCircle :
            Lock;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <header className="flex justify-between items-center pb-6 border-b border-gray-700">
                <h1 className="text-4xl font-bold text-yellow-400 flex items-center">
                    <Home className="w-7 h-7 mr-3" />
                    Gmaking 메인 플랫폼
                </h1>
                <button
                    onClick={logout}
                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-200 flex items-center"
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    로그아웃
                </button>
            </header>


            <div className="mt-8 p-6 bg-gray-800 rounded-xl shadow-lg space-y-8">
                <h2 className="text-2xl font-semibold text-gray-200 flex items-center">
                    <User className="w-6 h-6 mr-2 text-yellow-400" />
                    환영합니다, {user?.userName || '사용자'}님!
                </h2>


                <div className="space-y-3 text-gray-300 border-t border-gray-700 pt-4">
                    <p><strong>사용자 ID:</strong> <span className="text-yellow-400">{user?.userId}</span></p>
                    <p><strong>역할 (Role):</strong> <span className="text-yellow-400">{user?.role}</span></p>
                    <p className="break-words">
                        <strong>발급된 JWT 토큰:</strong>
                        <span className="block mt-1 p-3 text-xs bg-gray-700 rounded-md select-all overflow-hidden text-wrap">
                            {token}
                        </span>
                    </p>
                </div>
                <div className="border border-gray-600 rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-3 text-yellow-400 flex items-center">
                        <Lock className="w-5 h-5 mr-2" />
                        보호된 API 인증 테스트
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                        이 메시지는 JWT 토큰을 사용하여 백엔드(`GET /api/secured/test`)에 성공적으로 접근했을 때만 표시됩니다.
                    </p>


                    <div className={`flex items-center p-3 rounded-lg border-2 ${statusStyle[testMessage.status]}`}>
                        <StatusIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                        <span className="font-medium">{testMessage.message}</span>
                    </div>


                    {testMessage.status !== 'loading' && (
                        <button
                            onClick={fetchSecuredData}
                            className="mt-4 px-4 py-2 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 transition duration-200"
                        >
                            인증 테스트 다시 시도
                        </button>
                    )}
                </div>
            </div>

            <footer className="mt-12 text-center text-gray-500 text-sm">
                <p>AI 활용 체험 게임 플랫폼 - 프론트엔드 구축 시작</p>
            </footer>
        </div>
    );
};


export default HomePage;