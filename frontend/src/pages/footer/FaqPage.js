import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FaqItem = ({ question, answer }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 mb-4 overflow-hidden shadow-md">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center p-4 text-left text-gray-200 hover:bg-gray-700 transition"
            >
                <span className="font-semibold">{question}</span>
                {open ? (
                    <ChevronUp className="w-5 h-5 text-yellow-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-yellow-400" />
                )}
            </button>

            {open && (
                <div className="px-6 pb-4 pt-4 text-sm text-gray-300 leading-relaxed border-t border-gray-700">
                    {answer}
                </div>
            )}
        </div>
    );
};

const FaqPage = () => {
    const faqList = [
        {
            question: "겜만중이란 무엇인가요?",
            answer: (
                <>
                    <span className="text-yellow-400 font-semibold">겜만중(Gmaking)</span>은
                    AI 기술을 체험하고 학습할 수 있는 게임형 플랫폼입니다.
                    <br />AI 캐릭터 생성, 전투, 토론, 대화 등 다양한 기능을 제공합니다.
                </>
            ),
        },
        {
            question: "회원가입을 해야 이용할 수 있나요?",
            answer: "네. 캐릭터 저장, 전투 기록, 토론 로그 등은 회원 정보와 연결되어 관리됩니다. 로그인 후 이용 가능합니다.",
        },
        {
            question: "AI 캐릭터는 어떻게 생성되나요?",
            answer: "캐릭터의 이름, 성격, 이미지를 선택하면 AI가 자동으로 캐릭터 이미지를 생성하고, 해당 성격에 맞는 대화 스타일이 적용됩니다.",
        },
        {
            question: "전투(PVE/PVP)는 어떤 방식으로 진행되나요?",
            answer: (
                <>
                    PVE는 AI 몬스터와 싸우는 모드이며, PVP는 다른 유저와의 대결 모드입니다.
                    <br />모든 전투는 턴제 방식으로 진행되며, 명령(공격/방어/회피/필살기)을 선택해 플레이합니다.
                </>
            ),
        },
        {
            question: "AI 토론 배틀은 무엇인가요?",
            answer: (
                <>
                    두 캐릭터를 선택하고 주제를 입력하면 AI가 자동으로 토론을 진행합니다.
                    <br />이후 GPT, Gemini, O1-mini가 토론 로그를 평가해 승패를 판정합니다.
                </>
            ),
        },
        {
            question: "개발 중인 기능이 있나요?",
            answer: "현재 추가 미니게임과 AI 성장 시스템, 캐릭터 교환 기능을 개발 중입니다.",
        },
        {
            question: "문의나 오류 제보는 어디로 하나요?",
            answer: (
                <>
                    이메일 : <span className="text-yellow-400">support@gmaking.com</span>
                    <br />
                    디스코드 : <span className="text-yellow-400">discord.gg/gmaking</span>
                </>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-yellow-400 mb-8">자주 묻는 질문 (FAQ)</h1>

                {faqList.map((faq, index) => (
                    <FaqItem key={index} question={faq.question} answer={faq.answer} />
                ))}

                <p className="mt-10 text-center text-gray-500 text-sm border-t border-gray-700 pt-4">
                    © 2025 겜만중 (Gmaking). All Rights Reserved.
                </p>
            </div>
        </div>
    );
};

export default FaqPage;
