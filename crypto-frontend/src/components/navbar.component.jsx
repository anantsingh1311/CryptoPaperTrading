import { Component } from "react";
import { Link } from "react-router-dom";

export default class Navbar extends Component {


  // create a function to remove token and the user from our local storage and take the user to our log in form 
  handleLogout=()=>{
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.assign("/login");

  }


  render() {

    // we create a variable for referncing the token to check if the user was logged in
    const isLoggedIn = localStorage.getItem("token");
    return (
      <nav className="w-full bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Logo / Brand */}
            <Link to="/" className="text-2xl font-extrabold text-white">
              <span className="text-violet-400">Tarar</span> Crypto
            </Link>

            {/* Navigation Links */}
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <li>
                <Link
                  to="/"
                  className="text-slate-300 hover:text-violet-400 font-semibold transition-colors"
                >
                  Home
                </Link>
              </li>
               {isLoggedIn &&(
              <li>
               
                <Link
                  to="/market"
                  className="text-slate-300 hover:text-violet-400 font-semibold transition-colors"
                >
                  Market
                </Link>
              </li>
              )}
              {isLoggedIn &&(
              <li>
                <Link
                  to="/paper-trading"
                  className="text-slate-300 hover:text-violet-400 font-semibold transition-colors"
                >
                  Paper Trading
                </Link>
              </li>
              )}
              {/* If is Logged in is true, then we need to hide our log-in bar: */
              !isLoggedIn &&
              (<li>
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-violet-400 font-semibold transition-colors"
                >
                  Login
                </Link>
              </li>
              )}
              { isLoggedIn && (
               <li> <Link
                  to="/profile"
                  className="text-slate-300 hover:text-violet-400 font-semibold transition-colors"
                >
                  Profile
                </Link>
                </li>
                )}
              {!isLoggedIn && (
              <li>
                <Link
                  to="/signup"
                  className="bg-violet-700 hover:bg-violet-800 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                >
                  Sign Up
                </Link>
              </li>
              )}
                 {isLoggedIn && (
              <li>
                <button onClick={this.handleLogout}>
                  Logout
                </button>
              </li>
              )}
             

            </ul>

          </div>
        </div>
      </nav>
    );
  }
}
