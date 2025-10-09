import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { findPasswordSendCodeApi, verifyEmailApi } from '../../api/authApi';
import { Mail, Key, ShieldOff } from 'lucide-react';

const WithdrawPage = () => {
    const { user, withdrawUser } = useAuth();
    const navigate = useNavigate();
    
    // 1: 이메일 발송, 2: 코드 확인, 3: 비밀번호 확인/탈퇴)
    const [phase, setPhase] = useState(1); 
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);
    
    const userId = user?.userId;
    const userEmail = user?.userEmail; 

    // 이메일 인증 코드 발송 핸들러
    const handleSendCode = useCallback(async () => {
        if (!userId || !userEmail) {
            alert("사용자 정보(ID 또는 이메일)를 찾을 수 없습니다. 다시 로그인 해주세요.");
            return;
        }

        if (!window.confirm(`회원 탈퇴를 위해 [${userEmail}]로 인증 코드를 발송합니다. 계속하시겠습니까?`)) {
            return;
        }

        setEmailLoading(true);
        try {
            const response = await findPasswordSendCodeApi(userId, userEmail); 
            
            if (response.data?.success) {
                alert('인증 코드가 이메일로 발송되었습니다. 3분 이내에 코드를 입력해주세요.');
                setPhase(2); 
            } else {
                alert(response.data?.message || '인증 코드 발송 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Send Code Error:', error);
            alert(error.response?.data?.message || '인증 코드 발송 중 오류가 발생했습니다.');
        } finally {
            setEmailLoading(false);
        }
    }, [userId, userEmail]);

    // 이메일 인증 코드 확인 핸들러
    const handleVerifyCode = useCallback(async () => {
        if (code.length !== 6) {
            alert('인증 코드는 6자리 숫자입니다.');
            return;
        }

        setEmailLoading(true);
        try {
            const response = await verifyEmailApi(userId, userEmail, code); 
            
            if (response.data?.success) {
                alert('이메일 인증이 완료되었습니다. 최종 비밀번호를 입력해주세요.');
                setIsEmailVerified(true);
                setPhase(3);
            } else {
                alert(response.data?.message || '인증 코드가 일치하지 않거나 만료되었습니다.');
            }
        } catch (error) {
            console.error('Verify Code Error:', error);
            alert(error.response?.data?.message || '인증 코드 확인 중 오류가 발생했습니다.');
        } finally {
            setEmailLoading(false);
        }
    }, [userId, userEmail, code]);

    // 최종 회원 탈퇴 핸들러
    const handleFinalWithdraw = useCallback(async () => {
        if (!isEmailVerified) {
            alert("이메일 인증을 먼저 완료해야 합니다.");
            return;
        }
        if (!password) {
            alert("비밀번호를 입력해주세요.");
            return;
        }
        
        if (!window.confirm("경고: 계정 탈퇴 시 모든 데이터는 영구적으로 삭제되며 복구할 수 없습니다. 계속하시겠습니까?")) {
            return;
        }

        const success = await withdrawUser(userId, password); 

        if (success) {
            navigate('/login'); 
        } else {
        }
    }, [userId, password, isEmailVerified, withdrawUser, navigate]);
    
    const renderContent = useMemo(() => {
        switch (phase) {
            case 1:
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-4 flex items-center text-yellow-400">
                            <Mail className="w-6 h-6 mr-3" /> 1단계: 이메일 인증
                        </h2>
                        <p className="text-gray-400 mb-6">
                            회원 탈퇴 전, 본인 확인을 위해 가입 시 등록한 이메일({userEmail || '정보 없음'})로 인증 코드를 발송합니다.
                        </p>
                        <button 
                            onClick={handleSendCode} 
                            disabled={emailLoading || !userEmail}
                            className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition duration-200 disabled:bg-red-800 disabled:opacity-50"
                        >
                            {emailLoading ? '인증 코드 발송 중...' : '인증 코드 발송'}
                        </button>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-4 flex items-center text-yellow-400">
                            <Key className="w-6 h-6 mr-3" /> 2단계: 인증 코드 확인
                        </h2>
                        <p className="text-gray-400 mb-6">
                            이메일로 발송된 6자리 인증 코드를 입력해주세요.
                        </p>
                        <input
                            type="text"
                            placeholder="인증 코드 6자리"
                            value={code}
                            onChange={(e) => setCode(e.target.value.slice(0, 6))}
                            className="w-full px-4 py-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                            maxLength={6}
                        />
                        <button 
                            onClick={handleVerifyCode} 
                            disabled={emailLoading || code.length !== 6}
                            className="w-full py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition duration-200 disabled:bg-gray-700 disabled:opacity-50"
                        >
                            {emailLoading ? '코드 확인 중...' : '인증 코드 확인'}
                        </button>
                        <button 
                            onClick={handleSendCode} 
                            disabled={emailLoading}
                            className="w-full py-2 mt-3 text-sm text-gray-400 hover:text-white transition"
                        >
                            코드 재발송
                        </button>
                    </>
                );
            case 3:
                return (
                    <>
                        <h2 className="text-2xl font-bold mb-4 flex items-center text-red-400">
                            <ShieldOff className="w-6 h-6 mr-3" /> 3단계: 최종 탈퇴 확인
                        </h2>
                        <p className="text-red-400 mb-6 font-semibold">
                            ⚠️ 최종 탈퇴를 위해 현재 비밀번호를 다시 한번 입력해주세요. 이 작업은 되돌릴 수 없습니다.
                        </p>
                        <input
                            type="password"
                            placeholder="현재 비밀번호 입력"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 mb-6 bg-gray-800 border border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white"
                        />
                        <button 
                            onClick={handleFinalWithdraw}
                            disabled={!password || !isEmailVerified}
                            className="w-full py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 transition duration-200 disabled:bg-gray-700 disabled:opacity-50"
                        >
                            계정 영구 탈퇴
                        </button>
                    </>
                );
            default:
                return null;
        }
    }, [phase, code, password, isEmailVerified, userEmail, emailLoading, handleSendCode, handleVerifyCode, handleFinalWithdraw]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
            <div className="p-8 bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white">계정 탈퇴</h1>
                    <p className="text-gray-500 mt-2">안전한 탈퇴를 위해 3단계 본인 인증을 진행합니다.</p>
                </div>
                {renderContent}
            </div>
        </div>
    );
};

export default WithdrawPage;