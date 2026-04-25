/** Author: Chitron Bhattacharjee **/
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, 
  query, orderBy, onSnapshot, serverTimestamp 
} from 'firebase/firestore';
import { 
  Radio, Send, Trash2, Shield, Brain, Settings, Database, 
  Key, RefreshCw, Loader2, Signal, Eye, EyeOff, Layout,
  Smartphone, Bot, Image as ImageIcon, CheckCircle2, AlertTriangle,
  Camera, LogOut
} from 'lucide-react';
import { Post, Story, AIKnowledgeShard, SiteSettings } from '../types';
import * as otplib from 'otplib';
const authenticator = (otplib as any).authenticator || (otplib as any).default?.authenticator;
import { QRCodeSVG } from 'qrcode.react';

import { addDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { uploadImage } from '../lib/imagekit';

export default function Admin() {
  const { loading, refreshSettings } = useFirebase();
  const [activeTab, setActiveTab] = useState<'broadcast' | 'content' | 'neural' | 'vault'>('broadcast');
  const [mfaVerified, setMfaVerified] = useState(() => {
    return !!localStorage.getItem('chitron_admin_token');
  });
  const [mfaCode, setMfaCode] = useState('');
  const [mfaType, setMfaType] = useState<'telegram' | 'app' | 'otp'>('telegram');
  
  // Data states
  const [adminSettings, setAdminSettings] = useState<SiteSettings | null>(null);
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [storyMedia, setStoryMedia] = useState('');
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video'>('image');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [shards, setShards] = useState<AIKnowledgeShard[]>([]);
  const [newShard, setNewShard] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 2FA Setup state
  const [mfaSetupSecret, setMfaSetupSecret] = useState('');
  const [showQr, setShowQr] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem('chitron_admin_token');
    if (!token) return;
    
    try {
      const res = await fetch('/api/admin/data', {
        headers: { 'x-admin-token': token }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setShards(data.shards);
        setStories(data.stories);
        setAdminSettings(data.settings);
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (mfaVerified) {
      fetchData();
    }
  }, [mfaVerified]);

  const requestTelegramCode = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (response.ok) alert('Signal transmitted to Telegram DM.');
      else alert('Failed to transmit signal. Node mismatch.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyMfa = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mfaCode, type: mfaType })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('chitron_admin_token', data.token);
        setMfaVerified(true);
      } else {
        alert('Cipher mismatch. Access denied.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    setMfaVerified(false);
    localStorage.removeItem('chitron_admin_token');
  };

  const handleBroadcast = async () => {
    const token = localStorage.getItem('chitron_admin_token');
    if (!token || !postContent || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          authorName: 'Chitron Bhattacharjee',
          content: postContent,
          mediaUrl: postMedia,
          mediaType: mediaType
        })
      });
      if (res.ok) {
        setPostContent('');
        setPostMedia('');
        alert('Transmission success.');
        fetchData();
      }
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  const handleDeletePost = async (id: string) => {
    const token = localStorage.getItem('chitron_admin_token');
    if (!token || !confirm('Prune this signal from history?')) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  const handleCreateShard = async () => {
    const token = localStorage.getItem('chitron_admin_token');
    if (!token || !newShard || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/shards', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          content: newShard,
          source: 'Manual Entry'
        })
      });
      if (res.ok) {
        setNewShard('');
        fetchData();
      }
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  const handleUpdateSecrets = async (newSettings: Partial<SiteSettings>) => {
    const token = localStorage.getItem('chitron_admin_token');
    if (!token) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        await fetchData();
        await refreshSettings();
        alert('Secrets synchronized across node.');
      }
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  const [expirationHours, setExpirationHours] = useState('24');

  const handleStoryBroadcast = async () => {
    const token = localStorage.getItem('chitron_admin_token');
    if (!token || !storyMedia || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/posts/story', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({
          authorId: 'admin',
          content: '', // Stories usually don't have text content in this UI but I'll keep it empty for now or maybe add a storyContent state later
          mediaUrl: storyMedia,
          mediaType: storyMediaType,
          expiresAt: Date.now() + (parseInt(expirationHours) * 60 * 60 * 1000)
        })
      });
      if (res.ok) {
        setStoryMedia('');
        alert('Story fragment projected.');
        fetchData();
      }
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  const handleDeleteStory = async (id: string) => {
    const token = localStorage.getItem('chitron_admin_token');
    if (!token || !confirm('Prune this story fragment?')) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/stories/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  const handleSetupTelegramWebhook = async () => {
    const token = localStorage.getItem('chitron_admin_token');
    if (!token) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/telegram/setup-webhook', {
        method: 'POST',
        headers: { 'x-admin-token': token }
      });
      if (res.ok) alert('Telegram Webhook successfully synchronized to neural gateway.');
      else {
        const err = await res.json();
        alert(`Gateway failure: ${err.description || 'Unknown error'}`);
      }
    } catch (e) { console.error(e); }
    finally { setIsProcessing(false); }
  };

  const initMfaSetup = () => {
    const secret = authenticator.generateSecret();
    setMfaSetupSecret(secret);
    setShowQr(true);
  };

  const commitMfaSetup = async () => {
    if (!mfaSetupSecret || !mfaCode) return;
    const isValid = authenticator.check(mfaCode, mfaSetupSecret);
    if (isValid) {
      await handleUpdateSecrets({ mfaSecret: mfaSetupSecret, mfaEnabled: true });
      setShowQr(false);
      setMfaSetupSecret('');
      setMfaCode('');
      alert('Vault hardened with App MFA.');
    } else {
      alert('Sync failed. Refresh and retry.');
    }
  };

  if (loading) return null;

  if (!mfaVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg glass-morphism p-12 rounded-[4rem] space-y-12 border border-white/60 bg-white/40"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-[28px] mx-auto flex items-center justify-center shadow-xl shadow-brand-primary/5">
              <Shield className="text-brand-primary animate-pulse" size={40} />
            </div>
            <h2 className="text-3xl font-display font-black tracking-tighter uppercase">Vault <span className="text-brand-primary">Access</span></h2>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.4em] font-sans">Level 4 Clearance Required</p>
          </div>

          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[24px]">
            <button 
              onClick={() => setMfaType('telegram')}
              className={cn("flex-1 py-4 rounded-[20px] text-[10px] uppercase font-black tracking-widest transition-all", mfaType === 'telegram' ? "bg-white text-brand-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >Telegram</button>
            <button 
              onClick={() => setMfaType('app')}
              className={cn("flex-1 py-4 rounded-[20px] text-[10px] uppercase font-black tracking-widest transition-all", mfaType === 'app' ? "bg-white text-brand-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >App MFA</button>
            <button 
              onClick={() => setMfaType('otp')}
              className={cn("flex-1 py-4 rounded-[20px] text-[10px] uppercase font-black tracking-widest transition-all", mfaType === 'otp' ? "bg-white text-brand-primary shadow-sm" : "text-slate-400 hover:text-slate-600")}
            >Passkey</button>
          </div>

          <div className="space-y-8">
            {mfaType === 'telegram' && (
              <button 
                onClick={requestTelegramCode}
                className="w-full py-5 border-2 border-slate-100 rounded-[28px] text-[10px] uppercase font-black tracking-widest hover:border-brand-primary/30 hover:text-brand-primary transition-all flex items-center justify-center gap-3"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <>Request Dynamic Code <RefreshCw size={14} /></>}
              </button>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-sans font-black text-slate-400 ml-6 uppercase tracking-[0.2em]">
                {mfaType === 'otp' ? 'Type your 4 digit one time code to access' : 'Enter Authentication Cipher'}
              </label>
              <input 
                type="text"
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                maxLength={mfaType === 'otp' ? 4 : (mfaType === 'app' ? 6 : 12)}
                className="w-full bg-white border border-slate-100 rounded-[32px] py-6 px-10 text-center text-3xl font-display font-black tracking-[0.4em] focus:outline-none focus:ring-4 focus:ring-brand-primary/5 shadow-xl shadow-slate-100"
                placeholder={mfaType === 'otp' ? '••••' : '••••••••'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && mfaCode) verifyMfa();
                }}
              />
            </div>

            <button 
              onClick={verifyMfa}
              disabled={isProcessing || !mfaCode}
              className="w-full neo-button-primary py-6 text-sm font-black shadow-2xl"
            >
              Initialize Authorization
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-32 pb-20 px-6">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Tabs */}
        <aside className="lg:w-56 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-6 lg:pb-0 scrollbar-hide">
          {[
            { id: 'broadcast', label: 'Broadcast', icon: Radio },
            { id: 'content', label: 'Feed', icon: Layout },
            { id: 'neural', label: 'Neural', icon: Brain },
            { id: 'vault', label: 'Vault', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "p-6 rounded-[32px] flex flex-col items-center gap-4 transition-all min-w-[120px] border-4",
                activeTab === tab.id ? "bg-brand-primary text-white border-white shadow-2xl shadow-brand-primary/20 scale-105" : "bg-white/40 border-transparent text-slate-400 hover:text-slate-600 hover:bg-white/60"
              )}
            >
              <tab.icon size={24} />
              <span className="text-[10px] uppercase font-black tracking-widest">{tab.label}</span>
            </button>
          ))}
          
          <div className="flex-1 hidden lg:block" />
          
          <button
            onClick={handleLogout}
            className="p-6 rounded-[32px] flex flex-col items-center gap-4 transition-all bg-white/20 border-4 border-transparent text-slate-400 hover:text-red-500 hover:bg-red-50"
          >
            <LogOut size={24} />
            <span className="text-[10px] uppercase font-black tracking-widest">Logout</span>
          </button>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 glass-morphism rounded-[48px] p-12 min-h-[75vh] border border-white/80 bg-white/40 shadow-2xl">
          <AnimatePresence mode="wait">
            {activeTab === 'broadcast' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                <header className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-display font-black tracking-tighter uppercase">Signal <span className="text-brand-primary">Injection</span></h2>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em] font-sans">Broadcast to global neural stream</p>
                  </div>
                </header>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-black text-slate-400 ml-6 font-sans tracking-widest">Payload Content</label>
                    <textarea 
                      value={postContent}
                      onChange={e => setPostContent(e.target.value)}
                      className="w-full h-48 bg-white border border-slate-100 rounded-[32px] p-8 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 shadow-inner transition-all resize-none"
                      placeholder="Input data stream for global distribution..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-black text-slate-400 ml-6 font-sans tracking-widest">Media Resource URL</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            value={postMedia}
                            onChange={e => setPostMedia(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-[24px] py-5 pl-16 pr-8 text-sm font-medium focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm"
                            placeholder="ImageKit / Cloudinary Endpoint"
                          />
                        </div>
                        <label className="p-5 bg-brand-primary/10 text-brand-primary rounded-[24px] cursor-pointer hover:bg-brand-primary/20 transition-all flex items-center justify-center">
                          <Camera size={20} />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,video/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsProcessing(true);
                              try {
                                const url = await uploadImage(file);
                                setPostMedia(url);
                                if (file.type.startsWith('video')) setMediaType('video');
                                else setMediaType('image');
                              } catch (err) {
                                alert('Transmission failure during upload.');
                              } finally {
                                setIsProcessing(false);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase font-black text-slate-400 ml-6 font-sans tracking-widest">Media Waveform Type</label>
                      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[24px] h-[64px]">
                        <button onClick={() => setMediaType('image')} className={cn("flex-1 rounded-[20px] text-[10px] uppercase font-bold tracking-widest transition-all", mediaType === 'image' ? "bg-white text-brand-primary shadow-sm" : "text-slate-400")}>Image</button>
                        <button onClick={() => setMediaType('video')} className={cn("flex-1 rounded-[20px] text-[10px] uppercase font-bold tracking-widest transition-all", mediaType === 'video' ? "bg-white text-brand-primary shadow-sm" : "text-slate-400")}>Video</button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                    <div className="p-8 bg-white/60 border border-white/80 rounded-[40px] space-y-6 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Radio size={80} /></div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                            <Radio size={16} className="text-brand-primary" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Feed Broadcast</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Publish a permanent signal to the global feed.</p>
                      </div>
                      <button 
                        onClick={handleBroadcast}
                        disabled={isProcessing || !postContent}
                        className="w-full neo-button-primary bg-slate-900 shadow-slate-900/20"
                      >
                         {isProcessing ? <Loader2 className="animate-spin" /> : <><Send size={16} className="mr-3" /> Initialize Broadcast</>}
                      </button>
                    </div>

                    <div className="p-8 bg-brand-primary/5 border border-brand-primary/10 rounded-[40px] space-y-6 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Smartphone size={80} /></div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-primary/20 rounded-xl flex items-center justify-center">
                            <Smartphone size={16} className="text-brand-primary" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">Story Projection</span>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="text-[8px] uppercase font-black text-brand-primary/60 ml-2 font-sans tracking-widest leading-none">Story Media Resource</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/30" size={14} />
                              <input 
                                value={storyMedia}
                                onChange={e => setStoryMedia(e.target.value)}
                                className="w-full bg-white border-2 border-brand-primary/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-medium focus:ring-4 focus:ring-brand-primary/5 transition-all"
                                placeholder="Media URL"
                              />
                            </div>
                            <label className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl cursor-pointer hover:bg-brand-primary/20 transition-all flex items-center justify-center border-2 border-brand-primary/10">
                              <Camera size={16} />
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*,video/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setIsProcessing(true);
                                  try {
                                    const url = await uploadImage(file);
                                    setStoryMedia(url);
                                    if (file.type.startsWith('video')) setStoryMediaType('video');
                                    else setStoryMediaType('image');
                                  } catch (err) {
                                    alert('Story transmission failure.');
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1 space-y-2">
                            <label className="text-[8px] uppercase font-black text-brand-primary/60 ml-2 font-sans tracking-widest leading-none">TTL (Hours)</label>
                            <input 
                              type="number"
                              value={expirationHours}
                              onChange={e => setExpirationHours(e.target.value)}
                              className="w-full bg-white border-2 border-brand-primary/10 rounded-2xl py-3 px-5 text-sm font-black text-brand-primary"
                            />
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleStoryBroadcast}
                        disabled={isProcessing || !storyMedia}
                        className="w-full neo-button-primary"
                      >
                         {isProcessing ? <Loader2 className="animate-spin" /> : <><RefreshCw size={16} className="mr-3" /> Start Projection</>}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'content' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <header className="flex justify-between items-end">
                   <div>
                    <h2 className="text-3xl font-display font-black tracking-tighter">DATA <span className="text-brand-primary">MALL</span></h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Existing Neural Transmissions</p>
                  </div>
                  <div className="text-[10px] font-mono text-brand-primary bg-brand-primary/10 px-4 py-2 rounded-full uppercase">Count: {posts.length}</div>
                </header>

                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 scrollbar-hide">
                  <div className="flex items-center gap-2 mb-4">
                    <Radio size={14} className="text-brand-primary" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Neural Posts</span>
                  </div>
                  {posts.map(post => (
                    <div key={post.id} className="p-5 glass flex items-center justify-between rounded-3xl group">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center">
                          {post.mediaUrl ? <img src={post.mediaUrl} className="w-full h-full object-cover rounded-2xl" /> : <Signal size={20} className="text-slate-700" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate max-w-[200px] md:max-w-sm">{post.content}</p>
                          <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{post.id}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}

                  {stories.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 mt-12 mb-4">
                        <Smartphone size={14} className="text-brand-primary" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Ephemeral Stories</span>
                      </div>
                      {stories.map(story => (
                        <div key={story.id} className="p-5 glass flex items-center justify-between rounded-3xl group">
                          <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex-shrink-0 flex items-center justify-center">
                              {story.mediaUrl ? <img src={story.mediaUrl} className="w-full h-full object-cover rounded-2xl" /> : <ImageIcon size={20} className="text-slate-700" />}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium truncate max-w-[200px] md:max-w-sm">{story.content || 'Untitled Fragment'}</p>
                              <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Expires: {new Date(story.expiresAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteStory(story.id)}
                            className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'neural' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <header>
                  <h2 className="text-3xl font-display font-black tracking-tighter">NEURAL <span className="text-brand-primary">SYNAPSE</span></h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">ShiPu AI Knowledge Shards</p>
                </header>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-600 ml-4 font-mono">New Fragment Content</label>
                    <textarea 
                      value={newShard}
                      onChange={e => setNewShard(e.target.value)}
                      className="w-full h-32 bg-white/5 border border-white/5 rounded-3xl p-6 text-sm focus:outline-none focus:border-brand-primary/30 font-sans"
                      placeholder="Inject custom intelligence data..."
                    />
                  </div>
                  <button onClick={handleCreateShard} disabled={!newShard || isProcessing} className="w-full neo-button-primary py-4 flex items-center justify-center gap-2">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Commit Intelligence Fragment</>}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shards.map(shard => (
                    <div key={shard.id} className="p-6 glass rounded-[2rem] gap-4 flex flex-col relative group">
                      <button 
                        onClick={async () => { 
                          const token = localStorage.getItem('chitron_admin_token');
                          if(!token || !confirm('Purge fragment?')) return;
                          const res = await fetch(`/api/admin/shards/${shard.id}`, {
                            method: 'DELETE',
                            headers: { 'x-admin-token': token }
                          });
                          if(res.ok) fetchData();
                        }} 
                        className="absolute top-4 right-4 p-2 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      <p className="text-xs text-slate-400 leading-relaxed overflow-hidden line-clamp-4">{shard.content}</p>
                      <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-[8px] font-mono uppercase text-slate-600 tracking-widest">
                        <span>Source: {shard.source}</span>
                        <span>{shard.id.slice(0, 4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'vault' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <header>
                  <h2 className="text-3xl font-display font-black tracking-tighter">SECURE <span className="text-brand-primary">VAULT</span></h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Infrastructure Credentials & Identity</p>
                </header>

                {/* Secrets Management */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-mono font-black uppercase tracking-[0.2em] text-brand-primary border-b border-brand-primary/20 pb-2">API Signals</h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-600 ml-4 font-mono">Gemini AI Token</label>
                        <input 
                          type="password"
                          value={adminSettings?.geminiKey || ''}
                          onChange={e => handleUpdateSecrets({ geminiKey: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-5 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-600 ml-4 font-mono">Telegram Bot Signer</label>
                        <input 
                          type="password"
                          value={adminSettings?.telegramBotToken || ''}
                          onChange={e => handleUpdateSecrets({ telegramBotToken: e.target.value })}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-5 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                   <h3 className="text-xs font-mono font-black uppercase tracking-[0.2em] text-cyan-400 border-b border-cyan-400/20 pb-2">Global Assets</h3>
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-600 ml-4 font-mono">Global Profile URL</label>
                        <div className="flex gap-2">
                          <input 
                            value={adminSettings?.profilePhoto || ''}
                            onChange={e => handleUpdateSecrets({ profilePhoto: e.target.value })}
                            className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-3 px-5 text-xs"
                          />
                          <label className="p-3 bg-cyan-400/10 text-cyan-400 rounded-2xl cursor-pointer hover:bg-cyan-400/20 transition-all border border-cyan-400/10 h-[42px] flex items-center">
                            <Camera size={18} />
                            <input 
                              type="file" className="hidden" accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsProcessing(true);
                                try {
                                  const url = await uploadImage(file);
                                  handleUpdateSecrets({ profilePhoto: url });
                                } catch (err) { alert('Upload failed.'); }
                                finally { setIsProcessing(false); }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-600 ml-4 font-mono">Global Cover URL</label>
                        <div className="flex gap-2">
                          <input 
                            value={adminSettings?.coverPhoto || ''}
                            onChange={e => handleUpdateSecrets({ coverPhoto: e.target.value })}
                            className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-3 px-5 text-xs"
                          />
                          <label className="p-3 bg-cyan-400/10 text-cyan-400 rounded-2xl cursor-pointer hover:bg-cyan-400/20 transition-all border border-cyan-400/10 h-[42px] flex items-center">
                            <Camera size={18} />
                            <input 
                              type="file" className="hidden" accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsProcessing(true);
                                try {
                                  const url = await uploadImage(file);
                                  handleUpdateSecrets({ coverPhoto: url });
                                } catch (err) { alert('Upload failed.'); }
                                finally { setIsProcessing(false); }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                   </div>
                  </div>
                </div>

                {/* Telegram Hub */}
                <div className="p-10 glass rounded-[3rem] space-y-6 border-brand-primary/10 relative overflow-hidden bg-gradient-to-br from-blue-500/5 to-transparent">
                  <div className="absolute top-0 right-0 p-10 opacity-5"><Bot size={100} /></div>
                  <h3 className="text-xl font-display font-bold flex items-center gap-3 text-blue-400">
                    <Bot size={24} /> Neural Gateway: Telegram Hub
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">Synchronize your bot with the neural gateway to enable /post and /story commands. Authorization strictly enforced via Admin ID.</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={handleSetupTelegramWebhook}
                      disabled={isProcessing}
                      className="glass-hover border border-blue-400/30 text-blue-400 hover:bg-blue-400/10 py-3 px-8 text-[10px] uppercase font-bold tracking-widest rounded-2xl transition-all"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" /> : 'Synchronize Neural Gateway'}
                    </button>
                    
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest bg-white/5 px-4 rounded-xl py-3">
                      <Key size={14} /> ID: {adminSettings?.telegramAdminId || 'UNSET'}
                    </div>
                  </div>
                  
                  <div className="bg-white/5 p-4 rounded-2xl space-y-2 border border-white/5">
                    <p className="text-[9px] uppercase font-bold text-slate-500 font-mono">Available Commands</p>
                    <div className="flex gap-4">
                      <code className="text-brand-primary text-[10px]">/post &lt;content&gt;</code>
                      <code className="text-brand-primary text-[10px]">/story &lt;media&gt;</code>
                    </div>
                  </div>
                </div>

                {/* MFA Section */}
                <div className="p-10 glass rounded-[3rem] space-y-6 border-brand-primary/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10"><Shield size={100} /></div>
                  <h3 className="text-xl font-display font-bold flex items-center gap-3">
                    <Smartphone className="text-brand-primary" /> Application MFA Control
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm">Enable Level 4 authentication by linking a compliant TOTP application (Google Authenticator, Authy, etc).</p>
                  
                  {adminSettings?.mfaEnabled ? (
                    <div className="flex items-center gap-4 text-brand-primary font-mono text-[10px] uppercase tracking-widest bg-brand-primary/10 w-fit px-6 py-2 rounded-full">
                      <CheckCircle2 size={16} /> Vault Status: HARDENED
                    </div>
                  ) : (
                    <button onClick={initMfaSetup} className="neo-button-primary bg-cyan-500 py-3 px-8 text-xs">Initialize App Authentication</button>
                  )}

                  {showQr && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pt-6 space-y-6">
                      <div className="bg-white p-4 rounded-3xl w-fit mx-auto shadow-2xl">
                        <QRCodeSVG value={`otpauth://totp/ChitronPortal:Admin?secret=${mfaSetupSecret}&issuer=ChitronPortal`} size={180} />
                      </div>
                      <div className="max-w-[200px] mx-auto space-y-2">
                        <input 
                          value={mfaCode}
                          onChange={e => setMfaCode(e.target.value)}
                          placeholder="Verify Cipher"
                          className="w-full bg-white/10 border border-white/10 rounded-xl py-2 px-4 text-center font-mono text-sm"
                        />
                        <button onClick={commitMfaSetup} className="w-full bg-brand-primary text-slate-900 rounded-xl py-2 font-bold text-[10px] uppercase">Commit Logic</button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
