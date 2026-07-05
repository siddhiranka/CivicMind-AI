import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapIcon, AlertTriangle, CheckCircle2, Info, FileText, Download, Filter, Search, Database, Bot, ChevronRight, MapPin, Activity } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Dashboard = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [mapCenter, setMapCenter] = useState({lat: 19.0760, lng: 72.8777});
  const [mapZoom, setMapZoom] = useState(11);

  const LiveMapChild = ({ center, zoom }: { center: google.maps.LatLngLiteral, zoom: number }) => {
    const map = useMap();
    useEffect(() => {
       if (map) {
          map.panTo(center);
          map.setZoom(zoom);
       }
    }, [map, center, zoom]);
    return null;
  };

  const fetchComplaints = () => {
    fetch('/api/complaints')
      .then(res => res.json())
      .then(data => setComplaints(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
       const result = complaints.find(c => 
          (c.complaintId && c.complaintId.toLowerCase().includes(searchQuery.toLowerCase())) || 
          (c.location?.address && c.location.address.toLowerCase().includes(searchQuery.toLowerCase()))
       );
       if (result && result.location?.lat) {
           setMapCenter({lat: result.location.lat, lng: result.location.lng});
           setMapZoom(15);
           setSelectedComplaint(result);
       }
    }
  }, [searchQuery, complaints]);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await fetch('/api/complaints/seed', { method: 'POST' });
      fetchComplaints();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAIQuery = (query: string) => {
    window.dispatchEvent(new CustomEvent('open-chat'));
    setTimeout(() => {
       window.dispatchEvent(new CustomEvent('open-chat-msg', { detail: query }));
    }, 100);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    // Allow UI to update to show loading state before blocking the main thread
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const doc = new jsPDF();
      
      if (selectedComplaint) {
        doc.setFontSize(20);
        doc.text(`Incident Report: ${selectedComplaint.complaintId || 'Unknown'}`, 14, 22);
        
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
        
        doc.setFontSize(14);
        doc.text('Issue Details', 14, 45);
        
        doc.setFontSize(12);
        doc.text(`Issue: ${selectedComplaint.issueDetected || selectedComplaint.originalDescription || 'N/A'}`, 14, 55);
        const addressText = doc.splitTextToSize(`Location: ${selectedComplaint.location?.address || 'N/A'}`, 180);
        doc.text(addressText, 14, 65);
        
        const currentY = 65 + (addressText.length * 7);
        
        doc.text(`Severity: ${selectedComplaint.severity}`, 14, currentY);
        doc.text(`Status: ${selectedComplaint.status}`, 14, currentY + 10);
        doc.text(`Assigned Department: ${selectedComplaint.suggestedDepartment || 'Pending'}`, 14, currentY + 20);
        
        doc.setFontSize(14);
        doc.text('AI Analysis', 14, currentY + 40);
        
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(selectedComplaint.riskAnalysis || 'No analysis available.', 180);
        doc.text(splitText, 14, currentY + 50);

        doc.save(`Issue_Report_${selectedComplaint.complaintId || 'Custom'}.pdf`);
      } else {
        doc.setFontSize(20);
        doc.text('CivicMind AI - Daily Issue Report', 14, 22);
        
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
        
        const tableData = complaints.map(c => [
           c.complaintId || 'CM-XXXX',
           c.issueDetected || c.originalDescription || 'N/A',
           c.location?.address || 'N/A',
           c.severity,
           c.status
        ]);

        // @ts-ignore
        doc.autoTable({
           startY: 40,
           head: [['ID', 'Issue', 'Location', 'Priority', 'Status']],
           body: tableData,
        });

        doc.save('CivicMind_Report.pdf');
      }
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Failed to generate PDF. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  // Dynamic Calculations
  const newReports = complaints.filter(c => {
     const today = new Date();
     const reportDate = new Date(c.createdAt);
     return reportDate.toDateString() === today.toDateString();
  }).length;
  
  const criticalIssues = complaints.filter(c => c.severity === 'Critical' && c.status !== 'Resolved').length;
  const resolvedToday = complaints.filter(c => c.status === 'Resolved' && new Date(c.updatedAt).toDateString() === new Date().toDateString()).length;
  const pendingReview = complaints.filter(c => c.status === 'Pending').length;

  // Most critical pending issue for Action Required
  const actionRequired = complaints.filter(c => c.status === 'Pending').sort((a, b) => b.priorityScore - a.priorityScore)[0];

  const handleApprove = async (id: string) => {
     try {
        await fetch(`/api/complaints/${id}/status`, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ status: 'Assigned' })
        });
        fetchComplaints();
     } catch (e) {
        console.error(e);
     }
  };

  const getAISummary = () => {
     if (complaints.length === 0) return "No community reports have been submitted yet. Once reports are received, AI insights and recommendations will appear here.";
     if (criticalIssues > 0) return `There are ${criticalIssues} critical issues requiring immediate attention, primarily focused on ${actionRequired?.suggestedDepartment || 'infrastructure'}. Please review the Action Required panel.`;
     return "Community conditions are stable. Ongoing issues are being monitored and processed by the assigned departments.";
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 pt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h1 className="text-2xl font-bold">City Workflow Dashboard</h1>
              <p className="text-muted-foreground">Manage and resolve live community reports</p>
           </div>
           <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                 <input 
                    type="text"
                    placeholder="Search ID, Location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-48 lg:w-64"
                 />
              </div>
              <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-lg text-sm font-medium hover:bg-secondary/80 disabled:opacity-50">
                 {isExporting ? <div className="w-4 h-4 border-2 border-t-transparent border-foreground rounded-full animate-spin"></div> : <Download size={16}/>} 
                 {isExporting ? 'Generating...' : 'Export PDF'}
              </button>
           </div>
        </div>

        {/* 1. Today's Overview */}
        <div className="bg-card/40 border border-border rounded-2xl p-6 flex flex-col md:flex-row gap-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1">
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">New Reports</span>
                 <span className="text-4xl font-black">{newReports}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Critical Issues</span>
                 <span className="text-4xl font-black text-destructive">{criticalIssues}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Resolved Today</span>
                 <span className="text-4xl font-black text-green-500">{resolvedToday}</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Pending Review</span>
                 <span className="text-4xl font-black text-amber-500">{pendingReview}</span>
              </div>
           </div>
           <div className="md:w-1/3 bg-primary/10 p-4 rounded-xl border border-primary/20 flex flex-col justify-center">
              <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1"><Bot size={14}/> AI Summary</span>
              <p className="text-sm font-medium leading-relaxed">{getAISummary()}</p>
           </div>
        </div>

        {/* 2. Action Required */}
        {actionRequired ? (
           <div className="bg-card/80 border-2 border-destructive/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.05)] flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex items-start gap-4 flex-1">
                 <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                    <AlertTriangle size={24} />
                 </div>
                 <div>
                    <span className="text-xs font-bold text-destructive uppercase tracking-wider mb-1 block">Action Required</span>
                    <h2 className="text-xl font-bold mb-1">{actionRequired.originalDescription}</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                       <span className="flex items-center gap-1"><MapPin size={14}/> {actionRequired.location?.address}</span>
                       <span className="font-bold text-foreground">Priority: {actionRequired.severity}</span>
                    </div>
                    <div className="mt-4 p-3 bg-background rounded-lg border border-border text-sm">
                       <span className="font-bold block mb-1">AI Reason:</span>
                       {actionRequired.riskAnalysis}
                    </div>
                 </div>
              </div>
              <div className="flex flex-col gap-3 min-w-[200px] w-full lg:w-auto">
                 <div className="text-sm">
                    <span className="text-muted-foreground block">Recommended Action:</span>
                    <span className="font-bold">Assign {actionRequired.suggestedDepartment}</span>
                 </div>
                 <div className="flex gap-2 mt-2">
                    <button onClick={() => handleApprove(actionRequired._id)} className="flex-1 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 text-sm">Approve</button>
                    <button onClick={() => setSelectedComplaint(actionRequired)} className="flex-1 py-2 bg-secondary border border-border text-foreground font-bold rounded-lg hover:bg-secondary/80 text-sm">View Details</button>
                 </div>
              </div>
           </div>
        ) : (
           <div className="bg-card/40 border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center h-32">
              <CheckCircle2 size={32} className="text-green-500 mb-2" />
              <p className="font-bold text-muted-foreground">No immediate action required right now.</p>
           </div>
        )}

        {/* 3. Live Map & Details */}
        <div className="bg-card/40 border border-border rounded-2xl overflow-hidden flex flex-col lg:flex-row h-[600px]">
           <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-border">
              <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-md px-4 py-2 rounded-lg border border-border shadow-sm flex items-center gap-2">
                 <MapIcon size={16}/> <span className="font-bold text-sm">Live Incident Map</span>
              </div>
              <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
                 <Map 
                    center={mapCenter}
                    zoom={mapZoom}
                    onCameraChanged={(ev) => {
                        setMapCenter(ev.detail.center);
                        setMapZoom(ev.detail.zoom);
                    }}
                    mapId="DEMO_MAP_ID"
                    colorScheme="DARK"
                    onClick={() => setSelectedComplaint(null)}
                 >
                    <LiveMapChild center={mapCenter} zoom={mapZoom} />
                    {complaints.map((c, idx) => {
                       if (!c.location || !c.location.lat) return null;
                       const isCritical = c.severity === 'Critical' || c.severity === 'High';
                       const isMedium = c.severity === 'Medium';
                       let colorClass = 'bg-green-500';
                       if (isCritical) colorClass = 'bg-red-500';
                       else if (isMedium) colorClass = 'bg-yellow-500';

                       return (
                          <AdvancedMarker key={c._id || idx} position={{lat: c.location.lat, lng: c.location.lng}} onClick={() => setSelectedComplaint(c)}>
                             <div className={`w-4 h-4 rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-125 transition-transform ${colorClass}`} />
                          </AdvancedMarker>
                       );
                    })}
                 </Map>
              </APIProvider>
           </div>
           
           {/* Map Side Panel */}
           <div className="w-full lg:w-96 bg-card overflow-y-auto">
              {selectedComplaint ? (
                 <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="font-bold text-lg">{selectedComplaint.issueDetected || 'Reported Issue'}</h3>
                       <button onClick={() => setSelectedComplaint(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                    </div>
                    <img src={selectedComplaint.imageUrl} alt="Complaint" className="w-full h-40 object-cover rounded-xl mb-4" />
                    
                    <div className="space-y-4 text-sm">
                       <div>
                          <span className="text-muted-foreground block mb-1">Complaint ID</span>
                          <span className="font-bold">{selectedComplaint.complaintId || 'Unknown'}</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <span className="text-muted-foreground block mb-1">Severity</span>
                             <span className={`font-bold px-2 py-1 rounded-md text-xs ${selectedComplaint.severity === 'High' || selectedComplaint.severity === 'Critical' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'}`}>{selectedComplaint.severity}</span>
                          </div>
                          <div>
                             <span className="text-muted-foreground block mb-1">Status</span>
                             <span className="font-bold">{selectedComplaint.status}</span>
                          </div>
                       </div>
                       <div>
                          <span className="text-muted-foreground block mb-1">Assigned Department</span>
                          <span className="font-bold">{selectedComplaint.suggestedDepartment || 'Pending'}</span>
                       </div>
                       <div>
                          <span className="text-muted-foreground block mb-1">AI Reasoning</span>
                          <p className="text-foreground/90">{selectedComplaint.riskAnalysis}</p>
                       </div>
                       <button className="w-full py-3 bg-secondary border border-border font-bold rounded-xl hover:bg-secondary/80 mt-4">
                          Open Full Details
                       </button>
                    </div>
                 </div>
              ) : (
                 <div className="p-6 h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                    <MapIcon size={48} className="mb-4 opacity-20" />
                    <p>Click a marker on the map to view detailed information and AI recommendations.</p>
                 </div>
              )}
           </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* 4. Recent Reports Table */}
           <div className="lg:col-span-2 bg-card/40 border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border bg-card">
                 <h3 className="font-bold flex items-center gap-2"><FileText size={18} /> Recent Reports</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                          <th className="px-6 py-4 font-bold">ID</th>
                          <th className="px-6 py-4 font-bold">Issue</th>
                          <th className="px-6 py-4 font-bold">Location</th>
                          <th className="px-6 py-4 font-bold">Priority</th>
                          <th className="px-6 py-4 font-bold">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                       {complaints.filter(c => !searchQuery || (c.complaintId && c.complaintId.toLowerCase().includes(searchQuery.toLowerCase())) || (c.location?.address && c.location.address.toLowerCase().includes(searchQuery.toLowerCase()))).slice(0, 5).map((c, i) => (
                          <tr key={c._id || i} className="hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelectedComplaint(c)}>
                             <td className="px-6 py-4 font-medium text-muted-foreground">{c.complaintId || 'CM-XXXX'}</td>
                             <td className="px-6 py-4 font-medium">{c.issueDetected || c.originalDescription || 'Complaint'}</td>
                             <td className="px-6 py-4 text-muted-foreground truncate max-w-[150px]">{c.location?.address || 'Unknown'}</td>
                             <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${c.severity === 'High' || c.severity === 'Critical' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'}`}>
                                   {c.severity}
                                </span>
                             </td>
                             <td className="px-6 py-4">{c.status}</td>
                          </tr>
                       ))}
                       {complaints.length === 0 && (
                          <tr>
                             <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No reports available in the database.</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* 5. Notifications & AI */}
           <div className="space-y-8">
              <div className="bg-card/40 border border-border rounded-2xl p-6">
                 <h3 className="font-bold flex items-center gap-2 mb-4"><Activity size={18} /> Notifications</h3>
                 <div className="space-y-4">
                    <div className="flex gap-3 text-sm">
                       <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                       <p>Road Department approved task <span className="font-bold text-foreground">CM-1001</span></p>
                    </div>
                    <div className="flex gap-3 text-sm">
                       <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                       <p>Garbage issue resolved at <span className="font-bold text-foreground">Malad West</span></p>
                    </div>
                    <div className="flex gap-3 text-sm">
                       <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                       <p>New complaint received: <span className="font-bold text-foreground">Water Leak</span></p>
                    </div>
                 </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                 <h3 className="font-bold flex items-center gap-2 mb-4 text-primary"><Bot size={18} /> AI Assistant</h3>
                 <p className="text-sm text-muted-foreground mb-4">Quick actions to manage your workflow.</p>
                 <div className="space-y-2">
                    <button onClick={() => handleAIQuery("What needs attention?")} className="w-full text-left px-4 py-3 bg-background border border-border rounded-xl text-sm font-medium hover:bg-secondary flex justify-between items-center group">
                       What needs attention? <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground" />
                    </button>
                    <button onClick={() => handleAIQuery("Generate today's report")} className="w-full text-left px-4 py-3 bg-background border border-border rounded-xl text-sm font-medium hover:bg-secondary flex justify-between items-center group">
                       Generate today's report <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground" />
                    </button>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
