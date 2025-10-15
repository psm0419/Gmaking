import React, { useEffect, useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axiosInstance from "../api/axiosInstance";

// ===== 공통 BASE URL & 이미지 경로 보정 =====
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8080";
function toFullImageUrl(raw) {
  let url = raw || "/images/character/placeholder.png";
  if (/^https?:\/\//i.test(url)) return url; // 절대경로면 그대로
  url = url.replace(/^\/?static\//i, "/"); // /static/ 제거
  url = url.replace(/^\/?character\//i, "/images/character/"); // /character/ 정규화
  if (url.startsWith("/")) return `${API_BASE}${url}`; // 루트 시작
  return `${API_BASE}/${url.replace(/^\/?/, "")}`;
}

// ===== 단순 토스트 =====
function useToast() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(""), 2400);
    return () => clearTimeout(id);
  }, [msg]);
  const Toast = () => (
    msg ? (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/80 text-yellow-300 text-sm shadow-lg z-50">
        {msg}
      </div>
    ) : null
  );
  return { setMsg, Toast };
}

// ===== 메인 페이지 =====
export default function SettingPage() {
  const { setMsg, Toast } = useToast();

  // 프로필 기본값 (초기 로드)
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // 비밀번호 변경 폼
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  // 이미지 업로드
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  // 회원탈퇴
  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deletePw, setDeletePw] = useState("");

  // ===== 초기 데이터 로드 (필요시 엔드포인트 맞춰 수정) =====
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await axiosInstance.get("/mypage/profile/me"); // { nickname, profileImageUrl }
        if (!alive) return;
        setNickname(res?.data?.nickname || "");
        setAvatarUrl(toFullImageUrl(res?.data?.profileImageUrl));
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  // ===== Handlers =====
  const handleSaveNickname = async () => {
    if (nickname.trim().length < 2 || nickname.trim().length > 10) {
      setMsg("닉네임은 2~10자입니다.");
      return;
    }
    try {
      await axiosInstance.patch("/mypage/profile/nickname", { nickname: nickname.trim() });
      setMsg("닉네임이 저장되었습니다.");
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.message || "닉네임 저장 실패");
    }
  };

  const passwordStrength = (() => {
    const v = newPw;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return score; // 0~4
  })();

  const handleChangePassword = async () => {
    if (newPw.length < 8) return setMsg("새 비밀번호는 8자 이상");
    if (newPw !== newPw2) return setMsg("새 비밀번호 확인이 일치하지 않습니다");
    try {
      await axiosInstance.patch("/mypage/profile/password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setMsg("비밀번호가 변경되었습니다.");
      setCurrentPw(""); setNewPw(""); setNewPw2("");
    } catch (e) {
      console.error(e);
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
      const res = await axiosInstance.post("/mypage/profile/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      const saved = res?.data?.url || res?.data?.imageUrl || res?.data;
      setAvatarUrl(toFullImageUrl(saved));
      setPreview("");
      setFile(null);
      setMsg("프로필 이미지가 업데이트되었습니다.");
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.message || "이미지 업로드 실패");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE") return setMsg('확인 문구로 "DELETE"를 입력하세요');
    try {
      await axiosInstance.delete("/mypage/account", { data: { password: deletePw } });
      setMsg("회원탈퇴가 완료되었습니다.");
      // 후처리: 로그아웃 / 메인 이동 등
      // window.location.href = "/";
    } catch (e) {
      console.error(e);
      setMsg(e?.response?.data?.message || "회원탈퇴 실패");
    }
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
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">회원정보 수정</h1>
            <p className="text-white/60 mt-1 text-sm">닉네임, 비밀번호, 프로필 이미지를 관리하고, 필요 시 회원탈퇴를 진행할 수 있어요.</p>
          </div>
        </div>

        {/* 프로필 이미지 */}
        <Section title="프로필 이미지">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <img
                src={preview || avatarUrl || toFullImageUrl("")}
                alt="avatar"
                className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover ring-2 ring-white/10 shadow-md"
              />
              {preview && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/70">미리보기</span>
              )}
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onPickFile}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
                >이미지 선택</button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

                <button
                  onClick={handleUploadAvatar}
                  className="px-4 py-2 rounded-xl bg-yellow-400/90 hover:bg-yellow-400 text-black font-semibold shadow"
                >저장하기</button>

                {preview && (
                  <button
                    onClick={() => { setPreview(""); setFile(null); }}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                  >취소</button>
                )}
              </div>
              <p className="text-xs text-white/50 mt-2">권장: 512×512 이상, JPG/PNG. 용량 제한은 서버 설정에 따릅니다.</p>
            </div>
          </div>
        </Section>

        {/* 닉네임 */}
        <Section title="닉네임">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
              placeholder="닉네임 (2~10자)"
              className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-yellow-400/60"
            />
            <button
              onClick={handleSaveNickname}
              className="px-4 py-2.5 rounded-xl bg-yellow-400/90 hover:bg-yellow-400 text-black font-semibold shadow"
            >저장</button>
          </div>
          <p className="text-xs text-white/50 mt-2">특수문자 제한 등 서버 검증 규칙은 백엔드와 동일하게 적용됩니다.</p>
        </Section>

        {/* 비밀번호 변경 */}
        <Section title="비밀번호 변경">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="현재 비밀번호"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-yellow-400/60"
            />
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="새 비밀번호 (8자 이상)"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-yellow-400/60"
            />
            <input
              type="password"
              value={newPw2}
              onChange={(e) => setNewPw2(e.target.value)}
              placeholder="새 비밀번호 확인"
              className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-yellow-400/60"
            />
          </div>

          {/* 강도 표시 */}
          <div className="mt-3">
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-2 ${
                  passwordStrength <= 1 ? "bg-red-500" : passwordStrength === 2 ? "bg-orange-400" : passwordStrength === 3 ? "bg-yellow-400" : "bg-green-500"
                }`} style={{ width: `${(passwordStrength/4)*100}%` }}
              />
            </div>
            <p className="text-xs text-white/50 mt-1">대문자/숫자/특수문자를 조합하면 더 안전해요.</p>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleChangePassword}
              className="px-4 py-2.5 rounded-xl bg-yellow-400/90 hover:bg-yellow-400 text-black font-semibold shadow"
            >비밀번호 변경</button>
            <button
              onClick={() => { setCurrentPw(""); setNewPw(""); setNewPw2(""); }}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >초기화</button>
          </div>
        </Section>

        {/* Danger Zone */}
        <Section title="회원 탈퇴">
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <p className="text-sm text-white/80">회원탈퇴를 하면 계정 및 게임 데이터가 삭제될 수 있습니다. 복구가 어려우니 신중히 진행하세요.</p>
            <div className="mt-3 flex flex-wrap gap-3 items-center">
              <button
                onClick={() => setShowDelete(true)}
                className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow"
              >회원 탈퇴 진행</button>
            </div>
          </div>
        </Section>
      </main>

      <Footer />
      <Toast />

      {/* 탈퇴 모달 */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDelete(false)} />
          <div className="relative w-[92%] max-w-lg bg-[#121827] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold">정말 탈퇴하시겠어요?</h3>
            <p className="text-sm text-white/60 mt-1">확인을 위해 아래 입력창에 <span className="text-red-400 font-semibold">DELETE</span> 를 입력하고 비밀번호를 입력하세요.</p>
            <div className="mt-4 grid gap-3">
              <input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-red-400/60"
              />
              <input
                type="password"
                value={deletePw}
                onChange={(e) => setDeletePw(e.target.value)}
                placeholder="비밀번호"
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-red-400/60"
              />
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10" onClick={() => setShowDelete(false)}>취소</button>
              <button className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold" onClick={handleDeleteAccount}>영구 탈퇴</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
