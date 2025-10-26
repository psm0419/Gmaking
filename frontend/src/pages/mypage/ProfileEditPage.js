import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import axiosInstance from "../../api/mypage/axiosInstance";
import { useAuth } from '../../context/AuthContext';

// ===== BASE URL & 프로필 전용 폴백/정규화 =====
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8080";
const PROFILE_FALLBACK = `${API_BASE}/images/profile/default.png`;

/** 프로필 이미지 URL 정규화 */
function profileUrl(raw) {
  const emptyLike =
    raw == null ||
    (typeof raw === "string" && raw.trim() === "") ||
    (typeof raw === "string" &&
      ["null", "undefined", "\"\"", "''"].includes(raw.trim().toLowerCase()));
  if (emptyLike) return PROFILE_FALLBACK;

  let url = String(raw).trim();

  if (/^https?:\/\//i.test(url)) return url;

  url = url
    .replace(/^\/?static(?:\/images)?\//i, "/images/")
    .replace(/^\/?profile\//i, "/images/profile/");

  if (!/^\/images\/profile\//i.test(url)) {
    const filename = url.split("/").pop();
    url = `/images/profile/${filename}`;
  }

  if (!url.startsWith("/")) url = "/" + url;
  return `${API_BASE}${url}`;
}

// ===== 단순 토스트 =====
function useToast() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(""), 2400);
    return () => clearTimeout(id);
  }, [msg]);
  const Toast = () =>
    msg ? (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/80 text-yellow-300 text-sm shadow-lg z-50">
        {msg}
      </div>
    ) : null;
  return { setMsg, Toast };
}

/** ===== IME 안전 입력 공통 훅 ===== */
function useImeInputRef(initial = "", { maxLen } = {}) {
  const inputRef = useRef(null);
  const composingRef = useRef(false);

  const onCompositionStart = () => {
    composingRef.current = true;
  };

  const onCompositionEnd = (e) => {
    composingRef.current = false;
    let v = e.target.value || "";
    if (typeof maxLen === "number") {
      v = Array.from(v).slice(0, maxLen).join("");
      if (v !== e.target.value) e.target.value = v;
    }
  };

  const api = {
    get value() {
      return inputRef.current?.value ?? "";
    },
    setValue(v) {
      if (inputRef.current) inputRef.current.value = v ?? "";
    },
    composingRef,
    bind: {
      ref: inputRef,
      onCompositionStart,
      onCompositionEnd,
    },
  };

  return api;
}

