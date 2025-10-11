
import api from "./axiosInstance";

// 마이페이지 프로필 조회 (서버가 JWT에서 userId 추출)
export const getMyPageProfile = () => {
  return api.get("/my-page/profile");
};

// 캐릭터 목록 조회
export const getMyPageCharacters = (page = 0, size = 12) => {
  return api.get("/my-page/characters", {
    params: { page, size },
  });
};

// 마이페이지 요약 (프로필 + 캐릭터 미리보기)
// userId를 절대 보내지 않음 — 서버가 JWT에서 본인 ID를 자동으로 식별
export const getMyPageSummary = (previewSize = 6) => {
  return api.get("/my-page/summary", {
    params: { previewSize },
  });
};
