import React, { useRef } from "react";
import { Printer, ShieldCheck, FileText, Share2, AlertOctagon, RefreshCw } from "lucide-react";
import { Incident } from "../types";

interface LessonsLearnedBulletinProps {
  incident: Incident;
  bulletinMarkdown?: string;
  onRegenerateBulletin?: () => void;
  isLoading?: boolean;
}

export default function LessonsLearnedBulletin({ 
  incident, 
  bulletinMarkdown, 
  onRegenerateBulletin,
  isLoading 
}: LessonsLearnedBulletinProps) {
  const printableRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Alert Header Control Bar */}
      <div className="glass-card rounded-2xl p-4 border border-cyber-border/40 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-cyan" />
          <span className="text-xs font-mono text-slate-300">CORPORATE SAFETY ALERT SYNCED</span>
        </div>
        
        <div className="flex gap-2">
          {onRegenerateBulletin && (
            <button
              onClick={onRegenerateBulletin}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-brand-cyan/40 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-cyan' : ''}`} />
              <span>Regenerate AI Bulletin</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT / SAVE AS PDF</span>
          </button>
        </div>
      </div>

      {/* High-Fidelity Print-Ready Sheet */}
      <div 
        ref={printableRef}
        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 max-w-[850px] mx-auto shadow-2xl relative overflow-hidden"
        style={{ colorScheme: "dark" }}
      >
        
        {/* Top Watermark Decorative Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500"></div>

        {/* Corporate Letterhead Header */}
        <div className="border-b-2 border-slate-700/80 pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-950/60 border border-brand-red flex items-center justify-center font-bold text-lg text-brand-red font-display glow-red">
              HSE
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-widest font-mono text-brand-red uppercase">CORPORATE SAFETY BULLETIN</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">INTELLIINVESTIGATE RISK INTELLIGENCE DIRECTIVE</p>
            </div>
          </div>

          <div className="text-right font-mono text-[10px] text-slate-400 space-y-0.5 border-l md:border-l-0 border-slate-700 pl-4 md:pl-0">
            <div><span className="font-bold text-slate-300">ALERT NO:</span> SHE-2026-A{incident.id?.replace("INC-", "") || "092"}</div>
            <div><span className="font-bold text-slate-300">ISSUED:</span> {incident.date}</div>
            <div><span className="font-bold text-slate-300">BU:</span> {incident.businessUnit?.toUpperCase() || "DOWNSTREAM"}</div>
            <div><span className="font-bold text-slate-300">STATUS:</span> ACTIVE SITE STAND-DOWN</div>
          </div>
        </div>

        {/* Main Subject Box */}
        <div className="bg-red-950/15 border border-brand-red/30 p-4 rounded-xl mb-6 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold font-display text-slate-100 uppercase tracking-tight leading-snug">
              {incident.incidentTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] font-mono text-slate-400">
              <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-bold">{incident.incidentClassification}</span>
              <span className="text-slate-500">•</span>
              <span>LOCATION: {incident.location}</span>
              <span className="text-slate-500">•</span>
              <span>CONTRACTOR: {incident.contractor}</span>
            </div>
          </div>
        </div>

        {/* Printable Grid Content */}
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          
          {/* Section 1: What Happened */}
          <div>
            <h3 className="text-[11px] font-mono font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2.5 uppercase tracking-wider">
              1. DESCRIPTION OF THE PHYSICAL EVENT SEQUENCE
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              On {incident.date} at {incident.time}, during performance of the work activity '{incident.workActivity}', an incident took place on the asset '{incident.equipmentAssets || "Active Process Unit"}'. 
              The active crew involved, representing the contractor '{incident.contractor}', suffered a catastrophic breakdown in isolation boundaries. 
              The primary energy source active was '{incident.energySource || "High Voltage Electrical Potentials"}'.
            </p>
            {incident.witnessStatements && (
              <div className="mt-3 p-3 bg-slate-950/60 rounded-lg border border-slate-900/60 italic text-slate-400 text-[11px]">
                " {incident.witnessStatements} "
              </div>
            )}
          </div>

          {/* Section 2: Why it Happened (Root Causes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <h3 className="text-[11px] font-mono font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2.5 uppercase tracking-wider">
                2. SYSTEMIC FAILURES (ICAM ROOT VECTOR)
              </h3>
              <ul className="space-y-2 text-[11px]">
                <li>
                  <span className="font-bold text-red-400 uppercase font-mono block">Immediate Cause:</span>
                  <span className="text-slate-300">{incident.rootCauses?.immediateCause || "Thermal/Mechanical energy release from bypassed insulation boundaries."}</span>
                </li>
                <li>
                  <span className="font-bold text-amber-400 uppercase font-mono block">Underlying Systemic Cause:</span>
                  <span className="text-slate-300">{incident.rootCauses?.underlyingCause || "Verification protocols (Test-Before-Touch) omitted; out-of-date nomenclatures."}</span>
                </li>
                <li>
                  <span className="font-bold text-orange-400 uppercase font-mono block">Primary Root Cause:</span>
                  <span className="text-slate-300">{incident.rootCauses?.rootCause || "Systemic delay in correcting audit observations combined with nomenclature drift."}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[11px] font-mono font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2.5 uppercase tracking-wider">
                3. CRITICAL HUMAN FACTORS IDENTIFIED
              </h3>
              <div className="space-y-2">
                {incident.humanFactors && incident.humanFactors.length > 0 ? (
                  incident.humanFactors.map((hf, i) => (
                    <div key={i} className="text-[11px] bg-slate-950/40 p-2 rounded border border-slate-900/40">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-slate-300 font-mono uppercase">{hf.factor}</span>
                        <span className="text-[9px] text-brand-orange bg-brand-orange/10 px-1.5 rounded font-mono">LEVEL: {hf.level}</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-tight">{hf.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 italic">No human factors analyzed yet. Run the AI Investigation Module.</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Mandatory Site stand-down actions */}
          <div className="pt-2">
            <h3 className="text-[11px] font-mono font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2.5 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-brand-green" />
              <span>3. MANDATORY SITE SAFETY DIRECTIVES (PTW STAND-DOWN)</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incident.capa && incident.capa.length > 0 ? (
                incident.capa.slice(0, 4).map((act, i) => (
                  <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 flex gap-2">
                    <input 
                      type="checkbox" 
                      defaultChecked={false} 
                      className="mt-0.5 accent-brand-cyan shrink-0 rounded w-4 h-4"
                    />
                    <div>
                      <span className="text-[9px] font-mono text-slate-400 block tracking-tight uppercase">
                        {act.type} ACTION | OWNER: {act.ownerRole}
                      </span>
                      <p className="text-[11px] font-bold text-slate-200 mt-0.5 leading-tight">
                        {act.action}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500 italic">No active CAPA requirements generated yet.</p>
              )}
            </div>
          </div>

          {/* Bulletin Footer Signatures */}
          <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="text-[9px] font-mono text-slate-500">
              <div>HSE INTELLIINVESTIGATE RISK COMPLIANCE OFFICE</div>
              <div>COPYRIGHT © 2026 GENERAL ENERGY CORP. ALL RIGHTS RESERVED.</div>
            </div>
            
            <div className="flex gap-8 text-[10px] font-mono text-slate-400">
              <div className="text-center">
                <div className="h-8 border-b border-slate-700 w-32 mx-auto"></div>
                <div className="mt-1 uppercase text-[8px] font-bold">Investigating Board Sec.</div>
              </div>
              <div className="text-center">
                <div className="h-8 border-b border-slate-700 w-32 mx-auto"></div>
                <div className="mt-1 uppercase text-[8px] font-bold">Group HSE Director</div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
