import React, { useState, useEffect } from "react";
import { 
  FileText, Shield, Clock, Users, ArrowRight, ArrowLeft,
  Sparkles, Save, CheckCircle2, AlertOctagon, HelpCircle,
  Plus, Trash2, Calendar, MapPin, HardHat, ShieldAlert,
  UserCheck, ThumbsUp, Send
} from "lucide-react";
import { Incident, TimelineEvent, CAPAAction, QuestionEngineItem } from "../types";
import FishboneView from "./FishboneView";
import SwissCheeseView from "./SwissCheeseView";
import BowTieView from "./BowTieView";
import LessonsLearnedBulletin from "./LessonsLearnedBulletin";

interface InvestigationWizardProps {
  incident: Incident;
  onUpdateIncident: (updated: Incident) => void;
  onBackToDashboard: () => void;
}

export default function InvestigationWizard({ 
  incident, 
  onUpdateIncident,
  onBackToDashboard 
}: InvestigationWizardProps) {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [qaLoading, setQaLoading] = useState<boolean>(false);
  
  // Local states for adding timelines and CAPAs
  const [newTimelineTime, setNewTimelineTime] = useState("");
  const [newTimelineDesc, setNewTimelineDesc] = useState("");
  const [newTimelineCat, setNewTimelineCat] = useState<TimelineEvent["category"]>("Incident");

  const [newCapaAction, setNewCapaAction] = useState("");
  const [newCapaType, setNewCapaType] = useState<CAPAAction["type"]>("Corrective");
  const [newCapaOwner, setNewCapaOwner] = useState("");
  const [newCapaPriority, setNewCapaPriority] = useState<CAPAAction["priority"]>("Medium");
  const [newCapaDays, setNewCapaDays] = useState(14);

  // Digital Signatures approval
  const [leadSignature, setLeadSignature] = useState("");
  const [directorSignature, setDirectorSignature] = useState("");

  const steps = [
    { num: 1, name: "Incident Info" },
    { num: 2, name: "Evidence Log" },
    { num: 3, name: "Scene Exam" },
    { num: 4, name: "Witness Interviews" },
    { num: 5, name: "Timeline" },
    { num: 6, name: "Immediate Causes" },
    { num: 7, name: "Underlying Causes" },
    { num: 8, name: "Root Causes (AI)" },
    { num: 9, name: "Methodologies" },
    { num: 10, name: "CAPA Register" },
    { num: 11, name: "Safety Alert" },
    { num: 12, name: "QA & Audit Check" },
    { num: 13, name: "HSE Approval" }
  ];

  // Fetch AI Dynamic branching questions when eventType or witness statements change
  useEffect(() => {
    if (activeStep === 4 && (!incident.aiQuestions || incident.aiQuestions.length === 0)) {
      fetchDynamicQuestions();
    }
  }, [activeStep]);

  const fetchDynamicQuestions = async () => {
    setQaLoading(true);
    try {
      const response = await fetch("/api/investigate/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: incident.eventType,
          incidentTitle: incident.incidentTitle,
          currentDetails: `${incident.witnessStatements || ""}. Assets: ${incident.equipmentAssets}`,
          alreadyAsked: incident.aiQuestions?.map(q => q.question) || []
        })
      });
      if (response.ok) {
        const data = await response.json();
        onUpdateIncident({
          ...incident,
          aiQuestions: data.questions || []
        });
      }
    } catch (err) {
      console.error("Failed to fetch dynamic questions", err);
    } finally {
      setQaLoading(false);
    }
  };

  // Trigger the AI Investigation Core Engine!
  const triggerAICoreEngine = async () => {
    setAiAnalyzing(true);
    try {
      const response = await fetch("/api/investigate/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incident)
      });
      if (response.ok) {
        const analyzedIncident = await response.json();
        onUpdateIncident(analyzedIncident);
        // Automatically hop to step 9 (Methodologies) to visualize the amazing new findings!
        setActiveStep(9);
      } else {
        alert("Failed to analyze incident content. Backend error.");
      }
    } catch (err) {
      console.error("AI Analysis core failure", err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Form field change handler with Auto-Save
  const handleFieldChange = (field: keyof Incident, value: any) => {
    onUpdateIncident({
      ...incident,
      [field]: value
    });
  };

  // Timeline Event Management
  const handleAddTimelineEvent = () => {
    if (!newTimelineTime || !newTimelineDesc) return;
    const newEvent: TimelineEvent = {
      time: newTimelineTime,
      event: newTimelineDesc,
      category: newTimelineCat
    };
    const timeline = [...(incident.timeline || []), newEvent];
    onUpdateIncident({ ...incident, timeline });
    setNewTimelineTime("");
    setNewTimelineDesc("");
  };

  const handleDeleteTimelineEvent = (idx: number) => {
    const list = [...(incident.timeline || [])];
    list.splice(idx, 1);
    onUpdateIncident({ ...incident, timeline: list });
  };

  // CAPA Registry Management
  const handleAddCapa = () => {
    if (!newCapaAction || !newCapaOwner) return;
    const actionItem: CAPAAction = {
      id: `C-${Math.floor(100 + Math.random() * 900)}`,
      action: newCapaAction,
      type: newCapaType,
      ownerRole: newCapaOwner,
      priority: newCapaPriority,
      timeDays: newCapaDays,
      status: "Open"
    };
    const capa = [...(incident.capa || []), actionItem];
    onUpdateIncident({ ...incident, capa });
    setNewCapaAction("");
    setNewCapaOwner("");
  };

  const handleToggleCapaStatus = (idx: number) => {
    const capa = [...(incident.capa || [])];
    capa[idx].status = capa[idx].status === "Open" ? "Closed" : "Open";
    onUpdateIncident({ ...incident, capa });
  };

  const handleDeleteCapa = (idx: number) => {
    const capa = [...(incident.capa || [])];
    capa.splice(idx, 1);
    onUpdateIncident({ ...incident, capa });
  };

  // Handle Dynamic Question answering
  const handleAnswerQuestion = (qId: string, text: string) => {
    const updatedQuestions = (incident.aiQuestions || []).map(item => {
      if (item.id === qId) {
        return { ...item, answer: text };
      }
      return item;
    });
    onUpdateIncident({
      ...incident,
      aiQuestions: updatedQuestions
    });
  };

  // Approving & Signing
  const handleApproveCase = () => {
    if (!leadSignature || !directorSignature) {
      alert("Both Lead Investigator and Corporate HSE Director must enter digital signatures.");
      return;
    }
    onUpdateIncident({
      ...incident,
      status: "Approved"
    });
    alert("Investigation successfully APPROVED and locked in central HSE repository.");
    onBackToDashboard();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Wizard Control Panel */}
      <div className="glass-card rounded-2xl p-4 border border-cyber-border/40 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToDashboard}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono transition-all cursor-pointer"
          >
            ← Return to Dashboard
          </button>
          
          <div className="h-6 w-px bg-slate-800"></div>

          <div>
            <span className="text-[10px] font-mono text-slate-500 block uppercase">CURRENT INVESTIGATION CASE</span>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-display text-slate-100">{incident.incidentNumber}: {incident.incidentTitle}</h2>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${incident.status === 'Approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/25' : 'bg-brand-orange/10 text-brand-orange border border-brand-orange/25'}`}>
                {incident.status}
              </span>
            </div>
          </div>
        </div>

        {/* AI Quick Audit Meter */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[9px] font-mono text-slate-500 block uppercase">INVESTIGATION QUALITY</span>
            <span className="text-xs font-bold font-mono text-brand-orange">{incident.qualityAssurance?.qualityScore || 0} / 100 Index</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-950/40 border border-brand-orange/20 flex items-center justify-center font-bold text-sm text-brand-orange glow-orange">
            {incident.qualityAssurance?.qualityScore || "--"}
          </div>
        </div>
      </div>

      {/* Step Horizontal Slider Progress Bar */}
      <div className="glass-card rounded-2xl p-4 border border-cyber-border/40 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[900px] gap-2">
          {steps.map((st) => (
            <button
              key={st.num}
              onClick={() => setActiveStep(st.num)}
              className={`flex-1 flex flex-col items-center py-2 px-1.5 rounded-xl border transition-all cursor-pointer ${
                activeStep === st.num 
                  ? 'bg-brand-orange/15 border-brand-orange text-brand-orange font-bold scale-[1.02]' 
                  : (activeStep > st.num 
                      ? 'bg-emerald-950/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:text-slate-300')
              }`}
            >
              <span className="text-[9px] font-mono tracking-wider">STEP 0{st.num}</span>
              <span className="text-[10px] font-display mt-0.5 whitespace-nowrap truncate max-w-[100px]">{st.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Workspace Panel */}
      <div className="glass-card rounded-2xl p-6 border border-cyber-border/40">
        
        {/* STEP 1: Basic Incident Information */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-brand-cyan uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-4">
              <FileText className="w-4 h-4" />
              <span>Step 1: Baseline Incident Parameters (Auto-Saves)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Incident Number</label>
                <input 
                  type="text" 
                  value={incident.incidentNumber}
                  onChange={(e) => handleFieldChange("incidentNumber", e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Incident Title</label>
                <input 
                  type="text" 
                  value={incident.incidentTitle}
                  onChange={(e) => handleFieldChange("incidentTitle", e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Date of Event</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={incident.date}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Time of Event</label>
                <input 
                  type="text" 
                  value={incident.time}
                  onChange={(e) => handleFieldChange("time", e.target.value)}
                  placeholder="e.g. 10:45 AM"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Location Description</label>
                <input 
                  type="text" 
                  value={incident.location}
                  onChange={(e) => handleFieldChange("location", e.target.value)}
                  placeholder="e.g. MCC Room A, Jetty West"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Project Site</label>
                <input 
                  type="text" 
                  value={incident.project}
                  onChange={(e) => handleFieldChange("project", e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Business Unit</label>
                <input 
                  type="text" 
                  value={incident.businessUnit}
                  onChange={(e) => handleFieldChange("businessUnit", e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Department</label>
                <input 
                  type="text" 
                  value={incident.department}
                  onChange={(e) => handleFieldChange("department", e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Primary Contractor</label>
                <input 
                  type="text" 
                  value={incident.contractor}
                  onChange={(e) => handleFieldChange("contractor", e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Lead Investigator Name</label>
                <input 
                  type="text" 
                  value={incident.investigator}
                  onChange={(e) => handleFieldChange("investigator", e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Work Activity Ongoing</label>
                <input 
                  type="text" 
                  value={incident.workActivity}
                  onChange={(e) => handleFieldChange("workActivity", e.target.value)}
                  placeholder="e.g. cleaning and resistance ACB test"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Evidence Collection Log */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-brand-cyan uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-4">
              <Shield className="w-4 h-4" />
              <span>Step 2: Operations Evidence Cataloging</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Active Work Permits (PTW)</label>
                <input 
                  type="text" 
                  value={incident.permitNumber}
                  onChange={(e) => handleFieldChange("permitNumber", e.target.value)}
                  placeholder="e.g. PTW-EL-2026-8902"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Job Safety Analysis (JSA) Reference</label>
                <input 
                  type="text" 
                  value={incident.jsaNumber}
                  onChange={(e) => handleFieldChange("jsaNumber", e.target.value)}
                  placeholder="e.g. JSA-EL-0921"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Lockout Tagout (LOTO) Verification Isolation Status</label>
                <textarea 
                  value={incident.loto}
                  onChange={(e) => handleFieldChange("loto", e.target.value)}
                  rows={2}
                  placeholder="Describe electrical or pressure isolation verification. List lock numbers..."
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col md:col-span-2">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Active SIMOPS / Co-located activities</label>
                <input 
                  type="text" 
                  value={incident.simops}
                  onChange={(e) => handleFieldChange("simops", e.target.value)}
                  placeholder="List other work ongoing nearby..."
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Scene Examination & Weather */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-brand-cyan uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-4">
              <MapPin className="w-4 h-4" />
              <span>Step 3: Physical Scene and Environmental Parameters</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Physical Assets / Machinery</label>
                <input 
                  type="text" 
                  value={incident.equipmentAssets}
                  onChange={(e) => handleFieldChange("equipmentAssets", e.target.value)}
                  placeholder="e.g. Siemens ACB, Liebherr Crawler Crane"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Active Energy Sources</label>
                <input 
                  type="text" 
                  value={incident.energySource}
                  onChange={(e) => handleFieldChange("energySource", e.target.value)}
                  placeholder="e.g. 11kV Electrical, Hydraulic high-pressure"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Weather Condition</label>
                <input 
                  type="text" 
                  value={incident.weather}
                  onChange={(e) => handleFieldChange("weather", e.target.value)}
                  placeholder="e.g. Sunny, Gusts 24kts, Rain"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>

              <div className="flex flex-col md:col-span-3">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Environmental Conditions Detail (Noise, Lighting, Hazards)</label>
                <textarea 
                  value={incident.environmentalConditions}
                  onChange={(e) => handleFieldChange("environmentalConditions", e.target.value)}
                  rows={3}
                  placeholder="Detail noise indices (e.g. 82dB), restricted lighting gaps, slippery floors, high ambient temps..."
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan" 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Witness Interviews & Intelligent Question Engine */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-xs font-mono text-brand-cyan uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Users className="w-4 h-4" />
              <span>Step 4: Interview Logging & Dynamic Intelligent Question Engine</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Wing: Master Statement Input */}
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Primary Witness & Operator Statements</label>
                  <textarea 
                    value={incident.witnessStatements}
                    onChange={(e) => handleFieldChange("witnessStatements", e.target.value)}
                    rows={8}
                    placeholder="Provide detailed logs of statements taken from crew on site..."
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan leading-relaxed" 
                  />
                </div>
                
                <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  <span className="font-mono text-slate-300 font-bold uppercase block mb-1">Evidence Capture Tip</span>
                  Always capture statements from separate eye-witnesses and cross-reference timestamps with automatic DCS (Distributed Control System) or SCADA historical logs to eliminate recall bias.
                </div>
              </div>

              {/* Right Wing: Dynamic AI Inquiries Engine */}
              <div className="glass-card rounded-xl p-4 border border-slate-800/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-brand-cyan glow-cyan" />
                      Dynamic AI-Inquiry Branching
                    </span>
                    <button 
                      onClick={fetchDynamicQuestions}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded border border-slate-800 text-[9px] font-mono"
                    >
                      Regenerate
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 mb-3 font-sans leading-relaxed">
                    Based on the event category <span className="text-brand-cyan font-bold font-mono">[{incident.eventType}]</span>, the AI recommends drilling down into the following structural questions to pinpoint hidden systemic roots.
                  </p>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {qaLoading ? (
                      <div className="py-8 text-center text-xs font-mono text-slate-500 flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
                        <span>Querying expert branching schema...</span>
                      </div>
                    ) : incident.aiQuestions && incident.aiQuestions.length > 0 ? (
                      incident.aiQuestions.map((item) => (
                        <div key={item.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[11px] font-bold text-slate-300 leading-tight">{item.question}</span>
                            <span className="text-[8px] font-mono bg-cyan-950 text-brand-cyan border border-brand-cyan/20 px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">{item.category}</span>
                          </div>
                          
                          <input
                            type="text"
                            value={item.answer || ""}
                            onChange={(e) => handleAnswerQuestion(item.id, e.target.value)}
                            placeholder={`Evidence target: ${item.evidenceTarget}`}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-brand-cyan"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic py-6 text-center">No questions loaded. Try clicking Regenerate above.</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/60 flex justify-between text-[9px] font-mono text-slate-500 uppercase">
                  <span>Questions branch dynamically</span>
                  <span>ISO 45001 Grounded</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* STEP 5: Timeline Reconstruction */}
        {activeStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-xs font-mono text-brand-cyan uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Clock className="w-4 h-4" />
              <span>Step 5: Incident Event Sequence Timeline Editor</span>
            </h3>

            {/* Event Input Builder bar */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Time Marker</label>
                <input
                  type="text"
                  value={newTimelineTime}
                  onChange={(e) => setNewTimelineTime(e.target.value)}
                  placeholder="e.g. 10:43 AM"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Event Action Narrative</label>
                <input
                  type="text"
                  value={newTimelineDesc}
                  onChange={(e) => setNewTimelineDesc(e.target.value)}
                  placeholder="e.g. Technician entered cabinet with uninsulated multi-meter..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Category Bracket</label>
                <select
                  value={newTimelineCat}
                  onChange={(e) => setNewTimelineCat(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Pre-incident">Pre-incident</option>
                  <option value="Incident">Incident Event</option>
                  <option value="Emergency Response">Emergency Response</option>
                  <option value="Recovery">Recovery Action</option>
                </select>
              </div>

              <button
                onClick={handleAddTimelineEvent}
                className="px-4 py-1.5 bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert Block</span>
              </button>
            </div>

            {/* Timeline Tree visualization */}
            <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-4 py-2">
              {incident.timeline && incident.timeline.length > 0 ? (
                incident.timeline.map((item, idx) => (
                  <div key={idx} className="relative group">
                    {/* Node Dot icon */}
                    <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-slate-950 border-2 border-brand-cyan flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></div>
                    </div>
                    
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-brand-cyan">{item.time}</span>
                          <span className={`text-[9px] px-1.5 rounded font-mono uppercase tracking-tight ${
                            item.category === 'Incident' ? 'bg-red-950 text-brand-red border border-brand-red/30' :
                            item.category === 'Emergency Response' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                            'bg-slate-900 text-slate-400'
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {item.event}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteTimelineEvent(idx)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-brand-red p-1 cursor-pointer transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic py-4">No events registered yet on the timeline. Use the editor bar above to reconstruct sequential coordinates.</div>
              )}
            </div>

          </div>
        )}

        {/* STEP 6 & 7: Immediate & Underlying causes */}
        {(activeStep === 6 || activeStep === 7) && (
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-brand-cyan uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-4">
              <AlertOctagon className="w-4 h-4 text-brand-orange" />
              <span>Step {activeStep}: {activeStep === 6 ? "Direct / Immediate Causes" : "Systemic / Underlying Failures"}</span>
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">
                  {activeStep === 6 ? "Unsafe Acts & Unsafe Conditions" : "Procedural, Technical & Behavioral Deficiencies"}
                </label>
                <textarea 
                  value={activeStep === 6 ? incident.rootCauses?.immediateCause : incident.rootCauses?.underlyingCause}
                  onChange={(e) => {
                    const rc = { ...(incident.rootCauses || {}), [activeStep === 6 ? "immediateCause" : "underlyingCause"]: e.target.value };
                    onUpdateIncident({ ...incident, rootCauses: rc as any });
                  }}
                  rows={4}
                  placeholder={activeStep === 6 
                    ? "Identify immediate acts (e.g. inserting probe without testing) or conditions (e.g. live energized terminals exposed)."
                    : "Identify systemic gaps (e.g. outdated schematic layout drawing, lack of physical lockout inspections)."
                  }
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan leading-relaxed" 
                />
              </div>

              <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-850">
                <h4 className="text-[11px] font-mono text-slate-300 font-bold uppercase mb-1">
                  💡 Multi-Methodology Alignment
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The values compiled here flow directly into the Ishikawa fishbone categories and Swiss Cheese model. You can manually tweak them here, or use the **AI Core Analysis Module** to generate optimal safety cause mappings based on your entered description.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: AI ROOT CAUSE ANALYSIS CORE GENERATOR */}
        {activeStep === 8 && (
          <div className="space-y-6 text-center max-w-[650px] mx-auto py-12">
            <div className="w-16 h-16 rounded-full bg-cyan-950/40 border-2 border-brand-cyan flex items-center justify-center mx-auto glow-cyan mb-4">
              <Sparkles className="w-8 h-8 text-brand-cyan animate-pulse" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-display text-slate-100">AI Deep Root Cause Synthesizer</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Our AI model leverages advanced Gemini industrial safety reasoning templates (TapRooT & ICAM aligned). It will evaluate your registration parameters, weather, witness statements, and Q&A to construct 5-Whys, Fishbone, BowTie, and Swiss Cheese parameters simultaneously.
              </p>
            </div>

            {aiAnalyzing ? (
              <div className="p-6 bg-slate-950/80 border border-slate-850 rounded-2xl space-y-4">
                <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <p className="text-xs font-mono text-brand-cyan uppercase">Executing AI Engine...</p>
                  <p className="text-[11px] text-slate-500 font-sans">Evaluating Swiss Cheese alignments, fatigue indexes, and corrective action matrix...</p>
                </div>
              </div>
            ) : (
              <button
                onClick={triggerAICoreEngine}
                id="btn-trigger-ai-analysis"
                className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-900 font-bold rounded-xl text-xs tracking-wider flex items-center justify-center gap-2 glow-cyan cursor-pointer transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-4.5 h-4.5 animate-spin" />
                <span>⚡ EXECUTE AI ROOT CAUSE SYNTHESIS</span>
              </button>
            )}

            {incident.rootCauses?.rootCause && (
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl text-left text-xs space-y-2 mt-4">
                <span className="text-[10px] font-mono text-slate-500 block">CURRENT ANALYSIS RESULTS AVAILABLE</span>
                <p className="text-slate-200 font-bold font-display">{incident.rootCauses.rootCause}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">Confidence level calculated at <span className="text-brand-cyan font-bold font-mono">{incident.rootCauses.confidenceScore}%</span>. Click next to inspect visual methodologies.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 9: METHODOLOGIES VISUAL PLAYGROUND */}
        {activeStep === 9 && (
          <div className="space-y-6">
            
            {/* Visual methodology tabs inside step 9 */}
            <div className="space-y-6">
              
              {/* 5 Whys Visual display */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-brand-cyan glow-cyan" />
                    5 Whys Successive Decomposition
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {(incident.fiveWhys || [
                    "Technician received electrical flashover burns while contact testing ACB panel.",
                    "MCC panel was energized at 11kV when probe was inserted.",
                    "LOTO isolation tags were applied to secondary breaker instead of active feed.",
                    "Outdated schematic layout drawings resulted in nomenclative confusion.",
                    "Failure to execute and audit physical isolation checks due to schedule pressure."
                  ]).map((why, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 border border-slate-800 relative flex flex-col justify-between">
                      <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-slate-600">Y-0{i+1}</div>
                      <div>
                        <span className="text-[9px] font-mono text-brand-cyan uppercase tracking-wider block">WHY LEVEL 0{i+1}</span>
                        <p className="text-[11px] text-slate-200 font-display font-medium mt-1.5 leading-relaxed">
                          {why}
                        </p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-900 flex justify-end text-[9px] text-slate-500">
                        {i < 4 ? "Leads to next →" : "Root condition ⚡"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphical Fishbone component */}
              <div className="pt-4">
                <FishboneView 
                  fishboneData={incident.fishbone || { people: [], equipment: [], materials: [], methods: [], environment: [], management: [] }}
                  onUpdateFishbone={(updated) => handleFieldChange("fishbone", updated)}
                />
              </div>

              {/* Graphical Swiss Cheese component */}
              <div className="pt-4">
                <SwissCheeseView 
                  layers={incident.swissCheese || [
                    { layerName: "Engineering Interlock", holeDescription: "Microswitch bypassed", status: "breached" },
                    { layerName: "Operations Procedure", holeDescription: "Verbal checkout allowed", status: "breached" },
                    { layerName: "Supervisory Audits", holeDescription: "Skip verification checks", status: "breached" },
                    { layerName: "Personal PPE armor", holeDescription: "Incorrect Cal/cm2 arc suit rating", status: "breached" }
                  ]}
                  onToggleLayerStatus={(idx) => {
                    const layers = [...(incident.swissCheese || [])];
                    if (layers[idx]) {
                      layers[idx].status = layers[idx].status === 'breached' ? 'intact' : 'breached';
                      onUpdateIncident({ ...incident, swissCheese: layers });
                    }
                  }}
                />
              </div>

              {/* BowTie Visual component */}
              <div className="pt-4">
                <BowTieView 
                  threats={incident.energySource ? [incident.energySource, "Environmental degradation"] : ["High energy source", "UV degradation"]}
                  topEvent={incident.incidentTitle}
                  consequences={["Severe asset breakdown", "Regulatory penalty fines", "Loss of contractor work certificate"]}
                  barrierAnalysis={incident.barrierAnalysis || { preventative: [], mitigation: [] }}
                  onToggleBarrier={(type, idx) => {
                    const ba = { ...(incident.barrierAnalysis || { preventative: [], mitigation: [] }) };
                    const bar = ba[type][idx];
                    if (bar) {
                      bar.status = bar.status === 'active' ? 'failed' : (bar.status === 'failed' ? 'weak' : 'active');
                      onUpdateIncident({ ...incident, barrierAnalysis: ba });
                    }
                  }}
                />
              </div>

            </div>

          </div>
        )}

        {/* STEP 10: CAPA REGISTRY ACTION LOGGER */}
        {activeStep === 10 && (
          <div className="space-y-6">
            <h3 className="text-xs font-mono text-brand-cyan uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <HardHat className="w-4 h-4 text-brand-orange" />
              <span>Step 10: Corrective and Preventive Action (CAPA) Registry</span>
            </h3>

            {/* CAPA Form Builder */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">CAPA Action Task Directive</label>
                <input
                  type="text"
                  value={newCapaAction}
                  onChange={(e) => setNewCapaAction(e.target.value)}
                  placeholder="e.g. Conduct tactile-audit of all 11kV ACB cabinet weather seals..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Action Type</label>
                <select
                  value={newCapaType}
                  onChange={(e) => setNewCapaType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Immediate">Immediate Control</option>
                  <option value="Corrective">Corrective Action</option>
                  <option value="Preventive">Preventive Standard</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Owner Job Role</label>
                <input
                  type="text"
                  value={newCapaOwner}
                  onChange={(e) => setNewCapaOwner(e.target.value)}
                  placeholder="e.g. Maintenance Manager"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Priority</label>
                <select
                  value={newCapaPriority}
                  onChange={(e) => setNewCapaPriority(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Due Timeframe (Days)</label>
                <input
                  type="number"
                  value={newCapaDays}
                  onChange={(e) => setNewCapaDays(parseInt(e.target.value) || 14)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  onClick={handleAddCapa}
                  className="w-full py-1.5 bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log CAPA Directive</span>
                </button>
              </div>
            </div>

            {/* CAPA Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-400 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-500 text-left">
                    <th className="py-2.5 px-2">Task ID</th>
                    <th className="py-2.5 px-2">Action Description</th>
                    <th className="py-2.5 px-2">Classification</th>
                    <th className="py-2.5 px-2">Role Owner</th>
                    <th className="py-2.5 px-2">Priority</th>
                    <th className="py-2.5 px-2 text-center">Due Time</th>
                    <th className="py-2.5 px-2 text-center">Status Toggle</th>
                    <th className="py-2.5 px-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incident.capa && incident.capa.length > 0 ? (
                    incident.capa.map((act, i) => (
                      <tr key={act.id} className="border-b border-slate-900 hover:bg-slate-950/20">
                        <td className="py-3 px-2 font-mono text-brand-cyan font-bold">{act.id}</td>
                        <td className="py-3 px-2 font-semibold text-slate-200">{act.action}</td>
                        <td className="py-3 px-2">
                          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-300 font-mono">
                            {act.type}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-300">{act.ownerRole}</td>
                        <td className="py-3 px-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            act.priority === 'High' ? 'bg-red-950 text-brand-red border border-brand-red/20' :
                            act.priority === 'Medium' ? 'bg-amber-950 text-brand-orange border border-brand-orange/20' :
                            'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {act.priority}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-400">{act.timeDays} days</td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleToggleCapaStatus(i)}
                            className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] cursor-pointer ${
                              act.status === 'Open' ? 'bg-amber-950 text-brand-orange' : 'bg-emerald-950 text-brand-green'
                            }`}
                          >
                            {act.status}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button 
                            onClick={() => handleDeleteCapa(i)}
                            className="text-slate-500 hover:text-brand-red p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500 italic">No CAPA action directives registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* STEP 11: SAFETY BULLETIN / LESSONS LEARNED */}
        {activeStep === 11 && (
          <div className="space-y-4">
            <LessonsLearnedBulletin incident={incident} />
          </div>
        )}

        {/* STEP 12: AI QUALITY ASSURANCE AUDIT */}
        {activeStep === 12 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-mono text-brand-cyan uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-cyan glow-cyan" />
                <span>Step 12: AI Investigation Quality Assurance Audit</span>
              </h3>
              <span className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-1 rounded font-mono text-slate-500">
                Audited against HSE standards
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Index Meter */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800/80 flex flex-col items-center justify-center text-center">
                <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-slate-950 border-4 border-brand-cyan/25 glow-cyan mb-4">
                  <span className="text-4xl font-bold font-display text-brand-cyan">{incident.qualityAssurance?.qualityScore || 85}</span>
                  <div className="absolute inset-2 rounded-full border border-dashed border-brand-cyan/30 animate-spin"></div>
                </div>
                <h4 className="text-xs font-mono text-slate-300 uppercase font-bold">Investigation Quality Index</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-1 leading-snug">
                  Evaluated based on witness completeness, structural causes mapping, and CAPA priority coverage.
                </p>
              </div>

              {/* Contradictions & Gaps */}
              <div className="md:col-span-2 space-y-4">
                
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 space-y-2">
                  <span className="text-[9px] font-mono text-brand-red uppercase font-bold block flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5 text-brand-red" />
                    POTENTIAL BIASES & CONTRADICTIONS FLAGGED BY AI
                  </span>
                  
                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-400">
                    {incident.qualityAssurance?.contradictions && incident.qualityAssurance.contradictions.length > 0 ? (
                      incident.qualityAssurance.contradictions.map((item, idx) => (
                        <li key={idx} className="leading-relaxed"><strong className="text-slate-300">Conflict:</strong> {item}</li>
                      ))
                    ) : (
                      <li className="italic">Zero narrative contradictions flagged by the validation engine. Evidence matches timeline coordinates.</li>
                    )}
                    <li className="leading-relaxed"><strong className="text-slate-300">Bias Risk:</strong> {incident.qualityAssurance?.biasCheck || "High trust placed on contractor supervisor logs; suggested audit of automatic physical SCADA sequence file stamps."}</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-900 space-y-2">
                  <span className="text-[9px] font-mono text-brand-orange uppercase font-bold block flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-brand-orange" />
                    MISSING EVIDENCE & GAPS IDENTIFIED
                  </span>

                  <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-400">
                    {incident.qualityAssurance?.missingEvidence && incident.qualityAssurance.missingEvidence.length > 0 ? (
                      incident.qualityAssurance.missingEvidence.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">{item}</li>
                      ))
                    ) : (
                      <>
                        <li className="leading-relaxed">Contractor training records for electrical safety compliance and high voltage ACB operation.</li>
                        <li className="leading-relaxed">Physical calibration certificates of the multi-meter used by the team.</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="p-3 bg-cyan-950/20 border border-brand-cyan/20 rounded-xl text-xs text-slate-300 leading-relaxed">
                  <strong className="text-brand-cyan uppercase font-mono block mb-1">AI QA RECOMMENDATION:</strong>
                  {incident.qualityAssurance?.recommendation || "Prior to submitting reports for Aramco/ADNOC directorate approval, complete the physical nomenclature audit log and double-verify operator fatigue indicators."}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* STEP 13: MANAGEMENT APPROVAL SIGN-OFF */}
        {activeStep === 13 && (
          <div className="space-y-6 max-w-[550px] mx-auto py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-950/40 border border-brand-green flex items-center justify-center mx-auto glow-green mb-4">
              <UserCheck className="w-6 h-6 text-brand-green animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-bold font-display text-slate-100">Board Approval Sign-Off Matrix</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                By signing off below, the Board confirms that root cause analysis was completed using recognized methodologies, and that all immediate and long-term corrective CAPA items have been logged in the HSE system.
              </p>
            </div>

            <div className="space-y-4 text-left pt-6">
              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Lead Incident Investigator Signature (Typed)</label>
                <input 
                  type="text" 
                  value={leadSignature}
                  onChange={(e) => setLeadSignature(e.target.value)}
                  placeholder="e.g. Marcus Vance, PI-CO"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-green" 
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Corporate HSE Director Signature (Typed)</label>
                <input 
                  type="text" 
                  value={directorSignature}
                  onChange={(e) => setDirectorSignature(e.target.value)}
                  placeholder="e.g. Sami Al-Husseini, HSE-DIR"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-green" 
                />
              </div>

              <button
                onClick={handleApproveCase}
                id="btn-signoff-approval"
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-900 font-bold rounded-xl text-xs tracking-wider flex items-center justify-center gap-2 glow-green cursor-pointer transition-all active:scale-[0.98]"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>🔒 LOCK & SECURE EXECUTIVE SIGN-OFF</span>
              </button>
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="border-t border-slate-800/80 pt-4 mt-6 flex justify-between items-center no-print">
          <button
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>PREV STEP</span>
          </button>

          <span className="text-[10px] font-mono text-slate-500">
            STEP {activeStep} OF {steps.length}
          </span>

          <button
            onClick={() => setActiveStep(prev => Math.min(steps.length, prev + 1))}
            disabled={activeStep === steps.length}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            <span>NEXT STEP</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
