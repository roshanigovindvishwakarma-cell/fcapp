import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const RegisterPage = ({ onLogin }) => {
    const [name, setName] = useState('');
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
            const res = await axios.post('/api/auth/register', { name, email, password });
            onLogin(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 relative overflow-hidden transition-colors duration-300">
            {/* Background Orbs */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-emerald-100 dark:bg-emerald-900/10 rounded-full blur-[120px] opacity-60"></div>
            <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-[120px] opacity-60"></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 dark:shadow-emerald-950/20 border border-gray-100 dark:border-slate-800 p-10 md:p-14 z-10"
            >
                <div className="flex flex-col items-center text-center space-y-4 mb-10">
                    <div className="bg-[#059669] p-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
                        <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Atrium Chat</h2>
                        <p className="text-gray-500 dark:text-slate-400 font-medium tracking-wide">Create your digital atrium profile</p>
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
                        <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-slate-600 transition-colors group-focus-within:text-primary" />
                            <input 
                                type="text" 
                                required 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800 border-2 focus:border-primary/30 dark:focus:border-primary/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all outline-none text-gray-900 dark:text-white font-medium"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-slate-600 transition-colors group-focus-within:text-primary" />
                            <input 
                                type="email" 
                                required 
                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800 border-2 focus:border-primary/30 dark:focus:border-primary/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all outline-none text-gray-900 dark:text-white font-medium"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">Create Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 dark:text-slate-600 transition-colors group-focus-within:text-primary" />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                required 
                                className="w-full pl-12 pr-12 py-4 bg-gray-50/50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-800 border-2 focus:border-primary/30 dark:focus:border-primary/30 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all outline-none text-gray-900 dark:text-white font-medium"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 rounded-lg transition-colors outline-none"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {/* Password Strength Indicator (Visual only) */}
                        {password && (
                            <div className="flex gap-1 mt-3 px-1">
                                <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                                <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
                                <div className={`h-1 flex-1 ${password.length > 8 ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-slate-800'} rounded-full`}></div>
                                <div className={`h-1 flex-1 ${password.length > 12 ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-slate-800'} rounded-full`}></div>
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
                </form>

                <div className="mt-10 pt-8 border-t border-gray-50 dark:border-slate-800 text-center">
                    <p className="text-gray-500 dark:text-slate-400 font-medium">
                        Already have an account? <Link to="/login" className="text-primary hover:text-primary-dark font-bold underline underline-offset-4 decoration-primary/30">Log in</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
