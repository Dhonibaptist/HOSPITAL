"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useApp } from '@/context/AppContext';
import { 
  QrCode, 
  Flame, 
  Truck, 
  Droplet, 
  CheckCircle, 
  User, 
  Clock, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  specialization: string;
  date: string;
  timeSlot: string;
  status: string;
  queueStatus: string;
  tokenNumber?: number;
}

export default function ReceptionistDashboard() {
  const { user } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [manualApptId, setManualApptId] = useState('');
  
  // Emergency Walk-in Form states
  const [walkinName, setWalkinName] = useState('');
  const [walkinDocId, setWalkinDocId] = useState('usr-doc-1');
  const [walkinTime, setWalkinTime] = useState('11:30 AM');
  const [isEmergency, setIsEmergency] = useState(false);
  
  // Ambulance fleet simulation
  const [ambulances, setAmbulances] = useState([
    { id: 'AMB-101', driver: 'Ramesh Singh', phone: '+91 91111 22222', eta: '5 mins', status: 'Dispatched', priority: 'CRITICAL' },
    { id: 'AMB-104', driver: 'Karthik Raja', phone: '+91 92222 33333', eta: 'Ready', status: 'Standby', priority: 'STANDARD' },
  ]);

  // Blood bank mock stock
  const [bloodStock, setBloodStock] = useState<Record<string, number>>({
    'A+': 15, 'B+': 22, 'O-': 8, 'AB+': 11, 'O+': 34, 'A-': 5
  });

  const [alertMsg, setAlertMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error("Error reading schedule", err);
    }
  };

  const handleQRCheckIn = async (apptId: string) => {
    setAlertMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/appointments/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apptId })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || "Patient checked-in successfully!");
        setManualApptId('');
        fetchAppointments();
      } else {
        setAlertMsg(data.message || "Failed to process QR check-in.");
      }
    } catch (err) {
      setAlertMsg("Offline Check-In: Database connection is not available.");
      
      // Fallback local check-in
      try {
        const { mockDb } = await import('@/utils/mock-db');
        const appt = mockDb.appointments.find(a => a.id === apptId);
        if (appt) {
          appt.queueStatus = 'WAITING';
          appt.status = 'CONFIRMED';
          appt.tokenNumber = mockDb.appointments.filter(a => a.doctorId === appt.doctorId).length;
          setSuccessMsg(`Offline checked-in ${appt.patientName}. Token allocated: ${appt.tokenNumber}`);
          fetchAppointments();
        } else {
          setAlertMsg("Appointment ID not found in local mock files.");
        }
      } catch (e) {}
    }
  };

  const handleEmergencyWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim()) return;
    setAlertMsg('');
    setSuccessMsg('');

    try {
      // Emergency bookings bypass Razorpay and mark directly as CONFIRMED, queueStatus WAITING
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: walkinDocId,
          date: new Date().toISOString().split('T')[0],
          timeSlot: walkinTime,
          paymentStatus: 'UNPAID', // mark unpaid but confirmed for clinical emergency
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Automatically check-in the emergency booking
        await handleQRCheckIn(data.appointment.id);
        setWalkinName('');
        setSuccessMsg(`Emergency patient ${walkinName} registered & checked-in!`);
      } else {
        setAlertMsg(data.message || "Failed to reserve emergency walk-in");
      }
    } catch (err) {
      // Local fallback emergency write
      try {
        const { mockDb } = await import('@/utils/mock-db');
        const docObj = mockDb.doctors.find(d => d.id === walkinDocId);
        const apptId = 'appt-emg-' + Math.random().toString(36).substring(2, 7);
        const newAppt = {
          id: apptId,
          patientId: 'usr-walkin',
          patientName: walkinName + " (Walk-in)",
          doctorId: walkinDocId,
          doctorName: docObj?.name || 'On Duty Doctor',
          specialization: docObj?.specialization || 'General',
          date: new Date().toISOString().split('T')[0],
          timeSlot: walkinTime,
          status: 'CONFIRMED' as const,
          paymentStatus: 'UNPAID' as const,
          tokenNumber: mockDb.appointments.filter(a => a.doctorId === walkinDocId).length + 1,
          queueStatus: 'WAITING' as const
        };
        mockDb.appointments.push(newAppt);
        setSuccessMsg(`Emergency offline registered ${walkinName}. Token: ${newAppt.tokenNumber}`);
        setWalkinName('');
        fetchAppointments();
      } catch (e) {}
    }
  };

  const dispatchAmbulance = () => {
    const newAmb = {
      id: 'AMB-' + Math.floor(100 + Math.random() * 900),
      driver: 'Rajesh Kumar',
      phone: '+91 93333 44444',
      eta: '10 mins',
      status: 'Dispatched',
      priority: 'CRITICAL'
    };
    setAmbulances([...ambulances, newAmb]);
    setSuccessMsg(`Ambulance ${newAmb.id} successfully dispatched!`);
  };

  const updateBloodStock = (group: string, delta: number) => {
    setBloodStock(prev => ({
      ...prev,
      [group]: Math.max(0, prev[group] + delta)
    }));
  };

  const pendingCheckins = appointments.filter(a => a.queueStatus === 'NOT_ARRIVED' && a.status !== 'CANCELLED');
  const activeTriageQueue = appointments.filter(a => a.queueStatus === 'WAITING' || a.queueStatus === 'ACTIVE');

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full space-y-12 text-left">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-500/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">{user?.name || "Emily Clark (Receptionist)"}</h1>
            <p className="text-xs text-slate-500">Triage Center: Front Desk Operations Roster</p>
          </div>
          <button 
            onClick={fetchAppointments}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200/50 hover:bg-slate-300/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 text-xs font-bold w-fit border border-slate-300/10"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Queue lists
          </button>
        </div>

        {alertMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{alertMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left operations: QR Scanner & Walk-in */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. QR Scan Simulator */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-black tracking-tight">QR Check-In Scanner</h2>
              </div>

              {/* Developer Assist list */}
              <div className="p-4 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 space-y-2.5">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Pending Check-Ins (Click to auto-scan)
                </span>
                {pendingCheckins.length === 0 ? (
                  <span className="text-[10px] text-slate-500 block">No pending patient check-ins today</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {pendingCheckins.map((appt) => (
                      <button
                        key={appt.id}
                        onClick={() => handleQRCheckIn(appt.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200/50 hover:bg-slate-300/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 text-[10px] font-mono transition-all flex items-center gap-1 border border-slate-300/10"
                      >
                        {appt.patientName.split(' ')[0]} ({appt.timeSlot})
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste or Type Appointment ID (e.g. appt-1)"
                  value={manualApptId}
                  onChange={(e) => setManualApptId(e.target.value)}
                  className="flex-1 bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                />
                <button
                  onClick={() => handleQRCheckIn(manualApptId)}
                  className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-glass-glow transition-all"
                >
                  Verify Barcode ID
                </button>
              </div>

            </div>

            {/* 2. Walk-in Registration */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500 animate-pulse-slow" />
                <h2 className="text-lg font-black tracking-tight">Emergency Walk-In Triage</h2>
              </div>

              <form onSubmit={handleEmergencyWalkin} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Patient Name"
                    value={walkinName}
                    onChange={(e) => setWalkinName(e.target.value)}
                    className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Consulting Specialist</label>
                  <select
                    value={walkinDocId}
                    onChange={(e) => setWalkinDocId(e.target.value)}
                    className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  >
                    <option value="usr-doc-1">Dr. Sarah Jenkins (Cardiology)</option>
                    <option value="usr-doc-2">Dr. Rajan Sharma (Neurology)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Clinical Slot Assigned</label>
                  <select
                    value={walkinTime}
                    onChange={(e) => setWalkinTime(e.target.value)}
                    className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  >
                    {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end pb-1.5">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs shadow-glass transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-4 h-4" /> Book Triage Slot
                  </button>
                </div>
              </form>
            </div>

            {/* 3. Ambulance dispatch */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-accent-cyan" />
                  <h2 className="text-lg font-black tracking-tight">Ambulance Fleet Status</h2>
                </div>
                <button
                  onClick={dispatchAmbulance}
                  className="px-3 py-1.5 rounded-xl bg-brand-500 text-white text-[10px] font-bold hover:bg-brand-600 transition-colors"
                >
                  Dispatch Emergency Ride
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ambulances.map((amb, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 space-y-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>Vehicle: {amb.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        amb.status === 'Dispatched' ? 'bg-rose-500/15 text-rose-500' : 'bg-slate-500/15 text-slate-400'
                      }`}>{amb.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-1">
                      <div>Driver: {amb.driver} ({amb.phone})</div>
                      <div>Priority: <strong className="text-slate-800 dark:text-white">{amb.priority}</strong> • ETA: {amb.eta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right operations: active list & blood bank */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Active outpatient lineup */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-4">
              <h2 className="text-lg font-black tracking-tight">Active Outpatient queue</h2>
              
              {activeTriageQueue.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No active patients in clinic lobbies</p>
              ) : (
                <div className="space-y-3">
                  {activeTriageQueue.map((appt) => (
                    <div key={appt.id} className="p-3 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold block">{appt.patientName}</span>
                        <span className="text-[9px] text-slate-400 block">Doctor: {appt.doctorName} • Token: #{appt.tokenNumber}</span>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                        appt.queueStatus === 'ACTIVE' ? 'bg-rose-500/15 text-rose-500' : 'bg-brand-500/15 text-brand-500'
                      }`}>{appt.queueStatus}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blood Bank stock */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-500 animate-pulse-slow" />
                <h2 className="text-lg font-black tracking-tight">Blood Stock Availability</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {Object.entries(bloodStock).map(([grp, count]) => (
                  <div key={grp} className="p-3 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 flex flex-col items-center justify-between">
                    <span className="font-black text-sm text-rose-500">{grp}</span>
                    <span className="text-lg font-black">{count} U</span>
                    <div className="flex gap-1.5 mt-2">
                      <button 
                        onClick={() => updateBloodStock(grp, -1)}
                        className="w-5 h-5 rounded bg-slate-300/50 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold flex items-center justify-center select-none"
                      >-</button>
                      <button 
                        onClick={() => updateBloodStock(grp, 1)}
                        className="w-5 h-5 rounded bg-slate-300/50 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold flex items-center justify-center select-none"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
