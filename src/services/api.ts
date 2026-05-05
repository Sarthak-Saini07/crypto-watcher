import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const fetchTrendingCoins = async () => {
  const { data } = await axios.get(`${API_URL}/search/trending`);
  return data.coins.map((c: any) => c.item);
};

export const fetchMarketData = async (page = 1, currency = "usd") => {
  const { data } = await axios.get(`${API_URL}/coins/markets`, {
    params: {
      vs_currency: currency,
      order: "market_cap_desc",
      per_page: 50,
      page,
      sparkline: true,
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
