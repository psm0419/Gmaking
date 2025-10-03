import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export const loginApi = (userId, userPassword) => {
  return axios.post(`${API_BASE_URL}/login`, { userId, userPassword });
};

export const securedTestApi = (token) => {
  return axios.get(`${API_BASE_URL}/secured/test`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
