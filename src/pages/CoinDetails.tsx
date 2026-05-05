import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCoinDetails, fetchCoinChart } from "../services/api";
import { ArrowLeft, Loader2, Star, TrendingUp, TrendingDown, Activity, DollarSign, PieChart, Globe, Twitter, Github, MessageSquare } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import ConversionCalculator from "../components/ConversionCalculator";
import { formatCurrency } from "../lib/utils";

export default function CoinDetails() {
  const { id } = useParams<{ id: string }>();
  const { isFavorite, toggleFavorite, currency } = useAppContext();
  const favorite = isFavorite(id!);

  const { data: coin, isLoading: coinLoading } = useQuery({
    queryKey: ["coin", id],
    queryFn: () => fetchCoinDetails(id!),
    enabled: !!id,
  });

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ["chart", id, currency],
    queryFn: () => fetchCoinChart(id!, 7, currency),
    enabled: !!id,
  });

  const isLoading = coinLoading || chartLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-[60vh] animate-pulse">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
        <h2 className="text-2xl font-bold mb-4">Coin not found</h2>
        <Link to="/" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const formattedChartData = chartData?.prices?.map(([timestamp, price]: [number, number]) => ({
    time: new Date(timestamp).toLocaleDateString(),
    price,
  })) || [];

  const priceChange = coin.market_data?.price_change_percentage_24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Details & Stats */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Header Card */}
          <div className="glass-card p-8 rounded-3xl flex flex-col gap-8 animate-in slide-up duration-500">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img src={coin.image?.large} alt={coin.name} className="w-16 h-16 rounded-full shadow-sm ring-2 ring-primary/10" />
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-extrabold tracking-tight">{coin.name}</h1>
                  <span className="text-sm font-semibold bg-primary/10 text-primary w-fit px-2.5 py-0.5 rounded-md uppercase tracking-wider">{coin.symbol}</span>
                </div>
              </div>
              <button
                onClick={() => toggleFavorite(id!)}
                className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 ${
                  favorite ? "text-yellow-500 bg-yellow-500/10 shadow-inner" : "text-muted-foreground bg-accent hover:bg-accent/80"
                }`}
              >
                <Star className="w-6 h-6" fill={favorite ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-5xl font-extrabold tracking-tighter text-foreground">
                {formatCurrency(coin.market_data?.current_price?.[currency] || 0, currency)}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold w-fit ${
                isPositive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              }`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive ? "+" : ""}{priceChange.toFixed(2)}% (24h)
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="glass-card p-6 rounded-3xl flex flex-col gap-5 animate-in slide-up duration-500 delay-150">
            <h3 className="font-semibold text-lg text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Market Statistics
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                  <PieChart className="w-4 h-4 opacity-70" /> Market Cap
                </span>
                <span className="font-medium text-foreground text-right">{formatCurrency(coin.market_data?.market_cap?.[currency] || 0, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 opacity-70" /> Volume (24h)
                </span>
                <span className="font-medium text-foreground text-right">{formatCurrency(coin.market_data?.total_volume?.[currency] || 0, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 opacity-70" /> Circulating Supply
                </span>
                <span className="font-medium text-foreground text-right">{coin.market_data?.circulating_supply?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 opacity-70" /> Max Supply
                </span>
                <span className="font-medium text-foreground text-right">{coin.market_data?.max_supply ? coin.market_data?.max_supply.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "Unlimited"}</span>
              </div>
            </div>
          </div>

          {/* Resources Card */}
          <div className="glass-card p-6 rounded-3xl flex flex-col gap-5 animate-in slide-up duration-500 delay-300">
            <h3 className="font-semibold text-lg text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Official Resources
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                {coin.links?.homepage?.[0] && (
                  <a href={coin.links.homepage[0]} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-background border border-border/50 hover:border-primary/50 text-foreground px-4 py-3 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10">
                    <Globe className="w-4 h-4 text-muted-foreground" /> Website
                  </a>
                )}
                {coin.links?.blockchain_site?.[0] && (
                  <a href={coin.links.blockchain_site[0]} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-background border border-border/50 hover:border-primary/50 text-foreground px-4 py-3 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10">
                    <Activity className="w-4 h-4 text-muted-foreground" /> Explorer
                  </a>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {coin.links?.repos_url?.github?.[0] && (
                  <a href={coin.links.repos_url.github[0]} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-background border border-border/50 hover:border-primary/50 text-foreground px-4 py-3 rounded-xl text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10">
                    <Github className="w-4 h-4 text-muted-foreground" /> GitHub
                  </a>
                )}
                {coin.links?.twitter_screen_name && (
                  <a href={`https://twitter.com/${coin.links.twitter_screen_name}`} target="_blank" rel="noopener noreferrer" className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-transparent text-[#1DA1F2] px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5">
                    <Twitter className="w-4 h-4" /> Twitter
                  </a>
                )}
                {coin.links?.subreddit_url && (
                  <a href={coin.links.subreddit_url} target="_blank" rel="noopener noreferrer" className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 bg-[#FF4500]/10 hover:bg-[#FF4500]/20 border border-transparent text-[#FF4500] px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5">
                    <MessageSquare className="w-4 h-4" /> Reddit
                  </a>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Chart & Tools */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Chart Card */}
          <div className="glass-card rounded-3xl p-6 flex flex-col h-[450px] animate-in fade-in zoom-in-95 duration-700">
            <h2 className="text-xl font-semibold mb-6 text-foreground tracking-tight">7-Day Price History</h2>
            <div className="flex-1 w-full relative">
              {formattedChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedChartData}>
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      minTickGap={30}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value, currency).replace(/\.00$/, '')}
                      domain={['auto', 'auto']}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: '500' }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                      formatter={(value: number) => formatCurrency(value, currency)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground bg-muted/20 rounded-2xl">
                  No chart data available
                </div>
              )}
            </div>
          </div>

          {/* Calculator Integration */}
          <div className="animate-in slide-up duration-700 delay-300">
            <ConversionCalculator defaultCoin={coin.id} />
          </div>

        </div>
      </div>
    </div>
  );
}
