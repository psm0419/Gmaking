// fetch + JWT 직접 전달 스타일 유지
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8080";

// 내부 공통 fetch
async function fx(path, { method = "GET", token, headers = {}, body } = {}) {
  if (!path.startsWith("/")) path = `/${path}`;
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[HTTP ${res.status}] ${res.statusText} ${text}`);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

/** 안 읽은 개수 */
export async function fetchUnreadCount(jwt) {
  const data = await fx("/api/notifications/unread/count", { token: jwt });
  // 서버가 {count: number} 반환한다고 가정
  return typeof data?.count === "number" ? data.count : data;
}

/** 안 읽은 목록 (limit/offset 또는 page/size 둘 다 지원) */
export async function fetchUnread(
  jwt,
  { limit, offset, page, size } = { limit: 20, offset: 0 }
) {
  let qs = "";
  if (page != null || size != null) {
    qs = `?page=${encodeURIComponent(page ?? 0)}&size=${encodeURIComponent(size ?? 20)}`;
  } else {
    qs = `?limit=${encodeURIComponent(limit ?? 20)}&offset=${encodeURIComponent(offset ?? 0)}`;
  }
  return fx(`/api/notifications/unread${qs}`, { token: jwt });
}

/** 읽은 목록 (필요 없으면 import 제거) */
export async function fetchRead(
  jwt,
  { limit, offset, page, size } = { limit: 20, offset: 0 }
) {
  let qs = "";
  if (page != null || size != null) {
    qs = `?page=${encodeURIComponent(page ?? 0)}&size=${encodeURIComponent(size ?? 20)}`;
  } else {
    qs = `?limit=${encodeURIComponent(limit ?? 20)}&offset=${encodeURIComponent(offset ?? 0)}`;
  }
  return fx(`/api/notifications/read${qs}`, { token: jwt });
}

/** 읽음 처리 (서버가 PATCH /notifications/{id}/read 수신 가정) */
export async function markRead(jwt, id) {
  await fx(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    token: jwt,
  });
}
