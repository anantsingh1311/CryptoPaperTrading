import { Component } from "react";

import { getCryptoChart, getCryptoPrices } from "../services/market.service.js";
import {
  executePaperTrade,
  getPaperAccount,
} from "../services/paperTrade.service.js";

const DEFAULT_COINS = ["bitcoin", "ethereum", "solana"];
const DEFAULT_CURRENCY = "usd";
const DASHBOARD_REFRESH_MS = 45000;
const LIVE_TICK_REFRESH_MS = 10000;
const LIVE_SERIES_LIMIT = 140;
const TIMEFRAMES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
];

export default class PaperTrading extends Component {
  constructor(props) {
    super(props);

    this.state = {
      prices: [],
      charts: {},
      liveSeries: {},
      account: null,
      selectedCoinId: "bitcoin",
      selectedTimeframeDays: 1,
      side: "BUY",
      quantity: "0.01",
      isLoading: true,
      isRefreshing: false,
      isChartLoading: false,
      isSubmitting: false,
      errorMessage: "",
      orderMessage: "",
      liveStatusMessage: "",
      fetchedAt: "",
      lastTickAt: "",
      lastTickDirection: {},
    };

    this.dashboardRefreshTimer = null;
    this.liveTickTimer = null;
  }

  componentDidMount() {
    this.loadDashboard();

    /*
     * The dashboard refresh keeps account value, holdings, and market cards aligned
     * with backend data. It uses normal cached market data so the full page remains
     * gentle on the provider API.
     */
    this.dashboardRefreshTimer = window.setInterval(() => {
      this.loadDashboard(false);
    }, DASHBOARD_REFRESH_MS);

    /*
     * The live tick loop is intentionally separate from the full dashboard refresh.
     * It fetches only the selected asset with fresh=true and appends that point to
     * the SVG line, giving the trading screen a moving market feel.
     */
    this.liveTickTimer = window.setInterval(() => {
      this.refreshLiveTick();
    }, LIVE_TICK_REFRESH_MS);
  }

  componentWillUnmount() {
    if (this.dashboardRefreshTimer) {
      window.clearInterval(this.dashboardRefreshTimer);
    }

    if (this.liveTickTimer) {
      window.clearInterval(this.liveTickTimer);
    }
  }

  loadDashboard = async (showFullLoading = true) => {
    if (showFullLoading) {
      this.setState({
        isLoading: true,
        errorMessage: "",
      });
    } else {
      this.setState({
        isRefreshing: true,
        errorMessage: "",
      });
    }

    try {
      /*
       * The first load still gathers everything the page already needs:
       * account summary, current prices, and seeded historical chart points.
       */
      const [marketResponse, accountResponse, ...chartResponses] =
        await Promise.all([
          getCryptoPrices(DEFAULT_COINS, DEFAULT_CURRENCY),
          getPaperAccount(),
          ...DEFAULT_COINS.map((coinId) =>
            getCryptoChart(
              coinId,
              DEFAULT_CURRENCY,
              this.state.selectedTimeframeDays
            )
          ),
        ]);

      const prices = marketResponse.prices || [];
      const charts = {};
      const liveSeries = {};

      chartResponses.forEach((chart) => {
        const matchingCoin = prices.find((coin) => coin.coinId === chart.coinId);

        charts[chart.coinId] = chart;
        liveSeries[chart.coinId] = this.buildLiveSeriesFromChart(
          chart,
          matchingCoin
        );
      });

      this.setState(
        {
          prices,
          charts,
          liveSeries,
          account: accountResponse,
          fetchedAt: marketResponse.fetchedAt || new Date().toISOString(),
          lastTickAt: marketResponse.fetchedAt || new Date().toISOString(),
          isLoading: false,
          isRefreshing: false,
          errorMessage: "",
          liveStatusMessage: "",
        },
        () => this.refreshLiveTick()
      );
    } catch (err) {
      this.handleRequestError(err, "Paper trading is not available right now.");
    }
  };

