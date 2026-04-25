/** Author: Chitron Bhattacharjee **/
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Bot, Sparkles, Loader2 } from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

export default function ShiPuAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Greeting, seeker. I am ShiPu AI, the virtual architect for Chitron Bhattacharjee. How may I assist your traversal through this portal?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const { user, db, settings } = useFirebase();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isTyping) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, history: messages })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Signal interference detected. Please re-transmit.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const prompts = [
    "Who is Chitron?",
    "Technical Stack?",
    "Political Vision?",
    "Current Research?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-80 sm:w-96 glass-morphism rounded-3xl overflow-hidden h-[500px] flex flex-col"
          >
            {/* Header */}
            <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm relative z-20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-2.5 bg-brand-primary/10 rounded-2xl">
                    <Bot size={22} className="text-brand-primary" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm tracking-tight">ShiPu AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1,2,3].map(i => <div key={i} className="w-1 h-1 bg-brand-primary/40 rounded-full" />)}
                    </div>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em]">Neural Node: Active</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/50">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] px-5 py-3.5 rounded-[24px] text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                  }`}>
                    <p className="font-medium tracking-tight">{m.content}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 px-5 py-3 rounded-[24px] rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 bg-brand-primary/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="px-5 py-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-hide relative z-20">
              {prompts.map(p => (
                <button 
                  key={p} 
                  onClick={() => handleSend(p)}
                  className="whitespace-nowrap px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[9px] font-black uppercase text-slate-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all tracking-wider"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-5 bg-white border-t border-slate-100 flex gap-3 relative z-20">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Initialize signal..."
                className="flex-1 bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:bg-white transition-all placeholder:text-slate-400"
              />
              <button 
                onClick={() => handleSend()}
                disabled={isTyping || !input.trim()}
                className="w-11 h-11 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-brand-secondary to-brand-primary flex items-center justify-center shadow-xl shadow-brand-primary/20 hover:scale-110 transition-transform active:scale-95 group"
      >
        <MessageSquare className="text-slate-900 transition-transform group-hover:rotate-12" />
        {/* Author: Chitron Bhattacharjee */}
      </button>
    </div>
  );
}
