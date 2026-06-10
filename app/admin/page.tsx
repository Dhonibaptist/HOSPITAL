"use client";

import { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { useApp } from '@/context/AppContext';
import { 
  Building, 
  Users, 
  Activity, 
  DollarSign, 
  Plus, 
  Settings, 
  Download, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  Pill,
  Package,
  Edit2,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  consultationFee: number;
  languages: string[];
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string; // YYYY-MM-DD
  supplier: string;
}

export default function AdminDashboard() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'clinic' | 'inventory' | 'settings'>('clinic');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // New Doctor creation states
  const [docName, setDocName] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docSpec, setDocSpec] = useState('Cardiology');
  const [docExp, setDocExp] = useState(6);
  const [docFee, setDocFee] = useState(600);
  const [docLang, setDocLang] = useState('English');
  const [docPass, setDocPass] = useState('password123');

  // Config toggles
  const [multiHospital, setMultiHospital] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [auditLogs, setAuditLogs] = useState(false);

  // Medicine Inventory states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [invName, setInvName] = useState('');
  const [invQty, setInvQty] = useState(50);
  const [invExpiry, setInvExpiry] = useState('');
  const [invSupplier, setInvSupplier] = useState('');
  
  // Inventory Inline Editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchInventory();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors);
      }
    } catch (err) {
      console.error("Doctors fetching error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      const res = await fetch('/api/admin/inventory');
      if (res.ok) {
        const data = await res.json();
        setInventory(data.inventory);
      }
    } catch (err) {
      console.error("Inventory fetching error", err);
      // fallback to mockDb
      try {
        const { mockDb } = await import('@/utils/mock-db');
        setInventory(mockDb.medicineInventory);
      } catch (e) {}
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName,
          email: docEmail,
          password: docPass,
          role: 'DOCTOR',
          specialization: docSpec,
          experience: Number(docExp),
          consultationFee: Number(docFee),
          languages: docLang.split(',').map(s => s.trim()),
          availability: { "Monday": ["09:00 AM", "11:00 AM"] }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Doctor ${docName} successfully registered in system database!`);
        setDocName('');
        setDocEmail('');
        fetchDoctors();
      } else {
        setErrorMsg(data.message || "Failed to register doctor profile");
      }
    } catch (err) {
      setErrorMsg("Offline: Local fallbacks will add doctor profile in memory.");
      
      try {
        const { mockDb } = await import('@/utils/mock-db');
        const mockId = 'usr-doc-' + Math.random().toString(36).substring(2, 6);
        const newUserObj = {
          id: mockId,
          name: docName,
          email: docEmail,
          phone: '',
          role: 'DOCTOR' as const,
          passwordHash: ''
        };
        mockDb.users.push(newUserObj);
        mockDb.doctors.push({
          id: mockId,
          name: docName,
          specialization: docSpec,
          experience: docExp,
          consultationFee: docFee,
          languages: [docLang],
          availability: {},
          rating: 5.0,
          image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop',
          qualifications: ['MBBS']
        });
        setSuccessMsg(`Offline registered doctor ${docName}`);
        setDocName('');
        setDocEmail('');
        fetchDoctors();
      } catch (e) {}
    }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: invName,
          quantity: Number(invQty),
          expiryDate: invExpiry,
          supplier: invSupplier
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Medicine "${invName}" registered successfully!`);
        setInvName('');
        setInvQty(50);
        setInvExpiry('');
        setInvSupplier('');
        fetchInventory();
      } else {
        setErrorMsg(data.message || "Failed to register stock item");
      }
    } catch (err) {
      setErrorMsg("Offline: Falling back to register in-memory.");
      try {
        const { mockDb } = await import('@/utils/mock-db');
        const mockId = 'inv-' + Math.random().toString(36).substring(2, 6);
        mockDb.medicineInventory.push({
          id: mockId,
          name: invName,
          quantity: Number(invQty),
          expiryDate: invExpiry,
          supplier: invSupplier
        });
        setSuccessMsg(`Registered "${invName}" in memory.`);
        setInvName('');
        setInvQty(50);
        setInvExpiry('');
        setInvSupplier('');
        fetchInventory();
      } catch (e) {}
    }
  };

  const handleUpdateQuantity = async (id: string, newQty: number) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          quantity: Number(newQty)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Stock quantity updated successfully!");
        setEditingItemId(null);
        fetchInventory();
      } else {
        setErrorMsg(data.message || "Failed to update quantity");
      }
    } catch (err) {
      setErrorMsg("Offline: Updating stock level in-memory.");
      try {
        const { mockDb } = await import('@/utils/mock-db');
        const item = mockDb.medicineInventory.find(i => i.id === id);
        if (item) {
          item.quantity = Number(newQty);
          setSuccessMsg("Stock level updated in-memory.");
        }
        setEditingItemId(null);
        fetchInventory();
      } catch (e) {}
    }
  };

  const checkExpiryStatus = (expiryStr: string) => {
    const expiryDate = new Date(expiryStr);
    const today = new Date();
    expiryDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'EXPIRED', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    } else if (diffDays <= 30) {
      return { status: 'NEAR EXPIRY', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', daysLeft: diffDays };
    } else {
      return { status: 'OK', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    }
  };

  const downloadReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "=== SYSTEM OPERATIONAL METRICS ===\n";
    csvContent += `Total Doctors,${doctors.length}\n`;
    csvContent += "Total Patients,12450\n";
    csvContent += "Total Medicine Types," + inventory.length + "\n";
    csvContent += "Total Medicine Stock Volume," + inventory.reduce((sum, item) => sum + item.quantity, 0) + "\n\n";
    
    csvContent += "=== OUTPATIENT DOCTORS REGISTRY ===\n";
    csvContent += "Name,Specialization,Experience,Fee (INR),Languages\n";
    doctors.forEach(d => {
      csvContent += `"${d.name}","${d.specialization}",${d.experience},${d.consultationFee},"${d.languages.join('; ')}"\n`;
    });
    
    csvContent += "\n=== MEDICINE INVENTORY LOGS ===\n";
    csvContent += "Medicine Name,Quantity (Units),Expiry Date,Supplier,Status\n";
    inventory.forEach(i => {
      const statusInfo = checkExpiryStatus(i.expiryDate);
      const lowStockTag = i.quantity < 20 ? "LOW STOCK" : "NORMAL";
      csvContent += `"${i.name}",${i.quantity},"${i.expiryDate}","${i.supplier}","${statusInfo.status} | ${lowStockTag}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AstraCare_Enterprise_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg("Comprehensive enterprise system report downloaded!");
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full space-y-8 text-left">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-500/10 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">{user?.name || "Administrator"}</h1>
            <p className="text-xs text-slate-500">Corporate Management Center: System Administration console</p>
          </div>
          <button 
            onClick={downloadReport}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600 transition-colors shadow-glass-glow"
          >
            <Download className="w-3.5 h-3.5" /> Compile & Download CSV Report
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-500/10 gap-2 p-1 bg-slate-200/20 dark:bg-slate-900/20 rounded-2xl w-fit">
          <button
            onClick={() => {
              setActiveTab('clinic');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'clinic'
                ? 'bg-brand-500 text-white shadow-glass-glow'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Clinic & Specialists
          </button>
          <button
            onClick={() => {
              setActiveTab('inventory');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-brand-500 text-white shadow-glass-glow'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/5'
            }`}
          >
            <Pill className="w-4 h-4" /> Medicine Inventory
          </button>
          <button
            onClick={() => {
              setActiveTab('settings');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-brand-500 text-white shadow-glass-glow'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" /> System Configurations
          </button>
        </div>

        {/* Clinic & Specialists Tab */}
        {activeTab === 'clinic' && (
          <div className="space-y-8">
            {/* Stats cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Active Doctors Registry", val: doctors.length.toString(), desc: "Registered specialists", icon: UserCheck, color: "text-brand-500 bg-brand-500/10" },
                { label: "Annual Clinic Revenue", val: "₹45.2 Lakhs", desc: "Fiscal Year 2026", icon: DollarSign, color: "text-emerald-500 bg-emerald-500/10" },
                { label: "Patients Registered", val: "12,450", desc: "Corporate ID base", icon: Users, color: "text-accent-purple bg-accent-purple/10" },
                { label: "Active Branches", val: "4 Regions", desc: "OMR, Adyar, T-Nagar, Central", icon: Building, color: "text-accent-cyan bg-accent-cyan/10" }
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className="p-5 rounded-2xl glass-card space-y-4">
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

            {/* Management Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Add Doctor Profile Form */}
              <div className="lg:col-span-12 space-y-8">
                <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-brand-500" />
                    <h2 className="text-lg font-black tracking-tight">Register Medical Specialist</h2>
                  </div>

                  <form onSubmit={handleAddDoctor} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Doctor Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Rajesh Kumar"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Hospital Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="rajesh@astracare.com"
                        value={docEmail}
                        onChange={(e) => setDocEmail(e.target.value)}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Clinical Specialization</label>
                      <select
                        value={docSpec}
                        onChange={(e) => setDocSpec(e.target.value)}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-3 px-4 text-xs font-medium focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      >
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Orthopedics">Orthopedics</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Years Experience</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={docExp}
                        onChange={(e) => setDocExp(Number(e.target.value))}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Consultation Fee (INR)</label>
                      <input
                        type="number"
                        required
                        min={100}
                        value={docFee}
                        onChange={(e) => setDocFee(Number(e.target.value))}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Languages Spoken (comma separated)</label>
                      <input
                        type="text"
                        placeholder="English, Tamil, Hindi"
                        value={docLang}
                        onChange={(e) => setDocLang(e.target.value)}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="flex items-end pb-1.5 sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-glass-glow transition-all"
                      >
                        Add Doctor to Database
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Doctor List */}
            <section className="p-6 rounded-3xl glass-panel border-white/10 space-y-4">
              <h2 className="text-lg font-black tracking-tight">Outpatient Doctors Registry ({doctors.length})</h2>
              
              {loading ? (
                <p className="text-xs text-slate-500 py-6 text-center">Loading registry...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-500/10 text-slate-400 uppercase text-[9px] font-bold">
                        <th className="py-3 px-2">Doctor Name</th>
                        <th className="py-3 px-2">Specialization</th>
                        <th className="py-3 px-2">Experience</th>
                        <th className="py-3 px-2">Consultation Fee</th>
                        <th className="py-3 px-2">Languages</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map((d) => (
                        <tr key={d.id} className="border-b border-slate-500/5 hover:bg-slate-200/20 dark:hover:bg-slate-900/20">
                          <td className="py-3.5 px-2 font-bold">{d.name}</td>
                          <td className="py-3.5 px-2 text-brand-500 dark:text-accent-cyan font-bold">{d.specialization}</td>
                          <td className="py-3.5 px-2">{d.experience} years</td>
                          <td className="py-3.5 px-2 font-mono">₹{d.consultationFee}</td>
                          <td className="py-3.5 px-2">{d.languages.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Medicine Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-fade-in">
            {/* Inventory Stats Cards */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { 
                  label: "Total Medicine Types", 
                  val: inventory.length.toString(), 
                  desc: "Unique items stocked", 
                  icon: Pill, 
                  color: "text-brand-500 bg-brand-500/10" 
                },
                { 
                  label: "Total Volume (Units)", 
                  val: inventory.reduce((sum, item) => sum + item.quantity, 0).toLocaleString(), 
                  desc: "Aggregated count", 
                  icon: Package, 
                  color: "text-accent-cyan bg-accent-cyan/10" 
                },
                { 
                  label: "Low Stock Alerts", 
                  val: inventory.filter(i => i.quantity < 20).length.toString(), 
                  desc: "Stock level < 20 units", 
                  icon: AlertTriangle, 
                  color: inventory.filter(i => i.quantity < 20).length > 0 
                    ? "text-rose-500 bg-rose-500/10 border border-rose-500/20" 
                    : "text-slate-500 bg-slate-500/10" 
                },
                { 
                  label: "Near Expiry / Expired", 
                  val: inventory.filter(i => checkExpiryStatus(i.expiryDate).status !== 'OK').length.toString(), 
                  desc: "Expiry < 30 days", 
                  icon: Activity, 
                  color: inventory.filter(i => checkExpiryStatus(i.expiryDate).status !== 'OK').length > 0 
                    ? "text-amber-500 bg-amber-500/10 border border-amber-500/20" 
                    : "text-slate-500 bg-slate-500/10" 
                }
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className="p-5 rounded-2xl glass-card space-y-4">
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

            {/* Inventory Management Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Add Inventory Form */}
              <div className="lg:col-span-4 space-y-8">
                <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-brand-500" />
                    <h2 className="text-lg font-black tracking-tight">Register New Stock</h2>
                  </div>

                  <form onSubmit={handleAddInventory} className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Medicine Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Paracetamol 650mg"
                        value={invName}
                        onChange={(e) => setInvName(e.target.value)}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Initial Stock Quantity</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={invQty}
                        onChange={(e) => setInvQty(Number(e.target.value))}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry Date</label>
                      <input
                        type="date"
                        required
                        value={invExpiry}
                        onChange={(e) => setInvExpiry(e.target.value)}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Supplier / Vendor</label>
                      <input
                        type="text"
                        required
                        placeholder="AstraCare Pharma Ltd"
                        value={invSupplier}
                        onChange={(e) => setInvSupplier(e.target.value)}
                        className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-glass-glow transition-all"
                    >
                      Add Stock Item
                    </button>
                  </form>
                </div>
              </div>

              {/* Inventory Logs & Warnings Table */}
              <div className="lg:col-span-8 space-y-8">
                <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-accent-cyan" />
                      <h2 className="text-lg font-black tracking-tight">Medicine Stock Logs & Alerts</h2>
                    </div>
                    <button 
                      onClick={fetchInventory}
                      className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Activity className="w-3.5 h-3.5 animate-spin-slow" /> Refresh
                    </button>
                  </div>

                  {inventoryLoading ? (
                    <p className="text-xs text-slate-500 py-6 text-center">Loading stock database...</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-500/10 text-slate-400 uppercase text-[9px] font-bold">
                            <th className="py-3 px-2">Medicine Name</th>
                            <th className="py-3 px-2">Stock Level</th>
                            <th className="py-3 px-2">Expiry Date</th>
                            <th className="py-3 px-2">Supplier</th>
                            <th className="py-3 px-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventory.map((item) => {
                            const expiryInfo = checkExpiryStatus(item.expiryDate);
                            const isLowStock = item.quantity < 20;
                            const isEditing = editingItemId === item.id;

                            return (
                              <tr key={item.id} className="border-b border-slate-500/5 hover:bg-slate-200/20 dark:hover:bg-slate-900/20">
                                <td className="py-3.5 px-2 font-bold">
                                  <div className="flex flex-col text-left">
                                    <span>{item.name}</span>
                                    {isLowStock && (
                                      <span className="text-[9px] font-extrabold text-rose-500 flex items-center gap-0.5 mt-0.5 animate-pulse">
                                        <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" /> Low Stock Warning
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-2">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={0}
                                        value={editingQuantity}
                                        onChange={(e) => setEditingQuantity(Number(e.target.value))}
                                        className="w-16 bg-white/20 dark:bg-slate-950/40 border border-slate-400/40 rounded py-1 px-1.5 text-xs text-center font-bold text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className={`font-mono font-bold text-sm ${isLowStock ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                                        {item.quantity}
                                      </span>
                                      <span className="text-[9px] text-slate-400">units</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-2">
                                  <div className="flex flex-col gap-1 text-left">
                                    <span className="font-mono">{item.expiryDate}</span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase w-fit border ${expiryInfo.color}`}>
                                      {expiryInfo.status}
                                      {expiryInfo.daysLeft !== undefined && ` (${expiryInfo.daysLeft}d left)`}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-2 text-slate-500">{item.supplier}</td>
                                <td className="py-3.5 px-2 text-right">
                                  {isEditing ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleUpdateQuantity(item.id, editingQuantity)}
                                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-colors"
                                        title="Save Quantity"
                                      >
                                        <Save className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setEditingItemId(null)}
                                        className="p-1.5 rounded-lg bg-slate-500/20 hover:bg-slate-500 text-slate-400 hover:text-white transition-colors"
                                        title="Cancel"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setEditingItemId(item.id);
                                        setEditingQuantity(item.quantity);
                                      }}
                                      className="p-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white transition-colors flex items-center gap-1 ml-auto"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" /> <span className="text-[10px] font-bold">Edit Stock</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Configurations Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl animate-fade-in">
            <div className="p-6 rounded-3xl glass-panel border-white/10 space-y-6">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent-purple" />
                <h2 className="text-lg font-black tracking-tight">System Configurations</h2>
              </div>

              <div className="space-y-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10">
                  <div>
                    <span className="block text-slate-800 dark:text-white text-left">Multi-Hospital Support</span>
                    <span className="text-[9px] font-medium text-slate-400 text-left block">Enable cross-branch databases updates</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={multiHospital}
                    onChange={() => setMultiHospital(!multiHospital)}
                    className="w-4 h-4 text-brand-500 focus:ring-brand-500 accent-brand-500" 
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10">
                  <div>
                    <span className="block text-slate-800 dark:text-white text-left">SMS Triage Notifications</span>
                    <span className="text-[9px] font-medium text-slate-400 text-left block">Dispatch queue token links automatically</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={smsAlerts}
                    onChange={() => setSmsAlerts(!smsAlerts)}
                    className="w-4 h-4 text-brand-500 focus:ring-brand-500 accent-brand-500" 
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/20 dark:bg-slate-900/20 border border-slate-300/10">
                  <div>
                    <span className="block text-slate-800 dark:text-white text-left">HIPAA Activity Auditing</span>
                    <span className="text-[9px] font-medium text-slate-400 text-left block">Log all EMR edit operations</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={auditLogs}
                    onChange={() => setAuditLogs(!auditLogs)}
                    className="w-4 h-4 text-brand-500 focus:ring-brand-500 accent-brand-500" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
