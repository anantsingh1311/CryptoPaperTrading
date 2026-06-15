import axios from "axios";
import { PORTFOLIO_API_BASE_URL } from "../config/api.js";

export async function getCryptoPrices(ids, currency = "usd", options = {}) {
  const token = localStorage.getItem("token");
  const requestedIds = Array.isArray(ids) ? ids.join(",") : ids;

  const response = await axios.get(`${PORTFOLIO_API_BASE_URL}/api/market/prices`, {
    params: {
      ids: requestedIds,
      currency,
      fresh: options.fresh || false,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function getCryptoChart(id, currency = "usd", days = 1) {
  const token = localStorage.getItem("token");

  /*
   * Chart requests go through portfolio-service, not directly to CoinGecko.
   * That keeps the market API key and provider-specific request shape out of React.
   */
  const response = await axios.get(`${PORTFOLIO_API_BASE_URL}/api/market/chart`, {
    params: {
      id,
      currency,
      days,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
