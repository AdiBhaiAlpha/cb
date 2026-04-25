/** Author: Chitron Bhattacharjee **/
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Post, Story } from '../types';
import { Clock, Image as ImageIcon, Video, User, Loader2, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const { db, settings } = useFirebase();

  useEffect(() => {
    if (!db) return;

    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubPosts = onSnapshot(postsQuery, (snap) => {
      setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
      setLoading(false);
    });

    const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsubStories = onSnapshot(storiesQuery, (snap) => {
      const now = Date.now();
      setStories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story)).filter(s => s.expiresAt > now));
    });

    return () => {
      unsubPosts();
      unsubStories();
    };
  }, [db]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <div className="absolute inset-0 blur-xl bg-brand-primary/20 animate-pulse rounded-full" />
        </div>
        <p className="text-slate-400 font-display animate-pulse uppercase font-black tracking-[0.3em] text-[10px]">Synchronizing Neural Stream</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pt-32 pb-20 px-6">
      {/* Profile Summary / Progress Rings */}
      <section className="glass-morphism rounded-[40px] p-0 relative overflow-hidden group border border-white/80 shadow-2xl shadow-slate-200/50">
        <div className="h-48 w-full relative overflow-hidden">
          {settings?.coverPhoto ? (
            <img src={settings.coverPhoto} className="w-full h-full object-cover" alt="Cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-primary to-purple-600 opacity-20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        </div>
        
        <div className="px-8 pb-10 -mt-16 flex flex-col md:flex-row items-center md:items-end gap-6 relative z-10">
          <div className="relative w-32 h-32 rounded-[2.5rem] border-8 border-white bg-white shadow-2xl overflow-hidden group">
            {settings?.profilePhoto ? (
              <img src={settings.profilePhoto} className="w-full h-full object-cover" alt="Chitron Bhattacharjee" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 text-brand-primary">
                <User size={48} />
              </div>
            )}
            <div className="absolute inset-0 border-2 border-white/20 rounded-[2.5rem] pointer-events-none" />
          </div>
          
          <div className="flex-1 text-center md:text-left pb-2">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <h2 className="text-4xl font-display font-[900] tracking-tighter text-slate-900 bg-clip-text">
                Chitron Bhattacharjee
              </h2>
              <div className="flex items-center justify-center md:justify-start verified-badge-golden group/badge cursor-default">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-inner group-hover/badge:scale-110 transition-transform">
                  <CheckCircle2 size={12} className="text-[#FFAC00] stroke-[3px]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4A3B00] drop-shadow-sm">Verified Identity</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.4em] mt-3">Fullstack Neural Architect & Designer</p>
          </div>

          <div className="flex gap-2">
             <div className="flex flex-col items-center px-6 py-3 bg-white/40 border border-white/80 rounded-3xl shadow-sm backdrop-blur-md">
                <span className="text-xl font-display font-black text-slate-900">{posts.length}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Signals</span>
             </div>
             <div className="flex flex-col items-center px-6 py-3 bg-brand-primary text-white rounded-3xl shadow-lg shadow-brand-primary/20">
                <span className="text-xl font-display font-black">78%</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Sync</span>
             </div>
          </div>
        </div>
      </section>

      {/* Stories */}
      {stories.length > 0 && (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {stories.map((story) => (
            <motion.div 
              key={story.id} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative min-w-[120px] h-48 rounded-[32px] overflow-hidden glass border-4 border-white shadow-xl cursor-pointer"
            >
              <img src={story.mediaUrl} className="w-full h-full object-cover" alt="Story" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 text-[10px] uppercase font-black tracking-tighter text-white">
                {formatDistanceToNow(story.createdAt)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Posts */}
      <div className="columns-1 md:columns-2 gap-10 space-y-10 [column-fill:_balance]">
        {posts.map((post) => (
          <motion.article
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            key={post.id}
            className="glass-morphism rounded-[32px] p-6 mb-10 border border-white/80 bg-white/40 hover:bg-white/60 transition-all duration-500 break-inside-avoid shadow-xl shadow-slate-200/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[16px] bg-brand-primary/10 flex items-center justify-center border-2 border-white shadow-md">
                  <User size={20} className="text-brand-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-display font-black text-sm tracking-tight">{post.authorName || 'Chitron Bhattacharjee'}</h4>
                    <div className="w-3.5 h-3.5 golden-gradient rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(255,172,0,0.4)]">
                      <CheckCircle2 size={8} className="text-white stroke-[3.5px]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    <Clock size={8} /> {formatDistanceToNow(post.createdAt)} ago
                  </div>
                </div>
              </div>
            </div>

            <p className="text-slate-600 text-sm leading-relaxed mb-6 whitespace-pre-wrap font-medium">
              {post.content}
            </p>

            {post.mediaUrl && (
              <div className="rounded-[24px] overflow-hidden border-4 border-white shadow-lg relative group mb-6">
                {post.mediaType === 'video' ? (
                  <video src={post.mediaUrl} controls className="w-full aspect-auto" />
                ) : (
                  <img src={post.mediaUrl} className="w-full h-auto object-cover" alt="Broadcast" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all pointer-events-none" />
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[8px] font-black uppercase text-slate-400 tracking-widest">Neural</span>
              <span className="px-3 py-1 bg-brand-primary/5 border border-brand-primary/10 rounded-full text-[8px] font-black uppercase text-brand-primary tracking-widest">Signal</span>
            </div>

            <button className="w-full py-3 bg-slate-50 hover:bg-brand-primary/5 border border-slate-100 text-slate-400 hover:text-brand-primary font-black uppercase text-[9px] tracking-widest rounded-2xl transition-all">
              Details
            </button>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
