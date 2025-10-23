import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { findPasswordSendCodeApi, verifyEmailApi } from '../../api/auth/authApi';
import { Mail, Key, ShieldOff } from 'lucide-react';

const WithdrawPage = () => {
    const { user, withdrawUser } = useAuth();
    const navigate = useNavigate();

    // 1: 이메일 발송, 2: 코드 확인, 3: 비밀번호 확인/탈퇴
    const [phase, setPhase] = useState(1);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);

    const userId = user?.userId;
    const userEmail = user?.userEmail;
    const isSocialUser = useMemo(() => {
        return userId && (userId.startsWith('google_') || userId.startsWith('kakao_') || userId.startsWith('naver_'));
    }, [userId]);


    // 이메일 인증 코드 발송 핸들러
    const handleSendCode = useCallback(async () => {
        if (!userId || !userEmail) {
            alert("사용자 정보(ID 또는 이메일)를 찾을 수 없습니다. 다시 로그인 해주세요.");
            return;
        }

        const confirmMessage = isSocialUser
            ? `소셜 계정 탈퇴를 위해 [${userEmail}]로 인증 코드를 발송합니다. 인증 완료 시 비밀번호 확인 없이 바로 탈퇴됩니다. 계속하시겠습니까?`
            : `일반 계정 탈퇴를 위해 [${userEmail}]로 인증 코드를 발송합니다. 계속하시겠습니까?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setEmailLoading(true);

        try {
            const response = await findPasswordSendCodeApi(userId, userEmail);
            alert(response.data.message || "인증 코드가 발송되었습니다.");
            setPhase(2);
        } catch (error) {
            const errorMessage = error.response?.data?.message || '인증 코드 발송 중 오류가 발생했습니다.';
            alert(`오류: ${errorMessage}`);
        } finally {
            setEmailLoading(false);
        }
    }, [userId, userEmail, isSocialUser]);


    // 이메일 인증 코드 확인 핸들러
    const handleVerifyCode = useCallback(async () => {
        if (!userId || !userEmail || !code) {
            alert("필수 입력값이 누락되었습니다.");
            return;
        }

        try {
            const response = await verifyEmailApi(userId, userEmail, code);

            if (response.data.success) {
                alert("인증에 성공했습니다.");
                setIsEmailVerified(true);

                // 소셜 유저인 경우, 비밀번호 단계(phase 3)를 건너뛰고 바로 최종 탈퇴 함수 호출
                if (isSocialUser) {
                    await handleSocialWithdraw();
                } else {
                    setPhase(3);
                }
            } else {
                alert(`인증 실패: ${response.data.message}`);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || '인증 코드 확인 중 오류가 발생했습니다.';
            alert(`오류: ${errorMessage}`);
        }
    }, [userId, userEmail, code, isSocialUser]);


    // 소셜 유저용 최종 탈퇴 핸들러 (비밀번호 없이 호출)
    const handleSocialWithdraw = useCallback(async () => {
        if (!userId) {
            alert("사용자 정보를 찾을 수 없습니다.");
            return;
        }

        if (window.confirm("인증이 완료되었습니다. 계정을 영구 탈퇴하시겠습니까? (이 작업은 되돌릴 수 없습니다.)")) {
            // AuthContext의 withdrawUser 함수를 호출하되, 비밀번호는 null로 전달
            const success = await withdrawUser(userId, null);
            if (success) {
                navigate('/');
            }
        }
    }, [userId, withdrawUser, navigate]);


    // 최종 회원 탈퇴 핸들러 (일반 유저)
    const handleFinalWithdraw = useCallback(async () => {
        if (!userId || !password) {
            alert("아이디와 비밀번호는 필수 입력값입니다.");
            return;
        }

        if (!isEmailVerified) {
            alert("이메일 인증을 먼저 완료해야 합니다.");
            return;
        }

        if (window.confirm("비밀번호를 확인했습니다. 계정을 영구 탈퇴하시겠습니까? (이 작업은 되돌릴 수 없습니다.)")) {
            // AuthContext의 withdrawUser 함수를 호출하되, 비밀번호를 전달
            const success = await withdrawUser(userId, password);
            if (success) {
                navigate('/');
            }
        }
    }, [userId, userEmail, password, withdrawUser, isSocialUser, handleSocialWithdraw]);


    // ------------------------------------------------------------------------------------ //

    const renderContent = useMemo(() => {
        const emailVerifiedText = isEmailVerified
            ? "인증 완료"
            : emailLoading ? "⏳ 코드 발송 중..." : "인증 코드를 발송해주세요.";

        switch (phase) {
            case 1:
                return (
                    <>
                        <div className="flex items-center p-4 mb-6 bg-gray-800 border border-gray-700 rounded-lg text-white">
                            <Mail className="w-5 h-5 mr-3 text-yellow-400" />
                            <p className="font-medium truncate">{userEmail}</p>
                        </div>
                        <p className="text-sm text-gray-400 mb-6">
                            {isSocialUser
                                ? "소셜 계정은 이메일 인증 완료 후 비밀번호 확인 없이 바로 탈퇴됩니다."
                                : "일반 계정은 이메일 인증 완료 후 비밀번호 확인을 통해 최종 탈퇴됩니다."}
                        </p>
                        <button
                            onClick={handleSendCode}
                            disabled={emailLoading}
                            className="w-full py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 transition duration-200 disabled:bg-gray-700 disabled:opacity-50"
                        >
                            {emailLoading ? '코드 발송 중...' : '탈퇴용 인증 코드 발송'}
                        </button>
                    </>
                );
            case 2:
                return (
                    <>
                        <div className="flex items-center p-4 mb-6 bg-gray-800 border border-gray-700 rounded-lg text-white">
                            <Mail className="w-5 h-5 mr-3 text-yellow-400" />
                            <p className="font-medium truncate">{userEmail} ({emailVerifiedText})</p>
                        </div>
                        <label htmlFor="code" className="block text-sm font-medium text-gray-400 mb-2">
                            이메일 인증 코드 (6자리)
                        </label>
                        <input
                            id="code"
                            type="text"
                            placeholder="이메일로 전송된 코드 입력"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full px-4 py-3 mb-6 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white"
                        />
                        <button
                            onClick={handleVerifyCode}
                            disabled={!code || isEmailVerified}
                            className="w-full py-3 bg-yellow-600 text-gray-900 font-bold rounded-lg hover:bg-yellow-700 transition duration-200 disabled:bg-gray-700 disabled:opacity-50"
                        >
                            {isEmailVerified ? '인증 완료됨' : '인증 코드 확인'}
                        </button>
                        <button
                            onClick={handleSendCode}
                            disabled={emailLoading}
                            className="w-full py-3 mt-4 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition duration-200 disabled:bg-gray-700 disabled:opacity-50"
                        >
                            코드 재발송
                        </button>
                    </>
                );
            case 3:
                if (isSocialUser) {
                    return (
                        <div className="text-center">
                            <ShieldOff className="w-16 h-16 mx-auto mb-4 text-red-500" />
                            <h2 className="text-xl font-bold text-white mb-2">소셜 계정 탈퇴 완료 준비</h2>
                            <p className="text-gray-400 mb-8">
                                이메일 인증이 완료되었습니다. 비밀번호 확인 없이 최종 탈퇴 버튼을 눌러 계정을 영구 삭제할 수 있습니다.
                            </p>
                            <button
                                onClick={handleSocialWithdraw}
                                className="w-full py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-800 transition duration-200"
                            >
                                계정 영구 탈퇴
                            </button>
                            <p className="text-sm text-gray-500 mt-4">이 작업은 되돌릴 수 없습니다.</p>
                        </div>
                    );
                }

                // 일반 유저
                return (
                    <>
                        <div className="flex items-center p-4 mb-6 bg-gray-800 border border-green-500 rounded-lg text-white">
                            <Mail className="w-5 h-5 mr-3 text-green-500" />
                            <p className="font-medium truncate">{userEmail} (인증 완료)</p>
                        </div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                            탈퇴 확인을 위해 비밀번호를 다시 입력해주세요
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="비밀번호 입력"
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
    }, [phase, code, password, isEmailVerified, userEmail, emailLoading, handleSendCode, handleVerifyCode, handleFinalWithdraw, isSocialUser, handleSocialWithdraw]);

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