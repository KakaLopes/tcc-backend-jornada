import axios from "axios";

const api = axios.create({
  baseURL: "https://helps-turtle-partition-discipline.trycloudflare.com",
  timeout: 15000,
});

export default api;
