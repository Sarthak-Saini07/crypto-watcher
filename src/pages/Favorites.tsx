import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchMarketData } from "../services/api";
import { useAppContext } from "../context/AppContext";
import CryptoCard from "../components/CryptoCard";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { MarketCoin } from "../types/crypto";

export default function Favorites() {
  const { favorites, currency } = useAppContext();

  const {
    data: coins,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["market", currency, 50],
    queryFn: () => fetchMarketData(1, currency, 50, false),
    placeholderData: keepPreviousData,
  });

  const coinList = Array.isArray(coins) ? coins : [];
  const favoriteCoins = coinList.filter((coin: MarketCoin) => favorites.includes(coin.id));

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">Your Favorites</h1>
      
      {isLoading && coinList.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading favorites...</p>
        </div>
      ) : isError && coinList.length === 0 ? (
        <div className="text-center py-16 px-4 bg-card/60 backdrop-blur-md rounded-3xl border border-border/50 max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Unable to Load Favorites</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Failed to fetch cryptocurrency data. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Retrying..." : "Retry Now"}
          </button>
        </div>
      ) : favoriteCoins.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteCoins.map((coin: MarketCoin) => (
            <CryptoCard key={coin.id} coin={coin} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
          <h2 className="text-2xl font-bold mb-3">No favorites yet</h2>
          <p className="text-muted-foreground mb-6">Start tracking your favorite cryptocurrencies to see them here.</p>
          <Link to="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors">
            Explore Market
          </Link>
        </div>
      )}
    </div>
  );
}
