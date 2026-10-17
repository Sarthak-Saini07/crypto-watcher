import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ThemeProvider } from "./components/ThemeProvider";
import Dashboard from "./pages/Dashboard";
import CoinDetails from "./pages/CoinDetails";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 90 * 1000, // 90s freshness
      gcTime: 10 * 60 * 1000, // 10m cache retention
      refetchOnWindowFocus: false, // avoid hitting rate limits when switching tabs
      refetchOnReconnect: false,
      retry: (failureCount, error: unknown) => {
        // Never retry client errors or rate limits (429) automatically
        const errObj = error as { response?: { status?: number } };
        const status = errObj?.response?.status;
        if (status === 429 || (status !== undefined && status >= 400 && status < 500)) {
          return false;
        }
        // At most 1 retry for transient network/5xx errors
        return failureCount < 1;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="crypto-hub-theme">
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="coin/:id" element={<CoinDetails />} />
              <Route path="favorites" element={<Favorites />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
