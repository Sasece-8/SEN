import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user-context';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  function submitHandler(e) {
    e.preventDefault();
    axios.post('/users/login', { email, password })
      .then((res) => {
        console.log(res.data);
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        navigate('/');
      }).catch((err) => {
        console.error(err);
      });
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-black bg-glow p-4">
      <div className="glass p-10 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-white mb-2">Welcome <span className="text-brand-pink">Back</span></h2>
          <p className="text-brand-zinc-400">Log in to your account to continue</p>
        </div>
        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-brand-zinc-400 mb-2" htmlFor="email">Email Address</label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              className="w-full px-4 py-3 bg-brand-zinc-900/50 border border-brand-zinc-800 rounded-xl focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink outline-none transition-all text-white placeholder:text-brand-zinc-600"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-zinc-400 mb-2" htmlFor="password">Password</label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              className="w-full px-4 py-3 bg-brand-zinc-900/50 border border-brand-zinc-800 rounded-xl focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink outline-none transition-all text-white placeholder:text-brand-zinc-600"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-brand-pink hover:bg-brand-pink/90 text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] glow-pink shadow-lg shadow-brand-pink/20"
          >
            Sign In
          </button>
        </form>
        <p className="text-brand-zinc-400 mt-8 text-center">
          Don't have an account? <Link to="/register" className="text-brand-pink hover:underline font-semibold ml-1">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
