"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import ChatBot from '@/components/chat-bot';
import PaymentModal from '@/components/payment-modal';
import { useApp } from '@/context/AppContext';
import { 
  Heart, 
  Activity, 
  Layers, 
  Calendar, 
  FileText, 
  Bell, 
  Shield, 
  QrCode, 
  Video, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RefreshCw,
  Users,
  Sparkles,
  FileSearch,
  Upload,
  AlertTriangle,
  HeartCrack
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import Link from 'next/link';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  consultationFee: number;
  availability: Record<string, string[]>;
  image: string;
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  gender: string;
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  familyMemberId?: string;
  familyMemberName?: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  date: string;
  timeSlot: string;
  status: string;
  paymentStatus: string;
  paymentId?: string;
  tokenNumber?: number;
  queueStatus: string;
  prescription?: {
    id: string;
    medicines: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
    notes?: string;
  };
}

export default function PatientDashboard() {
  const { user, t } = useApp();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  
  // Reminders Form
  const [newMed, setNewMed] = useState('');
  const [newTime, setNewTime] = useState('08:00 AM');
  
  // Family Form
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState<'FATHER' | 'MOTHER' | 'CHILD' | 'GRANDPARENT'>('CHILD');
  const [famAge, setFamAge] = useState(10);
  const [famGender, setFamGender] = useState('MALE');
  const [addingFamily, setAddingFamily] = useState(false);

  // Health Profile Risk Calculator
  const [bloodSugar, setBloodSugar] = useState(105);
  const [systolicBP, setSystolicBP] = useState(118);
  const [exerciseHours, setExerciseHours] = useState(5);
  const [isSmoker, setIsSmoker] = useState(false);
  const [riskScores, setRiskScores] = useState({
    heartRisk: 15,
    diabetesRisk: 22,
    bmiRisk: 12,
    lifestyleScore: 82
  });
  const [calculatingRisk, setCalculatingRisk] = useState(false);

  // Medical Report Analyzer Form
  const [reportFileName, setReportFileName] = useState('blood_test_report_2026.pdf');
  const [reportType, setReportType] = useState<'LAB_RESULT' | 'IMAGING' | 'ECG'>('LAB_RESULT');
  const [reportText, setReportText] = useState('Fasting Sugar: 140 mg/dL, HbA1c: 6.8%, Cholesterol: 210 mg/dL');
  const [analyzingReport, setAnalyzingReport] = useState(false);
  const [analyzedResult, setAnalyzedResult] = useState<any>(null);

  // Booking selections
  const [selectedSpec, setSelectedSpec] = useState('all');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookForId, setBookForId] = useState('self'); // 'self' or familyMemberId

  // Dialog & Modal Triggers
  const [checkoutAppt, setCheckoutAppt] = useState<any>(null);
  const [activeQueueDoctorId, setActiveQueueDoctorId] = useState<string | null>(null);
  const [activeQueueApptId, setActiveQueueApptId] = useState<string | null>(null);
  const [liveQueueData, setLiveQueueData] = useState<any>(null);
  
  const [qrApptId, setQrApptId] = useState<string | null>(null);
  const [prescriptionDetail, setPrescriptionDetail] = useState<any>(null);

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
    fetchFamilyMembers();
    fetchHealthProfile();
    loadLocalReminders();
  }, []);

  // Poll SSE queue updates
  useEffect(() => {
    if (!activeQueueDoctorId) return;

    let url = `/api/queue/stream?doctorId=${activeQueueDoctorId}`;
    if (activeQueueApptId) url += `&appointmentId=${activeQueueApptId}`;

    const eventSource = new EventSource(url);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLiveQueueData(data);
    };

    return () => {
      eventSource.close();
    };
  }, [activeQueueDoctorId, activeQueueApptId]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors);
      }
    } catch (err) {}
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments);
        
        const activeAppt = data.appointments.find((a: any) => 
          a.queueStatus === 'WAITING' || a.queueStatus === 'ACTIVE'
        );
        if (activeAppt) {
          setActiveQueueDoctorId(activeAppt.doctorId);
          setActiveQueueApptId(activeAppt.id);
        }
      }
    } catch (err) {}
  };

  const fetchFamilyMembers = async () => {
    try {
      const res = await fetch('/api/patient/family');
      if (res.ok) {
        const data = await res.json();
        setFamilyMembers(data.familyMembers);
      }
    } catch (err) {}
  };

  const fetchHealthProfile = async () => {
    try {
      const res = await fetch('/api/ai/calculate-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloodSugar: 100, systolicBP: 120, exerciseHoursPerWeek: 5, smoking: false })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setBloodSugar(data.profile.bloodSugar);
          setSystolicBP(data.profile.systolicBP);
          setExerciseHours(data.profile.exerciseHoursPerWeek);
          setIsSmoker(data.profile.smoking);
          setRiskScores({
            heartRisk: data.profile.heartRisk,
            diabetesRisk: data.profile.diabetesRisk,
            bmiRisk: data.profile.bmiRisk,
            lifestyleScore: data.profile.lifestyleScore
          });
        }
      }
    } catch (err) {}
  };

  const loadLocalReminders = () => {
    const data = localStorage.getItem('local_medicine_reminders');
    if (data) setReminders(JSON.parse(data));
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.trim()) return;
    const list = [...reminders, { id: Date.now(), medicine: newMed, time: newTime, active: true }];
    setReminders(list);
    localStorage.setItem('local_medicine_reminders', JSON.stringify(list));
    setNewMed('');
  };

  const handleDeleteReminder = (id: number) => {
    const list = reminders.filter(r => r.id !== id);
    setReminders(list);
    localStorage.setItem('local_medicine_reminders', JSON.stringify(list));
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!famName.trim()) return;
    setAddingFamily(true);

    try {
      const res = await fetch('/api/patient/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: famName, relation: famRelation, age: Number(famAge), gender: famGender })
      });
      if (res.ok) {
        fetchFamilyMembers();
        setFamName('');
      }
    } catch (err) {} finally {
      setAddingFamily(false);
    }
  };

  const handleRiskCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculatingRisk(true);

    try {
      const res = await fetch('/api/ai/calculate-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloodSugar, systolicBP, exerciseHoursPerWeek: exerciseHours, smoking: isSmoker })
      });
      if (res.ok) {
        const data = await res.json();
        setRiskScores({
          heartRisk: data.profile.heartRisk,
          diabetesRisk: data.profile.diabetesRisk,
          bmiRisk: data.profile.bmiRisk,
          lifestyleScore: data.profile.lifestyleScore
        });
      }
    } catch (err) {} finally {
      setCalculatingRisk(false);
    }
  };

  const handleAnalyzeReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzingReport(true);
    setAnalyzedResult(null);

    try {
      const res = await fetch('/api/ai/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: reportFileName, reportType, reportText })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyzedResult(data.report);
      }
    } catch (err) {} finally {
      setAnalyzingReport(false);
    }
  };

  const handleBookClick = () => {
    if (!selectedDocId || !selectedDate || !selectedSlot) return;
    const doc = doctors.find(d => d.id === selectedDocId);
    if (!doc) return;

    setCheckoutAppt({
      doctorId: doc.id,
      doctorName: doc.name,
      specialization: doc.specialization,
      consultationFee: doc.consultationFee,
      date: selectedDate,
      timeSlot: selectedSlot,
      familyMemberId: bookForId === 'self' ? undefined : bookForId
    });
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    if (!checkoutAppt) return;
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: checkoutAppt.doctorId,
          date: checkoutAppt.date,
          timeSlot: checkoutAppt.timeSlot,
          paymentStatus: 'PAID',
          paymentId,
          familyMemberId: checkoutAppt.familyMemberId
        })
      });
      if (res.ok) {
        fetchAppointments();
        setSelectedDocId('');
        setSelectedSlot('');
        setBookForId('self');
      }
    } catch (err) {}
  };

  const handleSelectSpecialistFromChat = (spec: string) => {
    setSelectedSpec(spec);
    const doc = doctors.find(d => d.specialization.toLowerCase() === spec.toLowerCase());
    if (doc) setSelectedDocId(doc.id);
  };

  // Recharts mapped data
  const radarData = [
    { subject: 'Heart Risk %', score: riskScores.heartRisk, fullMark: 100 },
    { subject: 'Diabetes Risk %', score: riskScores.diabetesRisk, fullMark: 100 },
    { subject: 'BMI Risk %', score: riskScores.bmiRisk, fullMark: 100 },
    { subject: 'Lifestyle Score', score: riskScores.lifestyleScore, fullMark: 100 }
  ];

  const specFilteredDoctors = selectedSpec === 'all' 
    ? doctors 
    : doctors.filter(d => d.specialization.toLowerCase() === selectedSpec.toLowerCase());

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full space-y-12">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-500/10 pb-6 text-left">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Welcome, {user?.name || "Patient"}</h1>
            <p className="text-xs text-slate-500">Corporate Health ID: ASTRA-PAT-{user?.id?.substring(4, 8) || "098"}</p>
          </div>
          <button 
            onClick={fetchAppointments}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200/50 hover:bg-slate-300/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 text-xs font-bold w-fit border border-slate-300/10"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Synchronize Records
          </button>
        </div>

        {/* Health Tracker Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Heart Rate", val: "72 bpm", state: "Optimal", color: "text-rose-500 bg-rose-500/10", icon: Heart },
            { label: "Blood Pressure", val: "120/80", state: "Optimal", color: "text-accent-cyan bg-accent-cyan/10", icon: Activity },
            { label: "Lifestyle Score", val: `${riskScores.lifestyleScore}/100`, state: "Healthy", color: "text-accent-purple bg-accent-purple/10", icon: Layers },
            { label: "Cholesterol", val: "185 mg/dL", state: "Normal", color: "text-emerald-500 bg-emerald-500/10", icon: Shield }
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
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {card.state}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* Real-time Queue Tracking (SSE) */}
        {activeQueueDoctorId && liveQueueData && (
          <section className="p-6 rounded-3xl bg-gradient-to-r from-brand-950/60 to-slate-900/60 border border-brand-500/20 shadow-glass text-left grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs text-rose-500 font-bold uppercase tracking-wider">
                <Clock className="w-4 h-4 animate-spin" /> Live Triage Status
              </div>
              <h3 className="text-lg font-bold">Queue progress update</h3>
              <p className="text-xs text-slate-400">Physician consultation lounge</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Now Serving Token</span>
              <span className="text-3xl font-black text-brand-500">{liveQueueData.currentServing || "Wait"}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Your Token Position</span>
              <span className="text-3xl font-black text-accent-cyan">{liveQueueData.patientToken || "-"}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Estimated Wait</span>
              <span className="text-2xl font-black text-emerald-500">
                {liveQueueData.estimatedWaitMinutes > 0 ? `${liveQueueData.estimatedWaitMinutes} mins` : "Ready"}
              </span>
              
              {liveQueueData.patientQueueStatus === 'ACTIVE' && activeQueueApptId && (
                <Link
                  href={`/consultation/${activeQueueApptId}`}
                  className="mt-2 block w-full py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] text-center shadow-neon-purple transition-colors"
                >
                  Join Video Visit Now
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
          
          {/* LEFT SECTION (7 Columns) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Booking Form Widget */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-500/10 pb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-500" />
                  <h2 className="text-lg font-black tracking-tight">{t.bookNow}</h2>
                </div>
                {/* Book For Selector */}
                <select
                  value={bookForId}
                  onChange={(e) => setBookForId(e.target.value)}
                  className="bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/10 rounded-lg py-1 px-3.5 text-[11px] font-bold focus:outline-none"
                >
                  <option value="self">Book for Self</option>
                  {familyMembers.map(m => (
                    <option key={m.id} value={m.id}>Book for {m.name} ({m.relation})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Specialty Clinic</label>
                  <select 
                    value={selectedSpec}
                    onChange={(e) => { setSelectedSpec(e.target.value); setSelectedDocId(''); }}
                    className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  >
                    <option value="all">All Clinics</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="neurology">Neurology</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Consulting Specialist</label>
                  <select 
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  >
                    <option value="">Select Doctor</option>
                    {specFilteredDoctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                    ))}
                  </select>
                </div>
              </div>

              {doctors.find(d => d.id === selectedDocId) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-500/10 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Available Date</label>
                    <input 
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Available Slots</label>
                    <select 
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                    >
                      <option value="">Select Time</option>
                      {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {doctors.find(d => d.id === selectedDocId) && selectedDate && selectedSlot && (
                <button
                  type="button"
                  onClick={handleBookClick}
                  className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-glass-glow transition-all"
                >
                  Verify Availability & Lock Slot
                </button>
              )}
            </div>

            {/* AI Medical Report Analyzer */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
              <div className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-black tracking-tight">AI Medical Report Analyzer</h2>
              </div>

              <form onSubmit={handleAnalyzeReport} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Document Type</label>
                  <select 
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  >
                    <option value="LAB_RESULT">Blood Test Report</option>
                    <option value="ECG">ECG Waveform</option>
                    <option value="IMAGING">Imaging Scan / X-Ray</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">File Name Attachment</label>
                  <div className="relative">
                    <Upload className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text"
                      value={reportFileName}
                      onChange={(e) => setReportFileName(e.target.value)}
                      className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-3 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Input / Copied Report text values</label>
                  <textarea
                    required
                    rows={2}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="e.g. Fasting Sugar: 140 mg/dL, WBC: 12000 cells/mcL"
                    className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={analyzingReport}
                  className="sm:col-span-2 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan text-white font-bold text-xs shadow-glass-glow flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" /> {analyzingReport ? "AI Analyzing report..." : "Analyze Diagnostic report"}
                </button>
              </form>

              {analyzedResult && (
                <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/30 border border-slate-500/10 space-y-3.5 text-xs text-left">
                  <div className="flex justify-between items-center border-b border-slate-500/10 pb-2">
                    <span className="font-bold text-brand-500">AI Analyzer Results Summary</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      analyzedResult.riskLevel === 'HIGH' ? 'bg-rose-500/15 text-rose-500' : analyzedResult.riskLevel === 'MEDIUM' ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500'
                    }`}>
                      Risk level: {analyzedResult.riskLevel}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wider">Key Findings:</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{analyzedResult.keyFindings}</p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wider">Alert Values / Abnormalities:</span>
                      <p className="text-rose-500 font-extrabold">{analyzedResult.abnormalValues}</p>
                    </div>

                    {analyzedResult.specialist && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-500/5 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold">Suggested specialist: <strong className="text-slate-800 dark:text-white">{analyzedResult.specialist}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleSelectSpecialistFromChat(analyzedResult.specialist)}
                          className="px-3 py-1 rounded bg-brand-500 text-white font-bold text-[9px]"
                        >
                          Book {analyzedResult.specialist}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Health Risk Dashboard (Recharts Radar) */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
              <div className="flex items-center gap-2">
                <HeartCrack className="w-5 h-5 text-rose-500 animate-pulse-slow" />
                <h2 className="text-lg font-black tracking-tight">AI Health Risk Score Dashboard</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Form to submit parameters */}
                <form onSubmit={handleRiskCalculate} className="md:col-span-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Fasting Sugar (mg/dL)</label>
                      <input
                        type="number"
                        value={bloodSugar}
                        onChange={(e) => setBloodSugar(Number(e.target.value))}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Systolic BP (mmHg)</label>
                      <input
                        type="number"
                        value={systolicBP}
                        onChange={(e) => setSystolicBP(Number(e.target.value))}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Exercise (Hrs/Week)</label>
                      <input
                        type="number"
                        value={exerciseHours}
                        onChange={(e) => setExerciseHours(Number(e.target.value))}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 pl-2 border border-slate-300/20 rounded-xl bg-white/20 dark:bg-slate-900/20">
                      <input
                        type="checkbox"
                        checked={isSmoker}
                        onChange={() => setIsSmoker(!isSmoker)}
                        className="w-4 h-4 accent-brand-500"
                      />
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Active Smoker</label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={calculatingRisk}
                    className="w-full py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-glass-glow flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> {calculatingRisk ? "Calculating Risk Indexes..." : "Compile Risk Score"}
                  </button>
                </form>

                {/* Recharts Radar chart */}
                <div className="md:col-span-6 w-full h-52 text-[10px] font-bold text-slate-400">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                      <PolarAngleAxis dataKey="subject" stroke="#888888" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#888888" />
                      <Radar 
                        name="Health Profile" 
                        dataKey="score" 
                        stroke="#0e94eb" 
                        fill="#0e94eb" 
                        fillOpacity={0.4} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>

          </div>
          
          {/* RIGHT SECTION (5 Columns) */}
          <div className="lg:col-span-5 space-y-8 text-left">
            
            {/* Appointments schedule */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent-purple" />
                <h2 className="text-lg font-black tracking-tight">{t.upcomingAppts}</h2>
              </div>

              {appointments.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No scheduled appointments</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="p-4 rounded-2xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-sm block">
                            {appt.patientName} {appt.familyMemberName ? `(${appt.familyMemberName})` : ''}
                          </span>
                          <span className="text-[10px] text-brand-500 dark:text-accent-cyan block font-bold">{appt.specialization} • {appt.doctorName}</span>
                        </div>
                        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          appt.status === 'CONFIRMED' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
                        }`}>
                          {appt.status}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 flex justify-between">
                        <span>Slot: {appt.date} • {appt.timeSlot}</span>
                        <span>Queue: <strong className="text-slate-800 dark:text-white">{appt.queueStatus}</strong></span>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-500/10">
                        {appt.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setQrApptId(appt.id)}
                            className="flex-1 py-2 rounded-xl bg-slate-200/50 hover:bg-slate-300/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 text-[10px] font-bold flex items-center justify-center gap-1.5 border border-slate-300/10 transition-all"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Check-in QR
                          </button>
                        )}
                        
                        {appt.queueStatus === 'ACTIVE' && (
                          <Link
                            href={`/consultation/${appt.id}`}
                            className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Video className="w-3.5 h-3.5 animate-pulse-slow" /> Tele-Consult
                          </Link>
                        )}

                        {appt.prescription && (
                          <button
                            onClick={() => setPrescriptionDetail(appt.prescription)}
                            className="flex-1 py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500 hover:text-white text-brand-500 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <FileText className="w-3.5 h-3.5" /> Prescription
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Family profiles manager */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-500" />
                <h2 className="text-lg font-black tracking-tight">Family Health Management</h2>
              </div>

              {/* Members Row list */}
              <div className="grid grid-cols-2 gap-3">
                {familyMembers.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 text-xs">
                    <span className="font-bold block">{m.name}</span>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1 uppercase">
                      <span>{m.relation}</span>
                      <span>{m.age} yrs • {m.gender}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Family form */}
              <form onSubmit={handleAddFamilyMember} className="space-y-3 border-t border-slate-500/10 pt-4">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Add Family Member Profile</span>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Member Full Name"
                    value={famName}
                    onChange={(e) => setFamName(e.target.value)}
                    className="col-span-2 bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 focus:outline-none"
                  />
                  <select
                    value={famRelation}
                    onChange={(e) => setFamRelation(e.target.value as any)}
                    className="bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 focus:outline-none"
                  >
                    <option value="CHILD">Child</option>
                    <option value="MOTHER">Mother</option>
                    <option value="FATHER">Father</option>
                    <option value="GRANDPARENT">Grandparent</option>
                  </select>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Age"
                    value={famAge}
                    onChange={(e) => setFamAge(Number(e.target.value))}
                    className="bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 focus:outline-none"
                  />
                  <select
                    value={famGender}
                    onChange={(e) => setFamGender(e.target.value)}
                    className="col-span-2 bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2 px-3 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={addingFamily}
                  className="w-full py-2.5 rounded-xl border border-dashed border-brand-500 text-brand-500 dark:text-accent-cyan text-xs font-bold hover:bg-brand-500/10 transition-colors"
                >
                  {addingFamily ? "Saving..." : "Add Family Member"}
                </button>
              </form>
            </div>

            {/* Medicine Reminder System */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent-cyan" />
                <h2 className="text-lg font-black tracking-tight">{t.remindersLabel}</h2>
              </div>

              <form onSubmit={handleAddReminder} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Vitamin D3, Paracetamol etc"
                  value={newMed}
                  onChange={(e) => setNewMed(e.target.value)}
                  className="flex-1 bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                />
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                >
                  {['08:00 AM', '12:30 PM', '04:00 PM', '09:00 PM', '09:30 PM'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="p-3.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              <div className="space-y-3.5">
                {reminders.map(r => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm block">{r.medicine}</span>
                      <span className="text-[10px] text-slate-400 block">{r.time}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(r.id)}
                      className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Insurance details tracker */}
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-black tracking-tight">{t.insuranceLabel}</h2>
              </div>
              <div className="p-4 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span>Provider:</span>
                  <span>UnitedHealthcare Corp</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Policy Number:</span>
                  <span>UA-987-99-234</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Coverage Status:</span>
                  <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[9px] uppercase">
                    ACTIVE / APPR
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* QR Code Dialog */}
      {qrApptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl glass-panel border-white/20 p-6 text-center space-y-6 relative">
            <button 
              onClick={() => setQrApptId(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-black">Fast-Track Check-In QR</h3>
            <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-md border">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${qrApptId}`} 
                alt="Appointment QR" 
                className="w-40 h-40"
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Show this QR to the receptionist scanner or automated kiosk upon arrival to register in the queue list.
            </p>
          </div>
        </div>
      )}

      {/* Prescription Viewer */}
      {prescriptionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl glass-panel border-white/20 p-6 space-y-4 text-left relative">
            <button 
              onClick={() => setPrescriptionDetail(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="border-b border-slate-500/10 pb-3">
              <h3 className="text-lg font-black text-brand-500">Digital Prescription</h3>
              <span className="text-[10px] text-slate-500 block">Issued Ref: {prescriptionDetail.id}</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Medicines Checklist:</span>
                {prescriptionDetail.medicines.map((m: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10 text-xs">
                    <div className="flex justify-between font-bold mb-1">
                      <span>{m.name}</span>
                      <span className="text-brand-500 dark:text-accent-cyan font-medium">{m.dosage}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>{m.frequency}</span>
                      <span>Duration: {m.duration}</span>
                    </div>
                  </div>
                ))}
              </div>

              {prescriptionDetail.notes && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block tracking-wider">Physician's Notes:</span>
                  <p className="p-3 rounded-xl bg-slate-200/30 dark:bg-slate-900/30 border border-slate-300/10 text-xs italic text-slate-600 dark:text-slate-400">
                    "{prescriptionDetail.notes}"
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              Print Prescription Sheet
            </button>
          </div>
        </div>
      )}

      {/* Floating Chat Bot */}
      <ChatBot onSelectSpecialist={handleSelectSpecialistFromChat} />

      {/* Checkout Payment Modal */}
      {checkoutAppt && (
        <PaymentModal
          isOpen={!!checkoutAppt}
          onClose={() => setCheckoutAppt(null)}
          doctorName={checkoutAppt.doctorName}
          specialization={checkoutAppt.specialization}
          consultationFee={checkoutAppt.consultationFee}
          date={checkoutAppt.date}
          timeSlot={checkoutAppt.timeSlot}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      <Footer />
    </div>
  );
}

// Inline Close helper
function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
