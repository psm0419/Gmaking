import api from "./axiosInstance";

// 마이페이지 프로필 조회
export const getMyPageProfile = (userId) => {
  return api.get("/my-page/profile", {
    params: { userId },
  });
};

// 캐릭터 목록 조회
export const getMyPageCharacters = (userId, page = 0, size = 12) => {
  return api.get("/my-page/characters", {
    params: { userId, page, size },
  });
};

// 마이페이지 요약 (프로필 + 캐릭터 미리보기)
export const getMyPageSummary = (userId, previewSize = 6) => {
  return api.get("/my-page/summary", {
    params: { userId, previewSize }, // 컨트롤러 파라미터와 동일한 이름
  });
};
