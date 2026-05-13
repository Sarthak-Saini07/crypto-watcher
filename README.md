# Spark Crypto Hub

> A modern, real-time cryptocurrency dashboard that helps you track prices, charts, and market movements for your favorite cryptocurrencies with advanced caching and rate-limiting.



## Table of Contents

* [About](#about)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Architecture](#architecture)
* [Screenshots](#screenshots)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Local Development](#local-development)
  * [Docker Setup](#docker-setup)
* [Configuration](#configuration)
* [Usage](#usage)
* [Contributing](#contributing)
* [License](#license)

---

## About

**Spark Crypto Hub** is a full-stack, responsive web application for monitoring cryptocurrency prices and trends in near real-time. It features a sleek, futuristic UI, dynamic animations, and interactive charts. The application is supported by a custom Node.js Express proxy server that handles API rate-limiting and response caching for the CoinGecko API, ensuring a smooth and uninterrupted user experience.

## Features

* **Live Market Data:** Real-time price feed for top cryptocurrencies.
* **Interactive Charts:** Detailed price charts (1h / 24h / 7d / 30d) powered by Recharts.
* **Advanced UI/UX:** Built with shadcn/ui components, Tailwind CSS, and Framer Motion for a premium, glassmorphism-inspired aesthetic.
* **Smart Search & Watchlist:** Search and add coins to your personal watchlist.
* **Custom Proxy Server:** Built-in Express backend to handle CoinGecko API rate limits with in-memory caching and exponential backoff retries.
* **Global Currency Switcher:** Dynamically view prices in different fiat currencies (USD, INR, EUR).
* **Responsive Design:** Fully optimized layout for both desktop and mobile devices.
* **Dark / Light Mode:** Seamless theme toggling for different viewing preferences.

## Tech Stack

### Frontend
* **Framework:** React 18 & Vite
* **Styling:** Tailwind CSS
* **UI Components:** Radix UI & shadcn/ui
* **Animations:** Framer Motion & tailwindcss-animate
* **Data Fetching:** React Query & Axios
* **Charts:** Recharts
* **Forms & Validation:** React Hook Form & Zod

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **Middlewares:** cors, express-rate-limit

### Infrastructure
* **Containerization:** Docker & Docker Compose

## Architecture

The project is structured as a full-stack application:
- **`src/` (Frontend):** Contains the React application. It communicates with the backend proxy to fetch cryptocurrency data.
- **`server/` (Backend Proxy):** An Express server running on port 4000. It intercepts requests from the frontend, queries the public CoinGecko API, caches the responses, and implements rate-limiting and retry logic to prevent `429 Too Many Requests` errors.

---

## Getting Started

These instructions will get a copy of the project running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (>= 18)
* npm or yarn
* Docker (optional, for containerized setup)

### Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/Sarthak-Saini07/spark-crypto-hub.git
   cd spark-crypto-hub
   ```

2. **Start the Backend Proxy**
   Open a terminal and run:
   ```bash
   cd server
   npm install
   npm start
   ```
   The proxy server will start on `http://localhost:4000`.

3. **Start the Frontend Development Server**
   Open a new terminal window in the root directory:
   ```bash
   npm install
   npm run dev
   ```
   The React app will be available at `http://localhost:8080` (or the port shown in your terminal).

### Docker Setup

You can run the entire stack (frontend and backend) using Docker Compose.

```bash
# In the root directory of the project
docker-compose up --build
```

- The frontend will be accessible at `http://localhost:3000`
- The backend proxy will be accessible at `http://localhost:4000`

---

## Configuration

If your app uses an API that requires a key or if you want to configure ports, create a `.env` file in the project root.

Example frontend `.env`:
```env
VITE_API_URL=http://localhost:4000/api
```

The backend server is configured to connect to `https://api.coingecko.com/api/v3/` by default.

## Usage

* Use the search bar to find coins by name or symbol.
* Click a coin to open its detail view and interactive chart.
* Add coins to your watchlist using the star (★) or the "Add" button.
* Toggle dark mode using the theme switch in the header.
* Switch global currencies via the settings or header dropdown.

## Contributing

Thanks for wanting to contribute! Follow these steps:

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/some-feature`.
3. Commit your changes: `git commit -m "feat: add ..."`.
4. Push to your branch: `git push origin feat/some-feature`.
5. Open a Pull Request and describe your changes.

Please open issues for bugs and feature requests. Keep PRs focused and include screenshots or GIFs when UI is affected.

## License

This project is open-source and available under the [MIT License](LICENSE).

---

*Happy hacking!* ✨
