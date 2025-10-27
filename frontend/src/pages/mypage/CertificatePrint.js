import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function CertificatePrint({ open, data, onClose, onFinish, autoPrint = true }) {
  const shouldRender = !!open && !!data;


  const runIdRef = useRef(0);
  const printedRunIdRef = useRef(-1);
  const closedRunIdRef  = useRef(-1);

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      runIdRef.current += 1;
    }
    prevOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!shouldRender) return;

    const thisRun = runIdRef.current;

    const done = (reason = 'afterprint') => {
      if (closedRunIdRef.current === thisRun) return;
      closedRunIdRef.current = thisRun;
      setTimeout(() => {
        onFinish?.({ runId: thisRun, reason });
        onClose?.();
      }, 0);
    };

    const handleAfterPrint = () => done();

    const mql = window.matchMedia?.("print");
    const handleChange = (e) => { if (!e.matches) done('mql-exit'); };

    window.addEventListener("afterprint", handleAfterPrint);
    if (mql?.addEventListener) mql.addEventListener("change", handleChange);
    else if (mql?.addListener) mql.addListener(handleChange);

    // 추가: 이미지 프리로드 후 프린트
    const urls = [data?.characterImageUrl, data?.qrUrl].filter(Boolean);
    const preload = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });

    const startPrint = async () => {
      // 1) 프리로드(최대 2~3장)
      try {
        await Promise.race([
          Promise.all(urls.map(preload)),
          new Promise((r) => setTimeout(r, 1500)), // 1.5s 타임아웃
        ]);
      } catch {}

      // 2) 프린트
      if (autoPrint && printedRunIdRef.current !== thisRun) {
        printedRunIdRef.current = thisRun;
        requestAnimationFrame(() => setTimeout(() => window.print(), 0));
      }
    };

    startPrint();

    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      if (mql?.removeEventListener) mql.removeEventListener("change", handleChange);
      else if (mql?.removeListener) mql.removeListener(handleChange);
    };
  }, [shouldRender, autoPrint, onClose]);

  if (!shouldRender) return null;

  const fmt = (v, fb = "-") => (v === null || v === undefined || v === "" ? fb : v);
  const issuedLocal = new Date(data.issuedAt || Date.now()).toLocaleString();

  const C = {
    ink: "#0f172a",
    text: "#111827",
    sub: "#6b7280",
    line: "#e5e7eb",
    soft: "#f3f4f6",
    chip: "#1f2937",
    brand: "#0ea5e9",
    brandDark: "#0284c7",
    accent: "#f59e0b",
    bgBadge: "#fff7ed",
  };

  return createPortal(
    <>
      <style>{`
        @media print {
          body > *:not(#cert-print-root) { display: none !important; }
          #cert-print-root { display: block !important; position: fixed; inset: 0; z-index: 2147483647; background: white !important; }
          @page { size: A4; margin: 14mm; }
          html, body { background: white !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          a[href]:after { content: ""; }
        }
      `}</style>

      <div id="cert-print-root">
        <div
          style={{
            maxWidth: 980,
            margin: "0 auto",
            padding: 32,
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial",
            color: C.text,
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: 16,
              borderBottom: `2px solid ${C.line}`,
              paddingBottom: 14,
            }}
          >
            {/* 로고 */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 14,
                border: `1px solid ${C.line}`,
                display: "grid",
                placeItems: "center",
              }}
            >
              <span style={{ fontWeight: 900, letterSpacing: 1, color: C.ink }}>GMJ</span>
            </div>

            {/* 타이틀 & 발급일/시리얼 */}
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.ink }}>캐릭터 인증서</div>
                {data.gradeLabel && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: C.bgBadge,
                      border: `1px solid ${C.accent}40`,
                      color: C.accent,
                    }}
                  >
                    등급 {data.gradeLabel}
                  </span>
                )}
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: C.sub, display: "flex", gap: 10 }}>
                <span>Issued: {issuedLocal}</span>
                {data.serial && <span>• Serial: {data.serial}</span>}
              </div>
            </div>

            {/* 유저 닉네임 */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: C.sub }}>유저 닉네임</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>
                {fmt(data.userNickname, "마스터 님")}
              </div>
            </div>
          </div>

          {/* 본문 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "330px 1fr",
              gap: 24,
              marginTop: 24,
            }}
          >
            {/* 좌측 카드 */}
            <div
              style={{
                border: `1px solid ${C.line}`,
                borderRadius: 18,
                padding: 16,
              }}
            >
              {/* 캐릭터 이미지 */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 14,
                  border: `1px solid ${C.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  background: C.soft,
                }}
              >
                {data.characterImageUrl ? (
                  <img
                    src={data.characterImageUrl}
                    alt={fmt(data.characterName, "character")}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>NO IMAGE</div>
                )}
              </div>

              {/* 기본 정보 */}
              <InfoRow label="캐릭터 이름" value={fmt(data.characterName)} C={C} mt={16} big />
              <InfoRow
                label="등급"
                value={`${fmt(data.gradeLabel, "-")}`}
                C={C}
                mt={10}
              />
              <InfoRow
                label="성장 단계"
                value={fmt(data.evolutionStep)}
                C={C}
                mt={10}
              />
              <InfoRow
                label="총 PVE/PVP 횟수"
                value={`PVE: ${fmt(data.pveCount, 0)} / PVP: ${fmt(data.pvpCount, 0)}`}
                C={C}
                mt={10}
              />
              <InfoRow
                label="스테이지 누적 클리어"
                value={`${fmt(data.totalStageClears, 0)} 회`}
                C={C}
                mt={10}
              />

              {/* 배지(선택) */}
              {Array.isArray(data.badges) && data.badges.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>획득 배지</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {data.badges.map((b, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 11,
                          padding: "6px 10px",
                          borderRadius: 999,
                          background: "#f8fafc",
                          border: `1px solid ${C.line}`,
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 우측 카드들 */}
            <div style={{ display: "grid", gap: 16 }}>
              {/* 능력치: 카드 3열 그리드 버전 */}
              <div
                style={{
                  border: `1px solid ${C.line}`,
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <SectionTitle title="능력치 (Stats)" C={C} />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <StatLine label="HP"   value={fmt(data.hp)} />
                  <StatLine label="ATK"  value={fmt(data.attack)} />
                  <StatLine label="DEF"  value={fmt(data.defense)} />
                  <StatLine label="SPD"  value={fmt(data.speed)} />
                  <StatLine
                    label="CRIT"
                    value={
                      typeof data.criticalRate === "number"
                        ? `${data.criticalRate}%`
                        : fmt(data.criticalRate)
                    }
                  />
                </div>
              </div>

              {/* 성격 */}
              <div
                style={{
                  border: `1px solid ${C.line}`,
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <SectionTitle title="성격 (Personality)" C={C} />
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    marginTop: 6,
                    background: "#f8fafc",
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                  }}
                >
                  {fmt(data.personality, "등록된 성격 설명이 없습니다.")}
                </div>
              </div>

              {/* 배경 */}
              <div
                style={{
                  border: `1px solid ${C.line}`,
                  borderRadius: 18,
                  padding: 16,
                }}
              >
                <SectionTitle title="배경 (Background)" C={C} />
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.7,
                    marginTop: 6,
                    whiteSpace: "pre-wrap",
                    background: "#f8fafc",
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                  }}
                >
                  {fmt(data.backgroundInfo, "등록된 배경 설명이 없습니다.")}
                </div>
              </div>
            </div>
          </div>

          {/* 푸터/워터마크/서명/QR */}
          <div
            style={{
              marginTop: 26,
              borderTop: `2px solid ${C.line}`,
              paddingTop: 12,
              display: "grid",
              gridTemplateColumns: "1fr auto auto",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ fontSize: 12, color: C.sub }}>
              본 인증서는 겜만중 시스템에서 발급되었습니다. 위·변조 및 무단 편집을 금합니다.
            </div>

            {/* 서명박스 */}
            <div
              style={{
                border: `1px dashed ${C.line}`,
                borderRadius: 10,
                padding: "8px 12px",
                minWidth: 180,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>발급 담당</div>
              <div style={{ height: 22 }} />
              <div style={{ height: 1, background: C.line, marginTop: 8 }} />
            </div>

            {/* QR (있으면 노출) */}
            {data.qrUrl ? (
              <div
                style={{
                  width: 80,
                  height: 80,
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <img
                  src={data.qrUrl}
                  alt="QR"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : (
              <div />
            )}
          </div>

          {/* 워터마크 라벨 */}
          <div
            style={{
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: C.ink,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            <span>GAMEMANJUNG</span>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                background: C.bgBadge,
                border: `1px solid ${C.accent}40`,
                color: C.accent,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              VERIFIED
            </span>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ---------- Sub Components ---------- */

function SectionTitle({ title, C }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 900, color: C.ink }}>{title}</div>
      <div
        style={{
          height: 6,
          flex: 1,
          marginLeft: 10,
          background:
            "linear-gradient(to right, rgba(2,132,199,0.18), rgba(2,132,199,0))",
          borderRadius: 999,
        }}
      />
    </div>
  );
}

function InfoRow({ label, value, C, mt = 0, big = false }) {
  return (
    <div style={{ marginTop: mt }}>
      <div style={{ fontSize: 12, color: C.sub }}>{label}</div>
      <div style={{ fontSize: big ? 18 : 16, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

/** 카드형 스탯 한 칸 */
function StatLine({ label, value }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800 }}>{value ?? "-"}</div>
    </div>
  );
}
