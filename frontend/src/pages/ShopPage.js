import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Ticket, Egg } from "lucide-react";
import {useAuth} from "../context/AuthContext"

// 공통 카드
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

// 프로필 바
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
  const { updateIncubatorCount, updateAdFree } = useAuth();
  const [profile, setProfile] = useState({
    name: "마스터 님",
    incubatorCount: 0,
    profileImageUrl: null,
  });
  const [loadingSku, setLoadingSku] = useState(null);

  const token = localStorage.getItem("gmaking_token");

  // 프로필 로드
  useEffect(() => {
    if (!token) return;
    const auth = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

    fetch(`/api/shop/profile/me`, {
      headers: { Authorization: auth, Accept: "application/json" },
      credentials: "include",
    })
      .then(async (r) => {
        if (r.status === 401) {
          localStorage.removeItem("gmaking_token");
          window.location.href = "/login";
          return null;
        }
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          throw new Error(`GET /profile/me ${r.status} ${t}`);
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setProfile({
          name: data.nickName ?? "마스터 님",
          incubatorCount: Number(data.incubatorCount ?? 0),
          profileImageUrl: data.profileImageUrl ?? null,
        });
      })
      .catch((e) => {
        console.error("프로필 로드 실패:", e);
      });
  }, [token]);

  // 구매 API
  const purchase = async (productId, quantity = 1) => {
    if (!token) {
      window.location.href = "/login";
      return null;
    }
    const auth = token.startsWith("Bearer ") ? token : `Bearer ${token}`;

    const res = await fetch("/api/shop/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
        Accept: "application/json",
      },
      body: JSON.stringify({ productId, quantity }),
      credentials: "include",
    });

    if (res.status === 401) {
      localStorage.removeItem("gmaking_token");
      window.location.href = "/login";
      return null;
    }
    if (!res.ok) {
      throw new Error(
        `POST /purchase ${res.status} ${await res.text().catch(() => "")}`
      );
    }
    return res.json();
  };

  const addBySku = {
    1: 0,   // 광고 제거
    2: 5,   // 부화기 5개
    3: 15,  // 부화기 15개
  };

  // 구매 버튼 핸들러
  const handleBuy = async (productId, label) => {
    try {
      setLoadingSku(productId);
      const data = await purchase(productId, 1);
      if (!data) return;

      // 화면 상단 프로필 즉시 반영
      setProfile((prev) => {
        const nextCount =
          typeof data.incubatorCount !== 'undefined'
            ? Number(data.incubatorCount)
            : Number(prev.incubatorCount) + (addBySku[productId] ?? 0);

        return {
          ...prev,
          name: data.nickName ?? prev.name,
          incubatorCount: nextCount,
          profileImageUrl: data.profileImageUrl ?? prev.profileImageUrl,
        };
      });

      // 전역(AuthContext) 반영
      if (productId === 1) {
        // 광고 제거 패스
        updateAdFree?.({
          enabled: data?.isAdFree ?? true,
          expiresAt: data?.adFreeExpiry,
        });
      } else if (productId === 2 || productId === 3) {
        // 부화기 증가
        if (typeof data?.incubatorCount !== 'undefined') {
          updateIncubatorCount?.({ set: Number(data.incubatorCount) });
        } else {
          updateIncubatorCount?.({ add: addBySku[productId] });
        }
      }

      alert(`${label} 구매 완료!`);
    } catch (e) {
      console.error('구매 실패:', e);
      alert('구매 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
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
          {/* 1. 광고 제거 패스 (productId=1) */}
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
                <p className="text-xl text-zinc-600 mb-2">
                  30일간 광고 없이 이용
                </p>
                <div className="text-4xl font-extrabold tabular-nums text-violet-600">
                  4,900 원
                </div>
                <div className="text-sm mt-1 text-zinc-400">
                  월 자동 결제 가능
                </div>
              </div>
            </div>
          </ShopCard>

          {/* 2. 부화기 패키지 (5개) productId=2 */}
          <ShopCard
            title="🐣 부화기 패키지 (5개)"
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

          {/* 3. 부화기 대용량 (15개) productId=3 */}
          <ShopCard
            title="💰 부화기 대용량 (15개)"
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
                <div className="text-sm mt-1 text-zinc-400 line-through">
                  원가 18,000원
                </div>
              </div>
            </div>
          </ShopCard>
        </section>

        {/* 안내 섹션 */}
        <div className="my-16 border-t-2 border-zinc-200"></div>

        <section className="px-4 lg:px-0">
          <h2 className="text-3xl font-bold text-zinc-800 mb-8">
            구매 전 꼭 확인하세요
          </h2>
          <div className="grid md:grid-cols-2 gap-8 p-6 bg-white rounded-xl shadow-sm">
            <div>
              <h3 className="text-xl font-semibold text-zinc-700 mb-4 flex items-center">
                💳 결제 및 환불 안내
              </h3>
              <ul className="space-y-3 text-zinc-600 text-base">
                <li className="flex items-start">
                  <span className="mr-2 text-violet-500 font-bold">•</span>
                  모든 상품은 **부가세(VAT)**가 포함된 금액입니다.
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-violet-500 font-bold">•</span>
                  상품 구매 후 **7일 이내 사용하지 않은 상품**에 한해 환불이 가능합니다. (단, 기간제 상품은 제외)
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-violet-500 font-bold">•</span>
                  자세한 환불 정책은 하단의 **[이용약관]**을 확인해 주세요.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-zinc-700 mb-4 flex items-center">
                ✨ 상품 사용 유의사항
              </h3>
              <ul className="space-y-3 text-zinc-600 text-base">
                <li className="flex items-start">
                  <span className="mr-2 text-sky-500 font-bold">•</span>
                  **부화기**는 구매 즉시 계정에 지급되며, 미사용 시 유효기간이 없습니다.
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-sky-500 font-bold">•</span>
                  **광고 제거 패스**는 구매일로부터 **30일**간 적용되며, 만료일 이후 광고가 다시 노출됩니다.
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-sky-500 font-bold">•</span>
                  지급이 지연될 경우, **고객 지원**을 통해 문의해 주세요.
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
