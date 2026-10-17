import axios from "axios";

import { MarketCoin } from "../types/crypto";

const rawBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "/api";
// Normalize: ensure it ends with /api (strip trailing slashes or /v3)
const API_URL = rawBase.replace(/\/+$/, "").replace(/\/v3$/, "");

export const fetchTrendingCoins = async () => {
  const { data } = await axios.get(`${API_URL}/search/trending`);
  return data.coins.map((c: { item: unknown }) => c.item);
};

export const fetchMarketData = async (
  page = 1,
  currency = "usd",
  perPage = 20,
  sparkline = false
): Promise<MarketCoin[]> => {
  const { data } = await axios.get(`${API_URL}/coins/markets`, {
    params: {
      vs_currency: currency,
      order: "market_cap_desc",
      per_page: perPage,
      page,
      sparkline,
    },
  });
  return data;
};

export const fetchCoinDetails = async (id: string) => {
  const { data } = await axios.get(`${API_URL}/coins/${id}`, {
    params: {
      localization: false,
      tickers: false,
      market_data: true,
      community_data: false,
      developer_data: false,
      sparkline: true,
    },
  });
  return data;
};

export const fetchCoinChart = async (id: string, days: number = 7, currency = "usd") => {
  const { data } = await axios.get(`${API_URL}/coins/${id}/market_chart`, {
    params: {
      vs_currency: currency,
      days,
    },
  });
  return data;
};

export const fetchSimplePrice = async (ids: string, vs_currencies: string) => {
  const { data } = await axios.get(`${API_URL}/simple/price`, {
    params: {
      ids,
      vs_currencies,
    },
  });
  return data;
};
