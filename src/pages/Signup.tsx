/** Author: Chitron Bhattacharjee **/
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, Mail, Lock, User, Phone, AtSign, ArrowRight } from 'lucide-react';

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { auth, db, signInWithGoogle } = useFirebase();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    setLoading(true);
    setError('');

    try {
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCred.user;

      await updateProfile(user, {
        displayName: `${formData.firstName} ${formData.lastName}`
      });

      const userData = {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username.toLowerCase(),
        phone: formData.phone,
        createdAt: Date.now()
      };

      await setDoc(doc(db, 'users', user.uid), userData);
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
        className="w-full max-w-lg glass-morphism p-8 md:p-12 rounded-[3rem] space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-display font-extrabold">Identity <span className="text-brand-primary">Creation</span></h2>
          <p className="text-slate-500 text-sm tracking-widest uppercase">Initialize your signal within the portal</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 ml-4 uppercase">First Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  required
                  type="text" 
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 ml-4 uppercase">Last Name</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand-primary/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-500 ml-4 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-primary/50 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 ml-4 uppercase">Username</label>
              <div className="relative">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  required
                  type="text" 
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-500 ml-4 uppercase">Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  required
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-primary/50 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-500 ml-4 uppercase">Secret Key (Password)</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input 
                required
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:border-brand-primary/50 transition-all"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full neo-button-primary py-4 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Complete Initiation <ArrowRight size={18} /></>}
          </button>

          <div className="relative py-4">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
             <div className="relative flex justify-center text-[8px] uppercase tracking-widest"><span className="bg-slate-950 px-2 text-slate-600">Fast Forward</span></div>
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
            Sign up with Google
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already sequenced? <Link to="/login" className="text-brand-primary hover:underline">Establish Uplink</Link>
        </p>
      </motion.div>
    </div>
  );
}
