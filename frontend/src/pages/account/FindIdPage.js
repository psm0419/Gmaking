import React, { useState } from 'react';
import { User, Mail, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { findIdSendCodeApi, findIdVerifyCodeApi } from '../../api/auth/authApi';

const FindIdPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        userName: '',
        userEmail: '',
        code: ''
    });

    // 정보 입력 및 코드 발송, 코드 확인 및 ID 표시
    const [step, setStep] = useState(1);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [foundUserId, setFoundUserId] = useState(''); // 찾은 아이디
    const [tempUserId, setTempUserId] = useState(''); // 서버에서 받은 임시 ID

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    // 1단계: 코드 발송 요청
    const handleSendCode = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        const { userName, userEmail } = formData;
        if (!userName || !userEmail) {
            setMessage('이름과 이메일을 모두 입력해주세요.');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await findIdSendCodeApi(userName, userEmail);

            if (response.data.success) {
                setMessage(response.data.message);
                setTempUserId(response.data.userId);
                setStep(2);
            } else {
                setMessage(response.data.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message || '아이디 찾기 요청 중 오류가 발생했습니다.';
            setMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 코드 검증 요청
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        const { userEmail, code } = formData;
        if (!code) {
            setMessage('인증 코드를 입력해주세요.');
            setIsSubmitting(false);
            return;
        }

        try {
            // tempUserId는 인증 코드가 발송된 ID
            const response = await findIdVerifyCodeApi(tempUserId, userEmail, code);

            if (response.data.success) {
                setFoundUserId(response.data.userId); // 마스킹된 최종 아이디
                setMessage(response.data.message);
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

    // 정보 입력 및 코드 발송
    const renderFindIdForm = () => (
        <form onSubmit={handleSendCode} className="space-y-4">
            <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-300">이름</label>
                <input
                    type="text"
                    id="userName"
                    value={formData.userName}
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
                className="w-full py-2.5 mt-4 text-lg font-semibold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-500 transition duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-600 focus:ring-opacity-50 flex items-center justify-center disabled:bg-gray-500"
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
                className="w-full py-2.5 mt-4 text-lg font-semibold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-500 transition duration-200 focus:outline-none focus:ring-4 focus:ring-yellow-600 focus:ring-opacity-50 flex items-center justify-center disabled:bg-gray-500"
            >
                <Search className="w-5 h-5 mr-2" />
                {isSubmitting ? '아이디 찾는 중...' : '아이디 확인'}
            </button>
        </form>
    );

    // 3단계: 결과 표시
    const renderResult = () => (
        <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-green-400">아이디 찾기 완료!</h2>
            <p className="text-lg text-gray-300">
                회원님의 아이디는
            </p>
            <div className="bg-gray-700 p-4 rounded-lg text-3xl font-extrabold text-yellow-400 tracking-widest">
                {foundUserId}
            </div>
            <Link to="/login" className="w-full block py-2.5 mt-6 text-lg font-semibold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-500 transition duration-200">
                로그인 페이지로 이동
            </Link>
        </div>
    );


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-extrabold text-white text-center flex items-center justify-center">
                    <User className="w-8 h-8 mr-3 text-yellow-400" />
                    {step === 1 ? '아이디 찾기' : (step === 2 ? '인증 코드 확인' : '아이디 확인 완료')}
                </h1>

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.includes('오류') || message.includes('일치하지') ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                        {message}
                    </div>
                )}

                {step === 1 && renderFindIdForm()}
                {step === 2 && renderVerifyCodeForm()}
                {step === 3 && renderResult()}

                {/* 하단 링크 */}
                <div className="text-center pt-4 border-t border-gray-700">
                    <Link
                        to="/login"
                        className="text-sm text-gray-400 hover:text-gray-300 flex items-center justify-center w-full"
                    >
                        로그인 페이지로 돌아가기
                    </Link>
                    <Link
                        to="/find-password"
                        className="mt-2 text-sm text-gray-400 hover:text-gray-300 flex items-center justify-center w-full"
                    >
                        비밀번호 찾기
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FindIdPage;