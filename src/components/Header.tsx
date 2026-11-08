/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bot, Calendar, Layers, Terminal, Globe, Lock, ShieldCheck, Menu, X } from 'lucide-react';
import { SupportedTimezone } from '../types.ts';

interface HeaderProps {
  currentTab: 'chat' | 'admin';
  adminSubTab: string;
  selectedTimezone: string;
  supportedTimezones: SupportedTimezone[];
  isAdminAuthenticated: boolean;
  onSelectTab: (tab: 'chat' | 'admin') => void;
  onSelectTimezone: (tz: string) => void;
  onOpenQuickBooking: () => void;
  onRunQuickTests: () => void;
  onToggleAdminAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  adminSubTab,
  selectedTimezone,
  supportedTimezones,
  isAdminAuthenticated,
  onSelectTab,
  onSelectTimezone,
  onOpenQuickBooking,
  onRunQuickTests,
  onToggleAdminAuth
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileTabSwitch = (tab: 'chat' | 'admin') => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-xs">
              SI
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                SIHub Assistant
              </span>
              <span className="hidden xs:inline text-[10px] sm:text-[11px] font-medium text-slate-500 whitespace-nowrap">
                AI Customer Service & Booking Agent
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Desktop & Tablet: hidden on mobile < 768px) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <button
              onClick={() => onSelectTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[40px] ${
                currentTab === 'chat'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Customer Assistant</span>
            </button>

            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[40px] ${
                currentTab === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Admin Management Hub</span>
            </button>
          </nav>

          {/* Zone 3: Actions + Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Timezone Switcher (Desktop & Large Tablet: hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 min-h-[36px]">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={selectedTimezone}
                onChange={(e) => onSelectTimezone(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {supportedTimezones.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Auth Indicator (Desktop & Tablet) */}
            <button
              onClick={onToggleAdminAuth}
              title={isAdminAuthenticated ? "Authenticated as Admin" : "Guest Mode: Click to activate Demo Admin Token"}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                isAdminAuthenticated
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {isAdminAuthenticated ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">Admin Auth ✓</span>
                  <span className="md:hidden">Admin</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Demo Login</span>
                </>
              )}
            </button>

            {/* Primary Action Button (Adaptive sizing) */}
            {currentTab === 'chat' ? (
              <button
                onClick={onOpenQuickBooking}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs whitespace-nowrap rounded-lg min-h-[44px]"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Book Appointment</span>
                <span className="xs:hidden">Book</span>
              </button>
            ) : (
              <button
                onClick={onRunQuickTests}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap rounded-lg min-h-[44px]"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Run Benchmarks</span>
                <span className="xs:hidden">Tests</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle (Visible on < 768px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200/60"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation (320px–767px) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Navigation</span>
            <button
              onClick={() => handleMobileTabSwitch('chat')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors min-h-[44px] ${
                currentTab === 'chat'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Customer Assistant (Elena)</span>
            </button>
            <button
              onClick={() => handleMobileTabSwitch('admin')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors min-h-[44px] ${
                currentTab === 'admin'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Admin Management Hub</span>
            </button>
          </div>

          {/* Timezone Switcher on Mobile */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 px-1">
              Active Timezone
            </span>
            <div className="relative">
              <Globe className="w-4 h-4 text-indigo-600 absolute left-3 top-3 pointer-events-none" />
              <select
                value={selectedTimezone}
                onChange={(e) => {
                  onSelectTimezone(e.target.value);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-900 min-h-[44px]"
              >
                {supportedTimezones.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Admin Auth Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onToggleAdminAuth();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                {isAdminAuthenticated ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-slate-400" />}
                <span>{isAdminAuthenticated ? "Signed in as Admin" : "Sign in as Demo Admin"}</span>
              </span>
              <span className="text-[11px] text-indigo-600 font-bold">
                {isAdminAuthenticated ? "Log Out" : "Activate"}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
