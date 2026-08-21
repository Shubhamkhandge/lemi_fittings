'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckCircle2, Package, Users, X } from 'lucide-react';
import { UserSession } from '@/lib/auth';

interface SidebarProps {
  user?: UserSession | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Pending Orders & Billing', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customer Directory', href: '/dashboard/customers', icon: Users },
    { name: 'Completed History', href: '/dashboard/completed', icon: CheckCircle2 },
    { name: 'Products Catalog', href: '/dashboard/products-catalog', icon: Package },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* OFFICIAL LEMI BRAND HEADER */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1.5 rounded-xl shadow-md flex items-center justify-center shrink-0">
              <img
                src="/lemi-logo.png"
                alt="LEMI Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-wider text-white">LEMI</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Interior Fixtures</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-5 py-2.5 bg-slate-800/50 text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
          Sales & Customer Ledger
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'LEMI Admin'}</p>
              <p className="text-[10px] text-slate-400">{user?.email || 'admin@lemi.com'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
