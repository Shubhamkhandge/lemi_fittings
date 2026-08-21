'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Menu,
  Calendar
} from 'lucide-react';
import { UserSession } from '@/lib/auth';

interface HeaderProps {
  user?: UserSession | null;
  onMenuClick?: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs px-4 lg:px-8 py-3 flex items-center justify-between">
      {/* Mobile Menu & Live System Status Badge with Official LEMI Logo */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* LEMI POS Workspace Live Badge */}
        <div className="flex items-center space-x-2.5 bg-slate-100/90 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <div className="bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
            <img
              src="/lemi-logo.png"
              alt="LEMI Logo"
              className="h-5 w-auto object-contain"
            />
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-extrabold text-slate-900 text-xs tracking-wide uppercase">
            LEMI POS Workspace
          </span>
          <span className="hidden sm:inline-block font-bold text-slate-500 text-[10px] uppercase border-l border-slate-300 pl-2">
            Active Session
          </span>
        </div>
      </div>

      {/* Right Header Navigation Shortcuts & User Session */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Date Display Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{currentDate}</span>
        </div>

        {/* User Profile Menu Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2.5 p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 font-mono leading-tight uppercase font-semibold">{user?.role || 'STAFF'}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 text-xs z-50 animate-fadeIn">
              {/* <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-extrabold text-slate-900 text-sm">{user?.name}</p>
                <p className="text-[11px] text-slate-500">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-extrabold rounded-md uppercase">
                  {user?.role}
                </span>
              </div> */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
