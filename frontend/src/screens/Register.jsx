import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '../config/axios'
import { UserContext } from '../context/user-context'


const Register = () => {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const navigate = useNavigate()
    const { setUser } = useContext(UserContext)

    function submitHandler(e) {
        e.preventDefault()
        axios.post('/users/register', { email, password })
            .then((res) => {
                console.log("Register success:", res.data);
                localStorage.setItem('token', res.data.token)
                setUser(res.data.user)
                navigate('/');
            })
            .catch((err) => {
                if (err.response) {
                    console.error("Register failed:", err.response.status, err.response.data);
                } else {
                    console.error("Register request error:", err.message);
                }
            });

    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-brand-black bg-glow p-4">
            <div className="glass p-10 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-extrabold text-white mb-2">Create <span className="text-brand-pink">Account</span></h2>
                    <p className="text-brand-zinc-400">Join us and start building today</p>
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
                        Create Account
                    </button>
                </form>
                <p className="text-brand-zinc-400 mt-8 text-center">
                    Already have an account? <Link to="/login" className="text-brand-pink hover:underline font-semibold ml-1">Sign In</Link>
                </p>
            </div>
        </div>
    )
}

export default Register