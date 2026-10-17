import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchMarketData } from "../services/api";
import CryptoCard from "../components/CryptoCard";
import ConversionCalculator from "../components/ConversionCalculator";
import { Search, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { MarketCoin } from "../types/crypto";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const { currency } = useAppContext();

  const {
    data: coins,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["market", currency],
    queryFn: () => fetchMarketData(1, currency, 20, false),
    placeholderData: keepPreviousData,
  });

  const [cooldownSec, setCooldownSec] = useState<number | null>(null);

  useEffect(() => {
    if (isError && error) {
      const errObj = error as { response?: { data?: { retryAfter?: number }; headers?: Record<string, string> } };
      const retrySec = errObj?.response?.data?.retryAfter || (errObj?.response?.headers?.["retry-after"] ? parseInt(errObj.response.headers["retry-after"], 10) : null);
      if (retrySec && !isNaN(retrySec) && retrySec > 0) {
        setCooldownSec(retrySec);
      }
    } else {
      setCooldownSec(null);
    }
  }, [isError, error]);

  useEffect(() => {
    if (cooldownSec === null || cooldownSec <= 0) return;
    const interval = setInterval(() => {
      setCooldownSec((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          refetch(); // Automatically retry once cooldown ends
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSec, refetch]);

  const coinList = Array.isArray(coins) ? coins : [];
  const hasCoins = coinList.length > 0;

  const filteredCoins = coinList.filter((coin: MarketCoin) =>
    coin.name?.toLowerCase().includes(search.toLowerCase()) ||
    coin.symbol?.toLowerCase().includes(search.toLowerCase())
  );

  const getErrorMessage = () => {
    const errObj = error as { response?: { status?: number; data?: { error?: string } }; message?: string };
    const status = errObj?.response?.status;
    const backendMsg = errObj?.response?.data?.error;
    if (status === 429 || (backendMsg && backendMsg.toLowerCase().includes("rate limit"))) {
      if (cooldownSec && cooldownSec > 0) {
        return `CoinGecko API rate limit reached. Upstream cooldown active for ${cooldownSec}s.`;
      }
      return "CoinGecko API rate limit reached. Please wait a moment before retrying.";
    }
    return backendMsg || "Failed to load market data. Please check your connection and try again.";
  };

  return (
    <div className="flex-1 w-full pb-12">
      {/* Hero Section */}
      <section className="relative w-full py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-background to-muted/30">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] opacity-50 dark:opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] opacity-50 dark:opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[size:30px_30px] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        
        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column - Hero Text */}
            <div className="flex flex-col text-center lg:text-left animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="inline-block mb-4 px-4 py-1.5 rounded-full border bg-background/50 backdrop-blur-md shadow-sm w-fit mx-auto lg:mx-0">
                <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                  New Features Available 🚀
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-[1.1]">
                Track Crypto Prices in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Real Time</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0">
                Stay ahead of the market. Get real-time data, beautiful charts, and build your favorite cryptocurrency portfolio all in one place.
              </p>
              <div>
                <button className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg glow-hover shadow-lg shadow-primary/25">
                  Explore Market
                </button>
              </div>
            </div>

            {/* Right Column - Calculator */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-[2rem] blur opacity-20 dark:opacity-40" />
              <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-2 shadow-2xl">
                <ConversionCalculator />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 mt-12 md:mt-24">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 animate-in slide-up duration-700 delay-150">
          <h2 className="text-3xl font-bold tracking-tight">Market Overview</h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Warning banner when showing cached data due to background refresh error */}
        {isError && hasCoins && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-between text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Live market update temporarily unavailable. Displaying cached data.</span>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-semibold transition-colors disabled:opacity-50 text-xs shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {isLoading && !hasCoins ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading cryptocurrency market...</p>
          </div>
        ) : isError && !hasCoins ? (
          <div className="text-center py-16 px-4 bg-card/60 backdrop-blur-md rounded-3xl border border-border/50 max-w-lg mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Unable to Load Market Data</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {getErrorMessage()}
            </p>
            <button
              onClick={() => refetch()}
              disabled={isFetching || (cooldownSec !== null && cooldownSec > 0)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching
                ? "Retrying..."
                : cooldownSec && cooldownSec > 0
                ? `Retry in ${cooldownSec}s`
                : "Retry Now"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCoins.map((coin: MarketCoin) => (
              <CryptoCard key={coin.id} coin={coin} />
            ))}
          </div>
        )}
        
        {!isLoading && !isError && filteredCoins.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            No cryptocurrencies found matching "{search}"
          </div>
        )}
      </section>
    </div>
  );
}
