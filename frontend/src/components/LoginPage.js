import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

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
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-extrabold text-white text-center flex items-center justify-center">
                    <LogIn className="w-8 h-8 mr-3 text-yellow-400" />
                    로그인
                </h1>
                <p className="text-gray-400 text-center">JWT 인증을 통한 게임 플랫폼 접속</p>


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
                            placeholder="testuser"
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
                            placeholder="****"
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

                <div className="text-center text-sm text-gray-400 pt-4">
                    <p>테스트 계정: ID: `testuser`, PW: `1111`</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;