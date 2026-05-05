import { useQuery } from "@tanstack/react-query";
import { fetchMarketData } from "../services/api";
import { useAppContext } from "../context/AppContext";
import CryptoCard from "../components/CryptoCard";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Favorites() {
  const { favorites } = useAppContext();

  const { data: coins, isLoading } = useQuery({
    queryKey: ["marketData"],
    queryFn: () => fetchMarketData(1), // Since we only get top 50, we assume favorites are in top 50 for this demo
  });

  const favoriteCoins = coins?.filter((coin: any) => favorites.includes(coin.id)) || [];

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight mb-8">Your Favorites</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : favoriteCoins.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteCoins.map((coin: any) => (
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
