import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, ShieldAlert, Sparkles, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = ({ onOpenChat }: { onOpenChat: () => void }) => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const yBackground = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Animated Background Placeholder (Futuristic City) */}
        <motion.div 
          style={{ y: yBackground }}
          className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center"
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-background/80 to-background"></div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6 backdrop-blur-md"
          >
            <Sparkles size={16} />
            <span className="text-sm font-medium">Powered by Gemini AI</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent dark:from-white dark:to-gray-500"
          >
            Building Smarter Communities with Artificial Intelligence.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl font-light"
          >
            Report. Analyze. Predict. Improve.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button 
              onClick={() => navigate('/report')}
              className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.8)] hover:-translate-y-1 relative overflow-hidden group border border-blue-400/50"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              <span className="relative z-10 flex items-center gap-2">Report an Issue <ChevronRight size={20} /></span>
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-secondary/80 hover:-translate-y-1 hover:shadow-lg transition-all backdrop-blur-md border border-white/5"
            >
              Explore Dashboard
            </button>
            <button 
              onClick={onOpenChat}
              className="px-8 py-4 rounded-xl border border-border bg-background/50 text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-accent hover:-translate-y-1 hover:shadow-lg transition-all backdrop-blur-md"
            >
              Talk to Civic AI
            </button>
          </motion.div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-32 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">What happens when thousands of community problems go unnoticed?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Traditional reporting systems are slow, disconnected, and inefficient. Citizens speak, but the system doesn't listen.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProblemCard 
              icon={<AlertTriangle className="text-amber-500" size={32} />}
              title="Delayed Responses"
              desc="Weeks go by before simple issues like broken streetlights or potholes are even assigned to a department."
            />
            <ProblemCard 
              icon={<TrendingUp className="text-destructive" size={32} />}
              title="Escalating Costs"
              desc="Minor road cracks become major hazards. Small leaks turn into floods. Reactive maintenance is expensive."
            />
            <ProblemCard 
              icon={<Search className="text-blue-500" size={32} />}
              title="Lack of Transparency"
              desc="Citizens have no way of tracking their complaints, leading to frustration and a lack of trust in local governance."
            />
          </div>
        </div>
      </section>

      {/* Introducing CivicMind AI Section */}
      <section className="py-32 px-4 relative z-10 bg-gradient-to-b from-background to-secondary/20">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="w-48 h-48 rounded-full bg-primary/20 flex items-center justify-center mb-12 relative"
          >
             <div className="absolute inset-0 rounded-full animate-ping bg-primary/30"></div>
             <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_40px_rgba(37,99,235,0.8)] z-10">
                <Sparkles size={48} />
             </div>
          </motion.div>
          
          <h2 className="text-5xl font-bold mb-6">Meet CivicMind AI.</h2>
          <p className="text-2xl text-muted-foreground max-w-4xl leading-relaxed">
            An intelligent decision platform that understands your community, predicts problems, and recommends solutions before issues become disasters.
          </p>
        </div>
      </section>
      
      {/* Final Call to Action */}
      <section className="py-32 px-4 text-center">
         <h2 className="text-4xl font-bold mb-8">Every report creates change. Every decision shapes a smarter community.</h2>
         <button onClick={() => navigate('/report')} className="px-10 py-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(79,70,229,0.5)]">
            Start Building a Better Tomorrow
         </button>
      </section>
    </div>
  );
};

const ProblemCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    className="p-8 rounded-3xl bg-card/50 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:border-primary/30 hover:-translate-y-2 transition-all duration-300 group cursor-default"
  >
    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-4">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{desc}</p>
  </motion.div>
);

export default Home;
