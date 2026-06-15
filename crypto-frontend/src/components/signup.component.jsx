import axios from "axios";
import { Component } from "react";
import { AUTH_API_BASE_URL } from "../config/api.js";

export default class Signup extends Component {

  constructor(props){
    super(props)

    this.state = {
      email:"",
      username:"",
      password:"",
      password2:"",

    }

  }




  // Functions to handle event changes
emailOnChange=(event)=>{
// email change event to update the state of email
  this.setState({
    email:event.target.value
  });

};

usernameOnChange=(event)=>{
// username change event, to update the state of username
  this.setState({
    username:event.target.value
  });

}

passwordOnChange=(event)=>{
// passowrd change event fucntion
  this.setState({
    password:event.target.value
  });

}

password2OnChange=(event)=>{
// password2OnChange event function
  this.setState({
    password2:event.target.value
  });
}

OnSubmit = async (event)=>{
event.preventDefault();

/*

// console.log(email,username,password1,password2);
Testing code
*/
// to reload the page after submission

// Create a new user and save all the info in it:

const{
  email,
  username,
  password,
  password2
} = this.state;

if(password !== password2){
  alert("passwords do not match")
  return;
}

const newUser = {
  email,username,password
};

try{
    const response = await axios.post(
    `${AUTH_API_BASE_URL}/auth/register`,
    newUser
  );
  console.log("User Registered",response.data)
  alert("account created!")
  window.location.assign("/login")

}catch(err){
  console.error(err)

  if(err.response){
    alert(err.response.data.message||"Sign up failed");
  }
  else{
    alert("Backend is not working properly, connection failed")
  }

}





window.location.assign("/login");
}


  render() {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-lg">
          
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-violet-400 font-semibold mb-2">
              Create Demo Trading Account
            </p>

            <h1 className="text-3xl font-extrabold">
              Sign Up
            </h1>

            <p className="text-slate-400 mt-3">
              Start practicing crypto trading with virtual funds.
            </p>
          </div>

          {/* Signup Form onSubmit={this.handleSubmit}*/}
          <form onSubmit={this.OnSubmit}  className="flex flex-col gap-5">
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                Email Address
              </label>

              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white outline-none focus:border-violet-500"
                type="email"
                placeholder="Enter your email"
                value={this.state.email}
                onChange={this.emailOnChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                Username
              </label>

              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white outline-none focus:border-violet-500"
                type="text"
                placeholder="Choose a username"
                value={this.state.username}
                onChange={this.usernameOnChange}
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
                placeholder="Create a password"
                value={this.state.password}
                onChange={this.passwordOnChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-300">
                Confirm Password
              </label>

              <input
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white outline-none focus:border-violet-500"
                type="password"
                placeholder="Re-enter your password"
                value={this.state.password2}
                onChange={this.password2OnChange}
                required
              />
            </div>

            <button
              className="w-full bg-violet-700 hover:bg-violet-800 text-white px-6 py-3 rounded-lg font-bold mt-2"
              type="submit"
            >
              Create Account
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <span className="text-violet-400 font-semibold cursor-pointer hover:underline">
                Log in
              </span>
            </p>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-sm text-slate-300">
              Your account will begin with{" "}
              <span className="text-green-400 font-bold">$100,000 virtual balance</span>{" "}
              for paper trading.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
