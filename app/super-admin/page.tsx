"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Database, HardDrive, Key, Server, RefreshCw } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user } = useApp();
  
  // Audits log array
  const [logs, setLogs] = useState([
    { id: 1, action: "User Account Registered", user: "patient@astracare.com", status: "SUCCESS", time: "2 mins ago" },
    { id: 2, action: "Checkout Transaction Authorization", user: "pay_mock_12345", status: "PAID", time: "15 mins ago" },
    { id: 3, action: "Queue Check-In Scan Registered", user: "appt-1", status: "WAITING", time: "22 mins ago" },
    { id: 4, action: "Schema Migration Applied", user: "receptionist_triage_index", status: "SUCCESS", time: "1 hour ago" },
  ]);

  const [dbStatus, setDbStatus] = useState({
    provider: "PostgreSQL / Supabase",
    poolConnections: 12,
    latency: "14ms",
    health: "OPTIMAL"
  });

  const clearAuditLogs = () => {
    setLogs([]);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full space-y-12 text-left">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-500/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">{user?.name || "Super Admin Portal"}</h1>
            <p className="text-xs text-slate-500">Root Node: Database & Security Administration console</p>
          </div>
          <button 
            onClick={clearAuditLogs}
            className="px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs font-bold hover:bg-rose-500/20 transition-all"
          >
            Clear Audit Log Cache
          </button>
        </div>

        {/* Audit Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* DB info */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Database Status</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs space-y-1 font-bold text-slate-500">
              <div className="flex justify-between"><span className="text-slate-400">Provider:</span><span className="text-slate-800 dark:text-white">{dbStatus.provider}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Pool Size:</span><span className="text-slate-800 dark:text-white">{dbStatus.poolConnections}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Latency:</span><span className="text-slate-800 dark:text-white">{dbStatus.latency}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Health:</span><span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[9px]">OPTIMAL</span></div>
            </div>
          </div>

          {/* Security details */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Security Modules</span>
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs space-y-1 font-bold text-slate-500">
              <div className="flex justify-between"><span className="text-slate-400">Cryptography:</span><span className="text-slate-800 dark:text-white">Bcryptjs (rounds: 10)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Authorization:</span><span className="text-slate-800 dark:text-white">HS256 Jose JWT cookies</span></div>
              <div className="flex justify-between"><span className="text-slate-400">CSRF Header:</span><span className="text-emerald-500">ENFORCED</span></div>
              <div className="flex justify-between"><span className="text-slate-400">API rate limits:</span><span className="text-emerald-500">ACTIVE</span></div>
            </div>
          </div>

          {/* Harddrive storage */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cloud Storage</span>
              <div className="p-2 rounded-lg bg-accent-purple/10 text-accent-purple">
                <HardDrive className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xs space-y-1 font-bold text-slate-500">
              <div className="flex justify-between"><span className="text-slate-400">EHR Files Node:</span><span className="text-slate-800 dark:text-white">Supabase bucket</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Total volume usage:</span><span className="text-slate-800 dark:text-white">2.41 GB</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Uptime rate:</span><span className="text-slate-800 dark:text-white">99.998%</span></div>
              <div className="flex justify-between"><span className="text-slate-400">SSL status:</span><span className="text-emerald-500">SECURE SSL/TLS</span></div>
            </div>
          </div>

        </section>

        {/* Audit Lineup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 p-6 rounded-3xl glass-panel border-white/10 space-y-4">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Server className="w-5 h-5 text-brand-500" />
              <span>Real-Time Clinical Audit Logs</span>
            </h2>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Logs flushed</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 flex items-center justify-between text-xs font-mono">
                    <div className="text-left">
                      <span className="font-bold text-slate-800 dark:text-white block">{log.action}</span>
                      <span className="text-[10px] text-slate-400 block">Identifier: {log.user}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">{log.status}</span>
                      <span className="text-[9px] text-slate-400 block mt-1">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Migrations Applied */}
          <div className="lg:col-span-4 p-6 rounded-3xl glass-panel border-white/10 space-y-4">
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-accent-purple" />
              <span>Prisma Schema Migrations</span>
            </h2>
            <ul className="space-y-3.5 text-xs font-bold text-slate-500">
              {[
                { name: "20260601_init_schema", desc: "User base tables", active: true },
                { name: "20260605_queue_index", desc: "Outpatient tokens lookup", active: true },
                { name: "20260609_emr_prescription", desc: "Prescription Json logs", active: true }
              ].map((mig, idx) => (
                <li key={idx} className="p-3 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 flex items-center justify-between">
                  <div>
                    <span className="block text-slate-800 dark:text-white font-mono text-[10px]">{mig.name}</span>
                    <span className="text-[9px] font-medium text-slate-400">{mig.desc}</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                    Applied
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
