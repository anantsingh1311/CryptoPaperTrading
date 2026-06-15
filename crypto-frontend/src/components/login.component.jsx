import { Component } from "react";
import axios from "axios";
import { AUTH_API_BASE_URL } from "../config/api.js";

export default class Login extends Component {

  constructor(props){
  super(props)

  this.state={
    email:"",
    password:"",

  
  };
}

// Functions to handle event changes
emailOnChange=(event)=>{
// email change event to update the state of email
  this.setState({
    email:event.target.value
  });

}

passwordOnChange=(event)=>{
// passowrd change event fucntion
  this.setState ({
    password:event.target.value
  })

}


OnSubmit= async (event)=>{
  event.preventDefault();

  const {email,password} = this.state;

  // we created a palyoad where username is sent as an email option, to avoid adding username in the state, to make one variable handle username or email which is email
  const loginUser = {username:email.trim(),email:email.trim(),password:password}

  try{
    const response = await axios.post(`${AUTH_API_BASE_URL}/auth/login`,loginUser);
    // console.log(response.data);
    // alert("Log in Sucessful")
    // window.location.assign("/")

    // After login Succeeds, store the token in local storage 
    localStorage.setItem("token",response.data.token);
    localStorage.setItem("user",JSON.stringify(response.data));

    // then redirect to our home page:
      window.location.assign("/profile");
    

  }catch(err){
    console.error(err);
    if(err){
      console.log(err.response.data) || "Log in Failed"
    }
    else{
      alert("Backend not responding");
    }
  }

  // console.log(`Logged in ${email},${password}`)
  // window.location.assign("/");
  }

render() {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-lg">

          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-violet-400 font-semibold mb-2">
              Welcome Back Trader
            </p>

            <h1 className="text-3xl font-extrabold">
              Login
            </h1>

            <p className="text-slate-400 mt-3">
              Access your paper trading account and continue practicing crypto trades.
            </p>
          </div>

          {/* Login Form onSubmit={this.handleSubmit} */}
          <form onSubmit={this.OnSubmit} className="flex flex-col gap-5">

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                Email Address or Username
              </label>

              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white outline-none focus:border-violet-500"
                type="text"
                placeholder="Enter your email"
                value={this.state.email}
                onChange={this.emailOnChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                Password
              </label>

              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white outline-none focus:border-violet-500"
                type="password"
                placeholder="Enter your password"
                value={this.state.password}
                onChange={this.passwordOnChange}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400">
                <input type="checkbox" className="accent-violet-700" />
                Remember me
              </label>

              <span className="text-violet-400 font-semibold cursor-pointer hover:underline">
                Forgot password?
              </span>
            </div>

            <button
              className="w-full bg-violet-700 hover:bg-violet-800 text-white px-6 py-3 rounded-lg font-bold mt-2"
              type="submit"
            >
              Login
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Do not have an account?{" "}
              <span className="text-violet-400 font-semibold cursor-pointer hover:underline">
                Sign up
              </span>
            </p>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-300">
              Login to view your{" "}
              <span className="text-green-400 font-bold">virtual trading balance</span>, open trades,
              portfolio performance, and crypto market activity.
            </p>
          </div>

        </div>
      </div>
    );
  }
}
