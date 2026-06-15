import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/navbar.component.jsx";
import Home from "./components/home.component.jsx";
import Login from "./components/login.component.jsx";
import Signup from "./components/signup.component.jsx";
import ProtectedRoutes from "./components/protectedRoutes.component.jsx";
import Profile from "./components/profile.component.jsx";
import MarketPrices from "./components/marketPrices.component.jsx";
import PaperTrading from "./components/paperTrading.component.jsx";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-white">

        {/* App Header */}
        <header className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="text-center">
              <p className="text-violet-400 font-semibold text-sm md:text-base mb-2">
                Tarar Co & Solutions
              </p>

              <h1 className="text-2xl md:text-4xl font-extrabold text-white">
                Crypto Trading & AI Analysis
              </h1>

              <p className="text-slate-400 mt-2 text-sm md:text-base">
                Practice crypto trading with virtual funds and AI-powered market insights.
              </p>
            </div>
          </div>
        </header>

        {/* Navbar */}
        <Navbar />

        {/* Page Routes */}
        <main>
          <Routes>
            <Route path="/" element={
              
              <Home />
             
            } />
            <Route path="/login" element={
            
              <Login />
            
              } />
            
            <Route path="/signup" element={
              
              <Signup />
            
              } />
            <Route path="/profile" element={
              <ProtectedRoutes>
             <Profile/> 
             </ProtectedRoutes>
            }/>
            <Route path="/market" element={
              <ProtectedRoutes>
                <MarketPrices />
              </ProtectedRoutes>
            } />
            <Route path="/paper-trading" element={
              <ProtectedRoutes>
                <PaperTrading />
              </ProtectedRoutes>
            } />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;
