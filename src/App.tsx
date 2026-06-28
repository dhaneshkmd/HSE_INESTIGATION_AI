import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Activity, Database, AlertOctagon, Sparkles, 
  Plus, MessageSquare, Terminal, RefreshCw, Calendar, 
  MapPin, Clock, ChevronRight, X, AlertTriangle, Play, HelpCircle
} from "lucide-react";
import { Incident, DashboardStats } from "./types";
import Dashboard from "./components/Dashboard";
import InvestigationWizard from "./components/InvestigationWizard";
import AIChatAssistant from "./components/AIChatAssistant";
import { 
  DocumentParser, RcaEngine, ReportGenerator, CapaRegister, FloatingChatbot, AboutPage 
} from "./components/NvidiaFeatures";

export default function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // NVIDIA 5 Intelligent Features Tab states
  const [currentTab, setCurrentTab] = useState("Home");
  const [autoFillData, setAutoFillData] = useState<any>(null);
  const [rcaResults, setRcaResults] = useState<string>("");
  const [formDetails, setFormDetails] = useState<any>(null);
  const [capaList, setCapaList] = useState<any[]>([]);

  // Registration Form States
  const [regTitle, setRegTitle] = useState("");
  const [regSeverity, setRegSeverity] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [regPotSeverity, setRegPotSeverity] = useState<"Medium" | "High" | "Critical" | "Catastrophic">("High");
  const [regType, setRegType] = useState("Process Safety");
  const [regLocation, setRegLocation] = useState("");
  const [regContractor, setRegContractor] = useState("");
  const [regDescription, setRegDescription] = useState("");

  // Live clock hook
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial incidents and stats from the server on load
  const loadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/incidents");
      if (response.ok) {
        const list = await response.json();
        setIncidents(list);
        calculateStats(list);
      }
    } catch (err) {
      console.error("Failed to fetch initial database payload", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedClassification, setSelectedClassification] = useState("all");

  const calculateStats = (list: Incident[]) => {
    const total = list.length;
    const approved = list.filter(i => i.status === "Approved").length;
    const critical = list.filter(i => i.severity === "Critical" || i.potentialSeverity === "Catastrophic").length;
    
    // Average index calculation
    const withQa = list.filter(i => i.qualityAssurance && i.qualityAssurance.qualityScore);
    const avgScore = withQa.length > 0 
      ? Math.round(withQa.reduce((acc, curr) => acc + (curr.qualityAssurance?.qualityScore || 0), 0) / withQa.length)
      : 84;

    setStats({
      totalInvestigations: total,
      approvedRate: Math.round((approved / (total || 1)) * 100),
      criticalIncidents: critical,
      averageQAIndex: avgScore
    });
  };

  // Create a brand new incident locally and sync to server
  const handleRegisterIncident = async () => {
    if (!regTitle || !regLocation || !regContractor) {
      alert("Please provide Incident Title, Contractor and Location details.");
      return;
    }

    const newObj: Partial<Incident> = {
      incidentTitle: regTitle,
      severity: regSeverity,
      potentialSeverity: regPotSeverity,
      eventType: regType,
      location: regLocation,
      contractor: regContractor,
      witnessStatements: regDescription || "Initial description provided at registration."
    };

    try {
      const response = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newObj)
      });

      if (response.ok) {
        const savedIncident = await response.json();
        const updatedList = [savedIncident, ...incidents];
        setIncidents(updatedList);
        calculateStats(updatedList);
        setIsRegisterOpen(false);
        
        // Automatically load into Wizard so the investigator can begin immediately!
        setSelectedIncident(savedIncident);
        
        // Reset form states
        setRegTitle("");
        setRegLocation("");
        setRegContractor("");
        setRegDescription("");
      }
    } catch (err) {
      console.error("Failed to commit new incident case to ledger", err);
    }
  };

  // Sync edited incident back to our active collection and persist to server
  const handleUpdateIncidentInList = async (updated: Incident) => {
    const newList = incidents.map(item => item.id === updated.id ? updated : item);
    setIncidents(newList);
    calculateStats(newList);
    if (selectedIncident?.id === updated.id) {
      setSelectedIncident(updated);
    }

    try {
      await fetch(`/api/incidents/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error("Failed to persist updated incident state to database", err);
    }
  };

  const handleSelectCase = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-slate-100 flex flex-col font-sans selection:bg-brand-red selection:text-white relative overflow-hidden">
      
      {/* Ambient Mesh Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-800/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Grid Scanlines overlay for the Year 2035 control room aesthetic */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(18,24,38,0.08)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(0,30,60,0.01),rgba(0,0,0,0.1))] bg-[size:100%_4px,6px_100%] pointer-events-none z-50 opacity-30"></div>

      {/* Master Corporate Header */}
      <header className="sticky top-0 z-30 bg-slate-900/60 backdrop-blur-md border-b border-white/10 py-3.5 px-6 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center border border-brand-red/20 glow-red">
            <Shield className="w-5.5 h-5.5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold font-display tracking-widest text-white uppercase">HSE INTELLIINVESTIGATE AI <span className="text-brand-red tracking-widest text-[9px] ml-1 uppercase">v.3.0</span></h1>
              <span className="text-[9px] font-mono bg-red-950/40 border border-brand-red/30 text-brand-red px-2 py-0.5 rounded-full animate-pulse font-bold">Active Core</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tight">HSE ACCIDENT INVESTIGATION PLATFORM // SAUDI ARAMCO & ADNOC HSSE COMPLIANT</p>
          </div>
        </div>

        {/* Live HUD UTC Clock & Action Tray */}
        <div className="flex items-center gap-6">
          
          <div className="hidden md:flex flex-col items-end font-mono text-[10px] text-slate-400 space-y-0.5 border-r border-white/10 pr-6">
            <div><span className="text-slate-600 uppercase">SYS_TIME:</span> {currentTime.toUTCString().replace("GMT", "UTC")}</div>
            <div><span className="text-slate-600 uppercase">STATUS:</span> CORE_NODE_SECURE</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-4 py-1.5 bg-gradient-to-br from-brand-red to-red-800 hover:from-red-600 hover:to-red-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-red-500/20 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>REGISTER INCIDENT CASE</span>
            </button>
          </div>

        </div>
      </header>

      {/* Sub-Header Horizontal Navigation Bar */}
      <nav className="bg-slate-900/40 border-b border-white/5 py-2.5 px-6 flex items-center justify-between no-print overflow-x-auto gap-4 scrollbar-none">
        <div className="flex gap-1.5">
          {[
            { id: "Home", label: "🏠 Home" },
            { id: "Parser", label: "📎 Document Parser" },
            { id: "Rca", label: "🔍 RCA Engine" },
            { id: "Report", label: "📄 Report Generator" },
            { id: "Capa", label: "✅ Corrective Actions" },
            { id: "About", label: "ℹ️ About Platform" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id);
                if (tab.id !== "Home") {
                  setSelectedIncident(null);
                }
              }}
              className={`px-4 py-2 rounded-xl text-[11px] font-mono uppercase tracking-tight transition-all cursor-pointer ${
                currentTab === tab.id
                  ? "bg-brand-red/20 border border-brand-red text-white font-bold glow-red"
                  : "bg-transparent border border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="text-[10px] font-mono text-slate-500 uppercase hidden lg:block tracking-widest">
          SECURE_NODE // NVIDIA_NEMOTRON_CONNECTED
        </div>
      </nav>

      {/* Primary Layout Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Workspace Canvas (Dashboard or Wizard) */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="h-[60vh] flex flex-col items-center justify-center gap-3 font-mono text-xs text-slate-500"
              >
                <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                  <p>LOADING DATABASE PARAMETERS...</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">ESTABLISHING CRYPTOGRAPHIC AUDIT LOCKS</p>
                </div>
              </motion.div>
            ) : currentTab === "Parser" ? (
              <motion.div
                key="parser-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DocumentParser 
                  onAutoFillRca={(data) => {
                    setAutoFillData(data);
                    setCurrentTab("Rca");
                  }} 
                />
              </motion.div>
            ) : currentTab === "Rca" ? (
              <motion.div
                key="rca-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <RcaEngine 
                  autoFillData={autoFillData}
                  onNavigateToReport={(rca, details) => {
                    setRcaResults(rca);
                    setFormDetails(details);
                    setCurrentTab("Report");
                  }}
                  onNavigateToCapa={(items) => {
                    setCapaList(items);
                    setCurrentTab("Capa");
                  }}
                />
              </motion.div>
            ) : currentTab === "Report" ? (
              <motion.div
                key="report-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ReportGenerator 
                  rcaResults={rcaResults}
                  formDetails={formDetails}
                />
              </motion.div>
            ) : currentTab === "Capa" ? (
              <motion.div
                key="capa-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <CapaRegister 
                  initialCapa={capaList}
                />
              </motion.div>
            ) : currentTab === "About" ? (
              <motion.div
                key="about-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AboutPage />
              </motion.div>
            ) : selectedIncident ? (
              <motion.div
                key="wizard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <InvestigationWizard 
                  incident={selectedIncident}
                  onUpdateIncident={handleUpdateIncidentInList}
                  onBackToDashboard={() => setSelectedIncident(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Dashboard 
                  incidents={incidents}
                  onSelectIncident={handleSelectCase}
                  onAddNewIncident={() => setIsRegisterOpen(true)}
                  selectedDept={selectedDept}
                  setSelectedDept={setSelectedDept}
                  selectedClassification={selectedClassification}
                  setSelectedClassification={setSelectedClassification}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sliding AI Conversational Drawer */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.aside 
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-[420px] shrink-0 z-40 relative no-print shadow-2xl border-l border-slate-900"
            >
              <AIChatAssistant 
                activeIncident={selectedIncident}
                onClose={() => setIsChatOpen(false)}
              />
            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* Slide-over Overlay for Registering Incidents */}
      <AnimatePresence>
        {isRegisterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-cyber-card border border-cyber-border rounded-2xl p-6 shadow-2xl overflow-hidden relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand-cyan glow-cyan" />
                  <div>
                    <h3 className="text-xs font-bold tracking-widest font-mono text-slate-100">REGISTER NEW INCIDENT CASE</h3>
                    <span className="text-[9px] text-slate-500 font-mono">INITIATES INVESTIGATION SEQUENCE</span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsRegisterOpen(false)}
                  className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div className="flex flex-col md:col-span-2">
                  <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Incident Case Title</label>
                  <input
                    type="text"
                    value={regTitle}
                    onChange={(e) => setRegTitle(e.target.value)}
                    placeholder="e.g. Electrical arc flash during 11kV ACB isolation checks at MCC cabinet A"
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Immediate Severity classification</label>
                  <select
                    value={regSeverity}
                    onChange={(e) => setRegSeverity(e.target.value as any)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan"
                  >
                    <option value="Low">Low - First Aid / Near Miss</option>
                    <option value="Medium">Medium - Medical Treatment</option>
                    <option value="High">High - Lost Time Injury (LTI)</option>
                    <option value="Critical">Critical - Fatality / Asset Loss</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Potential Severity Matrix rating</label>
                  <select
                    value={regPotSeverity}
                    onChange={(e) => setRegPotSeverity(e.target.value as any)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan"
                  >
                    <option value="Medium">Medium - Level 2 exposure</option>
                    <option value="High">High - Significant hazard event</option>
                    <option value="Critical">Critical - Major Process event</option>
                    <option value="Catastrophic">Catastrophic - Regional site loss</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Incident Category</label>
                  <select
                    value={regType}
                    onChange={(e) => setRegType(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan"
                  >
                    <option value="Process Safety">Process Safety / Chemical</option>
                    <option value="Electrical Isolation">Electrical Isolation / Energy</option>
                    <option value="Heavy Lifting">Heavy Lifting / Crane Ops</option>
                    <option value="Excavation">Excavation & Civil Shoring</option>
                    <option value="Work at Height">Work at Height / Fall Protection</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Location Description</label>
                  <input
                    type="text"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    placeholder="e.g. Substation Room 2, West Terminal Jetty"
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Contractor / Employer Name</label>
                  <input
                    type="text"
                    value={regContractor}
                    onChange={(e) => setRegContractor(e.target.value)}
                    placeholder="e.g. Arab Engineering & Contracting Ltd"
                    className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan"
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Initial Occurrence Description / Evidence Statement</label>
                  <textarea
                    value={regDescription}
                    onChange={(e) => setRegDescription(e.target.value)}
                    rows={4}
                    placeholder="Enter witness description of event, active crew members, and immediate protective controls executed on the field..."
                    className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan leading-relaxed"
                  />
                </div>

              </div>

              {/* Submit panel */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterIncident}
                  className="px-6 py-2 bg-gradient-to-r from-brand-red to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>INITIALIZE SYSTEM LEAD</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Chatbot Global Core */}
      <FloatingChatbot />

    </div>
  );
}
