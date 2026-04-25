/** Author: Chitron Bhattacharjee **/
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Mail, Lock, User, AtSign, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { auth, db, signInWithGoogle } = useFirebase();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);
    setError('');

    try {
      let email = identifier;
      
      // If doesn't look like email, assume it's a username
      if (!identifier.includes('@')) {
        const q = query(collection(db, 'users'), where('username', '==', identifier.toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error('Identity not found in neural records.');
        email = snap.docs[0].data().email;
      }

      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-morphism p-8 md:p-12 rounded-[3.5rem] space-y-10"
      >
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl mx-auto flex items-center justify-center border border-brand-primary/20">
            <ShieldCheck className="text-brand-primary" size={32} />
          </div>
          <h2 className="text-3xl font-display font-extrabold tracking-tight">Establish <span className="text-brand-primary">Uplink</span></h2>
          <p className="text-slate-500 text-[10px] tracking-[0.2em] uppercase font-mono">Re-verify Signal Credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-600 ml-4 uppercase tracking-widest">Email or Username</label>
            <div className="relative">
              <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
              <input 
                required
                type="text" 
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-3xl py-4 pl-14 pr-6 focus:outline-none focus:border-brand-primary/40 focus:bg-white/[0.05] transition-all"
                placeholder="Enter identifier..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-600 ml-4 uppercase tracking-widest">Access Key</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
              <input 
                required
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-3xl py-4 pl-14 pr-6 focus:outline-none focus:border-brand-primary/40 focus:bg-white/[0.05] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-[10px] text-center font-mono opacity-80">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full neo-button-primary py-4 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Verify Identity <ArrowRight size={18} /></>}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[8px] uppercase tracking-widest"><span className="bg-slate-950 px-2 text-slate-600">Alternative Terminal</span></div>
          </div>

          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              try { await signInWithGoogle(); navigate('/'); }
              catch (e: any) { setError(e.message); }
              finally { setLoading(false); }
            }}
            className="w-full glass-hover border border-white/10 rounded-[2rem] py-4 flex items-center justify-center gap-3 text-sm transition-all"
          >
            <img src="https://www.gstatic.com/firebase/anonymous-scan/google.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </form>

        <div className="text-center space-y-4 pt-4 border-t border-white/5">
          <p className="text-xs text-slate-600">
            New node? <Link to="/signup" className="text-brand-primary/80 hover:text-brand-primary transition-colors">Generate Account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
