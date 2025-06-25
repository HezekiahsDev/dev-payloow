import axios from "axios";
import { CONFIG } from "../config";

const baseURL = CONFIG.PAYSTACK.PAYSTACK_BASE_URL;

const paystackHttpInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CONFIG.PAYSTACK.PAYSTACK_SECRET_KEY}`,
  },
});

export { paystackHttpInstance };
