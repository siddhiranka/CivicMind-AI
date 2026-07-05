import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Report from './pages/Report';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TrackComplaint from './pages/TrackComplaint';
import ChatBot from './components/ChatBot';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Header = ({ onOpenChat }: { onOpenChat: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="px-8 py-4 border-b border-border/40 flex items-center justify-between backdrop-blur-md bg-background/60 fixed top-0 w-full z-50">
      <h1 onClick={() => navigate('/')} className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent flex items-center gap-2 cursor-pointer">
        CivicMind AI
      </h1>
      <nav className="flex items-center gap-6 font-medium text-sm">
        <a href="/" className="hover:text-primary transition-colors">Home</a>
        <a href="/report" className="hover:text-primary transition-colors">Report Issue</a>
        <a href="/track" className="hover:text-primary transition-colors">Track Complaint</a>
        <a href="/dashboard" className="hover:text-primary transition-colors">Dashboard</a>
        
        {user ? (
          <div className="flex items-center gap-4 ml-4 border-l border-border pl-4">
            <div className="flex items-center gap-2 text-primary">
              <User size={16} />
              <span>{user.name}</span>
            </div>
            <button onClick={logout} className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 ml-4 border-l border-border pl-4">
            <button onClick={() => navigate('/login')} className="hover:text-primary transition-colors">Login</button>
            <button onClick={() => navigate('/signup')} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">Sign Up</button>
          </div>
        )}
      </nav>
    </header>
  );
};

const AppContent = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  React.useEffect(() => {
    const handleOpenChat = () => setIsChatOpen(true);
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans dark">
      <Header onOpenChat={() => setIsChatOpen(true)} />
      
      <main className="flex-1 flex flex-col pt-16">
        <Routes>
          <Route path="/" element={<Home onOpenChat={() => setIsChatOpen(true)} />} />
          <Route path="/report" element={<Report />} />
          <Route path="/track" element={<TrackComplaint />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </main>

      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