  loadSelectedChart = async (days) => {
    const selectedCoin = this.getSelectedCoin();

    if (!selectedCoin) {
      return;
    }

    this.setState({
      selectedTimeframeDays: days,
      isChartLoading: true,
      errorMessage: "",
      orderMessage: "",
    });

    try {
      /*
       * Timeframe changes only replace the selected market chart. The order panel,
       * account summary, holdings, and trade history stay untouched.
       */
      const chart = await getCryptoChart(
        selectedCoin.coinId,
        DEFAULT_CURRENCY,
        days
      );

      this.setState(
        (previousState) => ({
          charts: {
            ...previousState.charts,
            [chart.coinId]: chart,
          },
          liveSeries: {
            ...previousState.liveSeries,
            [chart.coinId]: this.buildLiveSeriesFromChart(chart, selectedCoin),
          },
          isChartLoading: false,
        }),
        () => this.refreshLiveTick()
      );
    } catch (err) {
      this.handleRequestError(err, "The live chart could not be loaded.");
    }
  };

  refreshLiveTick = async () => {
    const selectedCoin = this.getSelectedCoin();

    if (!selectedCoin || this.state.isLoading) {
      return;
    }

    try {
      /*
       * fresh=true bypasses the normal backend market cache for this one selected
       * coin. Other page sections keep using the safer cached refresh path.
       */
      const response = await getCryptoPrices(
        [selectedCoin.coinId],
        DEFAULT_CURRENCY,
        { fresh: true }
      );
      const liveCoin = response.prices?.[0];

      if (!liveCoin || liveCoin.price === null || liveCoin.price === undefined) {
        return;
      }

      this.appendLiveTick(liveCoin, response.fetchedAt);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.assign("/login");
        return;
      }

      /*
       * A missed live tick should not break the trading page. The historical chart,
       * order form, and account data stay visible while the next tick retries.
       */
      this.setState({
        liveStatusMessage: "Waiting for the next live market tick...",
      });
    }
  };

  appendLiveTick = (liveCoin, fetchedAt) => {
    const tickTime = fetchedAt || new Date().toISOString();

    this.setState((previousState) => {
      const currentSeries = previousState.liveSeries[liveCoin.coinId] || [];
      const previousPoint = currentSeries[currentSeries.length - 1];
      const previousPrice = Number(previousPoint?.price || liveCoin.price);
      const nextPrice = Number(liveCoin.price);
      const direction =
        nextPrice > previousPrice
          ? "up"
          : nextPrice < previousPrice
            ? "down"
            : "flat";
      const nextPoint = {
        time: tickTime,
        price: liveCoin.price,
        isLiveTick: true,
      };
      const nextSeries = [...currentSeries, nextPoint].slice(-LIVE_SERIES_LIMIT);
      const updatedPrices = previousState.prices.map((coin) =>
        coin.coinId === liveCoin.coinId ? liveCoin : coin
      );

      return {
        prices: updatedPrices,
        liveSeries: {
          ...previousState.liveSeries,
          [liveCoin.coinId]: nextSeries,
        },
        fetchedAt: tickTime,
        lastTickAt: tickTime,
        lastTickDirection: {
          ...previousState.lastTickDirection,
          [liveCoin.coinId]: direction,
        },
        liveStatusMessage: "",
      };
    });
  };

  buildLiveSeriesFromChart = (chart, coin) => {
    const chartPoints = (chart?.points || []).slice(-LIVE_SERIES_LIMIT).map(
      (point) => ({
        time: point.time,
        price: point.price,
        isLiveTick: false,
      })
    );

    /*
     * Seed the graph with the latest card price too. That makes the first render
     * land on the same current price the user sees in the order panel.
     */
    if (coin?.price !== null && coin?.price !== undefined) {
      chartPoints.push({
        time: new Date().toISOString(),
        price: coin.price,
        isLiveTick: true,
      });
    }

    return chartPoints.slice(-LIVE_SERIES_LIMIT);
  };

  handleRequestError = (err, fallbackMessage) => {
    console.error(err);

    if (err.response && err.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.assign("/login");
      return;
    }

    this.setState({
      isLoading: false,
      isRefreshing: false,
      isChartLoading: false,
      isSubmitting: false,
      errorMessage: err.response?.data?.message || fallbackMessage,
    });
  };

  handleTradeSubmit = async (event) => {
    event.preventDefault();

    const selectedCoin = this.getSelectedCoin();
    const quantityNumber = Number(this.state.quantity);

    if (!selectedCoin || Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      this.setState({
        orderMessage: "",
        errorMessage: "Enter a trade quantity greater than zero.",
      });
      return;
    }

    this.setState({
      isSubmitting: true,
      errorMessage: "",
      orderMessage: "",
    });

    try {
      /*
       * The order still sends only intent. portfolio-service owns execution price,
       * paper cash checks, holding updates, and trade history.
       */
      const execution = await executePaperTrade({
        coinId: selectedCoin.coinId,
        symbol: selectedCoin.symbol,
        side: this.state.side,
        quantity: this.state.quantity,
      });

      this.setState({
        isSubmitting: false,
        orderMessage: `${execution.side} ${this.formatNumber(
          execution.quantity,
          8
        )} ${execution.symbol} filled at ${this.formatMoney(
          execution.executionPrice,
          execution.currency
        )}.`,
      });

      await this.loadDashboard(false);
    } catch (err) {
      this.handleRequestError(err, "The paper trade could not be placed.");
    }
  };

  selectCoin = (coinId) => {
    this.setState(
      {
        selectedCoinId: coinId,
        orderMessage: "",
        errorMessage: "",
        liveStatusMessage: "",
      },
      () => this.refreshLiveTick()
    );
  };

  changeSide = (side) => {
    this.setState({
      side,
      orderMessage: "",
      errorMessage: "",
    });
  };

  changeQuantity = (event) => {
    this.setState({
      quantity: event.target.value,
      orderMessage: "",
      errorMessage: "",
    });
  };

  getSelectedCoin = () => {
    return (
      this.state.prices.find(
        (coin) => coin.coinId === this.state.selectedCoinId
      ) || this.state.prices[0]
    );
  };

  formatMoney = (value, currency = DEFAULT_CURRENCY, options = {}) => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: Number(value) >= 1 ? 2 : 6,
      ...options,
    }).format(Number(value));
  };

  formatCompactMoney = (value, currency = DEFAULT_CURRENCY) => {
    return this.formatMoney(value, currency, {
      notation: "compact",
      maximumFractionDigits: 2,
    });
  };

  formatNumber = (value, maximumFractionDigits = 6) => {
    if (value === null || value === undefined || value === "") {
      return "N/A";
    }

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits,
    }).format(Number(value));
  };

  formatPercent = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    return `${Number(value).toFixed(2)}%`;
  };

  formatDateTime = (value) => {
    if (!value) {
      return "N/A";
    }

    return new Date(value).toLocaleString();
  };

  formatShortTime = (value) => {
    if (!value) {
      return "";
    }

    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  getPnlClass = (value) => {
    return Number(value || 0) >= 0 ? "text-green-400" : "text-red-400";
  };

  getDirectionClasses = (coinId) => {
    const direction = this.state.lastTickDirection[coinId];

    if (direction === "down") {
      return {
        text: "text-red-300",
        background: "bg-red-500/10",
        border: "border-red-500/40",
      };
    }

    if (direction === "up") {
      return {
        text: "text-green-300",
        background: "bg-green-500/10",
        border: "border-green-500/40",
      };
    }

    return {
      text: "text-sky-300",
      background: "bg-sky-500/10",
      border: "border-sky-500/30",
    };
  };

  renderSummaryCard = (label, value, toneClass = "text-white") => {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-lg">
        <p className="text-sm font-semibold text-slate-400">{label}</p>
        <p className={`mt-2 text-2xl font-extrabold ${toneClass}`}>{value}</p>
      </div>
    );
  };

  renderMarketSelector = () => {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        {this.state.prices.map((coin) => {
          const isSelected = coin.coinId === this.state.selectedCoinId;
          const isPositive = Number(coin.change24h || 0) >= 0;
          const directionClasses = this.getDirectionClasses(coin.coinId);

          return (
            <button
              className={`rounded-xl border p-4 text-left transition-colors ${
                isSelected
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-slate-700 bg-slate-800 hover:border-slate-500"
              }`}
              key={coin.coinId}
              onClick={() => this.selectCoin(coin.coinId)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-extrabold text-violet-300">
                    {coin.symbol}
                  </span>

                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-white">
                      {coin.name}
                    </p>
                    <p className="text-xs uppercase text-slate-500">
                      {coin.coinId}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    isPositive
                      ? "bg-green-500/10 text-green-300"
                      : "bg-red-500/10 text-red-300"
                  }`}
                >
                  {this.formatPercent(coin.change24h)}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <p className="text-lg font-extrabold text-white">
                  {this.formatMoney(coin.price, coin.currency)}
                </p>

                <span
                  className={`rounded-full border px-2 py-1 text-xs font-bold ${directionClasses.border} ${directionClasses.background} ${directionClasses.text}`}
                >
                  Live
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  renderLiveChart = (selectedCoin) => {
    const series = this.state.liveSeries[selectedCoin.coinId] || [];

    if (series.length < 2) {
      return (
        <div className="flex h-[360px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-500">
          Loading live market graph...
        </div>
      );
    }

    /*
     * Graph visibility fix:
     * The chart now gets a wider viewBox and more axis padding so price labels,
     * the live marker, and the right-side price badge do not look cramped.
     */
    const width = 1000;
    const height = 430;
    const paddingLeft = 92;
    const paddingRight = 128;
    const paddingTop = 34;
    const paddingBottom = 58;
    const prices = series.map((point) => Number(point.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    const direction = this.state.lastTickDirection[selectedCoin.coinId];
    const isDown = direction === "down";
    const strokeColor = isDown ? "#f87171" : "#22c55e";
    const fillColor = isDown ? "#f8717122" : "#22c55e22";

    /*
     * Convert each live tick into chart coordinates. The x-axis is based on point
     * order, which works well for short polling intervals and keeps the graph smooth.
     */
    const coordinates = series.map((point, index) => {
      const x =
        paddingLeft + (index / (series.length - 1)) * plotWidth;
      const y =
        paddingTop +
        (1 - (Number(point.price) - minPrice) / priceRange) * plotHeight;

      return {
        x,
        y,
        point,
      };
    });
    const linePath = coordinates
      .map((coordinate, index) =>
        `${index === 0 ? "M" : "L"} ${coordinate.x} ${coordinate.y}`
      )
      .join(" ");
    const areaLinePath = coordinates
      .map((coordinate) => `${coordinate.x} ${coordinate.y}`)
      .join(" L ");
    const firstCoordinate = coordinates[0];
    const latestCoordinate = coordinates[coordinates.length - 1];
    const baseline = height - paddingBottom;
    /*
     * Graph visibility fix:
     * The old filled-area path reused a line path that started with "M", which
     * created a large diagonal fill across the graph. This path uses one continuous
     * polygon under the market line, so the live line stays readable.
     */
    const areaPath = `M ${firstCoordinate.x} ${baseline} L ${areaLinePath} L ${latestCoordinate.x} ${baseline} Z`;
    const gridRows = [0, 0.25, 0.5, 0.75, 1];
    const currentPrice = Number(latestCoordinate.point.price);
    const firstTime = series[0]?.time;
    const latestTime = latestCoordinate.point.time;
    const priceTagWidth = 118;
    const priceTagX = Math.min(
      latestCoordinate.x + 16,
      width - priceTagWidth - 10
    );

    return (
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4">
        <svg
          aria-label={`${selectedCoin.name} live market graph`}
          className="h-[430px] min-h-[360px] w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          viewBox={`0 0 ${width} ${height}`}
        >
          <rect fill="#020617" height={height} width={width} x="0" y="0" />

          {gridRows.map((ratio) => {
            const y = paddingTop + ratio * plotHeight;
            const priceLabel = maxPrice - ratio * priceRange;

            return (
              <g key={ratio}>
                <line
                  stroke="#1e293b"
                  strokeDasharray="6 8"
                  strokeWidth="1"
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                />
                <text
                  fill="#94a3b8"
                  fontSize="12"
                  textAnchor="end"
                  x={paddingLeft - 12}
                  y={y + 4}
                >
                  {this.formatMoney(priceLabel, selectedCoin.currency, {
                    notation: Number(priceLabel) > 100000 ? "compact" : "standard",
                    maximumFractionDigits: 2,
                  })}
                </text>
              </g>
            );
          })}

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const x = paddingLeft + ratio * plotWidth;

            return (
              <line
                key={ratio}
                stroke="#0f172a"
                strokeWidth="1"
                x1={x}
                x2={x}
                y1={paddingTop}
                y2={baseline}
              />
            );
          })}

          <path d={areaPath} fill={fillColor} />
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />

          <line
            stroke={strokeColor}
            strokeDasharray="4 8"
            strokeWidth="1.5"
            x1={latestCoordinate.x}
            x2={latestCoordinate.x}
            y1={paddingTop}
            y2={baseline}
          />

          <circle
            cx={latestCoordinate.x}
            cy={latestCoordinate.y}
            fill={strokeColor}
            r="5"
          >
            <animate
              attributeName="r"
              dur="1.4s"
              repeatCount="indefinite"
              values="5;10;5"
            />
            <animate
              attributeName="opacity"
              dur="1.4s"
              repeatCount="indefinite"
              values="1;0.35;1"
            />
          </circle>

          <rect
            fill={strokeColor}
            height="28"
            rx="6"
            width={priceTagWidth}
            x={priceTagX}
            y={latestCoordinate.y - 15}
          />
          <text
            fill="#ffffff"
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
            x={priceTagX + priceTagWidth / 2}
            y={latestCoordinate.y + 4}
          >
            {this.formatMoney(currentPrice, selectedCoin.currency, {
              maximumFractionDigits: 2,
            })}
          </text>

          <text
            fill="#64748b"
            fontSize="12"
            textAnchor="start"
            x={paddingLeft}
            y={height - 12}
          >
            {this.formatShortTime(firstTime)}
          </text>
          <text
            fill="#64748b"
            fontSize="12"
            textAnchor="end"
            x={width - paddingRight}
            y={height - 12}
          >
            {this.formatShortTime(latestTime)}
          </text>
        </svg>
      </div>
    );
  };

  renderLiveStats = (selectedCoin) => {
    const price = Number(selectedCoin.price || 0);
    const bid = price * 0.9995;
    const ask = price * 1.0005;
    const directionClasses = this.getDirectionClasses(selectedCoin.coinId);

    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div
          className={`rounded-xl border p-4 ${directionClasses.border} ${directionClasses.background}`}
        >
          <p className="text-sm font-semibold text-slate-400">Live Price</p>
          <p className={`mt-2 text-3xl font-extrabold ${directionClasses.text}`}>
            {this.formatMoney(selectedCoin.price, selectedCoin.currency)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Last tick {this.formatShortTime(this.state.lastTickAt)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-400">24h Change</span>
            <span className={this.getPnlClass(selectedCoin.change24h)}>
              {this.formatPercent(selectedCoin.change24h)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-700 pt-3 text-sm">
            <span className="text-slate-400">24h Volume</span>
            <span className="font-semibold text-slate-100">
              {this.formatCompactMoney(
                selectedCoin.volume24h,
                selectedCoin.currency
              )}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-400">Market Cap</p>
          <p className="mt-3 text-xl font-extrabold text-white">
            {this.formatCompactMoney(
              selectedCoin.marketCap,
              selectedCoin.currency
            )}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Live data from portfolio-service
          </p>
        </div>

        {/* UI/UX fix: BID/ASK boxes stack in tight columns so long prices stay inside each card. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <div className="min-w-0 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
            <p className="text-xs font-bold uppercase text-green-300">Bid</p>
            {/* Long crypto prices can be wide, so break-words keeps the value inside the box. */}
            <p className="mt-2 break-words text-lg font-extrabold leading-tight text-white sm:text-xl xl:text-lg 2xl:text-xl">
              {this.formatMoney(bid, selectedCoin.currency)}
            </p>
          </div>

          <div className="min-w-0 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-xs font-bold uppercase text-red-300">Ask</p>
            {/* Same wrapping rule for ASK so both quote cards behave consistently. */}
            <p className="mt-2 break-words text-lg font-extrabold leading-tight text-white sm:text-xl xl:text-lg 2xl:text-xl">
              {this.formatMoney(ask, selectedCoin.currency)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  renderLiveTradingView = () => {
    const selectedCoin = this.getSelectedCoin();

    if (!selectedCoin) {
      return (
        <section className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
          <p className="text-slate-400">Loading live market...</p>
        </section>
      );
    }

    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-violet-400">
                Live Market
              </p>
              <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300">
                Streaming ticks
              </span>
            </div>

            <h2 className="text-3xl font-extrabold">
              {selectedCoin.name} / {selectedCoin.currency.toUpperCase()}
            </h2>
            <p className="mt-2 text-slate-400">
              Watch the selected market update while you practice orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {TIMEFRAMES.map((timeframe) => (
              <button
                className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                  this.state.selectedTimeframeDays === timeframe.days
                    ? "border-violet-500 bg-violet-700 text-white"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                }`}
                disabled={this.state.isChartLoading}
                key={timeframe.label}
                onClick={() => this.loadSelectedChart(timeframe.days)}
                type="button"
              >
                {timeframe.label}
              </button>
            ))}
          </div>
        </div>

        {this.renderMarketSelector()}

        {/* UI/UX fix: stats moved above the chart so the graph gets the full row width. */}
        <div className="mt-6">{this.renderLiveStats(selectedCoin)}</div>

        <div className="mt-6">
          <div>
            {this.state.isChartLoading ? (
              <div className="flex h-[462px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-sm text-slate-500">
                Refreshing chart...
              </div>
            ) : (
              this.renderLiveChart(selectedCoin)
            )}

            {this.state.liveStatusMessage && (
              <p className="mt-3 text-sm text-slate-500">
                {this.state.liveStatusMessage}
              </p>
            )}
          </div>
        </div>
      </section>
    );
  };

  renderOrderPanel = () => {
    const selectedCoin = this.getSelectedCoin();
    const estimatedValue =
      selectedCoin && this.state.quantity
        ? Number(selectedCoin.price) * Number(this.state.quantity || 0)
        : 0;

    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-lg">
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-violet-400">
            Paper Order
          </p>
          <h2 className="text-2xl font-extrabold">Place Practice Trade</h2>
        </div>

        <form className="grid gap-5" onSubmit={this.handleTradeSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Asset
            </label>

            <select
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-violet-500"
              onChange={(event) => this.selectCoin(event.target.value)}
              value={this.state.selectedCoinId}
            >
              {this.state.prices.map((coin) => (
                <option key={coin.coinId} value={coin.coinId}>
                  {coin.name} ({coin.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Side
            </label>

            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
              <button
                className={`px-4 py-3 font-bold transition-colors ${
                  this.state.side === "BUY"
                    ? "bg-green-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
                onClick={() => this.changeSide("BUY")}
                type="button"
              >
                Buy
              </button>

              <button
                className={`border-l border-slate-700 px-4 py-3 font-bold transition-colors ${
                  this.state.side === "SELL"
                    ? "bg-red-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
                onClick={() => this.changeSide("SELL")}
                type="button"
              >
                Sell
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Quantity
            </label>

            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-violet-500"
              min="0"
              onChange={this.changeQuantity}
              placeholder="0.01"
              step="0.00000001"
              type="number"
              value={this.state.quantity}
            />
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-400">Estimated Value</span>
              <span className="font-bold text-white">
                {this.formatMoney(estimatedValue)}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-700 pt-3 text-sm">
              <span className="text-slate-400">Available Cash</span>
              <span className="font-bold text-green-400">
                {this.formatMoney(this.state.account?.cashBalance)}
              </span>
            </div>
          </div>

          <button
            className="rounded-lg bg-violet-700 px-5 py-3 font-bold text-white transition-colors hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={this.state.isSubmitting || !selectedCoin}
            type="submit"
          >
            {this.state.isSubmitting ? "Placing Order..." : "Place Paper Order"}
          </button>
        </form>
      </section>
    );
  };

  renderHoldingsTable = () => {
    const holdings = this.state.account?.holdings || [];

    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900 shadow-lg">
        <div className="border-b border-slate-700 bg-slate-800 px-6 py-5">
          <h2 className="text-xl font-bold">Open Holdings</h2>
          <p className="mt-1 text-sm text-slate-400">
            Current paper positions valued with live backend prices.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800 text-sm uppercase tracking-wide text-slate-400">
                <th className="px-6 py-4">Coin</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Avg Price</th>
                <th className="px-6 py-4">Value</th>
                <th className="px-6 py-4">Unrealized P/L</th>
              </tr>
            </thead>

            <tbody>
              {holdings.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-slate-400" colSpan="5">
                    No open paper holdings yet.
                  </td>
                </tr>
              )}

              {holdings.map((holding) => (
                <tr
                  className="border-b border-slate-800 text-slate-200"
                  key={holding.coinId}
                >
                  <td className="px-6 py-5 font-bold text-white">
                    {holding.symbol}
                  </td>
                  <td className="px-6 py-5">
                    {this.formatNumber(holding.quantity, 8)}
                  </td>
                  <td className="px-6 py-5">
                    {this.formatMoney(holding.averagePrice)}
                  </td>
                  <td className="px-6 py-5 font-semibold">
                    {this.formatMoney(holding.currentValue)}
                  </td>
                  <td
                    className={`px-6 py-5 font-bold ${this.getPnlClass(
                      holding.unrealizedPnl
                    )}`}
                  >
                    {this.formatMoney(holding.unrealizedPnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  renderTradeHistory = () => {
    const trades = this.state.account?.recentTrades || [];

    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900 shadow-lg">
        <div className="border-b border-slate-700 bg-slate-800 px-6 py-5">
          <h2 className="text-xl font-bold">Recent Paper Trades</h2>
          <p className="mt-1 text-sm text-slate-400">
            The latest simulated fills from this practice account.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800 text-sm uppercase tracking-wide text-slate-400">
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Side</th>
                <th className="px-6 py-4">Coin</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Notional</th>
                <th className="px-6 py-4">Realized P/L</th>
              </tr>
            </thead>

            <tbody>
              {trades.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-slate-400" colSpan="7">
                    No paper trades placed yet.
                  </td>
                </tr>
              )}

              {trades.map((trade) => (
                <tr
                  className="border-b border-slate-800 text-slate-200"
                  key={`${trade.executedAt}-${trade.symbol}-${trade.side}`}
                >
                  <td className="px-6 py-5 text-sm text-slate-400">
                    {this.formatDateTime(trade.executedAt)}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold ${
                        trade.side === "BUY"
                          ? "bg-green-500/10 text-green-300"
                          : "bg-red-500/10 text-red-300"
                      }`}
                    >
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-bold text-white">
                    {trade.symbol}
                  </td>
                  <td className="px-6 py-5">
                    {this.formatNumber(trade.quantity, 8)}
                  </td>
                  <td className="px-6 py-5">
                    {this.formatMoney(trade.executionPrice, trade.currency)}
                  </td>
                  <td className="px-6 py-5 font-semibold">
                    {this.formatMoney(trade.notionalValue, trade.currency)}
                  </td>
                  <td
                    className={`px-6 py-5 font-bold ${this.getPnlClass(
                      trade.realizedPnl
                    )}`}
                  >
                    {this.formatMoney(trade.realizedPnl, trade.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  render() {
    const account = this.state.account;

    return (
      <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold text-violet-400">
                Paper Trading
              </p>
              <h1 className="text-3xl font-extrabold md:text-4xl">
                Practice Trading Dashboard
              </h1>
              {this.state.fetchedAt && (
                <p className="mt-3 text-slate-400">
                  Refreshed {this.formatDateTime(this.state.fetchedAt)}
                </p>
              )}
            </div>

            <button
              className="rounded-lg bg-violet-700 px-5 py-3 font-bold text-white transition-colors hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-slate-700"
              disabled={this.state.isRefreshing}
              onClick={() => this.loadDashboard(false)}
              type="button"
            >
              {this.state.isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {this.state.isLoading && (
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-300 shadow-lg">
              Loading paper trading dashboard...
            </div>
          )}

          {this.state.errorMessage && (
            <div className="mb-6 rounded-xl border border-red-800 bg-red-950/50 p-6 text-red-200 shadow-lg">
              {this.state.errorMessage}
            </div>
          )}

          {this.state.orderMessage && (
            <div className="mb-6 rounded-xl border border-green-800 bg-green-950/40 p-6 text-green-200 shadow-lg">
              {this.state.orderMessage}
            </div>
          )}

          {!this.state.isLoading && (
            <div className="grid gap-8">
              <div className="grid gap-4 md:grid-cols-4">
                {this.renderSummaryCard(
                  "Cash Balance",
                  this.formatMoney(account?.cashBalance),
                  "text-green-400"
                )}
                {this.renderSummaryCard(
                  "Holdings Value",
                  this.formatMoney(account?.holdingsValue),
                  "text-sky-300"
                )}
                {this.renderSummaryCard(
                  "Total Equity",
                  this.formatMoney(account?.totalEquity),
                  "text-white"
                )}
                {this.renderSummaryCard(
                  "Total P/L",
                  this.formatMoney(account?.totalPnl),
                  this.getPnlClass(account?.totalPnl)
                )}
              </div>

              {/* Flow is unchanged: live market first, existing paper order next to it on wide screens. */}
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                {this.renderLiveTradingView()}
                {this.renderOrderPanel()}
              </div>

              {this.renderHoldingsTable()}
              {this.renderTradeHistory()}
            </div>
          )}
        </div>
      </div>
    );
  }
}
