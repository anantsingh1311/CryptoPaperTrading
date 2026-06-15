import { Component } from "react";
import { Link } from "react-router-dom";

export default class Home extends Component {
  render() {
    return (
      <div className="min-h-screen bg-slate-950 text-white px-6 py-10">
        <div className="max-w-6xl mx-auto">

          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center min-h-[80vh]">

            {/* Left Side */}
            <div>
              <p className="text-violet-400 font-semibold mb-3">
                Crypto Paper Trading Platform
              </p>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                Trade Crypto With Virtual Money
              </h1>

              <p className="text-slate-300 text-lg mb-8">
                Practice buying and selling crypto without risking real money.
                Test strategies, track your performance, and learn how the market
                moves using a demo trading account.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  className="bg-violet-700 hover:bg-violet-800 text-white px-6 py-3 rounded-lg font-bold text-center"
                  to="/paper-trading"
                >
                  Start Trading
                </Link>

                <Link
                  className="border border-violet-500 text-violet-300 hover:bg-violet-900 px-6 py-3 rounded-lg font-bold text-center"
                  to="/market"
                >
                  View Market
                </Link>
              </div>
            </div>

            {/* Right Side Demo Account Card */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-lg">
              <div className="mb-8">
                <p className="text-violet-400 font-semibold mb-2">
                  Demo Account
                </p>

                <h2 className="text-3xl font-extrabold">
                  Paper Trading Wallet
                </h2>

                <p className="text-slate-400 mt-2">
                  Your virtual balance for practicing crypto trades.
                </p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6">
                <p className="text-slate-400 text-sm mb-1">
                  Virtual Balance
                </p>

                <h3 className="text-4xl font-extrabold text-green-400">
                  $100,000
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                  <p className="text-slate-400 text-sm">Portfolio Value</p>
                  <h4 className="text-xl font-bold mt-1">$100,000</h4>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                  <p className="text-slate-400 text-sm">Total Profit</p>
                  <h4 className="text-xl font-bold mt-1 text-green-400">
                    +$0.00
                  </h4>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                  <p className="text-slate-400 text-sm">Open Trades</p>
                  <h4 className="text-xl font-bold mt-1">0</h4>
                </div>

                <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                  <p className="text-slate-400 text-sm">Mode</p>
                  <h4 className="text-xl font-bold mt-1 text-yellow-400">
                    Practice
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16">
            <div className="text-center mb-10">
              <p className="text-violet-400 font-semibold mb-2">
                Learn Before You Risk
              </p>

              <h2 className="text-3xl md:text-4xl font-extrabold">
                What You Can Do
              </h2>

              <p className="text-slate-400 mt-3">
                Build trading confidence before entering real markets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-3 text-violet-400">
                  Practice Trades
                </h3>

                <p className="text-slate-300">
                  Buy and sell crypto using virtual money so you can understand
                  market movement without financial risk.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-3 text-violet-400">
                  Track Portfolio
                </h3>

                <p className="text-slate-300">
                  Monitor demo balance, open positions, profit, loss, and your
                  overall trading performance.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-3 text-violet-400">
                  Test Strategies
                </h3>

                <p className="text-slate-300">
                  Try different crypto trading ideas before using real money in
                  live markets.
                </p>
              </div>
            </div>
          </div>

          {/* Market Preview Section */}
          <div className="mt-20 bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-violet-400 font-semibold mb-2">
                  Market Preview
                </p>

                <h2 className="text-2xl md:text-3xl font-extrabold">
                  Popular Crypto Assets
                </h2>
              </div>

              <Link
                className="bg-violet-700 hover:bg-violet-800 text-white px-5 py-2 rounded-lg font-semibold"
                to="/market"
              >
                See All Coins
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-4 pr-6">Coin</th>
                    <th className="py-4 pr-6">Price</th>
                    <th className="py-4 pr-6">24h Change</th>
                    <th className="py-4 pr-6">Action</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-4 pr-6 font-semibold">Bitcoin</td>
                    <td className="py-4 pr-6">$68,000</td>
                    <td className="py-4 pr-6 text-green-400 font-semibold">
                      +2.4%
                    </td>
                    <td className="py-4 pr-6">
                      <Link
                        className="bg-violet-700 hover:bg-violet-800 px-4 py-2 rounded-lg font-semibold"
                        to="/paper-trading"
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>

                  <tr className="border-b border-slate-800">
                    <td className="py-4 pr-6 font-semibold">Ethereum</td>
                    <td className="py-4 pr-6">$3,500</td>
                    <td className="py-4 pr-6 text-red-400 font-semibold">
                      -1.2%
                    </td>
                    <td className="py-4 pr-6">
                      <Link
                        className="bg-violet-700 hover:bg-violet-800 px-4 py-2 rounded-lg font-semibold"
                        to="/paper-trading"
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-4 pr-6 font-semibold">Solana</td>
                    <td className="py-4 pr-6">$150</td>
                    <td className="py-4 pr-6 text-green-400 font-semibold">
                      +4.8%
                    </td>
                    <td className="py-4 pr-6">
                      <Link
                        className="bg-violet-700 hover:bg-violet-800 px-4 py-2 rounded-lg font-semibold"
                        to="/paper-trading"
                      >
                        Trade
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-20 mb-10 bg-violet-700 rounded-2xl p-8 text-center shadow-lg">
            <h2 className="text-3xl font-extrabold mb-3">
              Ready to Practice Trading?
            </h2>

            <p className="text-violet-100 mb-6">
              Create a demo account and start trading crypto with virtual funds.
            </p>

            <Link
              className="inline-block bg-white text-violet-800 hover:bg-slate-100 px-6 py-3 rounded-lg font-bold"
              to="/signup"
            >
              Create Free Account
            </Link>
          </div>

        </div>
      </div>
    );
  }
}
