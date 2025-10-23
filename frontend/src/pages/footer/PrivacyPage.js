import React from 'react';

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 px-6 py-10">
            <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
                <h1 className="text-3xl font-bold mb-6 text-yellow-400">개인정보처리방침</h1>

                <p className="mb-4">
                    <span className="text-yellow-400">“겜만중”</span>은 이용자의 개인정보를 중요하게 여기며 관련 법령을 준수합니다.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3 text-gray-100">1. 수집 항목</h2>
                <p>회원가입 시 이메일, 닉네임, 비밀번호 등의 정보를 수집할 수 있습니다.</p>

                <h2 className="text-xl font-semibold mt-8 mb-3 text-gray-100">2. 이용 목적</h2>
                <p>회원관리, 콘텐츠 제공, 서비스 개선 및 고객 문의 응대에 활용됩니다.</p>

                <h2 className="text-xl font-semibold mt-8 mb-3 text-gray-100">3. 보유 기간</h2>
                <p>서비스 이용 종료 시 즉시 파기하며, 법령에 따라 일정 기간 보관할 수 있습니다.</p>

                <p className="mt-10 text-sm text-gray-500 border-t border-gray-700 pt-4">
                    ※ 본 문서는 개발용 예시입니다.
                </p>
            </div>
        </div>
    );
};

export default PrivacyPage;
