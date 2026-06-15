export const AUTH_API_BASE_URL = (
  import.meta.env.VITE_AUTH_API_BASE_URL || "http://localhost:8801"
).replace(/\/$/, "");

export const PORTFOLIO_API_BASE_URL = (
  import.meta.env.VITE_PORTFOLIO_API_BASE_URL || "http://localhost:8802"
).replace(/\/$/, "");
