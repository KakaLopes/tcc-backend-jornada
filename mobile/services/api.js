import axios from "axios";

const api = axios.create({
  baseURL: "https://contemporary-elevation-consolidated-struck.trycloudflare.com",
  timeout: 15000,
});

export default api;
