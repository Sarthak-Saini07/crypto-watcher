import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSimplePrice } from "../services/api";
import { ArrowLeftRight, Loader2, AlertCircle } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export default function ConversionCalculator({ defaultCoin = "bitcoin" }: { defaultCoin?: string }) {
  const { currency } = useAppContext();
  const [amount, setAmount] = useState<string>("1");
  const [isCoinToFiat, setIsCoinToFiat] = useState(true);
  const [coin, setCoin] = useState(defaultCoin);
  const [fiat, setFiat] = useState(currency);
  const [debouncedAmount, setDebouncedAmount] = useState(amount);

  // Sync with global currency switcher
  useEffect(() => {
    setFiat(currency);
  }, [currency]);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amount);
    }, 300);
    return () => clearTimeout(timer);
  }, [amount]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["simplePrice", coin, fiat],
    queryFn: () => fetchSimplePrice(coin, fiat),
    staleTime: 60000, // cache for 1 minute
  });

  const rate = data?.[coin]?.[fiat];

  const handleSwap = () => {
    setIsCoinToFiat(!isCoinToFiat);
  };

  const calculateResult = () => {
    if (!rate || isNaN(Number(debouncedAmount))) return "0.00";
    
    const numAmount = Number(debouncedAmount);
    if (isCoinToFiat) {
      // Coin -> Fiat (2 decimals)
      return (numAmount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      // Fiat -> Coin (up to 8 decimals)
      return (numAmount / rate).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 8 });
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 w-full relative overflow-hidden group">
      {/* Decorative gradient blur inside the card */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors pointer-events-none" />
      
      <h3 className="text-xl font-bold flex items-center gap-2 relative z-10">
        <ArrowLeftRight className="w-5 h-5 text-primary" />
        Conversion Calculator
      </h3>
      
      <div className="flex flex-col md:flex-row items-center gap-4 mt-2">
        {/* Input Side */}
        <div className="flex-1 w-full bg-background border rounded-xl flex items-center p-2 focus-within:ring-2 focus-within:ring-primary/50 transition-shadow">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent px-3 outline-none font-medium"
            placeholder="0.00"
            min="0"
          />
          <select 
            value={isCoinToFiat ? coin : fiat}
            onChange={(e) => isCoinToFiat ? setCoin(e.target.value) : setFiat(e.target.value)}
            className="bg-accent/10 hover:bg-accent/20 cursor-pointer border-none outline-none font-bold py-2 px-3 rounded-lg"
          >
            {isCoinToFiat ? (
              <>
                <option value="bitcoin">BTC</option>
                <option value="ethereum">ETH</option>
                <option value="solana">SOL</option>
                <option value="cardano">ADA</option>
                <option value="ripple">XRP</option>
              </>
            ) : (
              <>
                <option value="usd">USD</option>
                <option value="inr">INR</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
              </>
            )}
          </select>
        </div>

        {/* Swap Button */}
        <button 
          onClick={handleSwap}
          className="p-3 bg-accent/10 hover:bg-accent/20 text-primary rounded-full transition-colors shrink-0"
          aria-label="Swap conversion direction"
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        {/* Output Side */}
        <div className="flex-1 w-full bg-muted/50 border border-transparent rounded-xl flex items-center p-2">
          <div className="w-full px-3 font-semibold text-lg overflow-hidden text-ellipsis">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground inline" />
            ) : isError ? (
              <span className="text-red-500 text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4"/> Error</span>
            ) : (
              calculateResult()
            )}
          </div>
          <select 
            value={!isCoinToFiat ? coin : fiat}
            onChange={(e) => !isCoinToFiat ? setCoin(e.target.value) : setFiat(e.target.value)}
            className="bg-accent/10 hover:bg-accent/20 cursor-pointer border-none outline-none font-bold py-2 px-3 rounded-lg"
          >
            {!isCoinToFiat ? (
               <>
               <option value="bitcoin">BTC</option>
               <option value="ethereum">ETH</option>
               <option value="solana">SOL</option>
               <option value="cardano">ADA</option>
               <option value="ripple">XRP</option>
             </>
            ) : (
              <>
                <option value="usd">USD</option>
                <option value="inr">INR</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
              </>
            )}
          </select>
        </div>
      </div>
      
      {/* Footer / Info */}
      <div className="text-xs text-muted-foreground flex justify-between items-center px-1">
        <span>Estimated based on current rates</span>
        {rate && !isError && (
          <span>
            1 {isCoinToFiat ? coin.toUpperCase() : fiat.toUpperCase()} = {isCoinToFiat ? rate : (1/rate).toFixed(8)} {!isCoinToFiat ? coin.toUpperCase() : fiat.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
