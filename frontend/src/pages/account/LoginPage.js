import React, { useState } from 'react';
import { LogIn, UserPlus, Gamepad2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaComment, FaLeaf } from 'react-icons/fa';

const BACKEND_BASE_URL = 'http://localhost:8080';
const GOOGLE_AUTH_URL = `${BACKEND_BASE_URL}/oauth2/authorization/google`;
const NAVER_AUTH_URL = `${BACKEND_BASE_URL}/oauth2/authorization/naver`;
const KAKAO_AUTH_URL = `${BACKEND_BASE_URL}/oauth2/authorization/kakao`;

const LoginPage = ({ onRegisterClick }) => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [userId, setUserId] = useState('');
    const [userPassword, setUserPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (userId.trim() === '' || userPassword.trim() === '') {
            alert('아이디와 비밀번호를 입력해주세요.');
            return;
        }

        const ok = await login(userId, userPassword);

        if (ok) {
            navigate('/');
            return;
        }

        if (!ok) {
            // 실패시 추가 동작
        }
    };

    // 소셜 로그인 버튼 렌더링 함수 
    const renderSocialLoginButtons = () => (
        <div className="space-y-3 pt-6 border-t border-gray-700">
            <p className="text-center text-gray-400 text-sm">또는 소셜 계정으로 로그인</p>

            {/* Google 로그인 버튼 */}
            <a href={GOOGLE_AUTH_URL} className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-gray-900 bg-white hover:bg-gray-100 transition duration-200 shadow-md">
                <FaGoogle className="w-5 h-5 mr-3 text-red-600" />
                Google로 로그인
            </a>

            {/* Naver 로그인 버튼 */}
            <a href={NAVER_AUTH_URL} className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-500 hover:bg-green-600 transition duration-200 shadow-md">
                <FaLeaf className="w-5 h-5 mr-3" />
                Naver로 로그인
            </a>

            {/* Kakao 로그인 버튼 */}
            <a href={KAKAO_AUTH_URL} className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-[#3c1e1e] bg-[#fee500] hover:bg-[#ffd600] transition duration-200 shadow-md">
                <FaComment className="w-5 h-5 mr-3" />
                Kakao로 로그인
            </a>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/GmakingLogin2.png')" }}
            />

            <div className="absolute inset-0 bg-black/2"></div>

            <div className="relative z-10 w-full max-w-md p-8 space-y-6 bg-gray-800/90 rounded-xl shadow-2xl backdrop-blur-sm">

                <div className="text-center pb-4">
                    <h2 className="text-5xl font-extrabold text-white tracking-wider leading-tight flex items-center justify-center space-x-2">
                        <Gamepad2 className="w-10 h-10 text-yellow-400 transform -rotate-12" />
                        <Link
                            to="/"
                            className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-yellow-700 animate-float"
                            style={{
                                textShadow: '0 4px 6px rgba(0, 0, 0, 0.4)',
                                textDecoration: 'none'
                            }}
                        >
                            겜만중
                        </Link>
                    </h2>
                </div>

                <h1 className="text-3xl font-extrabold text-white text-center flex items-center justify-center">
                    로그인
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="userId">
                            아이디
                        </label>
                        <input 
                            id="userId" 
                            type="text" 
                            value={userId} 
                            onChange={(e) => setUserId(e.target.value)} 
                            placeholder="겜만중 ID" 
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
                            required 
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="userPassword">
                            비밀번호
                        </label>
                        <input
                            id="userPassword"
                            type="password"
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            placeholder="비밀번호"
                            className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2.5 mt-4 text-lg font-semibold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-500 transition duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-600 focus:ring-opacity-50 flex items-center justify-center"
                    >
                        <LogIn className="w-5 h-5 mr-2" />
                        로그인 하기
                    </button>

                    {renderSocialLoginButtons()}
                </form>

                <div className="text-center pt-4">
                    <Link
                        to="/register"
                        className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center justify-center w-full"
                    >
                        <UserPlus className="w-4 h-4 mr-1" />
                        계정이 없으신가요? 지금 회원가입 하세요!
                    </Link>
                </div>

                <div className="text-center text-sm text-gray-400 flex justify-center space-x-4">
                    <Link to="/find-id" className="hover:text-yellow-400 transition">
                        아이디 찾기
                    </Link>
                    <span>|</span>
                    <Link to="/find-password" className="hover:text-yellow-400 transition">
                        비밀번호 찾기
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;