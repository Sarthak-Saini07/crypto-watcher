import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { formatCurrency } from "../lib/utils";

export default function CryptoCard({ coin }: { coin: any }) {
  const { isFavorite, toggleFavorite, currency } = useAppContext();
  const favorite = isFavorite(coin.id);

  const priceChange = coin.price_change_percentage_24h || 0;
  const isPositive = priceChange >= 0;

  // Generate a simple SVG sparkline path
  const sparklineData = coin.sparkline_in_7d?.price || [];
  let sparklinePath = "";
  if (sparklineData.length > 0) {
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    
    // Create an SVG path scaling x from 0 to 100, y from 0 to 30
    sparklinePath = sparklineData.map((val: number, i: number) => {
      const x = (i / (sparklineData.length - 1)) * 100;
      const y = 30 - ((val - min) / range) * 30; // invert y (0 is top)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  }

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:border-primary/40 hover:-translate-y-1">
      <div className="flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
          <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full ring-2 ring-primary/5" />
          <div>
            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{coin.name}</h3>
            <span className="text-sm text-muted-foreground uppercase font-medium">{coin.symbol}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(coin.id);
          }}
          className={`p-2 rounded-full transition-all active:scale-95 z-20 relative ${
            favorite ? "text-yellow-500 bg-yellow-500/10 shadow-inner" : "text-muted-foreground hover:bg-accent/50"
          }`}
        >
          <Star className="w-5 h-5" fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      
      <div className="mt-6 flex flex-col gap-1 z-10">
        <span className="text-2xl font-extrabold tracking-tight">
          {formatCurrency(coin.current_price || 0, currency)}
        </span>
        <span className={`text-sm font-bold ${isPositive ? "text-success" : "text-danger"}`}>
          {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
        </span>
      </div>

      {/* Sparkline background */}
      {sparklinePath && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 pointer-events-none overflow-hidden">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
            <path
              d={sparklinePath}
              fill="none"
              stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--danger))"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
            {/* Optional subtle gradient fill under the line */}
            <path
              d={`${sparklinePath} L 100 30 L 0 30 Z`}
              fill={`url(#gradient-${isPositive ? 'success' : 'danger'})`}
              stroke="none"
            />
            <defs>
              <linearGradient id="gradient-success" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="gradient-danger" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--danger))" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(var(--danger))" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      <Link to={`/coin/${coin.id}`} className="absolute inset-0 z-0">
        <span className="sr-only">View Details</span>
      </Link>
    </div>
  );
}
