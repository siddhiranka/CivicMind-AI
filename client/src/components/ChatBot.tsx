import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hello! I'm CivicMind AI. Ask me about live community issues, priority recommendations, or predictive trends." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to the network right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="fixed bottom-24 right-6 w-[450px] h-[550px] bg-background/70 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl flex flex-col overflow-hidden z-50"
        >
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={24} />
              <h3 className="font-bold">Civic AI Assistant</h3>
            </div>
            <button onClick={onClose} className="hover:bg-primary/50 p-1 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-3xl ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm shadow-md' : 'bg-secondary/60 backdrop-blur-md text-foreground rounded-bl-sm shadow-sm border border-white/5'}`}>
                  {msg.role === 'ai' ? (
                     <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-background/50 prose-strong:text-primary">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                     </div>
                  ) : (
                     <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start">
                <div className="bg-secondary/60 backdrop-blur-md text-foreground p-4 rounded-3xl rounded-bl-sm border border-white/5 shadow-sm flex gap-1.5 items-center">
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-foreground/50 rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-foreground/50 rounded-full" />
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-foreground/50 rounded-full" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-background/50 border-t border-border flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about live issues..."
              className="flex-1 bg-background border border-border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 disabled:opacity-50"
            >
              <Send size={18} className="ml-1" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatBot;
