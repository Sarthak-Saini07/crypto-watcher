import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketData } from "../services/api";
import CryptoCard from "../components/CryptoCard";
import ConversionCalculator from "../components/ConversionCalculator";
import { Search, Loader2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const { currency } = useAppContext();

  const { data: coins, isLoading, isError } = useQuery({
    queryKey: ["market", currency],
    queryFn: () => fetchMarketData(1, currency),
  });

  const filteredCoins = coins?.filter((coin: any) =>
    coin.name.toLowerCase().includes(search.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(search.toLowerCase())
  ) || [];

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

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            <p>Failed to load market data. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCoins.map((coin: any) => (
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
