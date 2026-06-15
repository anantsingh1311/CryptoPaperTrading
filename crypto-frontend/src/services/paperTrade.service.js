import axios from "axios";
import { PORTFOLIO_API_BASE_URL } from "../config/api.js";

export async function getPaperAccount() {
  const token = localStorage.getItem("token");

  /*
   * The backend reads the logged-in user from the JWT, so the frontend does not
   * send userId or email when loading the paper account.
   */
  const response = await axios.get(
    `${PORTFOLIO_API_BASE_URL}/api/trades/paper/account`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function executePaperTrade({ coinId, symbol, side, quantity }) {
  const token = localStorage.getItem("token");

  /*
   * Only order intent is sent. portfolio-service validates the JWT, checks the
   * latest backend market price, and updates virtual cash/holdings there.
   */
  const response = await axios.post(
    `${PORTFOLIO_API_BASE_URL}/api/trades/paper`,
    {
      coinId,
      symbol,
      side,
      quantity,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
