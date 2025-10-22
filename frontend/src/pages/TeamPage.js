import React from "react";

const teamMembers = [
    {
        name: "박수민",        
        description:
            "AI 이미지 분류 및 전투 시스템(PVE, PVP, 토론 배틀)을 담당했습니다. ERD 설계와 푸터 컴포넌트까지 구현했습니다.",
        tasks: ["이미지 분류 AI", "ERD 설계", "PVE / PVP / 토론 배틀", "푸터 구성"],
    },
    {
        name: "박은희",        
        description:
            "채팅 AI 기능과 마이페이지, 상점 페이지를 개발했습니다. 전체 기획서와 발표용 PPT도 제작했습니다.",
        tasks: ["채팅 AI", "기획서 및 PPT 제작", "마이페이지", "상점 페이지"],
    },
    {
        name: "박현재",        
        description:
            "이미지 생성 AI와 메인 페이지, 로그인 및 회원가입 흐름을 담당했습니다. 워크플로우 문서도 작성했습니다.",
        tasks: ["이미지 생성 AI", "워크 플로우", "메인 페이지", "로그인 / 회원가입"],
    },
    {
        name: "엄정민",        
        description:
            "이미지 변형 AI를 구현하고, 커뮤니티와 미니게임 페이지를 개발했습니다. 테이블 정의서를 작성했습니다.",
        tasks: ["이미지 변형 AI", "테이블 정의서", "커뮤니티", "미니게임"],
    },
];

const TeamPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 px-6 py-10">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-yellow-400 mb-10 text-center">
                    개발자 소개
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                    {teamMembers.map((member, index) => (
                        <div
                            key={index}
                            className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 hover:border-yellow-400 transition duration-300"
                        >
                            <h2 className="text-2xl font-bold text-gray-100 mb-1">
                                {member.name}
                            </h2>                            

                            <p className="text-gray-300 mb-4 leading-relaxed">
                                {member.description}
                            </p>

                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {member.tasks.map((task, i) => (
                                    <li key={i} className="text-yellow-400">
                                        {task}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <p className="mt-10 text-center text-gray-500 text-sm border-t border-gray-700 pt-4">
                    © 2025 겜만중 (Gmaking) 개발팀. All Rights Reserved.
                </p>
            </div>
        </div>
    );
};

export default TeamPage;
