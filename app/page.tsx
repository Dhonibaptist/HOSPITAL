"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { 
  Heart, 
  Brain, 
  Activity, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  Calendar, 
  UserCheck, 
  Clock, 
  ArrowUpRight 
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const stats = [
    { label: t.activeDoctors, val: "150+", icon: UserCheck, desc: "On-call Specialists" },
    { label: t.patientsServed, val: "250K+", icon: Heart, desc: "Successful Recoveries" },
    { label: t.reputationRate, val: "99.4%", icon: ShieldCheck, desc: "Verified Accuracy" },
    { label: "Est. Wait Time", val: "< 12m", icon: Clock, desc: "Fast-track Queue" },
  ];

  const services = [
    { id: "cardio", name: "Cardiology", desc: "Expert ECG, echocardiograms, bypass recovery, and heart valve treatments.", icon: Heart, color: "text-rose-500 bg-rose-500/10" },
    { id: "neuro", name: "Neurology", desc: "Neuro-imaging diagnostics, stroke rehabilitation, and epilepsy management.", icon: Brain, color: "text-accent-purple bg-accent-purple/10" },
    { id: "ortho", name: "Orthopedics", desc: "Joint replacements, sports physiotherapy, and fracture recovery clinics.", icon: Activity, color: "text-accent-cyan bg-accent-cyan/10" },
  ];

  const doctors = [
    {
      name: "Dr. Sarah Jenkins",
      spec: "Cardiology",
      exp: "14 yrs",
      fee: "₹800",
      rating: 4.9,
      img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop"
    },
    {
      name: "Dr. Rajan Sharma",
      spec: "Neurology",
      exp: "18 yrs",
      fee: "₹1000",
      rating: 4.8,
      img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop"
    }
  ];

  const faqs = [
    { q: "How does the QR check-in queue system operate?", a: "Once you reserve an appointment online, a unique QR code is generated in your dashboard. Present this code to our receptionist camera upon arrival; the system automatically changes your status to 'WAITING', assigns a token number, and sends your position to the Doctor's active lineup." },
    { q: "Can I consult specialists virtually?", a: "Yes. AstraCare features high-fidelity WebRTC consultation rooms. You and your doctor can launch secure video streams, share screens, chat, and download digital prescriptions from any desktop or mobile device." },
    { q: "Is the system secure and compliant?", a: "Absolutely. AstraCare utilizes bcrypt credential cryptography, JSON Web Token (JWT) sessions, and Zod endpoint schemas. We fully conform to HIPAA and GDPR standards." }
  ];

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
      
      {/* Background Neon Glows */}
      <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] rounded-full bg-brand-500/10 dark:bg-brand-500/20 blur-[80px] -z-10 animate-float" />
      <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent-purple/10 dark:bg-accent-purple/20 blur-[100px] -z-10 animate-pulse-slow" />
      <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-accent-cyan/10 dark:bg-accent-cyan/20 blur-[90px] -z-10" />

      <Navbar />

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        
        {/* Left Intro Text */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-accent-cyan text-xs font-bold uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" /> Next-Gen Health Portal
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
            {t.heroDesc}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link 
              href="/patient" 
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-bold text-sm shadow-glass-glow dark:shadow-glass-glow-dark hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> {t.bookNow} <ChevronRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/login" 
              className="px-6 py-3.5 rounded-xl border border-slate-300/80 dark:border-slate-800/80 bg-white/20 dark:bg-slate-900/20 hover:bg-white/40 dark:hover:bg-slate-800/40 text-slate-800 dark:text-white font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2"
            >
              Operations Portal <ArrowUpRight className="w-4 h-4 text-brand-500" />
            </Link>
          </div>
        </div>

        {/* Right Preview Graphic */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-[400px] h-[380px] rounded-3xl glass-panel border-white/20 p-6 flex flex-col justify-between shadow-glass animate-float">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold text-rose-500 tracking-wider">LIVE CLINIC TRIAGE</span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-200/50 dark:bg-slate-800/50 font-bold">Branch 01</span>
            </div>
            
            {/* Visualizer Block */}
            <div className="py-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-600 dark:text-accent-cyan flex items-center justify-center font-bold">A1</div>
                  <div>
                    <div className="text-sm font-bold">Dr. Sarah Jenkins</div>
                    <div className="text-[10px] text-slate-500">Cardiology Dept.</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Active Token</div>
                  <div className="text-lg font-black text-brand-500">22</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/10 flex items-center justify-between opacity-80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-purple/20 text-accent-purple flex items-center justify-center font-bold">A2</div>
                  <div>
                    <div className="text-sm font-bold">Dr. Rajan Sharma</div>
                    <div className="text-[10px] text-slate-500">Neurology Dept.</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Active Token</div>
                  <div className="text-lg font-black text-accent-purple">05</div>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-500 font-medium tracking-wide border-t border-slate-500/10 pt-4">
              Estimated general delay: 08 minutes
            </div>
          </div>
        </div>

      </header>

      {/* Stats Counter Section */}
      <section className="w-full bg-gradient-to-b from-transparent to-slate-200/20 dark:to-slate-950/40 py-12 border-y border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="flex items-center gap-4 text-left p-2">
                <div className="p-3.5 rounded-2xl bg-brand-500/10 text-brand-500 dark:text-accent-cyan">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-black">{s.val}</div>
                  <div className="text-xs font-bold tracking-tight text-slate-600 dark:text-slate-400">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 w-full text-center">
        <h2 className="text-3xl font-black tracking-tight mb-3">Enterprise Healthcare Specializations</h2>
        <p className="text-slate-500 max-w-xl mx-auto text-sm mb-12">
          Navigate through our key medical departments equipped with real-time token tracking.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((ser) => {
            const Icon = ser.icon;
            return (
              <div key={ser.id} className="p-6 rounded-2xl glass-card text-left space-y-4">
                <div className={`p-3 rounded-xl w-fit ${ser.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">{ser.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {ser.desc}
                </p>
                <Link 
                  href="/patient" 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-600 dark:text-accent-cyan"
                >
                  Book Specialist <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 w-full text-center">
        <h2 className="text-3xl font-black tracking-tight mb-3">On-Duty Medical Staff</h2>
        <p className="text-slate-500 max-w-xl mx-auto text-sm mb-12">
          Book immediate consultations with our verified clinical specialists.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {doctors.map((d, idx) => (
            <div key={idx} className="p-5 rounded-2xl glass-card text-left flex items-center gap-6">
              <img 
                src={d.img} 
                alt={d.name} 
                className="w-20 h-20 rounded-xl object-cover border border-white/10 shrink-0" 
              />
              <div className="space-y-1">
                <h3 className="text-base font-bold">{d.name}</h3>
                <p className="text-xs text-brand-500 dark:text-accent-cyan font-bold">{d.spec} • {d.exp} Experience</p>
                <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" /> {d.rating}
                </div>
                <div className="text-xs text-slate-500">Fee: <span className="font-bold text-slate-800 dark:text-white">{d.fee}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 w-full text-center">
        <h2 className="text-3xl font-black tracking-tight mb-10">{t.faqTitle}</h2>
        <div className="space-y-4 text-left">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="rounded-xl glass-panel border-white/5 cursor-pointer overflow-hidden transition-all duration-300"
              onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
            >
              <div className="p-5 flex items-center justify-between font-bold text-sm select-none">
                <span>{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-brand-500 transition-transform ${expandedFaq === idx ? 'rotate-90' : ''}`} />
              </div>
              {expandedFaq === idx && (
                <div className="px-5 pb-5 text-xs leading-relaxed text-slate-500 dark:text-slate-400 border-t border-slate-500/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
