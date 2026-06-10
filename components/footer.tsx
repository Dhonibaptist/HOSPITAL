"use client";

import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Phone, ShieldCheck, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="w-full mt-20 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-100/30 dark:bg-slate-950/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-slate-600 dark:text-slate-400">
        
        {/* Info */}
        <div className="space-y-4">
          <div className="text-lg font-bold text-slate-800 dark:text-white">
            {t.hospitalName}
          </div>
          <p className="text-xs leading-relaxed">
            Leading enterprise healthcare operations through next-generation diagnostic modules, instant queues triage boards, and telemedicine links.
          </p>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 w-fit">
            <Phone className="w-4 h-4 animate-bounce" />
            <span className="text-xs font-bold">Emergency Hotline: +91 999 112 000</span>
          </div>
        </div>

        {/* Links */}
        <div>
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Services</div>
          <ul className="space-y-2.5 text-xs">
            <li><span className="hover:text-brand-500 cursor-pointer">Cardiology & Hearts Clinic</span></li>
            <li><span className="hover:text-brand-500 cursor-pointer">Neurology Specialists</span></li>
            <li><span className="hover:text-brand-500 cursor-pointer">Orthopedics & Fractures care</span></li>
            <li><span className="hover:text-brand-500 cursor-pointer">Emergency Trauma Triage</span></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Location</div>
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
              <span>AstraCare Corporate Towers, Level 5, OMR IT Highway, Chennai, India</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-500 shrink-0" />
              <span>operations@astracare.com</span>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <div className="text-sm font-bold text-slate-800 dark:text-white mb-4">Portals</div>
          <ul className="space-y-2.5 text-xs">
            <li><Link href="/login" className="hover:text-brand-500">Staff Secure Login</Link></li>
            <li><span className="hover:text-brand-500 cursor-pointer">Corporate Careers</span></li>
            <li><span className="hover:text-brand-500 cursor-pointer">Patient Terms of Service</span></li>
            <li className="flex items-center gap-1.5 text-accent-emerald font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>HIPAA & GDPR Secure</span>
            </li>
          </ul>
        </div>

      </div>

      <div className="w-full text-center py-6 border-t border-slate-200/20 dark:border-slate-800/20 text-[10px] text-slate-500">
        © {new Date().getFullYear()} AstraCare Global Hospital Systems. All rights reserved.
      </div>
    </footer>
  );
}
