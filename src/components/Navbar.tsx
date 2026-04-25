/** Author: Chitron Bhattacharjee **/
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, User, MessageSquare, Shield, LogOut, Menu, X, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { cn } from '../lib/utils';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewSignal, setHasNewSignal] = useState(false);
  const location = useLocation();
  const { user, profile, isAdmin, auth, db } = useFirebase();
  const [hasAdminToken, setHasAdminToken] = useState(!!localStorage.getItem('chitron_admin_token'));

  useEffect(() => {
    const checkToken = () => {
      setHasAdminToken(!!localStorage.getItem('chitron_admin_token'));
    };
    window.addEventListener('storage', checkToken);
    // Also check on location change as logout might happen
    checkToken();
    return () => window.removeEventListener('storage', checkToken);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'signals'), where('userId', '==', user.uid), where('updatedAt', '>', Date.now() - 3600000));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) setHasNewSignal(true);
    });
    return () => unsub();
  }, [user, db]);

  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'About', path: '/about', icon: User },
    { name: 'Direct', path: '/messages', icon: MessageSquare, badge: hasNewSignal },
  ];

  if (isAdmin || hasAdminToken) {
    navItems.push({ name: 'Vault', path: '/admin', icon: Shield });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-8 pointer-events-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between p-2 glass-morphism rounded-full pointer-events-auto border border-white/80">
        <Link to="/" className="flex items-center gap-3 px-6">
          <div className="w-10 h-10 rounded-full bg-brand-primary shadow-lg shadow-brand-primary/30 flex items-center justify-center">
            <span className="text-white font-black text-xl">C</span>
          </div>
          <span className="font-display font-black text-xl tracking-tighter hidden sm:block">CHITRON</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100/50 rounded-full p-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const isVault = item.name === 'Vault';
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 tracking-wide uppercase group",
                  isActive 
                    ? "text-white bg-brand-primary shadow-md shadow-brand-primary/20" 
                    : isVault 
                      ? "text-yellow-600 bg-yellow-500/5 border border-yellow-500/20 hover:bg-yellow-500/10"
                      : "text-slate-500 hover:text-brand-primary"
                )}
              >
                <Icon size={14} className={cn("transition-transform", isActive ? "" : "group-hover:scale-110")} />
                <span className="mt-0.5">{item.name}</span>
                {item.badge && <span className="absolute top-1 right-2 w-2 h-2 bg-brand-primary rounded-full animate-pulse border-2 border-white" />}
              </Link>
            );
          })}
        </div>

        {/* User / Auth */}
        <div className="flex items-center gap-2 pr-2">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 group p-1 bg-slate-100 rounded-full border border-slate-200">
                <img 
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/shapes/svg?seed=${user.uid}`} 
                  className="w-8 h-8 rounded-full border-2 border-white transition-transform group-hover:scale-105"
                  alt="Avatar"
                />
              </Link>
              <button 
                onClick={() => auth?.signOut()}
                className="p-3 text-slate-400 hover:text-brand-primary transition-colors hover:bg-brand-primary/10 rounded-full"
                title="Disconnect"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="px-8 py-3 bg-brand-primary text-white text-[10px] uppercase font-black tracking-widest rounded-full shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:shadow-brand-primary/30 transition-all">
              Initialize
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-3 text-slate-400 hover:text-brand-primary">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-4 right-4 glass-morphism rounded-3xl p-4 md:hidden pointer-events-auto"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-2xl flex items-center gap-3",
                    location.pathname === item.path ? "bg-brand-primary/10 text-brand-primary" : "text-slate-400"
                  )}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
