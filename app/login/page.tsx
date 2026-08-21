'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@lemi.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      toast.success('Login successful!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 🖼️ 100% CRYSTAL CLEAR BACKGROUND IMAGE AS-IS */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-300"
        style={{ backgroundImage: `url('/lemi-bg.png')` }}
      />

      {/* ULTRA SUBTLE AMBIENT TINT FOR CONTRAST */}
      <div className="absolute inset-0 bg-slate-950/20" />

      {/* 🌟 SEMI-TRANSPARENT GLASSMORPHISM LOGIN CARD */}
      <div className="w-full max-w-md z-10">
        <div className="bg-slate-950/25 backdrop-blur-xl border border-white/20 p-7 sm:p-9 shadow-2xl rounded-3xl space-y-6 text-center">
          
          {/* 1. LOGO INSIDE CONTAINER */}
          <div className="flex justify-center">
            <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-white/20">
              <img
                src="/lemi-logo.png"
                alt="LEMI Interior Fixtures Logo"
                className="h-14 w-auto object-contain"
              />
            </div>
          </div>

          {/* 2. TITLE & SUBTITLE INSIDE CONTAINER */}
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-white tracking-wide drop-shadow-md">
              LEMI Interior Fixtures
            </h1>
            <p className="text-[11px] font-extrabold text-blue-400 uppercase tracking-widest drop-shadow-xs">
              Architectural Hardware & Billing POS
            </p>
          </div>

          {/* 3. INPUT FIELDS & LOGIN FORM INSIDE CONTAINER */}
          <form className="space-y-4 text-left pt-1" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lemi.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-900/90 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-900/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-slate-900/90 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/35 flex items-center justify-center space-x-2 transition-all text-sm cursor-pointer mt-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Login to System</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
