import React from 'react';

const LicensePage = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 px-6 py-10">
            <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
                <h1 className="text-3xl font-bold mb-6 text-yellow-400">오픈소스 라이선스</h1>

                <p className="mb-4">
                    본 플랫폼은 다음과 같은 오픈소스 소프트웨어를 사용하며, 각 라이선스 조건을 준수합니다.
                </p>

                <ul className="list-disc list-inside space-y-2">
                    <li><span className="text-gray-100">React</span> – MIT License</li>
                    <li><span className="text-gray-100">Spring Boot</span> – Apache License 2.0</li>
                    <li><span className="text-gray-100">Tailwind CSS</span> – MIT License</li>
                    <li><span className="text-gray-100">Axios</span> – MIT License</li>
                </ul>

                <p className="mt-10 text-sm text-gray-500 border-t border-gray-700 pt-4">
                    ※ 본 문서는 개발용 예시입니다.
                </p>
            </div>
        </div>
    );
};

export default LicensePage;
