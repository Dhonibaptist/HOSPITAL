"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, ShieldAlert, Sparkles, Activity } from 'lucide-react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  data?: {
    condition: string;
    urgency: string;
    specialist: string;
    advice: string[];
  };
}

export default function ChatBot({ onSelectSpecialist }: { onSelectSpecialist?: (spec: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: "Hello! I am your AstraCare Clinical Assistant. Tell me your symptoms (e.g., 'fever, headache, dry cough') and I will analyze the urgency and suggest the appropriate medical specialist." }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() || loading) return;

    const userText = symptoms;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setSymptoms('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/symptom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: userText })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.result) {
          const { condition, urgency, specialist, advice } = data.result;
          const aiResponseText = `I have analyzed your symptoms. Based on our clinical database:
          
          • Likely Issue: ${condition}
          • Urgency: ${urgency}
          • Recommended Specialist: ${specialist}`;

          setMessages(prev => [...prev, {
            sender: 'ai',
            text: aiResponseText,
            data: data.result
          }]);
        } else {
          setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I could not complete the diagnostic check. Please try describing your symptoms differently." }]);
        }
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: "Clinical diagnostics offline. Please schedule a consult directly with a General Physician." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: "Failed to reach AI diagnostic hub. Please ensure your network is connected." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 rounded-full bg-gradient-to-tr from-brand-600 to-accent-cyan text-white shadow-neon-cyan hover:scale-105 transition-transform flex items-center gap-2 font-bold text-xs"
        >
          <Bot className="w-5 h-5 animate-pulse-slow" />
          <span>AI Health Chatbot</span>
        </button>
      )}

      {/* Chat window panel */}
      {isOpen && (
        <div className="w-96 h-[500px] rounded-3xl glass-panel border-white/20 bg-white/95 dark:bg-slate-900/95 shadow-glass flex flex-col overflow-hidden text-slate-800 dark:text-white">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-500/10 flex items-center justify-between bg-brand-500/5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500 dark:text-accent-cyan">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-sm block">AstraCare AI Triager</span>
                <span className="text-[10px] text-slate-400 block font-medium">Symptom Checker v1.5-Flash</span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <div 
                  className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line text-left ${m.sender === 'user' ? 'bg-brand-500 text-white rounded-tr-none' : 'bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/10 rounded-tl-none'}`}
                >
                  {m.text}
                  
                  {/* Formatted Diagnostic Data */}
                  {m.data && (
                    <div className="mt-3 border-t border-slate-500/10 pt-3 space-y-2.5">
                      <div className="flex items-center gap-1.5 font-bold text-rose-500">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Urgency Level: {m.data.urgency}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="font-bold text-slate-400 block text-[9px] uppercase tracking-wider">Suggested Advice:</span>
                        <ul className="list-disc pl-4 space-y-1">
                          {m.data.advice.map((adv, aIdx) => (
                            <li key={aIdx}>{adv}</li>
                          ))}
                        </ul>
                      </div>

                      {onSelectSpecialist && m.data.specialist && (
                        <button
                          type="button"
                          onClick={() => onSelectSpecialist(m.data!.specialist.split('/')[0].trim())}
                          className="mt-2 w-full py-2 rounded-xl bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white dark:text-accent-cyan dark:hover:text-slate-900 text-[10px] font-bold border border-brand-500/20 transition-all flex items-center justify-center gap-1"
                        >
                          <Activity className="w-3 h-3" /> Book {m.data.specialist.split('/')[0].trim()} Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 mr-auto text-slate-400">
                <Sparkles className="w-4 h-4 animate-spin text-brand-500" />
                <span className="text-[10px] font-bold">Analyzing clinical indications...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-500/10 flex gap-2">
            <input
              type="text"
              required
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Describe symptoms (e.g. chills, headache)"
              className="flex-1 bg-white/20 dark:bg-slate-900/20 border border-slate-300/40 dark:border-slate-800/40 rounded-xl py-2.5 px-3.5 text-xs focus:outline-none focus:border-brand-500 text-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading}
              className="p-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white shadow-neon-cyan shrink-0 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
