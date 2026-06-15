import {Component} from "react";
import axios from "axios";
import { PORTFOLIO_API_BASE_URL } from "../config/api.js";

// The function of this component is to fetch a profile from portfolio-service(backend) and display the data
export default class Profile extends Component{

    constructor(props){
        super(props);

        this.state={
            username:"",
            emailId:"",
            balance:"",
            isLoading:true,
            errorMessage:"",
        }
    }

    // componentDidMount runs automatically when the Profile page opens.
    // This is where we fetch portfolio data because the page is ready to show backend data.
    componentDidMount(){
        this.fetchPortfolio();
    }

    fetchPortfolio=async()=>{

        // Get the JWT token saved during login.
        // This follows the same localStorage flow already used in login.component.jsx.
        const token = localStorage.getItem("token");

        // If token is missing, the user should not stay on the protected portfolio page.
        if(!token){
            window.location.assign("/login");
            return;
        }

        try{
            // Send the JWT token to portfolio-service.
            // Backend SecurityConfig reads this Authorization header before the controller runs.
            // This URL must match PortfolioController's /portfolio/information endpoint.
            const response = await axios.get(`${PORTFOLIO_API_BASE_URL}/portfolio/information`,{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            });

            // PortfolioDTO from backend returns userId, emailId, and balance.
            // We store only the fields needed to display this page.
            this.setState({
                username:response.data.userId,
                emailId:response.data.emailId,
                balance:response.data.balance,
                isLoading:false,
                errorMessage:"",
            });

        }catch(err){
            console.error(err);

            // If the token is expired/invalid, clear local auth data and send user to login.
            if(err.response && err.response.status === 401){
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.assign("/login");
                return;
            }

            // Keep the user on the page and show a clear message for normal backend failures.
            this.setState({
                isLoading:false,
                errorMessage:"Portfolio service is not responding right now.",
            });
        }
    }

    render(){
        return(
            <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
                <div className="mx-auto max-w-6xl">

                {/* Portfolio page header */}
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold text-violet-400">
                        Portfolio Dashboard
                    </p>

                    <h1 className="text-3xl font-extrabold md:text-4xl">
                        Portfolio for {this.state.username || "Trader"}
                    </h1>

                    <p className="mt-3 max-w-2xl text-slate-400">
                        Your portfolio details are loaded securely from your trading account.
                    </p>
                </div>

                {/* Loading message while backend request is still running */}
                {this.state.isLoading && (
                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-300 shadow-lg">
                        Fetching your portfolio...
                    </div>
                )}

                {/* Error message if portfolio-service does not return data */}
                {this.state.errorMessage && (
                    <div className="rounded-xl border border-red-800 bg-red-950/50 p-6 text-red-200 shadow-lg">
                        {this.state.errorMessage}
                    </div>
                )}

                {/* Portfolio data card */}
                {!this.state.isLoading && !this.state.errorMessage && (
                    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-lg">
                    <div className="border-b border-slate-700 bg-slate-800 px-6 py-5">
                        <h2 className="text-xl font-bold">
                            Account Overview
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Your current demo trading account information.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                        <tr className="border-b border-slate-700 bg-slate-800 text-sm uppercase tracking-wide text-slate-400">
                            <th className="px-6 py-4"> Username </th>
                            <th className="px-6 py-4"> Email Id </th>
                            <th className="px-6 py-4"> Starting Balance </th>
                        </tr>
                        </thead>

                        <tbody>
                        <tr className="border-b border-slate-800 text-slate-200">
                            <td className="px-6 py-5 font-semibold text-white"> {this.state.username} </td>
                            <td className="px-6 py-5"> {this.state.emailId} </td>
                            <td className="px-6 py-5 font-bold text-green-400">
                                ${Number(this.state.balance).toLocaleString()}
                            </td>
                        </tr>
                        </tbody>

                    </table>
                    </div>

                    <div className="grid gap-4 border-t border-slate-800 p-6 md:grid-cols-3">
                        {/* Quick display card for username */}
                        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                            <p className="text-sm text-slate-400">Username</p>
                            <p className="mt-2 font-bold text-white">{this.state.username}</p>
                        </div>

                        {/* Quick display card for email */}
                        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                            <p className="text-sm text-slate-400">Email</p>
                            <p className="mt-2 break-words font-bold text-white">{this.state.emailId}</p>
                        </div>

                        {/* Quick display card for virtual starting balance */}
                        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                            <p className="text-sm text-slate-400">Virtual Balance</p>
                            <p className="mt-2 text-2xl font-extrabold text-green-400">
                                ${Number(this.state.balance).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
                )}
                </div>
            </div>

        )
    }
}
