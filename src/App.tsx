/** Author: Chitron Bhattacharjee **/
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import ShiPuAI from './components/ShiPuAI';
import Feed from './components/Feed';
import About from './pages/About';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Admin from './pages/Admin';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const { loading, user } = useFirebase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white mesh-gradient">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <div className="absolute inset-0 blur-xl bg-brand-primary/20 animate-pulse rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen mesh-gradient relative overflow-x-hidden text-slate-900 selection:bg-brand-primary/20">
        <Navbar />
        
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/about" element={<About />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <ShiPuAI />
        
        <footer className="py-20 text-center border-t border-slate-100 relative z-10 bg-white/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <span className="text-brand-primary font-black text-xl">C</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.5em] font-sans font-bold">
                Design & Engineering by <span className="text-slate-900">Chitron Bhattacharjee</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppRoutes />
    </FirebaseProvider>
  );
}
