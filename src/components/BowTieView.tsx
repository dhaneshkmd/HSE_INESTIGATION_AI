import React from "react";
import { 
  Shield, ShieldAlert, AlertTriangle, ArrowRight, 
  ArrowLeft, Bomb, Activity, Minimize2, LifeBuoy 
} from "lucide-react";
import { Barrier, BarrierAnalysis } from "../types";

interface BowTieViewProps {
  threats: string[];
  topEvent: string;
  consequences: string[];
  barrierAnalysis: BarrierAnalysis;
  onToggleBarrier: (type: "preventative" | "mitigation", index: number) => void;
}

export default function BowTieView({ 
  threats, 
  topEvent, 
  consequences, 
  barrierAnalysis, 
  onToggleBarrier 
}: BowTieViewProps) {

  const getStatusStyle = (status: "active" | "failed" | "weak") => {
    switch (status) {
      case "active":
        return "bg-emerald-950/45 text-brand-green border-brand-green/60 hover:border-brand-green glow-green";
      case "failed":
        return "bg-red-950/45 text-brand-red border-brand-red/60 hover:border-brand-red glow-red";
      case "weak":
        return "bg-amber-950/45 text-brand-orange border-brand-orange/60 hover:border-brand-orange glow-yellow";
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 border border-cyber-border/40">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div>
            <h3 className="text-sm font-semibold tracking-wider font-display text-slate-200 uppercase">
              BowTie Multi-Barrier Safety Control Model
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Ties threats to consequences. Left wing presents preventative barriers, center is the top event, right is mitigation.
            </p>
          </div>
          <span className="text-[10px] bg-orange-950/40 border border-brand-orange/30 text-brand-orange px-2.5 py-1 rounded-lg font-mono font-semibold shadow-sm shadow-orange-500/5">
            BowTieXP Methodology
          </span>
        </div>

        {/* BowTie Diagram Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center py-6 relative overflow-x-auto min-w-[800px]">
          
          {/* 1. THREAT / HAZARD (Left Outer) */}
          <div className="space-y-3">
            <div className="text-center bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] font-mono text-slate-500 tracking-wider block">POTENTIAL THREATS</span>
            </div>
            
            {threats.map((threat, idx) => (
              <div 
                key={idx} 
                className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-start gap-2 text-xs text-slate-300 relative group hover:border-slate-700"
              >
                <AlertTriangle className="w-4 h-4 text-brand-yellow shrink-0 mt-0.5" />
                <span className="leading-tight">{threat}</span>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-4 h-0.5 bg-slate-700 hidden group-hover:block"></div>
              </div>
            ))}
          </div>

          {/* 2. PREVENTATIVE BARRIERS (Left Wing) */}
          <div className="space-y-3 relative">
            <div className="text-center bg-emerald-950/20 border border-brand-green/20 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] font-mono text-brand-green tracking-wider block flex items-center justify-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                PREVENTATIVE BARRIERS
              </span>
            </div>

            {barrierAnalysis.preventative.map((bar, idx) => (
              <div 
                key={idx}
                onClick={() => onToggleBarrier("preventative", idx)}
                className={`border p-3 rounded-xl cursor-pointer text-xs transition-all duration-300 flex flex-col gap-1.5 relative ${getStatusStyle(bar.status)}`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="truncate max-w-[120px]">{bar.name}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-900/80 rounded border border-slate-700/40">
                    {bar.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight line-clamp-2">
                  {bar.description}
                </p>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2">
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                </div>
              </div>
            ))}
          </div>

          {/* 3. CENTER KNOT (Top Incident Event) */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-red-950/50 border-4 border-brand-red flex flex-col items-center justify-center p-2 text-center shadow-lg shadow-brand-red/10 animate-pulse relative">
              <Bomb className="w-6 h-6 text-brand-red mb-1" />
              <span className="text-[9px] font-bold font-display leading-tight text-slate-100">TOP EVENT</span>
              
              {/* Outer decorative orbit radar rings */}
              <div className="absolute -inset-4 rounded-full border border-dashed border-brand-red/30 scale-110 pointer-events-none animate-spin"></div>
            </div>
            
            <div className="mt-4 p-2 bg-slate-900 border border-slate-800 rounded-lg text-center max-w-[150px]">
              <p className="text-[11px] font-display font-semibold text-slate-200 line-clamp-3">
                {topEvent}
              </p>
            </div>
          </div>

          {/* 4. MITIGATION BARRIERS (Right Wing) */}
          <div className="space-y-3 relative">
            <div className="text-center bg-blue-950/20 border border-blue-500/20 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] font-mono text-blue-400 tracking-wider block flex items-center justify-center gap-1">
                <LifeBuoy className="w-3.5 h-3.5" />
                MITIGATION BARRIERS
              </span>
            </div>

            {barrierAnalysis.mitigation.map((bar, idx) => (
              <div 
                key={idx}
                onClick={() => onToggleBarrier("mitigation", idx)}
                className={`border p-3 rounded-xl cursor-pointer text-xs transition-all duration-300 flex flex-col gap-1.5 relative ${getStatusStyle(bar.status)}`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="truncate max-w-[120px]">{bar.name}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-900/80 rounded border border-slate-700/40">
                    {bar.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight line-clamp-2">
                  {bar.description}
                </p>
                <div className="absolute -left-3 top-1/2 -translate-y-1/2">
                  <ArrowLeft className="w-3 h-3 text-slate-600" />
                </div>
              </div>
            ))}
          </div>

          {/* 5. CONSEQUENCES (Right Outer) */}
          <div className="space-y-3">
            <div className="text-center bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] font-mono text-slate-500 tracking-wider block">CONSEQUENCES</span>
            </div>

            {consequences.map((conseq, idx) => (
              <div 
                key={idx} 
                className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-start gap-2 text-xs text-slate-300 hover:border-slate-700"
              >
                <Minimize2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <span className="leading-tight">{conseq}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Legend Controls */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-wrap gap-4 text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-950 border border-brand-green inline-block"></span> Active Barrier (Blocked Event)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-950 border border-brand-red inline-block"></span> Failed Barrier (Breached Pathway)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-950 border border-brand-orange inline-block"></span> Weak Barrier (High-Risk Degradation)</span>
        </div>

      </div>
    </div>
  );
}
