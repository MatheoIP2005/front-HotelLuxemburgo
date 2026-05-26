import axios from "axios";
import { PUBLIC_API_BASE_URL } from "./apiConfig";

const publicApi = axios.create({
  baseURL: PUBLIC_API_BASE_URL,
});

export default publicApi;
