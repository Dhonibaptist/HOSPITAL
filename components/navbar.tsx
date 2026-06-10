"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Sun, Moon, Globe, LogOut, ShieldAlert, Activity } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { theme, toggleTheme, language, setLanguage, user, setUser, t } = useApp();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        localStorage.removeItem('mock_user_session');
        router.push('/');
        router.refresh();
      }
    } catch (e) {
      setUser(null);
      localStorage.removeItem('mock_user_session');
      router.push('/');
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'PATIENT': return '/patient';
      case 'DOCTOR': return '/doctor';
      case 'RECEPTIONIST': return '/receptionist';
      case 'ADMIN': return '/admin';
      case 'SUPER_ADMIN': return '/super-admin';
      default: return '/login';
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full px-6 py-4 glass-panel border-b border-white/10 dark:border-white/5 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-brand-600 to-accent-cyan text-white shadow-neon-cyan">
            <Activity className="w-5 h-5 animate-pulse-slow" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white bg-clip-text group-hover:text-brand-500 transition-colors">
              {t.hospitalName}
            </span>
            <span className="block text-[10px] tracking-wider uppercase font-semibold text-brand-600 dark:text-accent-cyan">
              {t.tagline}
            </span>
          </div>
        </Link>

        {/* Action Menu */}
        <div className="flex items-center gap-4">
          
          {/* Quick Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700 dark:text-slate-300 mr-4">
            <Link href="/" className="hover:text-brand-500 transition-colors">{t.home}</Link>
            <Link href={getDashboardLink()} className="hover:text-brand-500 transition-colors">{t.dashboard}</Link>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Picker */}
          <div className="relative">
            <button 
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs font-semibold transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-lg glass-panel border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 shadow-lg py-1 text-xs z-50 text-slate-800 dark:text-slate-200">
                {[
                  { code: 'en', label: 'English' },
                  { code: 'ta', label: 'தமிழ்' },
                  { code: 'hi', label: 'हिन्दी' },
                  { code: 'de', label: 'Deutsch' }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code as any);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-brand-500 hover:text-white transition-colors ${language === l.code ? 'font-bold text-brand-500 dark:text-accent-cyan' : ''}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth Button */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                href={getDashboardLink()} 
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white shadow-neon-cyan transition-all"
              >
                {user.role === 'PATIENT' ? 'My Chart' : 'Console'}
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-4 py-2 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-sm font-semibold shadow-neon-cyan transition-all"
            >
              {t.login}
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}
