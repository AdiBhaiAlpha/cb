/** Author: Chitron Bhattacharjee **/
import { motion } from 'motion/react';
import { Terminal, Code, Heart, BookOpen, Globe, Cpu, Palette, Users, CheckCircle2 } from 'lucide-react';

export default function About() {
  const roles = [
    { title: "Full Stack AI Bot Developer", icon: Cpu, desc: "Architecting large language model interfaces and autonomous agent ecosystems." },
    { title: "UI/UX Designer", icon: Palette, desc: "Crafting futuristic, high-fidelity digital experiences with minimalist aesthetics." },
    { title: "Socialist Politician", icon: Users, desc: "Advocating for democratic decentralization and technological equity in policy." },
    { title: "Writer", icon: BookOpen, desc: "Exploring the intersection of human consciousness and artificial intelligence through text." }
  ];

  return (
    <div className="max-w-4xl mx-auto pt-32 pb-20 px-6 space-y-20">
      {/* Hero */}
      <section className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-brand-primary blur-3xl opacity-20 rounded-full" />
          <img 
            src="https://ik.imagekit.io/chitron/profile_main.jpg" 
            className="w-48 h-48 rounded-[3rem] object-cover border-2 border-white/10 relative z-10"
            alt="Chitron Bhattacharjee"
          />
        </motion.div>
        
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight">
            Chitron <span className="text-brand-primary">Bhattacharjee</span>
          </h1>
          <div className="flex items-center justify-center gap-3">
             <div className="verified-badge-golden scale-90">
                <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={10} className="text-[#FFAC00] stroke-[3px]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4A3B00]">Verified Architect</span>
             </div>
          </div>
          <p className="text-slate-400 font-display text-lg tracking-widest uppercase mt-4">The Architect of Digital Sovereignty</p>
        </div>
      </section>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={role.title}
            className="glass-morphism p-8 rounded-[2rem] space-y-4 group"
          >
            <div className="p-3 bg-brand-primary/10 rounded-2xl w-fit group-hover:bg-brand-primary/20 transition-colors">
              <role.icon className="text-brand-primary" size={24} />
            </div>
            <h3 className="font-display font-bold text-xl">{role.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{role.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Manifesto */}
      <section className="glass-morphism p-10 rounded-[3rem] text-center space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[100px]" />
        <Terminal className="mx-auto text-brand-primary/40" size={40} />
        <h2 className="text-3xl font-display font-bold italic">"We build the future not by predicting it, but by programming the equity we want to see."</h2>
        <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Based in Dhaka, I merge the boundaries between technical infrastructure and social advocacy. My work is a synthesis of clean code, emotive design, and a relentless pursuit of a future where AI serves the many, not the few.
        </p>
      </section>

      {/* Technical Footprint */}
      <section className="space-y-10">
        <h2 className="text-2xl font-display font-bold flex items-center gap-3">
          <Code className="text-brand-primary" /> Technical DNA
        </h2>
        <div className="flex flex-wrap gap-3">
          {['TypeScript', 'Ruby', 'Python', 'React', 'Gemini AI', 'Tailwind CSS', 'Firebase', 'ImageKit', 'Express', 'Vite', 'Framer Motion', 'Linux Architecture'].map(skill => (
            <span key={skill} className="px-4 py-2 glass rounded-full text-xs font-mono text-slate-300">
              {skill}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
