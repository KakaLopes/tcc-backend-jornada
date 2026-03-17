import axios from "axios";

const api = axios.create({
  baseURL: "https://vic-cache-secretariat-eliminate.trycloudflare.com",
  timeout: 15000,
});

export default api;
