import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
});

http.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(err)
);
