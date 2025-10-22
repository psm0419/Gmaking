import React from 'react';

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 px-6 py-10">
            <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
                <h1 className="text-3xl font-bold mb-6 text-yellow-400">이용약관</h1>

                <p className="mb-4 text-gray-300">
                    본 약관은 AI 활용 체험 게임 플랫폼 <span className="text-yellow-400">"겜만중"</span>(이하 “플랫폼”)의 이용 조건과 절차를 규정합니다.
                </p>

                <h2 className="text-xl font-semibold mt-8 mb-3 text-gray-100">제1조 (목적)</h2>
                <p>이 약관은 이용자가 플랫폼 서비스를 이용함에 있어 필요한 사항을 명확히 하는 것을 목적으로 합니다.</p>

                <h2 className="text-xl font-semibold mt-8 mb-3 text-gray-100">제2조 (이용자의 의무)</h2>
                <p>이용자는 법령 및 본 약관을 준수해야 하며, 타인의 권리를 침해하거나 시스템을 손상시키는 행위를 금합니다.</p>

                <p className="mt-10 text-sm text-gray-500 border-t border-gray-700 pt-4">
                    ※ 본 문서는 개발용 예시입니다.
                </p>
            </div>
        </div>
    );
};

export default TermsPage;
