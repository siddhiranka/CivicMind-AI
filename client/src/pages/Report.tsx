import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ChevronRight, CheckCircle2, AlertTriangle, Activity, MapPin, Search, Server, FileText, Check, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Report = () => {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [checkingGps, setCheckingGps] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [aiResult, setAiResult] = useState<any>(null);
  const [complaintId, setComplaintId] = useState<string>('');

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const requestLocation = (): Promise<{lat: number, lng: number, hasGps: boolean}> => {
    return new Promise((resolve) => {
      setCheckingGps(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const loc = { lat: position.coords.latitude, lng: position.coords.longitude, hasGps: true };
            setCheckingGps(false);
            resolve(loc);
          },
          (error) => {
            const loc = { lat: 0, lng: 0, hasGps: false };
            setCheckingGps(false);
            resolve(loc);
          },
          { timeout: 5000 }
        );
      } else {
        const loc = { lat: 0, lng: 0, hasGps: false };
        setCheckingGps(false);
        resolve(loc);
      }
    });
  }

  const handleAnalyze = async () => {
    if (!file || !description) return;
    
    setIsAnalyzing(true);
    setAiStep(0);
    
    const steps = setInterval(() => {
       setAiStep(prev => prev < 5 ? prev + 1 : prev);
    }, 1200);
    
    const loc = await requestLocation();
    
    const formData = new FormData();
    formData.append('description', description);
    formData.append('image', file);
    formData.append('hasGps', loc.hasGps ? 'true' : 'false');
    if (loc.hasGps) {
      formData.append('lat', loc.lat.toString());
      formData.append('lng', loc.lng.toString());
    }

    try {
      const response = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setAiResult(data.aiAnalysis);
      if (data.complaint) {
         setComplaintId(data.complaint.complaintId);
      }
      
      clearInterval(steps);
      setAiStep(6);
      
      setTimeout(() => {
        setStep(3); // Move to results step
        setIsAnalyzing(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Failed to analyze issue.');
      clearInterval(steps);
      setIsAnalyzing(false);
    }
  };

  const thinkingSteps = [
    "Analyzing Image...",
    "Detecting Scene Context...",
    "Comparing Description...",
    "Checking GPS Verification...",
    "Generating Decision...",
    "Preparing Recommendation..."
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center pt-24 pb-10">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto px-4 relative z-10">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            AI Incident Reporting
          </h1>
          <p className="text-muted-foreground mt-2">CivicMind AI verifies and routes your report instantly.</p>
        </div>

        <div className="bg-card/40 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Description */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold">What is the issue?</h2>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. There is a huge pothole near Sudama Nagar main road causing traffic..."
                  className="w-full h-32 bg-background/50 border border-border/50 rounded-2xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-inner"
                />
                <button
                  disabled={!description.trim()}
                  onClick={() => setStep(2)}
                  className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold ml-auto flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:-translate-y-1"
                >
                  Next Step <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* STEP 2: Image Upload & Scanning */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-bold">Upload Visual Evidence</h2>
                
                <div className="relative border-2 border-dashed border-border rounded-2xl h-72 flex flex-col items-center justify-center overflow-hidden hover:border-primary/50 transition-colors bg-background/30 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    disabled={isAnalyzing}
                  />
                  
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      {isAnalyzing && (
                        <div className="absolute inset-0 z-30 overflow-hidden rounded-2xl">
                          {/* Laser Scanner */}
                          <motion.div 
                             initial={{ top: '-20%' }}
                             animate={{ top: '120%' }}
                             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                             className="absolute left-0 w-full h-1/4 bg-gradient-to-b from-transparent via-primary/20 to-primary/80 border-b-2 border-primary shadow-[0_10px_30px_rgba(59,130,246,1)]"
                          />
                          {/* AI Thinking Panel Overlay */}
                          <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex flex-col items-center justify-center p-6">
                            <Activity size={40} className="text-primary animate-pulse mb-6" />
                            <div className="w-full max-w-sm space-y-3">
                              {thinkingSteps.map((text, idx) => (
                                <div key={idx} className={`flex items-center gap-3 text-sm font-medium ${aiStep >= idx ? 'text-foreground' : 'text-muted-foreground opacity-30'}`}>
                                  {aiStep > idx ? <Check size={16} className="text-primary" /> : aiStep === idx ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : <div className="w-4 h-4 rounded-full border border-muted-foreground" />}
                                  {text}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Upload size={48} className="mb-4 text-primary" />
                      <p className="font-medium">Click or drag an image here</p>
                      <p className="text-xs mt-2 opacity-70">JPEG, PNG up to 10MB</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <button onClick={() => setStep(1)} className="text-muted-foreground hover:text-foreground font-medium" disabled={isAnalyzing}>Back</button>
                  <button
                    onClick={handleAnalyze}
                    disabled={!file || isAnalyzing}
                    className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                  >
                    {isAnalyzing ? (
                      <>Verifying... <Activity size={18} className="animate-spin" /></>
                    ) : checkingGps ? (
                      <>Requesting GPS... <MapPin size={18} className="animate-bounce" /></>
                    ) : (
                      <>Run AI Evidence Assessment <Search size={18} /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: AI Results */}
            {step === 3 && aiResult && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                {!aiResult.isGenuine ? (
                  <>
                    <div className="flex items-center gap-3 text-destructive mb-2">
                      <AlertTriangle size={32} />
                      <h2 className="text-3xl font-bold text-foreground">Submission Flagged</h2>
                    </div>
                    <div className="p-8 bg-destructive/10 border border-destructive/30 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                      <h3 className="font-bold text-destructive text-xl mb-4">Authenticity Warning</h3>
                      <p className="text-foreground text-lg mb-6 leading-relaxed">Our AI detected that this image may be a stock photo, unrelated to the description, or otherwise non-genuine.</p>
                      
                      <div className="bg-background/80 p-4 rounded-xl border border-destructive/20 mb-6">
                        <span className="text-sm text-destructive font-bold uppercase tracking-wider mb-2 block">AI Reasoning</span>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {aiResult.evidenceAssessment?.reasoning?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </div>
                    <button 
                      onClick={() => setStep(1)}
                      className="w-full mt-6 py-4 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-secondary/80 transition-all border border-white/5"
                    >
                      Restart Assessment
                    </button>
                  </>
                ) : (
                  <>
                    {/* Timeline */}
                    <div className="flex items-center justify-between px-2 mb-8 relative">
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10" />
                      <div className="absolute top-1/2 left-0 w-1/3 h-0.5 bg-primary -z-10 shadow-[0_0_10px_rgba(37,99,235,1)]" />
                      
                      <TimelineIcon icon={<FileText size={16}/>} label="Submitted" active />
                      <TimelineIcon icon={<Server size={16}/>} label="AI Review" active />
                      <TimelineIcon icon={<ShieldCheck size={16}/>} label="Verified" active />
                      <TimelineIcon icon={<Activity size={16}/>} label="Human Review" />
                      <TimelineIcon icon={<CheckCircle2 size={16}/>} label="Resolved" />
                    </div>

                    <div className="flex items-center justify-between mb-4">
                       <h2 className="text-3xl font-bold">AI Evidence Assessment</h2>
                       {complaintId && (
                          <div className="bg-primary/20 text-primary px-4 py-2 rounded-lg font-bold border border-primary/30">
                             ID: {complaintId}
                          </div>
                       )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Col: Evidence */}
                      <div className="space-y-4">
                        <div className="p-6 rounded-2xl border border-white/10 bg-card/40 flex flex-col">
                          <span className="text-sm text-muted-foreground mb-4 font-semibold uppercase tracking-wider">Verification Metrics</span>
                          
                          <MetricRow label="Scene matches description" value={`${aiResult.evidenceAssessment?.sceneMatch}%`} />
                          <MetricRow label="GPS Available" value={aiResult.evidenceAssessment?.gpsAvailable ? "YES" : "NO"} highlight={!aiResult.evidenceAssessment?.gpsAvailable} />
                          <MetricRow label="Location Verified" value={aiResult.evidenceAssessment?.locationVerified ? "YES" : "NO"} highlight={!aiResult.evidenceAssessment?.locationVerified} />
                          <MetricRow label="Confidence" value={`${aiResult.evidenceAssessment?.confidence}%`} />
                          
                          <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                            <span className="font-bold">Overall Evidence Strength</span>
                            <span className={`text-2xl font-black ${(aiResult.evidenceAssessment?.overallStrength || 0) > 70 ? 'text-green-400' : 'text-amber-400'}`}>
                              {aiResult.evidenceAssessment?.overallStrength}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Col: AI Reasoning */}
                      <div className="space-y-4">
                        <div className="p-6 rounded-2xl border border-white/10 bg-card/40 h-full">
                          <span className="text-sm text-primary mb-4 font-bold uppercase tracking-wider block">Why did AI reach this conclusion?</span>
                          <ul className="space-y-3">
                            {aiResult.evidenceAssessment?.reasoning?.map((reason: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-6 pt-6 border-t border-border">
                            <span className="text-sm text-primary mb-2 font-bold uppercase tracking-wider block">Recommendation</span>
                            <p className="font-medium text-lg">{aiResult.recommendedAction || 'Send inspection team.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate('/dashboard')}
                      className="w-full mt-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] hover:-translate-y-1 transition-all"
                    >
                      Proceed to AI Mission Control
                    </button>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const TimelineIcon = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${active ? 'bg-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.6)]' : 'bg-secondary text-muted-foreground border border-border'}`}>
      {icon}
    </div>
    <span className={`text-[10px] uppercase tracking-wider font-bold ${active ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
  </div>
);

const MetricRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`font-bold ${highlight ? 'text-amber-400' : 'text-foreground'}`}>{value}</span>
  </div>
);

export default Report;
