import React from "react";
import { useNavigate } from "react-router-dom";
import { Swords, Footprints, MessageSquare, Gamepad2 } from "lucide-react";
import Header from "../../components/Header";

// 재사용 카드 컴포넌트
function ModeCard({ icon: Icon, title, desc, to, accent }) {
    const navigate = useNavigate();

    // Tailwind JIT가 인식하도록 명시적 색상 매핑
    const accentColors = {
        red: {
            text: "text-red-400",
            bg: "bg-red-500/20",
            shadow: "hover:shadow-[0_0_30px_-10px_rgba(239,68,68,0.6)]", // red-500
        },
        emerald: {
            text: "text-emerald-400",
            bg: "bg-emerald-500/20",
            shadow: "hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.6)]", // emerald-500
        },
        violet: {
            text: "text-violet-400",
            bg: "bg-violet-500/20",
            shadow: "hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.6)]", // violet-500
        },
        amber: {
            text: "text-amber-400",
            bg: "bg-amber-500/20",
            shadow: "hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.6)]", // amber-500
        },
    };

    const color = accentColors[accent] || accentColors.violet;

    return (
        <button
            onClick={() => navigate(to)}
            className={`group relative flex flex-col items-start rounded-2xl border border-slate-700/40 bg-gradient-to-b from-slate-800/80 to-slate-950/80 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${color.shadow}`}
        >
            {/* 아이콘 영역 */}
            <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-700/60 to-slate-800/40 ${color.text} transition-transform duration-300 group-hover:scale-110`}
            >
                <Icon className="h-7 w-7 drop-shadow-md" />
            </div>

            {/* 제목 */}
            <h3 className="mt-4 text-xl font-bold text-white tracking-tight">
                {title}
            </h3>

            {/* 설명 */}
            <p className="mt-2 text-sm text-slate-300/90 leading-relaxed">
                {desc}
            </p>

            {/* Hover 시 표시되는 태그 */}
            <span
                className={`pointer-events-none absolute right-4 top-4 rounded-full ${color.bg} px-2 py-0.5 text-xs font-semibold ${color.text} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
            >
                Enter
            </span>

            {/* 빛 반사 효과 */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 bg-gradient-to-t from-transparent via-white/10 to-transparent transition-opacity duration-300" />
        </button>
    );
}

export default function BattleModeSelectPage() {
    return (
        <div>
            <Header />
            <main className="min-h-[calc(100vh-60px)] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-slate-100 flex flex-col">
                <div className="mx-auto max-w-6xl px-4 py-8 w-full">
                    {/* 제목 영역 */}
                    <header className="mb-12 text-center">
                        <h1 className="text-3xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-md">
                            게임 선택
                        </h1>
                        <p className="mt-3 text-slate-400 text-base md:text-lg">
                            원하는 게임을 선택하세요.
                        </p>
                    </header>

                    {/* 카드 영역 */}
                    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <ModeCard
                            icon={Swords}
                            title="PvP"
                            desc="플레이어와의 실시간 전투"
                            to="/pvp/match"
                            accent="red"
                        />
                        <ModeCard
                            icon={Footprints}
                            title="PvE"
                            desc="몬스터를 사냥하고 성장"
                            to="/pve/maps"
                            accent="emerald"
                        />
                        <ModeCard
                            icon={MessageSquare}
                            title="토론배틀"
                            desc={
                                <>
                                    자신의 캐릭터끼리 설전<br />
                                    AI 심사위원이 승패 판정
                                </>
                            }
                            to="/debate"
                            accent="violet"
                        />
                        <ModeCard
                            icon={Gamepad2}
                            title="미니게임"
                            desc="반응속도와 기억력 테스트"
                            to="/minigame"
                            accent="amber"
                        />
                    </section>
                </div>
            </main>
        </div>
    );
}
