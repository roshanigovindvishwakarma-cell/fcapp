import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, Mail, Lock, User, Eye, EyeOff, ArrowRight, Github } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = ({ onLogin }) => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGithubLogin = () => {
        const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
        if (!clientId) {
            setError('GitHub Client ID is not configured');
            return;
        }
        const redirectUri = window.location.origin + '/login';
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('/api/auth/register', { name, email, password });
            onLogin(res.data);
        } catch (err) {
            console.error("Registration error:", err);
            if (err.response) {
                setError(err.response.data.message || 'Registration failed');
            } else if (err.request) {
                setError('Cannot connect to server. Please try again.');
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#1a1d2d] p-6 relative overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] opacity-60"></div>
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] opacity-60"></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/20 border border-gray-100 dark:border-slate-800 p-10 md:p-14 z-10"
            >
                <div className="flex flex-col items-center text-center space-y-4 mb-10">
                    <div className="bg-primary p-3 rounded-2xl shadow-lg">
                        <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold text-white tracking-tight">NexaChat</h2>
                        <p className="text-slate-400 font-medium tracking-wide">Create your next-gen chat profile</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-semibold border border-red-100 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 transition-colors group-focus-within:text-primary" />
                            <input 
                                type="text" 
                                required 
                                className="w-full pl-12 pr-4 py-4 bg-[#282D45] border-transparent focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-2xl transition-all outline-none text-white font-medium placeholder:text-slate-600"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 transition-colors group-focus-within:text-primary" />
                            <input 
                                type="email" 
                                required 
                                className="w-full pl-12 pr-4 py-4 bg-[#282D45] border-transparent focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-2xl transition-all outline-none text-white font-medium placeholder:text-slate-600"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Create Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 transition-colors group-focus-within:text-primary" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required 
                                className="w-full pl-12 pr-12 py-4 bg-[#282D45] border-transparent focus:border-primary focus:ring-1 focus:ring-primary/30 rounded-2xl transition-all outline-none text-white font-medium placeholder:text-slate-600"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-600 hover:text-white transition-colors outline-none"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {/* Password Strength Indicator (Visual only) */}
                        {password && (
                            <div className="flex gap-1 mt-3 px-1">
                                <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                                <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                                <div className={`h-1 flex-1 ${password.length > 8 ? 'bg-emerald-500' : 'bg-[#282D45]'} rounded-full`}></div>
                                <div className={`h-1 flex-1 ${password.length > 12 ? 'bg-emerald-500' : 'bg-[#282D45]'} rounded-full`}></div>
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-[#059669] hover:bg-[#047857] text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-emerald-900/10 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group mt-4"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Create Account
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-slate-800"></div></div>
                        <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white dark:bg-slate-900 px-4 text-gray-400 dark:text-slate-500 font-bold tracking-[0.2em]">Or join with</span></div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <button type="button" className="flex items-center justify-center gap-2 py-3 px-2 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl transition-all font-medium text-xs text-gray-700 dark:text-slate-300">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" />
                            Google
                        </button>
                        <button type="button" className="flex items-center justify-center gap-2 py-3 px-2 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl transition-all font-medium text-xs text-gray-700 dark:text-slate-300">
                            <img src="https://www.svgrepo.com/show/511330/apple-fill.svg" className="w-4 h-4 dark:invert" />
                            Apple
                        </button>
                        <button 
                            type="button" 
                            onClick={handleGithubLogin}
                            className="flex items-center justify-center gap-2 py-3 px-2 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-100 dark:border-slate-800 rounded-xl transition-all font-medium text-xs text-gray-700 dark:text-slate-300"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </button>
                    </div>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-800 text-center">
                    <p className="text-slate-400 font-medium">
                        Already have an account? <Link to="/login" className="text-primary hover:text-white font-bold underline underline-offset-4 transition-colors">Log in</Link>
                    </p>
                    
                    <div className="mt-8 flex justify-center gap-6">
                        <a 
                            href="https://github.com/roshanigovindvishwakarma-cell/fcapp" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors flex items-center gap-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            GitHub
                        </a>
                        <a 
                            href="https://frontend-29l3c0m4y-roshanigovindvishwakarma-cells-projects.vercel.app" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors flex items-center gap-2"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h18" /></svg>
                            Live
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
