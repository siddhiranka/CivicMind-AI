import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data);
        navigate('/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/50 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-bold">Create Account</h2>
          <p className="text-muted-foreground mt-2">Join CivicMind to shape your community</p>
        </div>

        {error && <div className="p-3 mb-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-center text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              required 
            />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold mt-4 hover:bg-primary/90 transition-all">
            Sign Up
          </button>
        </form>
        
        <p className="text-center mt-6 text-muted-foreground">
          Already have an account? <a href="/login" className="text-primary hover:underline">Sign in</a>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
