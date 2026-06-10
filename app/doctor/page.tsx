"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useApp } from '@/context/AppContext';
import { 
  Users, 
  Calendar, 
  Activity, 
  DollarSign, 
  Video, 
  FileSpreadsheet, 
  User, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  Save, 
  Plus, 
  Trash2, 
  X 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import Link from 'next/link';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  timeSlot: string;
  status: string;
  paymentStatus: string;
  tokenNumber?: number;
  queueStatus: string;
}

export default function DoctorDashboard() {
  const { user, t } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // EMR / Prescription creator states
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [medicines, setMedicines] = useState<Array<{ name: string; dosage: string; frequency: string; duration: string }>>([]);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('500mg');
  const [medFreq, setMedFreq] = useState('Once daily');
  const [medDur, setMedDur] = useState('5 days');
  const [notes, setNotes] = useState('');
  const [savingPrescription, setSavingPrescription] = useState(false);

  // Analytics Chart Dummy Data
  const data = [
    { name: 'Mon', Patients: 12, Revenue: 9600 },
    { name: 'Tue', Patients: 18, Revenue: 14400 },
    { name: 'Wed', Patients: 15, Revenue: 12000 },
    { name: 'Thu', Patients: 22, Revenue: 17600 },
    { name: 'Fri', Patients: 20, Revenue: 16000 },
    { name: 'Sat', Patients: 8, Revenue: 6400 },
    { name: 'Sun', Patients: 0, Revenue: 0 },
  ];

  useEffect(() => {
    fetchDoctorSchedule();
  }, []);

  const fetchDoctorSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        // Server API returns appointments for the logged-in doctor
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error("Error loading doctor schedule", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCallPatient = async (apptId: string) => {
    try {
      // API call to update queue status to ACTIVE (representing calling patient into room)
      const res = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: apptId,
          status: 'CONFIRMED',
          queueStatus: 'ACTIVE'
        })
      });

      if (res.ok) {
        // Also update local mock serving count if demo mode
        const appt = appointments.find(a => a.id === apptId);
        if (appt && appt.tokenNumber) {
          // Put token to mockDb serving cache
          await fetch(`/api/queue/stream?doctorId=${user?.id}`, { method: 'GET' }); // wake up endpoint
          mockDbUpdateServing(appt.tokenNumber);
        }
        fetchDoctorSchedule();
      }
    } catch (err) {
      console.error("Error calling patient", err);
    }
  };

  const mockDbUpdateServing = async (tokenNum: number) => {
    try {
      // Call mockDb directly if fallback
      const { mockDb } = await import('@/utils/mock-db');
      if (user?.id) {
        mockDb.currentQueueToken[user.id] = tokenNum;
      }
    } catch (e) {}
  };

  const handleAddMedicine = () => {
    if (!medName.trim()) return;
    setMedicines([...medicines, {
      name: medName,
      dosage: medDosage,
      frequency: medFreq,
      duration: medDur
    }]);
    setMedName('');
  };

  const handleRemoveMedicine = (idx: number) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt || medicines.length === 0) return;
    setSavingPrescription(true);

    try {
      // 1. Create prescription record
      const presRes = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppt.id,
          medicines,
          notes
        })
      });

      // 2. Mark appointment as COMPLETED
      const apptRes = await fetch('/api/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppt.id,
          status: 'COMPLETED',
          queueStatus: 'COMPLETED'
        })
      });

      if (presRes.ok && apptRes.ok) {
        setSelectedAppt(null);
        setMedicines([]);
        setNotes('');
        fetchDoctorSchedule();
      }
    } catch (err) {
      console.error("Prescription saving error", err);
    } finally {
      setSavingPrescription(false);
    }
  };

  // Group queue lines
  const waitingPatients = appointments.filter(a => a.queueStatus === 'WAITING');
  const activePatient = appointments.find(a => a.queueStatus === 'ACTIVE');
  const generalSchedule = appointments.filter(a => a.queueStatus === 'NOT_ARRIVED' && a.status !== 'CANCELLED');

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full space-y-12">
        
        {/* Header Console */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-500/10 pb-6 text-left">
          <div>
            <h1 className="text-3xl font-black tracking-tight">{user?.name || "Dr. Sarah Jenkins"}</h1>
            <p className="text-xs text-slate-500">Consultation Department: Neurology & Cardiology</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchDoctorSchedule}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200/50 hover:bg-slate-300/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 text-xs font-bold w-fit border border-slate-300/10"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload List
            </button>
          </div>
        </div>

        {/* Doctor KPI stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Today's Patient load", val: appointments.length.toString(), desc: "Consultations", icon: Users, color: "text-brand-500 bg-brand-500/10" },
            { label: "Active token serving", val: activePatient?.tokenNumber?.toString() || "None", desc: activePatient ? `Patient: ${activePatient.patientName}` : "Idle State", icon: Activity, color: "text-rose-500 bg-rose-500/10" },
            { label: "In Waiting Queue", val: waitingPatients.length.toString(), desc: "Checked-in", icon: Clock, color: "text-accent-cyan bg-accent-cyan/10" },
            { label: "Estimated Revenue", val: `₹${appointments.filter(a => a.paymentStatus === 'PAID').length * 800}`, desc: "Authorized Payments", icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl glass-card text-left space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</span>
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className="text-xl font-black">{card.val}</div>
                  <span className="text-[10px] font-bold text-slate-400 block mt-0.5">{card.desc}</span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Main Work Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Active Worklist Panel */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            {/* 1. Currently Serving patient */}
            <div className="p-6 rounded-3xl bg-gradient-to-tr from-brand-950/60 to-slate-900/60 border border-brand-500/20 shadow-glass space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-500 animate-pulse-slow" />
                  <h2 className="text-base font-black text-rose-500 uppercase tracking-wider">Active Patient Console</h2>
                </div>
                {activePatient && (
                  <span className="text-xs font-bold px-3 py-1 bg-brand-500 text-white rounded-full">
                    Token #{activePatient.tokenNumber}
                  </span>
                )}
              </div>

              {activePatient ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black">{activePatient.patientName}</h3>
                      <span className="text-xs text-slate-400">Scheduled: {activePatient.timeSlot}</span>
                    </div>
                    
                    {/* Live Video consultations launch button */}
                    <Link
                      href={`/consultation/${activePatient.id}`}
                      className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-neon-purple transition-all"
                    >
                      <Video className="w-4 h-4" /> Tele-Consult Call
                    </Link>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedAppt(activePatient)}
                      className="flex-1 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Issue Digital Prescription & Complete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  No patient currently in session. Click "Call Patient" below to initiate a triage shift.
                </div>
              )}
            </div>

            {/* 2. Checked-in patients waiting */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-4">
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent-cyan" />
                <span>Waiting Room Queue ({waitingPatients.length})</span>
              </h2>

              {waitingPatients.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No patients checked-in yet</p>
              ) : (
                <div className="space-y-3">
                  {waitingPatients.map((pat) => (
                    <div key={pat.id} className="p-3.5 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm block">{pat.patientName}</span>
                        <span className="text-[10px] text-slate-400 block">Token Number: {pat.tokenNumber} • Slot: {pat.timeSlot}</span>
                      </div>
                      <button
                        onClick={() => handleCallPatient(pat.id)}
                        disabled={!!activePatient}
                        className="px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-bold disabled:opacity-50 transition-colors"
                      >
                        Call Patient
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. General Bookings roster */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-4">
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent-purple" />
                <span>Upcoming Bookings ({generalSchedule.length})</span>
              </h2>

              {generalSchedule.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No remaining schedule bookings for today</p>
              ) : (
                <div className="space-y-3">
                  {generalSchedule.map((appt) => (
                    <div key={appt.id} className="p-3.5 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm block">{appt.patientName}</span>
                        <span className="text-[10px] text-slate-400 block">Scheduled: {appt.timeSlot} • Status: {appt.status}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full uppercase">
                        Not Arrived
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Panel: Recharts Analytics */}
          <div className="lg:col-span-5 space-y-8 text-left">
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
              <h2 className="text-lg font-black tracking-tight">{t.analyticsOverview}</h2>
              <p className="text-xs text-slate-500">Weekly revenue statistics vs patient volume load</p>
              
              <div className="w-full h-64 text-xs font-bold text-slate-500">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0e94eb" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#0e94eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#888888" />
                    <YAxis yAxisId="left" stroke="#888888" />
                    <YAxis yAxisId="right" orientation="right" stroke="#888888" />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                    <Area yAxisId="left" type="monotone" dataKey="Revenue" stroke="#0e94eb" fillOpacity={1} fill="url(#colorRev)" name="Revenue (₹)" />
                    <Area yAxisId="right" type="monotone" dataKey="Patients" stroke="#a855f7" fillOpacity={0} name="Patients count" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="p-4 rounded-2xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 text-xs space-y-2">
                <div className="flex justify-between font-bold">
                  <span>Weekly Operations Earnings:</span>
                  <span className="text-emerald-500">₹76,000.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Average patients checkup rate:</span>
                  <span>15 per day</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* EMR & Prescription Generator Dialogue Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl glass-panel border-white/20 p-6 space-y-6 text-left relative overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setSelectedAppt(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-slate-500/10 pb-3">
              <h3 className="text-lg font-black">Clinical EMR Form</h3>
              <p className="text-xs text-slate-500">Patient: <strong className="text-slate-700 dark:text-white">{selectedAppt.patientName}</strong></p>
            </div>

            <form onSubmit={handleSavePrescription} className="space-y-4">
              
              {/* Consultation Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">Diagnosis Notes / Advice</label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Patient reports mild headache. Advised to stay hydrated and avoid bright screens."
                  className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                />
              </div>

              {/* Medicine adder */}
              <div className="space-y-3 border-t border-slate-500/10 pt-4">
                <span className="text-xs font-bold text-slate-500 block">Add Prescription Medicines</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Medicine Name (e.g. Paracetamol)"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    className="bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 500mg)"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Frequency (e.g. Twice daily)"
                    value={medFreq}
                    onChange={(e) => setMedFreq(e.target.value)}
                    className="bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Duration (e.g. 5 days)"
                      value={medDur}
                      onChange={(e) => setMedDur(e.target.value)}
                      className="flex-1 bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="p-2.5 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Medicines List */}
              {medicines.length > 0 && (
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {medicines.map((med, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-white/25 dark:bg-slate-900/25 border border-slate-300/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold">{med.name} • {med.dosage}</span>
                        <span className="text-[10px] text-slate-400 block">{med.frequency} for {med.duration}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Save Button */}
              <button
                type="submit"
                disabled={medicines.length === 0 || savingPrescription}
                className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {savingPrescription ? "Writing record..." : "Authorize EMR & Close Session"}
              </button>

            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}



// Inline Refresh helper
function RefreshCw({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3" />
    </svg>
  );
}
