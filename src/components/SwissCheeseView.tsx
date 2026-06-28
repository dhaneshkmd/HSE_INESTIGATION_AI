import React from "react";
import { Shield, ShieldAlert, Zap, Lock, Eye, AlertOctagon } from "lucide-react";
import { SwissCheeseLayer } from "../types";

interface SwissCheeseViewProps {
  layers: SwissCheeseLayer[];
  onToggleLayerStatus: (index: number) => void;
}

export default function SwissCheeseView({ layers, onToggleLayerStatus }: SwissCheeseViewProps) {
  
  // Custom icons for the cheese slices based on index
  const getLayerIcon = (index: number) => {
    switch (index % 4) {
      case 0: return <Lock className="w-4 h-4 text-brand-orange" />;
      case 1: return <Eye className="w-4 h-4 text-brand-yellow" />;
      case 2: return <Shield className="w-4 h-4 text-brand-orange" />;
      default: return <Zap className="w-4 h-4 text-brand-red" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6 border border-cyber-border/40">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div>
            <h3 className="text-sm font-semibold tracking-wider font-display text-slate-200 uppercase">
              Swiss Cheese Latent Failure & Active Error Mapping
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Defensive barriers are sliced with "holes" (latent conditions). Click a slice to toggle barrier status!
            </p>
          </div>
          <span className="text-[10px] bg-red-950/40 border border-red-500/30 text-red-400 px-2.5 py-1 rounded-lg font-mono">
            Breached Path Active
          </span>
        </div>

        {/* 3D Isometric Viewport */}
        <div className="relative py-12 px-4 flex flex-col lg:flex-row items-center justify-around gap-8 bg-slate-950/60 rounded-xl overflow-hidden border border-slate-900/80 min-h-[350px]">
          
          {/* Background grid scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-10"></div>

          {/* Core laser wire graphic */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-red-600 via-red-500 to-brand-green opacity-40 blur-[1px] hidden lg:block pointer-events-none"></div>

          {layers.map((layer, idx) => {
            const isBreached = layer.status === "breached";
            return (
              <div 
                key={idx}
                onClick={() => onToggleLayerStatus(idx)}
                className={`relative w-full max-w-[200px] aspect-[4/5] rounded-2xl border transition-all duration-500 transform lg:hover:-translate-y-2 cursor-pointer flex flex-col justify-between p-4 z-10 ${
                  isBreached 
                    ? "bg-amber-950/15 border-brand-red/35 hover:border-brand-red/60 shadow-lg shadow-brand-red/5" 
                    : "bg-emerald-950/15 border-brand-green/35 hover:border-brand-green/60 shadow-lg shadow-brand-green/5"
                }`}
              >
                {/* Isometric angle accent */}
                <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-600">
                  SL-0{idx + 1}
                </div>

                {/* Layer Icon & Status Label */}
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${isBreached ? 'bg-red-950/60 text-brand-red' : 'bg-emerald-950/60 text-brand-green'}`}>
                    {getLayerIcon(idx)}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">DEFENSE LAYER</div>
                    <div className={`text-xs font-bold font-display uppercase tracking-tight ${isBreached ? 'text-brand-red' : 'text-brand-green'}`}>
                      {isBreached ? "BREACHED" : "INTACT"}
                    </div>
                  </div>
                </div>

                {/* Center visual: Cheese Hole illustration */}
                <div className="flex justify-center items-center h-24 relative">
                  {isBreached ? (
                    <div className="relative">
                      {/* Red ring hole */}
                      <div className="w-14 h-14 rounded-full border-2 border-dashed border-brand-red/60 bg-red-950/30 flex items-center justify-center animate-pulse">
                        <ShieldAlert className="w-5 h-5 text-brand-red" />
                      </div>
                      <div className="absolute -inset-1 rounded-full border border-brand-red/30 scale-125 pointer-events-none"></div>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Intact solid green block */}
                      <div className="w-14 h-14 rounded-full bg-brand-green/20 border-2 border-brand-green/60 flex items-center justify-center glow-green">
                        <Shield className="w-5 h-5 text-brand-green" />
                      </div>
                      <div className="absolute -inset-1 rounded-full border border-brand-green/35 scale-125 pointer-events-none animate-ping opacity-25"></div>
                    </div>
                  )}
                </div>

                {/* Layer Name & Detail description */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold font-display text-slate-100 line-clamp-1">{layer.layerName}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {isBreached ? layer.holeDescription : "Barrier active. latent alignments blocked successfully."}
                  </p>
                </div>

                {/* Breached Alignment Indicator Bar */}
                <div className={`h-1.5 w-full rounded-full mt-2 ${isBreached ? 'bg-brand-red/30' : 'bg-brand-green/30'}`}>
                  <div className={`h-full rounded-full ${isBreached ? 'bg-brand-red w-full' : 'bg-brand-green w-1/4'}`}></div>
                </div>

              </div>
            );
          })}

        </div>

        {/* Detailed Swiss Cheese Legend & Action Matrix */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-red" />
              <span>THE TRAJECTORY OF LOSS IN FOCUS</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              When latent failures (holes in organizational processes or engineering specs) align perfectly with an active trigger, a "Trajectory of Loss" sweeps through the defenses. Bypassing interlocks, out-of-date single line diagrams, or lack of verification constitute these holes. Maintain integrity across all slices to block the trajectory!
            </p>
          </div>

          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 flex flex-col justify-between">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase mb-2">
              Barrier Status Manager
            </h4>
            
            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[100px]">
              {layers.map((layer, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="truncate max-w-[180px]">SL-0{idx+1}: {layer.layerName}</span>
                  <button
                    onClick={() => onToggleLayerStatus(idx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      layer.status === 'breached' 
                        ? 'bg-red-950 text-brand-red hover:bg-red-900' 
                        : 'bg-emerald-950 text-brand-green hover:bg-emerald-900'
                    }`}
                  >
                    {layer.status === 'breached' ? 'Breached (Hole Open)' : 'Intact (Closed)'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