// ===== 메인 페이지 =====
export default function SettingPage() {
  const { setMsg, Toast } = useToast();
  const { updateUserNickname } = useAuth();
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");

  // 입력: IME 안전 훅
  const nicknameIme = useImeInputRef("", { maxLen: 10 });
  
  const currentPwIme = useImeInputRef("");
  const newPwIme     = useImeInputRef("");
  const newPw2Ime    = useImeInputRef("");


  // 이미지 업로드
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  // 회원탈퇴
  const [showDelete, setShowDelete] = useState(false);

  // ===== 초기 데이터 로드 =====
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axiosInstance.get("/mypage/profile/me"); // { nickname, profileImageUrl }
        if (!alive) return;
        nicknameIme.setValue(res?.data?.nickname || "");
        setAvatarUrl(profileUrl(res?.data?.profileImageUrl));
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []); // eslint-disable-line

  // ===== Handlers =====
  const handleSaveNickname = async () => {
    const v = nicknameIme.value.trim();
    if (v.length < 2 || v.length > 10) return setMsg("닉네임은 2~10자입니다.");
    try {
      await axiosInstance.patch("/mypage/profile/nickname", { nickname: v });
      updateUserNickname(v);
      setMsg("닉네임이 저장되었습니다.");
    } catch (e) {
      setMsg(e?.response?.data?.message || "닉네임 저장 실패");
    }
  };

  const passwordStrength = (() => {
    const v = newPwIme.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return score; // 0~4
  })();

  const handleChangePassword = async () => {
    const currentPw = currentPwIme.value;
    const newPw = newPwIme.value;
    const newPw2 = newPw2Ime.value;
    if (newPw.length < 8) return setMsg("새 비밀번호는 8자 이상");
    if (newPw !== newPw2) return setMsg("새 비밀번호 확인이 일치하지 않습니다");
    try {
      await axiosInstance.patch("/mypage/profile/password", { currentPassword: currentPw, newPassword: newPw });
      setMsg("비밀번호가 변경되었습니다.");
      currentPwIme.setValue("");
      newPwIme.setValue("");
      newPw2Ime.setValue("");
    } catch (e) {
      setMsg(e?.response?.data?.message || "비밀번호 변경 실패");
    }
  };

  const onPickFile = () => fileRef.current?.click();
  const onFileChange = (ev) => {
    const f = ev.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleUploadAvatar = async () => {
    if (!file) return setMsg("업로드할 이미지를 선택하세요");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await axiosInstance.post("/mypage/profile/upload", form);
      const saved = res?.data?.url || res?.data?.imageUrl || res?.data;
      setAvatarUrl(profileUrl(saved));
      setPreview("");
      setFile(null);
      setMsg("프로필 이미지가 업데이트되었습니다.");
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.message || "이미지 업로드 실패");
    }
  };

  const navigate = useNavigate();
  const goWithdraw = () => {
    setShowDelete(false);
    navigate("/withdraw")
  };

  // ===== 공통 UI 파트 =====
  const Section = ({ title, children, right }) => (
    <section className="bg-[#121827] border border-white/5 rounded-2xl shadow-lg shadow-black/30 p-6 md:p-7">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-white">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center">
        <div className="animate-pulse text-white/70">로딩 중…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <Header />

      <main className="mx-auto max-w-5xl px-4 md:px-6 py-8 md:py-10 grid gap-6 md:gap-8">
        {/* 제목 */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              회원정보 수정
            </h1>
            <p className="text-white/60 mt-1 text-sm">
              닉네임, 비밀번호, 프로필 이미지를 관리하고, 필요 시 회원탈퇴를 진행할
              수 있어요.
            </p>
          </div>
        </div>

        {/* 프로필 이미지 */}
        <Section title="프로필 이미지">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={preview || avatarUrl || PROFILE_FALLBACK}
                alt="avatar"
                className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover ring-2 ring-white/10 shadow-md"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = PROFILE_FALLBACK;
                }}
              />
              {preview && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/70">
                  미리보기
                </span>
              )}
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onPickFile}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
                >
                  이미지 선택
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />

                <button
                  onClick={handleUploadAvatar}
                  className="px-4 py-2 rounded-xl bg-yellow-400/90 hover:bg-yellow-400 text-black font-semibold shadow"
                >
                  저장하기
                </button>

                {preview && (
                  <button
                    onClick={() => {
                      setPreview("");
                      setFile(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                  >
                    취소
                  </button>
                )}
              </div>
              <p className="text-xs text-white/50 mt-2">
                권장: 512×512 이상, JPG/PNG. 용량 제한은 서버 설정에 따릅니다.
              </p>
            </div>
          </div>
        </Section>

        {/* 닉네임 — 별도 폼으로 분리 */}
        <Section title="닉네임">
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                {...nicknameIme.bind}
                placeholder="닉네임 (2~10자)"
                autoComplete="off"            // username 후보에서 배제
                name="profile-nickname"       // username 오인 방지
                className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-yellow-400/60"
              />
              <button
                type="button"                  // 폼 제출 방지
                onClick={handleSaveNickname}
                className="px-4 py-2.5 rounded-xl bg-yellow-400/90 hover:bg-yellow-400 text-black font-semibold shadow"
              >
                저장
              </button>
            </div>
          </form>
          <p className="text-xs text-white/50 mt-2">
            특수문자 제한 등 서버 검증 규칙은 백엔드와 동일하게 적용됩니다.
          </p>
        </Section>

        {/* 비밀번호 변경 — 별도 폼으로 분리 */}
        <Section title="비밀번호 변경">
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()} name="password-change">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="password"
                {...currentPwIme.bind}
                autoComplete="off"  // 표준 토큰
                name="pw_current_manual"
                placeholder="현재 비밀번호"
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-yellow-400/60"
              />
              <input
                type="password"
                {...newPwIme.bind}
                autoComplete="new-password"       // 표준 토큰
                name="new-password"
                placeholder="새 비밀번호 (8자 이상)"
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-yellow-400/60"
              />
              <input
                type="password"
                {...newPw2Ime.bind}
                autoComplete="new-password"
                name="new-password-confirm"
                placeholder="새 비밀번호 확인"
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-yellow-400/60"
              />
            </div>

            {/* 강도 표시 */}
            <div className="mt-3">
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-2 ${
                    passwordStrength <= 1
                      ? "bg-red-500"
                      : passwordStrength === 2
                      ? "bg-orange-400"
                      : passwordStrength === 3
                      ? "bg-yellow-400"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                />
              </div>
              <p className="text-xs text-white/50 mt-1">
                대문자/숫자/특수문자를 조합하면 더 안전해요.
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"                      // 폼 제출 방지
                onClick={handleChangePassword}
                className="px-4 py-2.5 rounded-xl bg-yellow-400/90 hover:bg-yellow-400 text-black font-semibold shadow"
              >
                비밀번호 변경
              </button>
              <button
                type="button"
                onClick={() => {
                  currentPwIme.setValue("");
                  newPwIme.setValue("");
                  newPw2Ime.setValue("");
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
              >
                초기화
              </button>
            </div>
          </form>
        </Section>

        {/* Danger Zone */}
        <Section title="회원 탈퇴">
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-sm text-white/80">
              회원탈퇴를 하면 계정 및 게임 데이터가 삭제될 수 있습니다. 복구가
              어려우니 신중히 진행하세요.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 items-center">
              <button
                onClick={() => setShowDelete(true)}
                className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow"
              >
                회원 탈퇴 진행
              </button>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
      <Toast />

      {/* 탈퇴 모달 */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowDelete(false)}
          />
          <div className="relative w-[92%] max-w-lg bg-[#121827] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold">정말 탈퇴하시겠습니까?</h3>
            <p className="text-sm text-white/60 mt-2">
                탈퇴를 누르면 회원탈퇴 절차 페이지로 이동합니다.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                onClick={() => setShowDelete(false)}
              >
                취소
              </button>
              <button
                 className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
                onClick={goWithdraw}
              >
                영구 탈퇴
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
