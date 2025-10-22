import React, { useState } from 'react';
import { Lock, Mail, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { findPasswordSendCodeApi, verifyEmailApi, changePasswordApi } from '../../api/auth/authApi';

const FindPasswordPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        userId: '',
        userEmail: '',
        code: '',
        newPassword: '',
        confirmPassword: ''
    });

    // 정보 입력/코드 발송, 코드 확인, 비밀번호 변경
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    // 코드 발송 요청
    const handleSendCode = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        const { userId, userEmail } = formData;
        if (!userId || !userEmail) {
            setMessage('아이디와 이메일을 모두 입력해주세요.');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await findPasswordSendCodeApi(userId, userEmail);

            if (response.data.success) {
                setMessage(response.data.message);
                setStep(2); // 2단계로 이동
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message || '비밀번호 찾기 요청 중 오류가 발생했습니다.';
            setMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 인증 코드 검증 요청 (API: /api/email/verify-code)
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        const { userId, userEmail, code } = formData;

        if (!code) {
            setMessage('인증 코드를 입력해주세요.');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await verifyEmailApi(userId, userEmail, code);

            if (response.data.success) {
                setMessage('이메일 인증이 완료되었습니다. 새 비밀번호를 입력해주세요.');
                setStep(3);
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message || '인증 코드 확인 중 오류가 발생했습니다.';
            setMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 비밀번호 변경 요청
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        const { userId, userEmail, newPassword, confirmPassword } = formData;

        if (newPassword.length < 8) {
            setMessage('비밀번호는 최소 8자 이상이어야 합니다.');
            setIsSubmitting(false);
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await changePasswordApi(userId, userEmail, newPassword, confirmPassword);

            if (response.data.success) {
                setMessage(response.data.message);
                setStep(4);
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message || '비밀번호 변경 중 오류가 발생했습니다.';
            setMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };


    // 정보 입력 및 코드 발송
    const renderFindPasswordForm = () => (
        <form onSubmit={handleSendCode} className="space-y-4">
            <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-300">아이디</label>
                <input
                    type="text"
                    id="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
                    required
                />
            </div>
            <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-300">이메일</label>
                <input
                    type="email"
                    id="userEmail"
                    value={formData.userEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 mt-4 text-lg font-semibold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-500 transition duration-200 flex items-center justify-center disabled:bg-gray-500"
            >
                <Mail className="w-5 h-5 mr-2" />
                {isSubmitting ? '인증 코드 발송 중...' : '인증 코드 받기'}
            </button>
        </form>
    );

    // 인증 코드 입력 및 확인
    const renderVerifyCodeForm = () => (
        <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-sm text-yellow-400">
                {formData.userEmail}로 발송된 6자리 인증 코드를 입력해주세요.
            </div>
            <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-300">인증 코드</label>
                <input
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={handleChange}
                    maxLength="6"
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 mt-4 text-lg font-semibold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-500 transition duration-200 flex items-center justify-center disabled:bg-gray-500"
            >
                <CheckCircle className="w-5 h-5 mr-2" />
                {isSubmitting ? '인증 확인 중...' : '인증 코드 확인'}
            </button>
        </form>
    );

    // 비밀번호 변경
    const renderChangePasswordForm = () => (
        <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">새 비밀번호 (8자 이상)</label>
                <input
                    type="password"
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
                    required
                />
            </div>
            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">새 비밀번호 확인</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 transition duration-150"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 mt-4 text-lg font-semibold text-gray-900 bg-red-500 rounded-lg shadow-md hover:bg-red-600 transition duration-200 flex items-center justify-center disabled:bg-gray-500"
            >
                <Lock className="w-5 h-5 mr-2" />
                {isSubmitting ? '비밀번호 변경 중...' : '비밀번호 변경'}
            </button>
        </form>
    );

    // 완료 표시
    const renderResult = () => (
        <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-green-400">비밀번호 변경 완료!</h2>
            <p className="text-lg text-gray-300">
                새 비밀번호로 다시 로그인해주세요.
            </p>
            <Link to="/login" className="w-full block py-2.5 mt-6 text-lg font-semibold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-500 transition duration-200">
                로그인 페이지로 이동
            </Link>
        </div>
    );


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-extrabold text-white text-center flex items-center justify-center">
                    <Lock className="w-8 h-8 mr-3 text-yellow-400" />
                    {step === 1 ? '비밀번호 찾기' : (step === 2 ? '이메일 인증' : (step === 3 ? '비밀번호 변경' : '변경 완료'))}
                </h1>

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.includes('오류') || message.includes('일치하지') || message.includes('인증을 먼저') ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                        {message}
                    </div>
                )}

                {step === 1 && renderFindPasswordForm()}
                {step === 2 && renderVerifyCodeForm()}
                {step === 3 && renderChangePasswordForm()}
                {step === 4 && renderResult()}

                {/* 하단 링크 */}
                <div className="text-center pt-4 border-t border-gray-700">
                    <Link
                        to="/login"
                        className="text-sm text-gray-400 hover:text-gray-300 flex items-center justify-center w-full"
                    >
                        로그인 페이지로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FindPasswordPage;