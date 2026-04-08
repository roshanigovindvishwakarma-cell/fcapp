import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const LoginPage = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            onLogin(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen atrium-mesh">
            {/* Left Side: Brand/Marketing */}
            <div className="hidden md:flex md:w-1/2 bg-[#059669] p-12 text-white flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-12">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-semibold tracking-tight">Atrium Chat</span>
                    </div>
                    
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Step into the <br /> Digital Atrium.
                    </h1>
                    <p className="text-white/80 text-lg max-w-sm">
                        Experience crystal-clear conversations in a space designed for professional clarity and organic flow.
                    </p>
                </div>

                <div className="relative z-10">
                    <div className="flex -space-x-2 mb-4">
                        {[1, 2, 3].map((i) => (
                            <img key={i} src={`https://i.pravatar.cc/40?img=${i+10}`} className="w-10 h-10 rounded-full border-2 border-primary-dark" alt="User" />
                        ))}
                        <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-primary-dark flex items-center justify-center text-xs font-medium backdrop-blur-sm">+10k</div>
                    </div>
                    <p className="text-sm font-medium tracking-widest uppercase opacity-60">Join thousands of professionals today</p>
                </div>
                
                {/* Abstract Background Element */}
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-black/10 rounded-full blur-3xl opacity-30"></div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-gray-50/30 dark:bg-slate-950/50">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-2xl shadow-emerald-900/5 dark:shadow-emerald-950/20 space-y-8 border border-transparent dark:border-slate-800"
                >
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
                        <p className="text-gray-500 dark:text-slate-400">Please enter your details to sign in.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                                <input 
                                    type="email" 
                                    required 
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-slate-800/50 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Password</label>
                                <a href="#" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">Forgot?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-slate-800/50 border-transparent focus:border-primary focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl transition-all outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-1">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-primary focus:ring-primary" id="remember" />
                            <label htmlFor="remember" className="text-sm text-gray-500 dark:text-slate-400 font-medium">Keep me signed in</label>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 bg-[#059669] hover:bg-[#047857] text-white rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group btn-hover-effect"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    Login to Account
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-slate-800"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-4 text-gray-400 dark:text-slate-500 font-medium tracking-widest">Or continue with</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl transition-all font-medium text-sm text-gray-700 dark:text-slate-300">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" />
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl transition-all font-medium text-sm text-gray-700 dark:text-slate-300">
                            <img src="https://www.svgrepo.com/show/511330/apple-fill.svg" className="w-4 h-4 dark:invert" />
                            Apple
                        </button>
                    </div>

                    <p className="text-center text-gray-500 font-medium">
                        Don't have an account? <Link to="/register" className="text-primary hover:text-primary-dark font-bold underline underline-offset-4 decoration-primary/30">Sign up for free</Link>
                    </p>
                </motion.div>
            </div>
            
            {/* Small Footer Signature */}
            <div className="absolute bottom-4 left-0 right-0 text-center md:hidden lg:block">
                <p className="text-[10px] text-gray-300 uppercase tracking-[0.2em]">© 2024 Atrium Chat Communication Hub — All Systems Operational</p>
            </div>
        </div>
    );
};

export default LoginPage;
