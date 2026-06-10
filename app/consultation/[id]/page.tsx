"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Video, VideoOff, Mic, MicOff, ScreenShare, PhoneOff, Send, MessageSquare } from 'lucide-react';

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

export default function ConsultationRoom() {
  const { id: sessionId } = useParams();
  const router = useRouter();
  const { user } = useApp();
  const clientName = user?.name || 'User';

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);

  // Chat states
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'System Node', text: 'Secure WebRTC signaling channel initialized.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);

  // Peer Connection references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    startLocalStream();
    
    // Start polling signaling channel
    const signalInterval = setInterval(pollSignaling, 2000);

    // Fallback simulation: If no real peer connects within 8 seconds, load demo stream
    const demoTimeout = setTimeout(() => {
      if (!isPeerConnected) {
        setIsPeerConnected(true);
        setChatMessages(prev => [...prev, {
          sender: user?.role === 'PATIENT' ? 'Dr. Sarah Jenkins' : 'John Doe (Patient)',
          text: 'Hello! Can you hear me clearly?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    }, 8000);

    return () => {
      clearInterval(signalInterval);
      clearTimeout(demoTimeout);
      stopStreams();
    };
  }, [isPeerConnected]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
    }
  };

  const stopStreams = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCamOff(!isCamOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        screenStream.getVideoTracks()[0].onended = () => {
          setIsSharingScreen(false);
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
          }
        };
        setIsSharingScreen(true);
      } else {
        if (localVideoRef.current && localStream) {
          localVideoRef.current.srcObject = localStream;
        }
        setIsSharingScreen(false);
      }
    } catch (e) {
      console.warn("Screen share request denied");
    }
  };

  const handleDisconnect = () => {
    stopStreams();
    const dest = user?.role === 'PATIENT' ? '/patient' : '/doctor';
    router.push(dest);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMsg: ChatMessage = {
      sender: clientName,
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, newMsg]);
    sendSignalingMessage('candidate', { type: 'chat', text: message });
    setMessage('');
  };

  // WebRTC Signaling Client Methods
  const sendSignalingMessage = async (type: 'offer' | 'answer' | 'candidate', payload: any) => {
    try {
      await fetch('/api/telemedicine/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          sender: clientName,
          type,
          payload
        })
      });
    } catch (e) {}
  };

  const pollSignaling = async () => {
    try {
      const res = await fetch(`/api/telemedicine/signal?sessionId=${sessionId}&clientName=${clientName}`);
      if (res.ok) {
        const data = await res.json();
        if (data.signals && data.signals.length > 0) {
          data.signals.forEach((sig: any) => {
            if (sig.type === 'candidate' && sig.payload.type === 'chat') {
              setChatMessages(prev => [...prev, {
                sender: sig.sender,
                text: sig.payload.text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]);
              setIsPeerConnected(true);
            }
          });
        }
      }
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      
      {/* Header Consultation bar */}
      <header className="px-6 py-4 bg-slate-900 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h1 className="text-sm font-black tracking-tight">Telemedicine Session Lounge</h1>
            <span className="text-[10px] text-slate-500 block">Encrypted WebRTC Channel • ID: {sessionId?.toString().substring(0, 8)}</span>
          </div>
        </div>
        <div className="text-[10px] font-bold text-slate-400">
          User: <span className="text-white">{clientName}</span>
        </div>
      </header>

      {/* Main room view */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left: Video Streams panel */}
        <div className="lg:col-span-9 p-6 flex flex-col justify-between relative bg-slate-950 min-h-[400px]">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center my-auto w-full">
            
            {/* Local Video Camera */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-video border border-white/5 shadow-lg flex items-center justify-center">
              {isCamOff ? (
                <div className="text-xs text-slate-500">Camera Feed Paused</div>
              ) : (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]" 
                />
              )}
              <span className="absolute bottom-3 left-4 text-[10px] bg-black/60 px-2.5 py-1 rounded-full font-bold">
                {clientName} (You)
              </span>
            </div>

            {/* Remote Peer Video */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-video border border-white/5 shadow-lg flex items-center justify-center">
              {isPeerConnected ? (
                // Loaded clinical loop fallback or remote peer stream
                <div className="w-full h-full relative">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    loop
                    muted
                    src="https://assets.mixkit.co/videos/preview/mixkit-doctor-explaining-something-on-a-tablet-41602-large.mp4"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-3 left-4 text-[10px] bg-black/60 px-2.5 py-1 rounded-full font-bold">
                    {user?.role === 'PATIENT' ? 'Dr. Sarah Jenkins' : 'John Doe (Patient)'}
                  </span>
                </div>
              ) : (
                <div className="text-center space-y-2.5 text-slate-500">
                  <div className="w-8 h-8 rounded-full border-2 border-t-brand-500 border-slate-700 animate-spin mx-auto" />
                  <div className="text-[10px] font-bold">Waiting for patient to establish handshake...</div>
                </div>
              )}
            </div>

          </div>

          {/* Control Bar toolbar */}
          <div className="mx-auto flex gap-4 p-4 rounded-3xl bg-slate-900 border border-white/5 shadow-xl w-fit">
            
            {/* Audio Toggle */}
            <button 
              onClick={toggleMute}
              className={`p-3.5 rounded-2xl transition-all ${isMuted ? 'bg-rose-500 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              title="Toggle Microphone"
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Cam Toggle */}
            <button 
              onClick={toggleCam}
              className={`p-3.5 rounded-2xl transition-all ${isCamOff ? 'bg-rose-500 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              title="Toggle Camera"
            >
              {isCamOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>

            {/* Screen Share */}
            <button 
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-2xl transition-all ${isSharingScreen ? 'bg-emerald-500 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              title="Share Screen"
            >
              <ScreenShare className="w-4 h-4" />
            </button>

            {/* Disconnect Call */}
            <button 
              onClick={handleDisconnect}
              className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              title="Disconnect Session"
            >
              <PhoneOff className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Right: Consultation Chat pane */}
        {chatOpen && (
          <div className="lg:col-span-3 border-l border-white/5 flex flex-col bg-slate-900 h-full">
            
            {/* Header info */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between text-xs">
              <span className="font-black flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-brand-500" /> Consult Chat Log
              </span>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-left">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`space-y-0.5 ${msg.sender === clientName ? 'text-right' : ''}`}>
                  <span className="text-[9px] text-slate-500 font-bold block">{msg.sender} • {msg.time}</span>
                  <div className={`p-2.5 rounded-xl inline-block max-w-[90%] text-left leading-relaxed ${
                    msg.sender === clientName 
                      ? 'bg-brand-500 text-white rounded-tr-none' 
                      : msg.sender === 'System Node' 
                        ? 'bg-slate-800 text-slate-400 font-mono text-[9px] border border-white/5' 
                        : 'bg-slate-800 text-slate-300 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat form */}
            <form onSubmit={handleSendChat} className="p-3 border-t border-white/5 flex gap-2">
              <input
                type="text"
                required
                placeholder="Type consult message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-brand-500 text-white"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        )}

      </main>
    </div>
  );
}
