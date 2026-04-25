/** Author: Chitron Bhattacharjee **/
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, Camera, User, Phone, AtSign, Save, ShieldCheck } from 'lucide-react';
import { uploadImage } from '../lib/imagekit';

export default function Profile() {
  const { user, profile, db, loading } = useFirebase();
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    phone: profile?.phone || '',
    photoURL: profile?.photoURL || ''
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      alert('Neural record updated.');
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return null;
  if (!user) return <div className="pt-32 text-center font-mono opacity-50 uppercase tracking-widest">Unauthorized Access. Link Terminated.</div>;

  return (
    <div className="max-w-2xl mx-auto pt-32 pb-20 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-morphism rounded-[3rem] p-10 space-y-10"
      >
        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-brand-primary blur-3xl opacity-10 rounded-full group-hover:opacity-30 transition-opacity" />
             <img 
              src={formData.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${user.uid}`} 
              className="w-32 h-32 rounded-[2.5rem] object-cover ring-2 ring-white/10 relative z-10"
              alt="Profile"
            />
            <button className="absolute bottom-0 right-0 p-2 bg-brand-primary text-slate-900 rounded-xl z-20 shadow-lg hover:scale-110 transition-transform cursor-pointer">
              <Camera size={16} />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUpdating(true);
                  try {
                    const url = await uploadImage(file);
                    setFormData(prev => ({ ...prev, photoURL: url }));
                  } catch (err) {
                    alert('Neural link dropped during upload.');
                  } finally {
                    setUpdating(false);
                  }
                }}
              />
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold">@{profile?.username}</h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Status: Connected</p>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-slate-600 ml-4 uppercase">First Name</label>
              <input 
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-slate-600 ml-4 uppercase">Last Name</label>
              <input 
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-600 ml-4 uppercase">Neural Identifier (Phone)</label>
            <input 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono text-slate-600 ml-4 uppercase">Avatar Waveform (ImageKit URL)</label>
            <input 
              value={formData.photoURL}
              onChange={e => setFormData({...formData, photoURL: e.target.value})}
              placeholder="https://ik.imagekit.io/..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full neo-button-primary py-4 flex items-center justify-center gap-3"
          >
            {updating ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Commit Configuration</>}
          </button>
        </form>

        <div className="p-6 verified-badge-golden flex items-center gap-5 border-none shadow-[0_15px_35px_rgba(255,172,0,0.2)] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-12 -translate-y-12" />
          <div className="w-14 h-14 bg-white rounded-[20px] flex items-center justify-center shadow-2xl relative z-10">
            <ShieldCheck className="text-[#FFAC00]" size={28} />
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-black text-[#4A3B00] uppercase tracking-[0.1em] leading-none">Identity Secured</h4>
            <p className="text-[9px] text-[#4A3B00]/70 font-bold uppercase tracking-[0.2em] mt-2 block">Neural Bridge Protocol Active</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
