import React from "react";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 px-6 py-10">
            <div className="max-w-5xl mx-auto bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
                <h1 className="text-3xl font-bold mb-6 text-yellow-400">플랫폼 개요</h1>

                {/* 개요 */}
                <section className="mb-10">
                    <h2 className="text-2xl font-semibold mb-3 text-gray-100">겜만중(Gmaking)이란?</h2>
                    <p className="leading-relaxed">
                        <span className="text-yellow-400">겜만중</span>은 “게임 만드는 중”의 줄임말로,
                        AI 기술을 직접 체험하고 학습할 수 있는 <span className="text-yellow-400">AI 활용 체험형 게임 플랫폼</span>입니다.<br />
                        사용자는 AI가 생성한 캐릭터와 함께 전투, 토론, 대화 등 다양한 콘텐츠를 즐기며
                        <strong className="text-gray-100">‘AI와의 상호작용 경험’을 게임 형태로 배우고 느낄 수 있습니다.</strong>
                    </p>
                </section>

                {/* 주요 기능 */}
                <section className="mb-10">
                    <h2 className="text-2xl font-semibold mb-3 text-gray-100">주요 기능</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li><span className="text-yellow-400">AI 캐릭터 생성</span> : 이름, 유저 요구사항, 이미지 설정으로 나만의 AI 캐릭터 만들기</li>
                        <li><span className="text-yellow-400">PVE 모드</span> : 플레이어 vs AI 몬스터 전투</li>
                        <li><span className="text-yellow-400">PVP 모드</span> : 유저 간 대결 시스템</li>
                        <li><span className="text-yellow-400">AI 토론 배틀</span> : 캐릭터 성격 기반의 AI 대화 배틀</li>
                        <li><span className="text-yellow-400">AI 대화</span> : 생성된 캐릭터와 직접 채팅 가능</li>
                        <li><span className="text-yellow-400">미니게임</span> : 간단한 퍼즐·기억력 게임 등 성장형 컨텐츠</li>
                        <li><span className="text-yellow-400">커뮤니티</span> : 유저 간 소통 시스템</li>
                    </ul>
                </section>

                {/* 기술 스택 */}
                <section className="mb-10">
                    <h2 className="text-2xl font-semibold mb-3 text-gray-100">기술 스택</h2>
                    <ul className="list-disc list-inside space-y-2">
                        <li><span className="text-yellow-400">Frontend</span> : React, Tailwind CSS, JavaScript, HTML</li>
                        <li><span className="text-yellow-400">Backend</span> : Spring Boot, FastAPI</li>
                        <li><span className="text-yellow-400">Lanuage</span> : Python, Java</li>
                        <li><span className="text-yellow-400">DB</span> : MySQL</li>
                        <li><span className="text-yellow-400">AI API 연동</span> : OpenAI GPT, Google Gemini, O1-mini API</li>
                        <li><span className="text-yellow-400">AI 학습 모델</span> : Deliberate, YOLOv8</li>
                        <li><span className="text-yellow-400">협업 도구</span> : GitHub, Notion, Discord</li>
                    </ul>
                </section>

                {/* 플랫폼 철학 */}
                <section className="mb-10">
                    <h2 className="text-2xl font-semibold mb-3 text-gray-100">플랫폼 철학</h2>
                    <p className="leading-relaxed">
                        겜만중은 단순한 게임이 아니라,
                        <span className="text-yellow-400">“AI를 직접 체험하며 배우는 실험 공간”</span>을 지향합니다.<br />
                        사용자는 AI의 대화 생성, 판단, 감정 표현 등을 게임 속에서 직접 체험하며
                        자연스럽게 AI 기술의 원리를 이해하고 창의적인 아이디어를 실험할 수 있습니다.
                    </p>
                </section>

                {/* 개발자 정보 */}
                <section className="mb-6">
                    <h2 className="text-2xl font-semibold mb-3 text-gray-100">개발 정보</h2>
                    <ul className="list-disc list-inside space-y-1">
                        <li>개발자: 박수민, 박은희, 박현재, 엄정민</li>
                        <li>버전: v1.0.0 (개발용)</li>
                        <li>문의: <span className="text-yellow-400">support@gmaking.com</span></li>
                    </ul>
                </section>

                <p className="mt-8 text-sm text-gray-500 border-t border-gray-700 pt-4 text-center">
                    © 2025 겜만중 (Gmaking). All Rights Reserved.
                </p>
            </div>
        </div>
    );
};

export default AboutPage;
