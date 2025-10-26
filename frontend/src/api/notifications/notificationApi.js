import axios from "axios";

const authHeaders = () => {
  const t = localStorage.getItem("gmaking_token");
  if (!t) return {};
  return { Authorization: t.startsWith("Bearer ") ? t : `Bearer ${t}` };
};

export const notificationsApi = {
  unread:  (limit = 50, offset = 0) =>
    axios.get(`/api/notifications/unread?limit=${limit}&offset=${offset}`, { headers: authHeaders() })
         .then(r => r.data || []),

  read:    (limit = 50, offset = 0) =>
    axios.get(`/api/notifications/read?limit=${limit}&offset=${offset}`, { headers: authHeaders() })
         .then(r => r.data || []),

  count:   () =>
    axios.get(`/api/notifications/unread/count`, { headers: authHeaders() })
         .then(r => (typeof r.data?.count === "number" ? r.data.count : 0)),

  markRead: (id) =>
    axios.patch(`/api/notifications/${id}/read`, null, { headers: authHeaders() }),

  markAllRead: () =>
    axios.patch(`/api/notifications/read-all`, null, { headers: authHeaders() }),

  deleteOne: (id) =>
    axios.patch(`/api/notifications/${id}/delete`, null, { headers: authHeaders() }),

  deleteAllRead: () =>
    axios.patch(`/api/notifications/read/delete`, null, { headers: authHeaders() }),

  pvpModal: (notificationId) =>
    axios.get(`/api/notifications/${notificationId}/pvp-modal`, { headers: authHeaders() })
         .then(r => r.data),
};