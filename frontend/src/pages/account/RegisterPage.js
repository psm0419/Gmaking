import React, { useState } from 'react';
import { UserPlus, Mail, ArrowLeft } from 'lucide-react';
import { registerApi, verifyEmailApi } from '../../api/auth/authApi';
import { useNavigate } from 'react-router-dom'

const RegisterPage = () => {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        userId: '',
        userPassword: '',
        confirmPassword: '',
        userName: '',
        userNickname: '',
        userEmail: ''
    });

    // 플로우 상태 (1: 회원가입 폼, 2: 이메일 인증 폼)
    const [step, setStep] = useState(1);
    const [emailCode, setEmailCode] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 입력값 변경 핸들러
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    // 회원가입 요청 처리
    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        // 클라이언트 측 비밀번호 확인
        if (formData.userPassword !== formData.confirmPassword) {
            setMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            setIsSubmitting(false);
            return;
        }

        try {
            // API 호출
            const response = await registerApi(formData);

            // 회원가입 성공 및 이메일 발송 완료
            if (response.data.success) {
                setMessage(response.data.message + " 이메일로 발송된 6자리 인증 코드를 확인해주세요.");
                setStep(2); // 이메일 인증 단계로 전환
            } else {
                setMessage(response.data.message || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            console.error('Registration Error:', error);
            // 백엔드의 IllegalArgumentException (중복 등) 처리
            const errorMessage = error.response?.data?.message || '회원가입 중 예상치 못한 오류가 발생했습니다.';
            setMessage(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 이메일 인증 코드 확인 요청 처리
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        try {
            // API 호출: userId, email, code만 전송
            const response = await verifyEmailApi(formData.userId, formData.userEmail, emailCode);

            // 인증 성공
            if (response.data.success) {
                alert('🎉 이메일 인증 및 회원가입이 최종 완료되었습니다! 로그인 페이지로 이동합니다.');
                navigate('/login');
            }
        } catch (error) {
            console.error('Verification Error:', error);
            // 백엔드의 Bad Request (코드 불일치, 만료 등) 처리
            const errorMessage = error.response?.data?.message || '인증 코드가 일치하지 않거나 만료되었습니다.';
            setMessage(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ----------------------------------------------------
    // UI 렌더링
    // ----------------------------------------------------

    const renderRegisterForm = () => (
        <form onSubmit={handleRegister} className="space-y-4">
            {/* 아이디 */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="userId">아이디</label>
                <input id="userId" type="text" onChange={handleChange} value={formData.userId} required
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                <p className="mt-1 text-xs text-yellow-400">아이디는 4자에서 20자 사이여야 합니다.</p>
            </div>

            {/* 이메일 */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="userEmail">이메일</label>
                <input id="userEmail" type="email" onChange={handleChange} value={formData.userEmail} required
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
            </div>

            {/* 이름, 닉네임, 비밀번호... */}

            {/* 비밀번호 */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="userPassword">비밀번호</label>
                <input id="userPassword" type="password" onChange={handleChange} value={formData.userPassword} required
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                <p className="mt-1 text-xs text-yellow-400">비밀번호는 최소 8자 이상이어야 합니다.</p>
            </div>

            {/* 비밀번호 확인 */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="confirmPassword">비밀번호 확인</label>
                <input id="confirmPassword" type="password" onChange={handleChange} value={formData.confirmPassword} required
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
            </div>

            {/* 이름 */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="userName">이름</label>
                <input id="userName" type="text" onChange={handleChange} value={formData.userName} required
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
            </div>

            {/* 닉네임 */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="userNickname">닉네임</label>
                <input id="userNickname" type="text" onChange={handleChange} value={formData.userNickname} required
                    className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500" />
                <p className="mt-1 text-xs text-yellow-400">닉네임은 2자에서 10자 사이여야 합니다.</p>
            </div>


            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 mt-6 text-lg font-semibold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-500 disabled:bg-gray-500 transition duration-200 flex items-center justify-center"
            >
                <UserPlus className="w-5 h-5 mr-2" />
                {isSubmitting ? '회원가입 처리 중...' : '회원가입 및 이메일 발송'}
            </button>
        </form>
    );

    const renderVerifyForm = () => (
        <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="text-center text-sm text-gray-400">
                <p>{formData.userEmail}로 발송된 6자리 인증 코드를 입력해주세요.</p>
            </div>

            {/* 인증 코드 입력 */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="emailCode">인증 코드</label>
                <div className="flex">
                    <input id="emailCode" type="text" onChange={(e) => setEmailCode(e.target.value)} value={emailCode} required maxLength="6"
                        className="w-full px-4 py-2 text-center text-white bg-gray-700 border border-gray-600 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 tracking-widest text-xl" />
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 mt-6 text-lg font-semibold text-gray-900 bg-yellow-400 rounded-lg shadow-md hover:bg-yellow-500 disabled:bg-gray-500 transition duration-200 flex items-center justify-center"
            >
                <Mail className="w-5 h-5 mr-2" />
                {isSubmitting ? '인증 확인 중...' : '인증 코드 확인'}
            </button>
        </form>
    );


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-extrabold text-white text-center flex items-center justify-center">
                    <UserPlus className="w-8 h-8 mr-3 text-yellow-400" />
                    {step === 1 ? '회원가입' : '이메일 인증'}
                </h1>

                {message && (
                    <div className={`p-3 rounded-lg text-sm ${step === 1 ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'}`}>
                        {message}
                    </div>
                )}

                {step === 1 ? renderRegisterForm() : renderVerifyForm()}

                {/* 하단 로그인 버튼 */}
                <div className="text-center pt-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-sm text-gray-400 hover:text-gray-300 flex items-center justify-center w-full"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        로그인 페이지로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;