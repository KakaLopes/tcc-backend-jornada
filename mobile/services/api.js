import axios from "axios";

const api = axios.create({
  baseURL: "https://mild-paragraphs-textbook-worlds.trycloudflare.com",
  timeout: 15000,
});

export default api;
