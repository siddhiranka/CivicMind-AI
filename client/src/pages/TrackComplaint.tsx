import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, Clock, Circle, MapPin, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrackComplaint = () => {
  const [complaintId, setComplaintId] = useState('');
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId.trim()) return;

    setIsLoading(true);
    setError('');
    setTrackingData(null);

    try {
      const res = await fetch(`http://localhost:5000/api/complaints/track/${complaintId.trim()}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Complaint ID not found. Please check and try again.');
        throw new Error('Failed to fetch tracking data.');
      }
      const data = await res.json();
      setTrackingData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimelineSteps = (status: string) => {
    const statuses = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
    const currentIndex = statuses.indexOf(status) !== -1 ? statuses.indexOf(status) : 0;
    
    return [
      { id: 'reported', label: 'Reported', completed: true, date: trackingData?.createdAt },
      { id: 'reviewed', label: 'AI Reviewed', completed: true, date: trackingData?.createdAt },
      { id: 'assigned', label: 'Team Assigned', completed: currentIndex >= 1 },
      { id: 'progress', label: 'In Progress', completed: currentIndex >= 2 },
      { id: 'resolved', label: 'Resolved', completed: currentIndex >= 3 }
    ];
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black mb-4">Track My Complaint</h1>
          <p className="text-muted-foreground">Enter your Complaint ID to get real-time AI updates on your issue.</p>
        </div>

        <div className="bg-card/60 backdrop-blur-md border border-border rounded-3xl p-6 shadow-sm mb-8">
          <form onSubmit={handleTrack} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
                placeholder="e.g. CM-1024"
                className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary uppercase"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading || !complaintId.trim()}
              className="px-8 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Track'}
            </button>
          </form>
          {error && <p className="text-destructive mt-4 font-medium flex items-center gap-2"><AlertTriangle size={18}/> {error}</p>}
        </div>

        <AnimatePresence>
          {trackingData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/60 backdrop-blur-md border border-border rounded-3xl overflow-hidden shadow-sm"
            >
              <div className="p-6 md:p-8 border-b border-border bg-card">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Complaint ID</span>
                       <h2 className="text-3xl font-black text-primary">{trackingData.complaintId}</h2>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-bold text-sm ${trackingData.status === 'Resolved' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                       {trackingData.status}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                       <span className="text-muted-foreground block mb-1">Assigned Department</span>
                       <span className="font-bold">{trackingData.suggestedDepartment || 'Awaiting Assignment'}</span>
                    </div>
                    <div>
                       <span className="text-muted-foreground block mb-1">AI Priority</span>
                       <span className="font-bold flex items-center gap-1">
                          {trackingData.severity === 'Critical' && <AlertTriangle size={16} className="text-destructive"/>}
                          {trackingData.severity}
                       </span>
                    </div>
                    <div className="col-span-2">
                       <span className="text-muted-foreground block mb-1">Reported Location</span>
                       <span className="font-bold flex items-center gap-2"><MapPin size={16} className="text-primary"/> {trackingData.location?.address || 'Location provided via GPS'}</span>
                    </div>
                 </div>
              </div>

              <div className="p-6 md:p-8">
                 <h3 className="font-bold mb-6 text-lg">Live Timeline</h3>
                 <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[15px] before:h-full before:w-0.5 before:bg-border">
                    {getTimelineSteps(trackingData.status).map((step, index) => (
                       <div key={step.id} className="relative flex items-center gap-6">
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-background ${step.completed ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'}`}>
                             {step.completed ? <CheckCircle2 size={18} /> : <Circle size={10} fill="currentColor" />}
                          </div>
                          <div>
                             <span className={`font-bold block ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</span>
                             {step.completed && step.date && (
                                <span className="text-xs text-muted-foreground">{new Date(step.date).toLocaleString()}</span>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              
              <div className="p-6 bg-primary/5 border-t border-border flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="text-primary" size={24} />
                    <span className="text-sm font-medium">This report was verified and categorized by CivicMind AI.</span>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TrackComplaint;
