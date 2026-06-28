import React, { useState, useMemo } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  PieChart, Pie
} from "recharts";
import { 
  Shield, AlertTriangle, AlertOctagon, Flame, Activity, 
  Clock, CheckCircle, HelpCircle, HardHat, Ship, Filter,
  Layers, Hammer, RefreshCw, Sparkles, TrendingUp
} from "lucide-react";
import { Incident } from "../types";

interface DashboardProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  onAddNewIncident: () => void;
  selectedDept: string;
  setSelectedDept: (dept: string) => void;
  selectedClassification: string;
  setSelectedClassification: (cls: string) => void;
}

export default function Dashboard({ 
  incidents, 
  onSelectIncident, 
  onAddNewIncident,
  selectedDept,
  setSelectedDept,
  selectedClassification,
  setSelectedClassification
}: DashboardProps) {
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>("all");
  const [selectedRiskCell, setSelectedRiskCell] = useState<{l: number, s: number} | null>(null);

  // Available unique values for filters
  const departments = useMemo(() => {
    return ["all", ...Array.from(new Set(incidents.map(i => i.department).filter(Boolean)))];
  }, [incidents]);

  const classifications = useMemo(() => {
    return ["all", ...Array.from(new Set(incidents.map(i => i.incidentClassification).filter(Boolean)))];
  }, [incidents]);

  // Filtering Logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      const matchDept = selectedDept === "all" || inc.department === selectedDept;
      const matchClass = selectedClassification === "all" || inc.incidentClassification === selectedClassification;
      const matchSeverity = selectedSeverityFilter === "all" || inc.severity === selectedSeverityFilter;
      
      let matchRiskCell = true;
      if (selectedRiskCell) {
        // Likelihood maps to s (severity rating) and s maps to l (likelihood or severity)
        const sev = parseInt(inc.severity) || 1;
        const potSev = parseInt(inc.potentialSeverity) || 1;
        matchRiskCell = (sev === selectedRiskCell.s && potSev === selectedRiskCell.l);
      }

      return matchDept && matchClass && matchSeverity && matchRiskCell;
    });
  }, [incidents, selectedDept, selectedClassification, selectedSeverityFilter, selectedRiskCell]);

  // Executive KPI calculations
  const kpis = useMemo(() => {
    const total = filteredIncidents.length;
    const lti = filteredIncidents.filter(i => i.incidentClassification?.includes("LTI") || i.incidentClassification?.includes("Lost Time")).length;
    const nearMiss = filteredIncidents.filter(i => i.incidentClassification?.toLowerCase().includes("near miss")).length;
    const propertyDamage = filteredIncidents.filter(i => i.incidentClassification?.toLowerCase().includes("property")).length;
    const environmental = filteredIncidents.filter(i => i.incidentClassification?.toLowerCase().includes("environmental")).length;
    
    // TRIR and LTI rates calculation (simulated based on typical 1,000,000 man-hours formula)
    // Formula: (Number of Recordable Injuries * 200,000) / Man-hours
    const recordableInjuries = lti + filteredIncidents.filter(i => i.incidentClassification?.toLowerCase().includes("medical")).length;
    const manHours = 1200000; // Simulated constant
    const trir = ((recordableInjuries * 200000) / manHours).toFixed(2);
    const ltiRate = ((lti * 200000) / manHours).toFixed(2);

    // CAPA stats
    let totalCapas = 0;
    let openCapas = 0;
    let closedCapas = 0;
    filteredIncidents.forEach(inc => {
      if (inc.capa) {
        totalCapas += inc.capa.length;
        openCapas += inc.capa.filter((c: any) => c.status === "Open").length;
        closedCapas += inc.capa.filter((c: any) => c.status === "Closed").length;
      }
    });

    return {
      total,
      lti,
      nearMiss,
      propertyDamage,
      environmental,
      trir,
      ltiRate,
      totalCapas,
      openCapas,
      closedCapas
    };
  }, [filteredIncidents]);

  // Monthly incident trend chart data
  const trendData = [
    { name: "Jan", Incidents: 4, LTI: 1, NearMiss: 3 },
    { name: "Feb", Incidents: 2, LTI: 0, NearMiss: 2 },
    { name: "Mar", Incidents: 5, LTI: 1, NearMiss: 4 },
    { name: "Apr", Incidents: 3, LTI: 0, NearMiss: 3 },
    { name: "May", Incidents: 6, LTI: 2, NearMiss: 3 },
    { name: "Jun", Incidents: incidents.length, LTI: kpis.lti, NearMiss: kpis.nearMiss }
  ];

  // Category chart data
  const categoryData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredIncidents.forEach(i => {
      const cat = i.eventType || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredIncidents]);

  // Contractor performance chart data
  const contractorData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredIncidents.forEach(i => {
      const cont = i.contractor || "Direct Employee";
      counts[cont] = (counts[cont] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredIncidents]);

  // 5x5 Risk Matrix Matrix Color Map
  // row (Likelihood 1-5), col (Severity 1-5)
  // Low = Green, Medium = Yellow, High = Orange, Extreme = Red, Critical = Dark Red
  const getRiskColor = (likelihood: number, severity: number) => {
    const product = likelihood * severity;
    if (product >= 15) return "bg-red-950/85 hover:bg-red-900 border-red-500 text-red-400"; // Critical
    if (product >= 10) return "bg-rose-900/60 hover:bg-rose-800 border-rose-500 text-rose-300"; // Extreme
    if (product >= 6) return "bg-amber-600/40 hover:bg-amber-500 border-amber-500 text-amber-300"; // High
    if (product >= 3) return "bg-yellow-500/20 hover:bg-yellow-500/35 border-yellow-500/50 text-yellow-300"; // Medium
    return "bg-emerald-950/30 hover:bg-emerald-900/40 border-emerald-500/30 text-emerald-400"; // Low
  };

  const getRiskLabel = (likelihood: number, severity: number) => {
    const product = likelihood * severity;
    if (product >= 15) return "Crit";
    if (product >= 10) return "Extr";
    if (product >= 6) return "High";
    if (product >= 3) return "Med";
    return "Low";
  };

  // Find incidents placed on matrix coordinates
  const getMatrixIncidentsCount = (likelihood: number, severity: number) => {
    return incidents.filter(i => {
      const s = parseInt(i.severity) || 1;
      const l = parseInt(i.potentialSeverity) || 1;
      return s === severity && l === likelihood;
    }).length;
  };

  const handleRiskCellClick = (likelihood: number, severity: number) => {
    if (selectedRiskCell && selectedRiskCell.l === likelihood && selectedRiskCell.s === severity) {
      setSelectedRiskCell(null);
    } else {
      setSelectedRiskCell({ l: likelihood, s: severity });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Filters Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-cyber-border/40 animate-border-glow">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 border-r border-slate-700/60 pr-3 mr-1">
            <Filter className="w-3.5 h-3.5 text-brand-orange" />
            <span>METRIC FILTERS</span>
          </div>

          {/* Department Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-mono text-slate-500 mb-1">BUSINESS UNIT / DEPT</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-orange transition-all"
            >
              <option value="all">All Departments ({incidents.length})</option>
              {departments.filter(d => d !== "all").map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Classification Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-mono text-slate-500 mb-1">CLASSIFICATION</label>
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-orange transition-all"
            >
              <option value="all">All Classifications</option>
              {classifications.filter(c => c !== "all").map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Severity level Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-mono text-slate-500 mb-1">SEVERITY INDEX</label>
            <select
              value={selectedSeverityFilter}
              onChange={(e) => setSelectedSeverityFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-orange transition-all"
            >
              <option value="all">All Severities</option>
              <option value="1">1 - Insignificant</option>
              <option value="2">2 - Minor</option>
              <option value="3">3 - Moderate</option>
              <option value="4">4 - Major</option>
              <option value="5">5 - Catastrophic</option>
            </select>
          </div>

          {selectedRiskCell && (
            <button 
              onClick={() => setSelectedRiskCell(null)}
              className="self-end px-3 py-1.5 bg-brand-orange/10 hover:bg-brand-orange/20 border border-brand-orange/30 text-brand-orange rounded-lg text-xs font-mono transition-all flex items-center gap-1"
            >
              Clear Risk Coordinate [L:{selectedRiskCell.l}, S:{selectedRiskCell.s}]
            </button>
          )}
        </div>

        <button
          onClick={onAddNewIncident}
          id="btn-register-incident"
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer transition-all active:scale-95"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>REGISTER NEW INCIDENT</span>
        </button>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        
        <div id="kpi-total" className="glass-card rounded-2xl p-4 border border-cyber-border/40 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-12 h-12 text-slate-200" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">TOTAL ACTIVE CASES</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-brand-orange glow-orange">{kpis.total}</span>
            <span className="text-[10px] text-slate-500 font-mono">INCIDENTS</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono mt-1">Filtered from database</span>
        </div>

        <div id="kpi-trir" className="glass-card rounded-2xl p-4 border border-cyber-border/40 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame className="w-12 h-12 text-brand-red" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">ESTIMATED TRIR</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-brand-red glow-red">{kpis.trir}</span>
            <span className="text-[10px] text-slate-500 font-mono">per 1M Hrs</span>
          </div>
          <span className="text-[9px] text-brand-red/75 font-mono mt-1">Recordable Injury Freq.</span>
        </div>

        <div id="kpi-lti" className="glass-card rounded-2xl p-4 border border-cyber-border/40 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertOctagon className="w-12 h-12 text-brand-orange" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">LTI CASES</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-brand-orange">{kpis.lti}</span>
            <span className="text-[10px] text-slate-500 font-mono">Lost Time</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono mt-1">LTI Rate: {kpis.ltiRate}</span>
        </div>

        <div id="kpi-nearmiss" className="glass-card rounded-2xl p-4 border border-cyber-border/40 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield className="w-12 h-12 text-brand-yellow" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">NEAR MISSES</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-brand-yellow glow-yellow">{kpis.nearMiss}</span>
            <span className="text-[10px] text-slate-500 font-mono">Averted Risks</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-mono mt-1">High preventative index</span>
        </div>

        <div id="kpi-capa" className="glass-card rounded-2xl p-4 border border-cyber-border/40 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle className="w-12 h-12 text-brand-green" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">OPEN CAPA ACTIONS</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-brand-green">{kpis.openCapas}</span>
            <span className="text-[10px] text-slate-500 font-mono">/ {kpis.totalCapas}</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono mt-1">Pending verification</span>
        </div>

        <div id="kpi-severity" className="glass-card rounded-2xl p-4 border border-cyber-border/40 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="w-12 h-12 text-orange-400" />
          </div>
          <span className="text-[10px] font-mono text-slate-400 tracking-wider">ENV / PROPERTY DAMAGE</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-orange-400">{kpis.environmental + kpis.propertyDamage}</span>
            <span className="text-[10px] text-slate-500 font-mono">Asset Cases</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono mt-1">Marine & Plant impact</span>
        </div>

      </div>

      {/* Main Charts & Risk Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Risk Matrix (5x5) - Takes 5 cols */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-5 border border-cyber-border/40 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-yellow" />
              <h2 className="text-sm font-semibold tracking-wider font-display text-slate-200">INTERACTIVE 5X5 RISK MATRIX</h2>
            </div>
            <span className="text-[9px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">Likelihood vs Severity</span>
          </div>

          <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
            Click coordinates to filter active incidents. Circles <span className="inline-block w-4 h-4 rounded-full bg-brand-orange text-white text-center text-[10px] font-bold leading-4">N</span> represent incidents positioned by Severity & Likelihood rating.
          </p>

          <div className="flex-1 flex flex-col justify-center items-center">
            {/* 5x5 Matrix Layout */}
            <div className="w-full max-w-[400px]">
              {/* Columns Header (Severity) */}
              <div className="text-center text-[10px] font-mono text-slate-400 mb-2 uppercase tracking-widest font-bold">Severity (Consequence Index)</div>
              
              <div className="flex">
                {/* Y-Axis Label (Likelihood) rotated */}
                <div className="w-8 flex items-center justify-center">
                  <div className="-rotate-90 text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold whitespace-nowrap">
                    Potential (Likelihood)
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-5 gap-1">
                  {/* Grid Cells: row decreases from 5 to 1, col increases from 1 to 5 */}
                  {[5, 4, 3, 2, 1].map((row) => (
                    <React.Fragment key={row}>
                      {[1, 2, 3, 4, 5].map((col) => {
                        const count = getMatrixIncidentsCount(row, col);
                        const isSelected = selectedRiskCell?.l === row && selectedRiskCell?.s === col;
                        return (
                          <div
                            key={`${row}-${col}`}
                            onClick={() => handleRiskCellClick(row, col)}
                            className={`aspect-square rounded-lg border flex flex-col items-center justify-between p-1.5 cursor-pointer relative transition-all ${getRiskColor(row, col)} ${isSelected ? 'ring-2 ring-brand-orange scale-[1.03] shadow-md z-10' : ''}`}
                          >
                            <span className="text-[8px] font-mono font-semibold self-start tracking-tighter uppercase">{getRiskLabel(row, col)}</span>
                            
                            {/* Incident bubbles marker */}
                            {count > 0 ? (
                              <span className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-brand-orange text-white text-center text-[11px] font-bold flex items-center justify-center glow-orange border border-white/20">
                                {count}
                              </span>
                            ) : (
                              <span className="text-[8px] opacity-25 font-mono">{row}x{col}</span>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* X-Axis labels */}
              <div className="flex pl-8 mt-1 text-[9px] font-mono text-slate-400 text-center">
                <div className="flex-1">1: Insig</div>
                <div className="flex-1">2: Minor</div>
                <div className="flex-1">3: Mod</div>
                <div className="flex-1">4: Major</div>
                <div className="flex-1">5: Cat</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-800/60 flex justify-between text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-950 border border-red-500 inline-block"></span> Critical Risk</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-600/40 border border-amber-500 inline-block"></span> High</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-950/30 border border-emerald-500/30 inline-block"></span> Low Risk</span>
          </div>
        </div>

        {/* Monthly Trend Area Chart - Takes 7 cols */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-5 border border-cyber-border/40 flex flex-col h-[340px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-orange" />
              <h2 className="text-sm font-semibold tracking-wider font-display text-slate-200">HISTORICAL HSE TREND TIMELINE (2026)</h2>
            </div>
            <span className="text-xs font-mono text-brand-orange">Active Incidents vs Near Misses</span>
          </div>

          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNearMiss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)", borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: "10px", color: "#f1f5f9" }}
                  itemStyle={{ color: "#f1f5f9", fontSize: "11px" }}
                />
                <Legend iconSize={10} fontSize={11} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="Incidents" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorIncidents)" />
                <Area type="monotone" dataKey="NearMiss" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorNearMiss)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Secondary Chart Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Incident by Category (Event Type) Bar Chart */}
        <div className="glass-card rounded-2xl p-5 border border-cyber-border/40 h-[300px] flex flex-col">
          <h2 className="text-sm font-semibold tracking-wider font-display text-slate-200 mb-4 uppercase flex items-center gap-2">
            <Flame className="w-4 h-4 text-brand-red" />
            Incident Distribution by Industry Hazard
          </h2>
          <div className="flex-1 min-h-0">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">No data fits active filters.</div>
             ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)", borderColor: "rgba(255, 255, 255, 0.1)", borderRadius: "10px" }}
                    labelStyle={{ color: "#94a3b8", fontSize: "10px", fontFamily: "monospace" }}
                  />
                  <Bar dataKey="value" name="Case Count" fill="#f97316" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#f97316" : "#fbbf24"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Contractor Risk Comparison */}
        <div className="glass-card rounded-2xl p-5 border border-cyber-border/40 h-[300px] flex flex-col">
          <h2 className="text-sm font-semibold tracking-wider font-display text-slate-200 mb-4 uppercase flex items-center gap-2">
            <HardHat className="w-4 h-4 text-orange-400" />
            Contractor Group Risk Exposure Index
          </h2>
          <div className="flex-1 min-h-0">
            {contractorData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">No data fits active filters.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contractorData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={100} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(8px)", borderColor: "rgba(255, 255, 255, 0.1)" }} />
                  <Bar dataKey="value" name="Incidents" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Active Investigations Register List */}
      <div className="glass-card rounded-2xl p-5 border border-cyber-border/40">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wider font-display text-slate-200 uppercase">
              Incident Case Investigations Ledger ({filteredIncidents.length})
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Select a case block to launch the 13-Step AI Investigation Board</p>
          </div>
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 bg-slate-900/60 border border-slate-850 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-brand-orange" />
            <span>UTC TIMELINE SYNCHRONIZED</span>
          </span>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-mono">
            No incidents found matching current filter selections or matrix coordinate.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIncidents.map((inc) => (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className="glass-card-interactive rounded-xl p-4 border border-slate-800 flex flex-col justify-between cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-850 border border-slate-700/60 text-slate-300 px-2 py-0.5 rounded font-mono font-bold tracking-tight">{inc.incidentNumber}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-mono font-bold ${
                      inc.riskRating === 'High' ? 'bg-red-950/80 text-red-400 border border-red-500/30' :
                      inc.riskRating === 'Medium' ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {inc.riskRating} Risk
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{inc.date}</span>
                </div>

                <h3 className="text-xs font-bold font-display text-slate-100 line-clamp-1 mb-2 hover:text-brand-orange transition-colors">{inc.incidentTitle}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                  {inc.witnessStatements || "No statement entered yet. Open case file to begin."}
                </p>

                <div className="pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-1">
                    <HardHat className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[120px]">{inc.contractor}</span>
                  </div>
                  <div>
                    <span className="bg-slate-900 px-2 py-0.5 rounded text-[9px] text-slate-400 border border-slate-800">{inc.eventType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
