import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Ticket, Egg } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";

/** 공통 카드 */
function ShopCard({ title, children, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-3xl bg-white p-8 shadow-xl ring-1 ring-zinc-200 transition hover:shadow-2xl hover:-translate-y-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-400 focus-visible:ring-offset-2 ${className}`}
    >
      <h3 className="mb-8 text-center text-2xl font-bold tracking-tight text-zinc-900">
        {title}
      </h3>
      {children}
    </button>
  );
}

/** 프로필 바 */
function ProfileBar({ name = "마스터 님", incubatorCount = 0, imageUrl }) {
  return (
    <div className="flex items-center gap-6 px-4 sm:px-6 lg:px-0">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="me"
          className="h-20 w-20 rounded-full object-cover border border-zinc-200"
          onError={(e) => {
            e.currentTarget.src = "/images/profile/default.png";
          }}
        />
      ) : (
        <div className="h-20 w-20 rounded-full bg-zinc-300 flex items-center justify-center text-zinc-500 font-semibold text-xl">
          ME
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
        <div className="text-3xl font-extrabold text-zinc-900">{name}</div>
        <div className="text-xl sm:text-2xl font-medium text-zinc-600 flex items-center">
          보유 부화기:{" "}
          <span className="tabular-nums ml-2 text-zinc-900 text-3xl font-bold">
            {incubatorCount}
          </span>
          <Egg className="ml-2 h-6 w-6 text-yellow-500 fill-yellow-500" />
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

  // 디버그: 토큰 변경 시 payload 확인
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

  /** 공통: 서버 프로필 재조회 → 로컬/전역 set 동기화 */
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

    // 상단 카드
    setProfile({
      name: p.nickName ?? "마스터 님",
      incubatorCount: Number(p.incubatorCount ?? 0),
      profileImageUrl: p.profileImageUrl ?? null,
    });

    // 전역값 확정
    if (p.incubatorCount != null) {
      updateIncubatorCount?.({ set: Number(p.incubatorCount) });
    }
    if (typeof p.isAdFree !== "undefined") {
      updateAdFree?.({ enabled: p.isAdFree, expiresAt: p.adFreeExpiry });
    }
  };

  // 초기 프로필 로드
  useEffect(() => {
    refreshProfileAndSync().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  /** 아임포트 준비→결제→서버검증 (axios 없이 fetch) */
  async function requestPaymentFlow({ authToken, productId, quantity = 1 }) {
    if (!authToken) {
      window.location.href = "/login";
      return null;
    }
    if (!window.IMP) throw new Error("결제 모듈 로드 실패(IMP).");
    const auth = authToken.startsWith("Bearer ")
      ? authToken
      : `Bearer ${authToken}`;

    // 1) 준비
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
    const prep = await prepRes.json(); // { merchantUid, amount, productName }



    // 2) 아임포트 결제
    const { IMP } = window;

    // imp 코드 환경 변수 가드
    const impCode =
      process.env.REACT_APP_IMP_CODE ||
      process.env.NEXT_PUBLIC_IMP_CODE || "";

    console.log("[IMP code]", impCode);
    if (!impCode) {
      alert("가맹점 식별코드(imp_**)가 없습니다. .env 설정 후 개발서버를 재시작하세요.");
      return null;
    }
    IMP.init(impCode);

    IMP.init(process.env.REACT_APP_IMP_CODE); // imp_xxxxx (테스트 모드 imp 코드)

    const rsp = await new Promise((resolve) => {
      IMP.request_pay(
        {
          pg: "html5_inicis", // 테스트 PG (콘솔 설정과 일치해야 함)
          pay_method: "card",
          merchant_uid: prep.merchantUid,
          name: prep.productName,
          amount: prep.amount, // 서버 금액 그대로
        },
        (response) => resolve(response)
      );
    });

    if (!rsp?.success) {
      const msg = rsp?.error_msg || "결제 실패";
      throw new Error(msg);
    }

    // 3) 서버 검증/지급
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
    const conf = await confRes.json(); // { result: "OK" | "ALREADY_APPLIED" }

    // (선택) 백엔드에서 토큰 재발급을 헤더로 줄 경우 반영
    const headerToken =
      confRes.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ||
      confRes.headers.get("X-New-Token") ||
      null;
    if (headerToken) applyNewToken?.(headerToken);

    return conf;
  }

  /** 구매 버튼 핸들러: 결제 성공 후 프로필 동기화 */
  const handleBuy = async (productId, label) => {
    try {
      setLoadingSku(productId);
      const conf = await requestPaymentFlow({ authToken, productId, quantity: 1 });
      if (!conf) return;

      if (conf?.result === "OK" || conf?.result === "ALREADY_APPLIED") {
        await refreshProfileAndSync(); // 인벤/광고패스 갱신
        alert(`${label} 결제가 완료되었습니다.`);
      } else {
        alert(
          `검증 결과가 올바르지 않습니다. (result=${conf?.result ?? "?"})`
        );
      }
    } catch (e) {
      console.error(e);
      alert(e.message || "결제 중 오류가 발생했습니다.");
    } finally {
      setLoadingSku(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900">
      <Header />

      <main className="flex-1 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* 상단 프로필 */}
        <ProfileBar
          name={profile.name}
          incubatorCount={profile.incubatorCount}
          imageUrl={profile.profileImageUrl}
        />

        {/* 상품 카드 그리드 */}
        <section className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* 1. 광고 제거 패스 */}
          <ShopCard
            title="광고 제거 패스 (30일)"
            onClick={() => handleBuy(1, "광고 패스권(30일)")}
            className={`border-t-4 border-violet-500 ${
              loadingSku === 1 ? "opacity-60 cursor-wait" : ""
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="mb-8 rounded-3xl bg-violet-500 p-6 text-white shadow-lg transition group-hover:scale-105">
                <Ticket className="h-14 w-14" />
              </div>
              <div className="mt-auto text-center w-full">
                <p className="text-xl text-zinc-600 mb-2">30일간 광고 없이 이용</p>
                <div className="text-4xl font-extrabold tabular-nums text-violet-600">
                  4,900 원
                </div>
                <div className="text-sm mt-1 text-zinc-400">월 자동 결제 가능</div>
              </div>
            </div>
          </ShopCard>

          {/* 2. 부화기 5개 */}
          <ShopCard
            title="부화기 패키지 (5개)"
            onClick={() => handleBuy(2, "부화기 패키지 (5개)")}
            className={loadingSku === 2 ? "opacity-60 cursor-wait" : ""}
          >
            <div className="flex flex-col items-center">
              <div className="mb-8 rounded-3xl bg-yellow-100 p-6 text-yellow-600 shadow-md transition group-hover:scale-105">
                <div className="relative h-14 w-14">
                  <Egg className="absolute left-0 top-0 h-full w-full fill-yellow-300 stroke-yellow-600" />
                </div>
              </div>
              <div className="mt-auto text-center w-full">
                <p className="text-xl text-zinc-600 mb-2">기본 부화기 5개</p>
                <div className="text-4xl font-extrabold tabular-nums text-zinc-900">
                  6,000 원
                </div>
                <div className="text-sm mt-1 text-zinc-400">개당 1,200원</div>
              </div>
            </div>
          </ShopCard>

          {/* 3. 부화기 15개 */}
          <ShopCard
            title="부화기 대용량 (15개)"
            onClick={() => handleBuy(3, "부화기 대용량 (15개)")}
            className={`relative overflow-hidden border-t-4 border-sky-500 ${
              loadingSku === 3 ? "opacity-60 cursor-wait" : ""
            }`}
          >
            <div className="absolute top-0 right-0 bg-sky-500 text-white text-xs font-bold px-4 py-1 transform rotate-45 translate-x-7 -translate-y-4 shadow-md">
              BEST
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-8 rounded-3xl bg-sky-100 p-6 text-sky-600 shadow-md transition group-hover:scale-105">
                <div className="relative h-14 w-14">
                  <Egg className="absolute -left-2 top-0 h-10 w-10 fill-sky-300 stroke-sky-600" />
                  <Egg className="absolute right-0 bottom-0 h-12 w-12 fill-sky-400 stroke-sky-700" />
                </div>
              </div>
              <div className="mt-auto text-center w-full">
                <p className="text-xl text-zinc-600 mb-2">추가 5% 할인 효과</p>
                <div className="text-4xl font-extrabold tabular-nums text-sky-600">
                  16,000 원
                </div>
                <div className="text-sm mt-1 text-zinc-400 line-through">원가 18,000원</div>
              </div>
            </div>
          </ShopCard>
        </section>

        {/* 안내 섹션 */}
        <div className="my-16 border-t-2 border-zinc-200"></div>
        <section className="px-4 lg:px-0">
          <h2 className="text-3xl font-bold text-zinc-800 mb-8">구매 전 꼭 확인하세요</h2>
          <div className="grid md:grid-cols-2 gap-8 p-6 bg-white rounded-xl shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-zinc-700 mb-4 flex items-center">
                💳 결제 및 환불 안내
              </h3>
              <ul className="space-y-3 text-zinc-600 text-base">
                <li className="flex items-start">
                  <span className="mr-2 text-violet-500 font-bold">•</span>모든 상품은{" "}
                  <strong>부가세(VAT)</strong>가 포함된 금액입니다.
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-violet-500 font-bold">•</span>상품 구매 후{" "}
                  <strong>7일 이내 사용하지 않은 상품</strong>에 한해 환불이 가능합니다. (단, 기간제 상품은 제외)
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-violet-500 font-bold">•</span>자세한 환불 정책은 하단의{" "}
                  <strong>[이용약관]</strong>을 확인해 주세요.
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-zinc-700 mb-4 flex items-center">
                상품 사용 유의사항
              </h3>
              <ul className="space-y-3 text-zinc-600 text-base">
                <li className="flex items-start">
                  <span className="mr-2 text-sky-500 font-bold">•</span>
                  <strong>부화기</strong>는 구매 즉시 계정에 지급되며, 미사용 시 유효기간이 없습니다.
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-sky-500 font-bold">•</span>
                  <strong>광고 제거 패스</strong>는 구매일로부터 <strong>30일</strong>간 적용되며, 만료일 이후 광고가 다시 노출됩니다.
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-sky-500 font-bold">•</span>지급이 지연될 경우,{" "}
                  <strong>고객 지원</strong>을 통해 문의해 주세요.
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
