import { Component } from "react";

import { getCryptoPrices } from "../services/market.service.js";

const DEFAULT_COINS = ["bitcoin", "ethereum", "solana"];
const DEFAULT_CURRENCY = "usd";

export default class MarketPrices extends Component {
  constructor(props) {
    super(props);

    this.state = {
      prices: [],
      isLoading: true,
      errorMessage: "",
      fetchedAt: "",
    };
  }

  componentDidMount() {
    this.fetchPrices();
  }

  fetchPrices = async () => {
    this.setState({
      isLoading: true,
      errorMessage: "",
    });

    try {
      const response = await getCryptoPrices(DEFAULT_COINS, DEFAULT_CURRENCY);

      this.setState({
        prices: response.prices || [],
        fetchedAt: response.fetchedAt || "",
        isLoading: false,
        errorMessage: "",
      });
    } catch (err) {
      console.error(err);

      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.assign("/login");
        return;
      }

      this.setState({
        prices: [],
        isLoading: false,
        errorMessage:
          err.response?.data?.message || "Market prices are not available right now.",
      });
    }
  };

  formatMoney = (value, currency, options = {}) => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: Number(value) >= 1 ? 2 : 6,
      ...options,
    }).format(Number(value));
  };

  formatCompactMoney = (value, currency) => {
    return this.formatMoney(value, currency, {
      notation: "compact",
      maximumFractionDigits: 2,
    });
  };

  formatChange = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    return `${Number(value).toFixed(2)}%`;
  };

  formatLastUpdated = (lastUpdatedAt) => {
    if (!lastUpdatedAt) {
      return "N/A";
    }

    return new Date(lastUpdatedAt * 1000).toLocaleString();
  };

  renderPriceCard = (coin) => {
    const changeNumber = Number(coin.change24h || 0);
    const isPositive = changeNumber >= 0;

    return (
      <article
        key={coin.coinId}
        className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-lg"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/15 text-sm font-extrabold text-sky-300">
                {coin.symbol}
              </span>

              <div>
                <h2 className="text-xl font-extrabold text-white">{coin.name}</h2>
                <p className="text-sm uppercase text-slate-500">{coin.coinId}</p>
              </div>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              isPositive
                ? "bg-green-500/10 text-green-300"
                : "bg-red-500/10 text-red-300"
            }`}
          >
            {this.formatChange(coin.change24h)}
          </span>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-400">Price</p>
          <p className="mt-1 text-3xl font-extrabold text-white">
            {this.formatMoney(coin.price, coin.currency)}
          </p>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-3">
            <span className="text-slate-400">Market Cap</span>
            <span className="font-semibold text-slate-100">
              {this.formatCompactMoney(coin.marketCap, coin.currency)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-3">
            <span className="text-slate-400">24h Volume</span>
            <span className="font-semibold text-slate-100">
              {this.formatCompactMoney(coin.volume24h, coin.currency)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-3">
            <span className="text-slate-400">Last Updated</span>
            <span className="text-right font-semibold text-slate-100">
              {this.formatLastUpdated(coin.lastUpdatedAt)}
            </span>
          </div>
        </div>
      </article>
    );
  };

  render() {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-sky-300">Live Market</p>
              <h1 className="text-3xl font-extrabold md:text-4xl">
                Crypto Market Prices
              </h1>
              {this.state.fetchedAt && (
                <p className="mt-3 text-slate-400">
                  Refreshed {new Date(this.state.fetchedAt).toLocaleString()}
                </p>
              )}
            </div>

            <button
              className="rounded-lg bg-sky-600 px-5 py-3 font-bold text-white transition-colors hover:bg-sky-700"
              onClick={this.fetchPrices}
              type="button"
            >
              Refresh
            </button>
          </div>

          {this.state.isLoading && (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-300 shadow-lg">
              Loading market prices...
            </div>
          )}

          {this.state.errorMessage && (
            <div className="rounded-xl border border-red-800 bg-red-950/50 p-6 text-red-200 shadow-lg">
              {this.state.errorMessage}
            </div>
          )}

          {!this.state.isLoading && !this.state.errorMessage && (
            <div className="grid gap-6 md:grid-cols-3">
              {this.state.prices.map(this.renderPriceCard)}
            </div>
          )}
        </div>
      </div>
    );
  }
}
