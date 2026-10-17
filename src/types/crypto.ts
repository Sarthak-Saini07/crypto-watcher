export interface SparklineIn7D {
  price?: number[];
}

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap?: number;
  market_cap_rank?: number;
  fully_diluted_valuation?: number | null;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  circulating_supply?: number;
  total_supply?: number | null;
  max_supply?: number | null;
  sparkline_in_7d?: SparklineIn7D;
}
