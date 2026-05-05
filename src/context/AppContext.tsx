import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "usd" | "inr" | "eur";

interface AppContextType {
  favorites: string[];
  toggleFavorite: (coinId: string) => void;
  isFavorite: (coinId: string) => boolean;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("crypto-favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem("crypto-currency");
    return (saved as Currency) || "usd";
  });

  useEffect(() => {
    localStorage.setItem("crypto-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("crypto-currency", currency);
  }, [currency]);

  const toggleFavorite = (coinId: string) => {
    setFavorites((prev) =>
      prev.includes(coinId) ? prev.filter((id) => id !== coinId) : [...prev, coinId]
    );
  };

  const isFavorite = (coinId: string) => favorites.includes(coinId);

  return (
    <AppContext.Provider value={{ favorites, toggleFavorite, isFavorite, currency, setCurrency }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
