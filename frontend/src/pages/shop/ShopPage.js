import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { Ticket, Egg } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";

/** 공통 카드 — 다크 패널 + 네온 사이언 포커스 */
function ShopCard({ title, children, onClick, className = "", disabled = false }) {
  const handleClick = (e) => {
    if (disabled || typeof onClick !== "function") return;
    onClick(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`group w-full rounded-3xl bg-slate-800/70 p-8 shadow-xl ring-1 ring-slate-700 transition hover:shadow-2xl hover:-translate-y-1
                  focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                  ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
    >
      <h3 className="mb-8 text-center text-2xl font-bold tracking-tight text-slate-100">
        {title}
      </h3>
      {children}
    </button>
  );
}

/** 프로필 바 */
function ProfileBar({
  name = "마스터 님",
  incubatorCount = 0,
  imageUrl,
  isLoggedIn = false,
}) {
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="me"
            className="h-20 w-20 rounded-full object-cover border border-slate-700"
            onError={(e) => { e.currentTarget.src = "/images/profile/default.png"; }}
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xl">
            ME
          </div>
        )}
        <div className="text-lg sm:text-xl text-slate-300">
          쇼핑을 계속하려면{" "}
          <a href="/login" className="font-semibold text-cyan-400 underline hover:text-cyan-300">
            로그인
          </a>
          {" "}해주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 px-4 sm:px-6 lg:px-0">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="me"
          className="h-20 w-20 rounded-full object-cover border border-slate-700"
          onError={(e) => { e.currentTarget.src = "/images/profile/default.png"; }}
        />
      ) : (
        <div className="h-20 w-20 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xl">
          ME
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
        <div className="text-3xl font-extrabold text-slate-100">{name}</div>
        <div className="text-xl sm:text-2xl font-medium text-slate-300 flex items-center">
          보유 부화기:{" "}
          <span className="tabular-nums ml-2 text-slate-100 text-3xl font-bold">
            {incubatorCount}
          </span>
          <Egg className="ml-2 h-6 w-6 text-amber-400 fill-amber-400" />
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const {
    token: authToken,
    updateIncubatorCount,
    updateAdFree,
    applyNewToken,
  } = useAuth();

   useEffect(() => {
      document.documentElement.classList.add("no-scrollbar");
      document.body.classList.add("no-scrollbar");
      return () => {
        document.documentElement.classList.remove("no-scrollbar");
        document.body.classList.remove("no-scrollbar");
      };
    }, []);

  useEffect(() => {
    if (!authToken) {
      console.log("[JWT] no token in context");
      return;
    }
    try {
      const payload = jwtDecode(authToken);
      console.log("[JWT payload]", payload);
      console.log(
        "[JWT] incubatorCount:",
        payload.incubatorCount,
        "isAdFree:",
        payload.isAdFree
      );
    } catch (e) {
      console.error("[JWT] decode failed:", e);
    }
  }, [authToken]);

  const [profile, setProfile] = useState({
    name: "마스터 님",
    incubatorCount: 0,
    profileImageUrl: null,
  });
  const [loadingSku, setLoadingSku] = useState(null);

  const refreshProfileAndSync = async () => {
    if (!authToken) return;
    const auth = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`;
    const r = await fetch(`/api/shop/profile/me`, {
      headers: { Authorization: auth, Accept: "application/json" },
      credentials: "include",
    });
    if (!r.ok) return;
    const p = await r.json();
    if (!p) return;

    setProfile({
      name: p.nickName ?? "마스터 님",
      incubatorCount: Number(p.incubatorCount ?? 0),
      profileImageUrl: p.profileImageUrl ?? null,
    });

    if (p.incubatorCount != null) {
      updateIncubatorCount?.({ set: Number(p.incubatorCount) });
    }
    if (typeof p.isAdFree !== "undefined") {
      updateAdFree?.({ enabled: p.isAdFree, expiresAt: p.adFreeExpiry });
    }
  };

  useEffect(() => {
    refreshProfileAndSync().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  async function requestPaymentFlow({ authToken, productId, quantity = 1 }) {
    if (!authToken) {
      window.location.href = "/login";
      return null;
    }
    if (!window.IMP) throw new Error("결제 모듈 로드 실패(IMP).");
    const auth = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`;

    const prepRes = await fetch(`/api/payments/prepare`, {
      method: "POST",
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
      body: new URLSearchParams({
        productId: String(productId),
        quantity: String(quantity),
      }),
      credentials: "include",
    });
    if (prepRes.status === 401) {
      localStorage.removeItem("gmaking_token");
      window.location.href = "/login";
      return null;
    }
    if (!prepRes.ok) {
      throw new Error(`prepare 실패: ${prepRes.status}`);
    }
    const prep = await prepRes.json();

    const { IMP } = window;
    const impCode =
      process.env.REACT_APP_IMP_CODE ||
      process.env.NEXT_PUBLIC_IMP_CODE || "";
    if (!impCode) {
      alert("가맹점 식별코드(imp_**)가 없습니다. .env 설정 후 개발서버를 재시작하세요.");
      return null;
    }
    IMP.init(impCode);

    const rsp = await new Promise((resolve) => {
      IMP.request_pay(
        {
          pg: "html5_inicis",
          pay_method: "card",
          merchant_uid: prep.merchantUid,
          name: prep.productName,
          amount: prep.amount,
        },
        (response) => resolve(response)
      );
    });

    if (!rsp?.success) {
      const msg = rsp?.error_msg || "결제 실패";
      throw new Error(msg);
    }

    const confRes = await fetch(`/api/payments/confirm`, {
      method: "POST",
      headers: {
        Authorization: auth,
        Accept: "application/json",
      },
      body: new URLSearchParams({
        impUid: rsp.imp_uid,
        merchantUid: rsp.merchant_uid,
      }),
      credentials: "include",
    });
    if (!confRes.ok) {
      throw new Error(`confirm 실패: ${confRes.status}`);
    }
    const conf = await confRes.json();

    const headerToken =
      confRes.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ||
      confRes.headers.get("X-New-Token") ||
      null;
    if (headerToken) applyNewToken?.(headerToken);

    return conf;
  }

  const handleBuy = async (productId, label) => {
    try {
      setLoadingSku(productId);
      const conf = await requestPaymentFlow({ authToken, productId, quantity: 1 });
      if (!conf) return;

      if (conf?.result === "OK" || conf?.result === "ALREADY_APPLIED") {
        await refreshProfileAndSync();
        alert(`${label} 결제가 완료되었습니다.`);
      } else {
        alert(`검증 결과가 올바르지 않습니다. (result=${conf?.result ?? "?"})`);
      }
    } catch (e) {
      console.error(e);
      alert(e.message || "결제 중 오류가 발생했습니다.");
    } finally {
      setLoadingSku(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <Header />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 상단 프로필 */}
        <ProfileBar
          name={profile.name}
          incubatorCount={profile.incubatorCount}
          imageUrl={profile.profileImageUrl}
          isLoggedIn={!!authToken}
        />

        {/* 상품 카드 그리드 */}
        <section className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. 광고 제거 패스 — 네온 그라디언트 */}
          <ShopCard
            title="광고 제거 패스 (30일)"
            onClick={() => handleBuy(1, "광고 패스권(30일)")}
            disabled={loadingSku === 1}
            className={`border-t-4 border-cyan-500 ${loadingSku === 1 ? "opacity-60" : ""}`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-8 rounded-3xl p-6 shadow-lg transition group-hover:scale-105
                              bg-gradient-to-br from-fuchsia-500 via-cyan-500 to-sky-400 text-white">
                <Ticket className="h-14 w-14" />
              </div>
              <div className="mt-auto text-center w-full">
                <p className="text-xl text-slate-300 mb-2">30일간 광고 없이 이용</p>
                <div className="text-4xl font-extrabold tabular-nums text-cyan-300 drop-shadow">
                  4,900 원
                </div>
                <div className="text-sm mt-1 text-slate-400">월 자동 결제 가능</div>
              </div>
            </div>
          </ShopCard>

          {/* 2. 부화기 5개 — 앰버 포인트 */}
          <ShopCard
            title="부화기 패키지 (5개)"
            onClick={() => handleBuy(2, "부화기 패키지 (5개)")}
            disabled={loadingSku === 2}
            className={loadingSku === 2 ? "opacity-60" : ""}
          >
            <div className="flex flex-col items-center">
              <div className="mb-8 rounded-3xl bg-amber-500/15 p-6 text-amber-300 shadow-md transition group-hover:scale-105">
                <div className="relative h-14 w-14">
                  <Egg className="absolute left-0 top-0 h-full w-full fill-amber-300 stroke-amber-400" />
                </div>
              </div>
              <div className="mt-auto text-center w-full">
                <p className="text-xl text-slate-300 mb-2">기본 부화기 5개</p>
                <div className="text-4xl font-extrabold tabular-nums text-slate-100">
                  6,000 원
                </div>
                <div className="text-sm mt-1 text-slate-400">개당 1,200원</div>
              </div>
            </div>
          </ShopCard>

          {/* 3. 부화기 15개 — 베스트 리본 사이언 */}
          <ShopCard
            title="부화기 대용량 (15개)"
            onClick={() => handleBuy(3, "부화기 대용량 (15개)")}
            disabled={loadingSku === 3}
            className={`relative overflow-hidden border-t-4 border-sky-500 ${loadingSku === 3 ? "opacity-60" : ""}`}
          >
            <div className="absolute top-0 right-0 bg-cyan-500 text-slate-900 text-xs font-extrabold px-4 py-1 transform rotate-45 translate-x-7 -translate-y-4 shadow-md">
              BEST
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-8 rounded-3xl bg-sky-500/15 p-6 text-sky-300 shadow-md transition group-hover:scale-105">
                <div className="relative h-14 w-14">
                  <Egg className="absolute -left-2 top-0 h-10 w-10 fill-sky-300 stroke-sky-400" />
                  <Egg className="absolute right-0 bottom-0 h-12 w-12 fill-cyan-300 stroke-cyan-500" />
                </div>
              </div>
              <div className="mt-auto text-center w-full">
                <p className="text-xl text-slate-300 mb-2">추가 5% 할인 효과</p>
                <div className="text-4xl font-extrabold tabular-nums text-cyan-300">
                  16,000 원
                </div>
                <div className="text-sm mt-1 text-slate-500 line-through">원가 18,000원</div>
              </div>
            </div>
          </ShopCard>
        </section>

        {/* 안내 섹션 */}
        <div className="my-16 border-t-2 border-slate-700/70"></div>
        <section className="px-4 lg:px-0">
          <h2 className="text-3xl font-bold text-slate-100 mb-8">구매 전 꼭 확인하세요</h2>

          <div className="grid md:grid-cols-2 gap-8 p-6 bg-slate-800/70 rounded-xl shadow-sm ring-1 ring-slate-700">
            {/* 좌측: 결제 및 환불 안내 */}
            <div>
              <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
                💳 결제 및 환불 안내
              </h3>
              <ul className="space-y-3 text-slate-300 text-base">
                <li className="flex items-start">
                  <span className="mr-2 text-cyan-400 font-bold">•</span>
                  <p className="flex-1 break-keep leading-relaxed">
                    모든 상품은 <strong className="font-semibold text-slate-200">부가세(VAT)</strong>가 포함된 금액입니다.
                  </p>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-cyan-400 font-bold">•</span>
                  <p className="flex-1 break-keep leading-relaxed">
                    상품 구매 후 <strong className="font-semibold text-slate-200">7일 이내 사용하지 않은 상품</strong>에 한해 환불이 가능합니다.
                    <span className="text-slate-500"> (단, 기간제 상품은 제외)</span>
                  </p>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-cyan-400 font-bold">•</span>
                  <p className="flex-1 break-keep leading-relaxed">
                    자세한 환불 정책은 하단의 <strong className="font-semibold text-slate-200">[이용약관]</strong>을 확인해 주세요.
                  </p>
                </li>
              </ul>
            </div>

            {/* 우측: 사용 유의사항 */}
            <div>
              <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center">
                상품 사용 유의사항
              </h3>
              <ul className="space-y-3 text-slate-300 text-base">
                <li className="flex items-start">
                  <span className="mr-2 text-sky-400 font-bold">•</span>
                  <p className="flex-1 break-keep leading-relaxed">
                    <strong className="font-semibold text-slate-200">부화기</strong>는 구매 즉시 계정에 지급되며, 미사용 시 유효기간이 없습니다.
                  </p>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-sky-400 font-bold">•</span>
                  <p className="flex-1 break-keep leading-relaxed">
                    <strong className="font-semibold text-slate-200">광고 제거 패스</strong>는 구매일로부터{" "}
                    <strong className="font-semibold text-slate-200">30일</strong>간 적용되며,
                    만료일 이후 광고가 다시 노출됩니다.
                  </p>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-sky-400 font-bold">•</span>
                  <p className="flex-1 break-keep leading-relaxed">
                    지급이 지연될 경우, <strong className="font-semibold text-slate-200">고객 지원</strong>을 통해 문의해 주세요.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
