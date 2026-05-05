import { Link } from "react-router-dom";
import { Moon, Sun, Activity, Globe } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAppContext, Currency } from "../context/AppContext";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useAppContext();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="font-bold inline-block text-xl tracking-tight">Crypto Hub</span>
        </Link>
        <div className="flex items-center space-x-4 md:space-x-6">
          <Link to="/favorites" className="text-sm font-medium transition-colors hover:text-primary hidden sm:inline-block">
            Favorites
          </Link>
          
          <div className="flex items-center bg-accent/20 rounded-full px-2 py-1 border border-border/50">
            <Globe className="w-4 h-4 text-muted-foreground mr-1" />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="bg-transparent border-none outline-none text-sm font-semibold text-foreground cursor-pointer"
            >
              <option value="usd" className="bg-background text-foreground">USD</option>
              <option value="inr" className="bg-background text-foreground">INR</option>
              <option value="eur" className="bg-background text-foreground">EUR</option>
            </select>
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
