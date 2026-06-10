"use client";

import { useState } from 'react';
import { CreditCard, QrCode, ShieldCheck, CheckCircle2, Download, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName: string;
  specialization: string;
  consultationFee: number;
  date: string;
  timeSlot: string;
  onPaymentSuccess: (paymentId: string) => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  doctorName,
  specialization,
  consultationFee,
  date,
  timeSlot,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [txnId, setTxnId] = useState('');
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    setTimeout(() => {
      const id = 'pay_' + Math.random().toString(36).substring(2, 11).toUpperCase();
      setTxnId(id);
      setProcessing(false);
      setPaymentSuccess(true);
      
      // Confetti burst for luxury SaaS feel
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 1500);
  };

  const handleDone = () => {
    onPaymentSuccess(txnId);
    onClose();
  };

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>AstraCare - Payment Receipt</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #0e94eb; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #075086; }
            .details { margin-bottom: 40px; }
            .details td { padding: 8px 0; }
            .details td.label { font-weight: bold; color: #666; width: 180px; }
            .footer { border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">AstraCare Global Hospital</div>
            <div style="font-size: 12px; color: #666; margin-top: 4px;">Enterprise Triage & Outpatient Receipt</div>
          </div>
          <h3>Consultation Payment Invoice</h3>
          <table class="details" style="width: 100%;">
            <tr><td class="label">Transaction ID:</td><td>${txnId}</td></tr>
            <tr><td class="label">Consulting Specialist:</td><td>${doctorName} (${specialization})</td></tr>
            <tr><td class="label">Date & Time Slot:</td><td>${date} at ${timeSlot}</td></tr>
            <tr><td class="label">Amount Paid:</td><td style="font-weight: bold; color: #0276ca;">INR ${consultationFee}.00</td></tr>
            <tr><td class="label">Status:</td><td style="color: #10b981; font-weight: bold;">AUTHORIZED / PAID</td></tr>
          </table>
          <div class="footer">
            Thank you for choosing AstraCare Global. Present this receipt or your dashboard QR code to the receptionist upon arrival.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl glass-panel border-white/20 p-6 shadow-glass text-slate-800 dark:text-white space-y-6 relative overflow-hidden">
        
        {/* Glow Spot */}
        <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-brand-500/10 dark:bg-brand-500/15 blur-[40px] -z-10" />

        {/* Close Button */}
        {!paymentSuccess && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {!paymentSuccess ? (
          <>
            <div className="text-left space-y-1">
              <h3 className="text-lg font-black tracking-tight">Secure Check-out</h3>
              <p className="text-xs text-slate-500">Choose payment method to confirm booking slot</p>
            </div>

            {/* Bill Summary */}
            <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/30 border border-slate-500/10 text-xs space-y-2 text-left">
              <div className="flex justify-between font-bold">
                <span>Clinical Specialist:</span>
                <span>{doctorName}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Specialization:</span>
                <span>{specialization}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Date & Time:</span>
                <span>{date} • {timeSlot}</span>
              </div>
              <div className="border-t border-slate-500/10 pt-2 flex justify-between font-extrabold text-sm text-brand-600 dark:text-accent-cyan">
                <span>Consultation Fee:</span>
                <span>₹{consultationFee}</span>
              </div>
            </div>

            {/* Selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${paymentMethod === 'card' ? 'bg-brand-500 text-white border-brand-500' : 'border-slate-300/40 dark:border-slate-800/40 hover:bg-slate-200/30 dark:hover:bg-slate-800/30'}`}
              >
                <CreditCard className="w-4 h-4" /> Razorpay
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${paymentMethod === 'upi' ? 'bg-brand-500 text-white border-brand-500' : 'border-slate-300/40 dark:border-slate-800/40 hover:bg-slate-200/30 dark:hover:bg-slate-800/30'}`}
              >
                <QrCode className="w-4 h-4" /> UPI QR Code
              </button>
            </div>

            {/* Form */}
            {paymentMethod === 'card' ? (
              <form onSubmit={handleCheckout} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500">Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                    className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">Expiry Date</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500">CVV</label>
                    <input
                      type="password"
                      required
                      placeholder="•••"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white font-extrabold text-xs shadow-glass hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" /> {processing ? "Processing checkout..." : `Pay ₹${consultationFee}`}
                </button>
              </form>
            ) : (
              // UPI QR
              <div className="space-y-4 text-center">
                <div className="p-4 bg-white rounded-2xl w-fit mx-auto border border-slate-300/20 flex flex-col items-center shadow-md">
                  {/* Dummy SVG QR Code */}
                  <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" fill="white"/>
                    <rect x="10" y="10" width="25" height="25" fill="#333" stroke="white" strokeWidth="2"/>
                    <rect x="15" y="15" width="15" height="15" fill="white"/>
                    <rect x="18" y="18" width="9" height="9" fill="#333"/>
                    <rect x="65" y="10" width="25" height="25" fill="#333" stroke="white" strokeWidth="2"/>
                    <rect x="70" y="15" width="15" height="15" fill="white"/>
                    <rect x="73" y="73" width="9" height="9" fill="#333"/>
                    <rect x="10" y="65" width="25" height="25" fill="#333" stroke="white" strokeWidth="2"/>
                    <rect x="15" y="70" width="15" height="15" fill="white"/>
                    <rect x="73" y="18" width="9" height="9" fill="#333"/>
                    <rect x="65" y="65" width="25" height="25" fill="#333" stroke="white" strokeWidth="2"/>
                    {/* Dots pattern */}
                    <rect x="42" y="10" width="6" height="6" fill="#333"/>
                    <rect x="52" y="18" width="6" height="6" fill="#333"/>
                    <rect x="42" y="30" width="6" height="6" fill="#333"/>
                    <rect x="10" y="45" width="6" height="6" fill="#333"/>
                    <rect x="25" y="52" width="6" height="6" fill="#333"/>
                    <rect x="45" y="45" width="10" height="10" fill="#333"/>
                    <rect x="52" y="60" width="6" height="6" fill="#333"/>
                    <rect x="42" y="75" width="6" height="6" fill="#333"/>
                    <rect x="75" y="45" width="6" height="6" fill="#333"/>
                  </svg>
                  <span className="text-[10px] font-bold text-slate-500 mt-2">Scan with GPay / PhonePe / BHIM</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full py-3.5 rounded-xl bg-brand-500 text-white font-extrabold text-xs hover:bg-brand-600 transition-colors"
                >
                  {processing ? "Waiting for authorization..." : "Simulate QR Scan Confirmation"}
                </button>
              </div>
            )}
          </>
        ) : (
          // Success State
          <div className="text-center space-y-6 py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 animate-pulse-slow" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black text-emerald-500">Transaction Authorized</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Payment transaction verified. Your appointment is confirmed and queue slot holds token number.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-200/50 dark:bg-slate-900/50 border border-slate-300/20 text-xs font-mono text-slate-500">
              Txn Reference: {txnId}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={printInvoice}
                className="flex-1 py-3 rounded-xl border border-slate-300/40 dark:border-slate-800/40 bg-white/20 dark:bg-slate-900/20 font-bold text-xs hover:bg-white/40 dark:hover:bg-slate-800/40 flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4 text-brand-500" /> Invoice
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="flex-1 py-3 rounded-xl bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
