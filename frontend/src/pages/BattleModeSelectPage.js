import React from "react";
import { useNavigate } from "react-router-dom";
import { Sword, Footprints, MessageSquare, Gamepad2 } from "lucide-react";

// 재사용 카드 컴포넌트
function ModeCard({ icon: Icon, title, desc, to }) {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => navigate(to)}
            className="group relative flex flex-col items-start rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900 p-6 shadow-lg outline-none ring-0 transition-all hover:-translate-y-0.5 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700/60 backdrop-blur">
                <Icon className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-300/90">{desc}</p>
            <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300 opacity-0 transition-opacity group-hover:opacity-100">
                Enter
            </span>
        </button>
    );
}

export default function BattleModeSelectPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
            <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
                <header className="mb-8 md:mb-12">
                    <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">모드 선택</h1>
                    <p className="mt-2 text-slate-300">원하는 전투 방식을 선택하세요.</p>
                </header>

                <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <ModeCard
                        icon={Sword}
                        title="PvP"
                        desc="플레이어와 대결"
                        to="/pvp/match"
                    />
                    <ModeCard
                        icon={Footprints}
                        title="PvE"
                        desc="몬스터와의 전투"
                        to="/pve/maps"
                    />
                    <ModeCard
                        icon={MessageSquare}
                        title="토론배틀"
                        desc="주제별 설전 및 AI 심판 판정"
                        to="/debate"
                    />
                    <ModeCard
                        icon={Gamepad2}
                        title="미니게임"
                        desc="반응속도 · 기억력 등"
                        to="/minigame"
                    />
                </section>
                
            </div>
        </main>
    );
}
