import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const GuideSection = ({ title, children }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 mb-4 overflow-hidden shadow-md">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center p-4 text-left text-gray-200 hover:bg-gray-700 transition"
            >
                <span className="font-semibold">{title}</span>
                {open ? <ChevronUp className="w-5 h-5 text-yellow-400" /> : <ChevronDown className="w-5 h-5 text-yellow-400" />}
            </button>

            {open && (
                <div className="px-6 pb-4 pt-4 text-sm text-gray-300 leading-relaxed border-t border-gray-700">
                    {children}
                </div>
            )}
        </div>
    );
};

const GuidePage = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 px-6 py-10">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-yellow-400 mb-8">이용 가이드</h1>

                <GuideSection title="1. 플랫폼 소개">
                    겜만중은 AI와 함께 게임을 즐길 수 있는 체험형 플랫폼입니다.<br />
                    캐릭터를 생성하고, AI와 대화하거나 전투를 진행할 수 있으며, PVE/PVP/토론 배틀 등 다양한 모드를 제공합니다.
                </GuideSection>

                <GuideSection title="2. 회원가입 및 로그인">
                    이메일 또는 소셜 계정으로 간단히 가입할 수 있습니다.<br />
                    로그인 시 생성한 캐릭터, 전투 기록, AI 대화 로그가 자동 저장됩니다.
                </GuideSection>

                <GuideSection title="3. 캐릭터 생성">
                    이미지 분류 모델을 이용하여 동물이름을 추출하고 캐릭터 이름, 유저 요구사항을 반영하여 나만의 캐릭터를 만듭니다.<br />
                    생성된 캐릭터는 전투나 토론에서 AI의 반응 스타일에 직접 반영됩니다.
                </GuideSection>

                <GuideSection title="4. 주요 콘텐츠">
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li><span className="text-yellow-400">PVE</span> : AI 몬스터와 싸우는 모드. 전투 결과는 로그로 저장됩니다.</li>
                        <li><span className="text-yellow-400">PVP</span> : 유저 간 대전. 전투 후 상대방에게 알림 기능.</li>
                        <li><span className="text-yellow-400">토론 배틀</span> : 두 캐릭터를 선택 후 주제 입력 → AI가 토론하고 AI 심판이 승패 결정.</li>
                        <li><span className="text-yellow-400">미니게임</span> : 간단한 카드 뒤집기, 기억력 테스트 등으로 캐릭터 스탯 성장 가능</li>
                    </ul>
                </GuideSection>

                <GuideSection title="5. AI 대화 기능">
                    생성한 캐릭터와 직접 대화할 수 있으며, 캐릭터의 성격에 따라 말투와 태도가 달라집니다.<br />
                    (예: 장난스러운 캐릭터는 유머러스하게, 진중한 캐릭터는 논리적으로 반응)
                </GuideSection>

                <GuideSection title="6. 랭킹 및 로그 조회">
                    각 전투의 결과, 승률, 캐릭터 스탯이 랭킹에 반영됩니다.<br />
                    전투 로그 페이지에서 모든 기록을 날짜순으로 확인할 수 있습니다.
                </GuideSection>

                <GuideSection title="7. 고객 지원">
                    문제가 발생하거나 건의사항이 있으면 다음으로 문의해주세요.<br />
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>이메일 : <span className="text-yellow-400">support@gmaking.com</span></li>
                        <li>Discord : <span className="text-yellow-400">https://discord.gg/xR6mhfz6</span></li>
                        <li>GitHub : <span className="text-yellow-400">https://github.com/psm0419/Gmaking</span></li>
                    </ul>
                </GuideSection>

                <GuideSection title="8. 주의사항">
                    AI 응답은 모델의 추론 결과로 실제 인격이 아닙니다.<br />
                    욕설, 스팸, 악용 시 이용이 제한될 수 있으며, 개발 환경에서는 일부 기능이 비활성화될 수 있습니다.
                </GuideSection>

                <p className="mt-8 text-gray-500 text-sm text-center border-t border-gray-700 pt-4">
                    © 2025 겜만중 (Gmaking). All Rights Reserved.
                </p>
            </div>
        </div>
    );
};

export default GuidePage;
