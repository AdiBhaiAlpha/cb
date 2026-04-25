/** Author: Chitron Bhattacharjee **/
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { SignalMessage } from '../types';
import { Send, Loader2, MessageSquare, ShieldAlert, Cpu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Messages() {
  const [messages, setMessages] = useState<SignalMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const { user, db, loading } = useFirebase();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!db || !user) return;

    const q = query(
      collection(db, 'signals'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SignalMessage)));
    });

    return () => unsub();
  }, [db, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !db || sending) return;
    setSending(true);

    try {
      const docRef = await addDoc(collection(db, 'signals'), {
        userId: user.uid,
        userName: user.displayName || 'Visitor',
        content: input,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setInput('');
      // Trigger telegram webhook via server
      await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, content: input, signalId: docRef.id })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-6">
        <div className="glass-morphism p-12 rounded-[3rem] text-center space-y-8 max-w-sm border border-white/60">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-[28px] flex items-center justify-center mx-auto shadow-xl shadow-brand-primary/5">
            <ShieldAlert className="text-brand-primary" size={40} />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-display font-black tracking-tighter uppercase">CHITRON <span className="text-brand-primary">DIRECT</span></h2>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.3em] font-sans">Level 2 Neural Auth Required</p>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed">Session must be authenticated via the neural gateway to traverse the bi-directional bridge.</p>
          <a href="/login" className="inline-block neo-button-primary w-full shadow-2xl">Establish Session</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen pt-24 bg-slate-50/30 overflow-hidden">
      {/* Immersive Header */}
      <header className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4 px-6 py-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-[20px] flex items-center justify-center border-2 border-white shadow-xl relative group">
            <div className="absolute inset-0 bg-brand-primary/5 rounded-[20px] animate-pulse" />
            <MessageSquare className="text-brand-primary relative z-10 group-hover:rotate-12 transition-transform" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-display font-black tracking-tighter uppercase leading-none">Chitron <span className="text-brand-primary">Direct</span></h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-600 rounded-md">
                 <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Active Tunnel</span>
              </div>
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.4em]">Node: 0xCHITRON</p>
            </div>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex flex-col items-end text-right">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Neural Link Latency</span>
             <span className="text-[10px] font-display font-black text-brand-primary">0.003ms</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <Cpu size={16} className="text-slate-400" />
          </div>
        </div>
      </header>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pb-2 relative flex flex-col overflow-hidden">
        <div className="flex-1 glass-morphism rounded-t-[40px] rounded-b-[20px] overflow-hidden flex flex-col border border-white/80 bg-white/80 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] relative">
          {/* Background Grid Accent */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 scrollbar-hide relative z-10 scroll-smooth">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-2 border-brand-primary/10 border-dashed animate-spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 bg-brand-primary/5 rounded-full flex items-center justify-center animate-pulse">
                     <Cpu size={48} className="text-brand-primary/20" />
                   </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-400">Initialize Neural Stream</p>
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed">Waiting for bi-directional data flow...</p>
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="space-y-10 group/msg animate-in fade-in slide-in-from-bottom-6 duration-700">
              {/* User Message */}
              <div className="flex justify-end pr-2">
                <div className="flex flex-col items-end gap-3 max-w-[85%] sm:max-w-[70%]">
                  <div className="flex items-center gap-3 mb-1 opacity-0 group-hover/msg:opacity-100 transition-all duration-300 translate-y-2 group-hover/msg:translate-y-0 text-slate-400">
                    <span className="text-[9px] font-black uppercase tracking-widest">Signal Transmitter</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary/40 animate-pulse" />
                  </div>
                  <div className="bg-slate-900 text-white rounded-[40px] rounded-tr-none py-6 px-10 shadow-2xl shadow-slate-900/20 group-hover/msg:-translate-y-1 transition-transform duration-500">
                    <p className="text-[15px] font-medium leading-relaxed tracking-tight">{m.content}</p>
                  </div>
                  <div className="flex items-center gap-2 px-4">
                    <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest whitespace-nowrap">
                      {formatDistanceToNow(m.createdAt)} ago • SYNCED
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Reply */}
              {m.reply && (
                <div className="flex justify-start pl-2">
                  <div className="flex flex-col items-start gap-4 max-w-[85%] sm:max-w-[70%]">
                    <div className="flex items-center gap-4 mb-2">
                       <div className="relative">
                         <div className="w-10 h-10 rounded-2xl bg-brand-primary/5 flex items-center justify-center border border-brand-primary/20 shadow-lg overflow-hidden group-hover/msg:scale-110 transition-transform">
                           <img src="/logo192.png" className="w-full h-full object-cover scale-150 rounded-2xl" alt="C" onError={(e) => (e.currentTarget.style.display = 'none')} />
                           <span className="text-brand-primary font-black text-sm relative z-10">C</span>
                         </div>
                         <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">Chitron Bhattacharjee</span>
                         <span className="text-[8px] font-bold text-brand-primary uppercase tracking-[0.2em] mt-1.5">Primary Neural Node</span>
                       </div>
                    </div>
                    <div className="bg-white border-2 border-brand-primary/10 text-slate-800 rounded-[40px] rounded-tl-none py-8 px-12 shadow-xl shadow-brand-primary/5 relative group-hover/msg:shadow-brand-primary/10 transition-all duration-500">
                      <div className="absolute -left-2 top-0 w-6 h-6 bg-white border-l-2 border-t-2 border-brand-primary/10 rotate-45 transform -translate-x-1/2" />
                      <p className="text-[15px] font-bold leading-relaxed tracking-tight text-slate-700">{m.reply}</p>
                    </div>
                    <div className="flex items-center gap-3 px-6">
                      <span className="text-[8px] text-slate-300 font-black uppercase tracking-[0.3em]">
                        {formatDistanceToNow(m.updatedAt)} ago • AUTHENTICATED
                      </span>
                      <div className="flex gap-1">
                        {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-brand-primary/20 rounded-full" />)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Scanning Effect */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <div className="w-full h-1 bg-brand-primary/5 absolute top-0 left-0 animate-scan" style={{ top: '-10%' }} />
        </div>

        <div className="p-8 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex flex-col gap-4 relative z-30">
          <div className="flex gap-4">
            <div className="flex-1 relative group">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Inject neural signal data..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] px-8 py-5 text-base font-medium focus:outline-none focus:ring-8 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all shadow-inner focus:bg-white"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                <span className="text-[8px] font-black text-brand-primary uppercase tracking-widest">Awaiting Command...</span>
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="px-10 bg-brand-primary text-white rounded-[28px] shadow-2xl shadow-brand-primary/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center justify-center group"
            >
              {sending ? <Loader2 className="animate-spin" /> : <Send size={24} className="group-hover:rotate-12 transition-transform" />}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 gap-3">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping" />
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Secure Link: Active</span>
               </div>
               <div className="h-3 w-px bg-slate-200 hidden sm:block" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bitrate: 1.2 GB/s</span>
               <div className="h-3 w-px bg-slate-200 hidden sm:block" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Latency: 0.003ms</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest opacity-60">Status: OK</span>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
      
      <p className="text-center text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] animate-pulse">End-to-End Encrypted Signal Tunnel Established</p>
    </div>
  );
}
