import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check, X, Users, Hammer, Layers, FileText, Globe, Key } from "lucide-react";
import { FishboneCategories } from "../types";

interface FishboneViewProps {
  fishboneData: FishboneCategories;
  onUpdateFishbone: (updated: FishboneCategories) => void;
}

export default function FishboneView({ fishboneData, onUpdateFishbone }: FishboneViewProps) {
  const [activeCategory, setActiveCategory] = useState<keyof FishboneCategories | null>(null);
  const [newValue, setNewValue] = useState("");
  const [editIndex, setEditIndex] = useState<{ category: keyof FishboneCategories; index: number } | null>(null);
  const [editText, setEditText] = useState("");

  const categories: { key: keyof FishboneCategories; label: string; icon: any; color: string }[] = [
    { key: "people", label: "PEOPLE (Human Factors)", icon: Users, color: "text-blue-400 border-blue-500/30" },
    { key: "equipment", label: "EQUIPMENT (Machinery)", icon: Hammer, color: "text-amber-400 border-amber-500/30" },
    { key: "materials", label: "MATERIALS (PPE / Tools)", icon: Layers, color: "text-purple-400 border-purple-500/30" },
    { key: "methods", label: "METHODS (Procedures)", icon: FileText, color: "text-green-400 border-green-500/30" },
    { key: "environment", label: "ENVIRONMENT (Site Conditions)", icon: Globe, color: "text-cyan-400 border-cyan-500/30" },
    { key: "management", label: "MANAGEMENT (Culture / Audits)", icon: Key, color: "text-rose-400 border-rose-500/30" }
  ];

  const handleAddCause = (category: keyof FishboneCategories) => {
    if (!newValue.trim()) return;
    const updated = {
      ...fishboneData,
      [category]: [...(fishboneData[category] || []), newValue.trim()]
    };
    onUpdateFishbone(updated);
    setNewValue("");
    setActiveCategory(null);
  };

  const handleDeleteCause = (category: keyof FishboneCategories, index: number) => {
    const list = [...fishboneData[category]];
    list.splice(index, 1);
    const updated = {
      ...fishboneData,
      [category]: list
    };
    onUpdateFishbone(updated);
  };

  const startEdit = (category: keyof FishboneCategories, index: number, text: string) => {
    setEditIndex({ category, index });
    setEditText(text);
  };

  const handleSaveEdit = () => {
    if (!editIndex || !editText.trim()) return;
    const { category, index } = editIndex;
    const list = [...fishboneData[category]];
    list[index] = editText.trim();
    const updated = {
      ...fishboneData,
      [category]: list
    };
    onUpdateFishbone(updated);
    setEditIndex(null);
    setEditText("");
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Spine Section */}
      <div className="glass-card rounded-2xl p-6 border border-cyber-border/40 relative overflow-x-auto min-w-[700px]">
        <h3 className="text-xs font-mono text-slate-400 mb-6 uppercase tracking-wider flex items-center gap-2">
          <span>Ishikawa (Fishbone) Dynamic Diagram Canvas</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span>
        </h3>

        {/* Outer Grid for Top & Bottom branches */}
        <div className="relative h-[280px] w-full flex flex-col justify-between">
          
          {/* Spine Arrow SVG Overlay */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-4 pointer-events-none z-0">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="8" x2="96%" y2="8" stroke="#00f0ff" strokeWidth="3" strokeDasharray="5 3" />
              <polygon points="98%,8 95%,1 95%,15" fill="#00f0ff" />
              <text x="94%" y="-5" fill="#00f0ff" fontSize="9" fontFamily="monospace" fontWeight="bold">PRIMARY HAZARD EVENT</text>
            </svg>
          </div>

          {/* TOP BRANCHES: People, Equipment, Materials */}
          <div className="grid grid-cols-3 gap-4 z-10">
            {categories.slice(0, 3).map((cat, colIdx) => {
              const Icon = cat.icon;
              return (
                <div key={cat.key} className="flex flex-col items-center">
                  <div className="text-center pb-2 border-b-2 border-slate-700/60 w-11/12">
                    <span className="text-[10px] font-mono text-slate-400 font-bold tracking-tight uppercase flex items-center justify-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-brand-cyan" />
                      {cat.label.split(" (")[0]}
                    </span>
                  </div>
                  
                  {/* Branch listing container slanted */}
                  <div className="mt-3 w-full pl-6 space-y-1 text-left min-h-[80px]">
                    {(fishboneData[cat.key] || []).map((cause, index) => (
                      <div 
                        key={index} 
                        className="group flex items-start gap-1 bg-slate-900/60 border border-slate-800/40 hover:border-brand-cyan/30 px-2 py-1 rounded text-[10px] text-slate-300 transition-all cursor-pointer hover:bg-slate-850"
                        onClick={() => startEdit(cat.key, index, cause)}
                      >
                        <span className="text-brand-cyan font-bold mr-1">•</span>
                        <span className="line-clamp-2 flex-1">{cause}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCause(cat.key, index); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-brand-red transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setActiveCategory(cat.key)}
                      className="w-full py-1 border border-dashed border-slate-800 hover:border-brand-cyan/40 hover:bg-brand-cyan/5 rounded flex items-center justify-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-all mt-1"
                    >
                      <Plus className="w-3 h-3" /> Add Factor
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spacer for central spine */}
          <div className="h-8"></div>

          {/* BOTTOM BRANCHES: Methods, Environment, Management */}
          <div className="grid grid-cols-3 gap-4 z-10">
            {categories.slice(3).map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.key} className="flex flex-col items-center">
                  {/* Branch listing container slanted */}
                  <div className="mb-3 w-full pl-6 space-y-1 text-left min-h-[80px] flex flex-col justify-end">
                    <button
                      onClick={() => setActiveCategory(cat.key)}
                      className="w-full py-1 border border-dashed border-slate-800 hover:border-brand-cyan/40 hover:bg-brand-cyan/5 rounded flex items-center justify-center gap-1 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-all mb-1"
                    >
                      <Plus className="w-3 h-3" /> Add Factor
                    </button>
                    {(fishboneData[cat.key] || []).map((cause, index) => (
                      <div 
                        key={index} 
                        className="group flex items-start gap-1 bg-slate-900/60 border border-slate-800/40 hover:border-brand-cyan/30 px-2 py-1 rounded text-[10px] text-slate-300 transition-all cursor-pointer hover:bg-slate-850"
                        onClick={() => startEdit(cat.key, index, cause)}
                      >
                        <span className="text-brand-cyan font-bold mr-1">•</span>
                        <span className="line-clamp-2 flex-1">{cause}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteCause(cat.key, index); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-brand-red transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-2 border-t-2 border-slate-700/60 w-11/12">
                    <span className="text-[10px] font-mono text-slate-400 font-bold tracking-tight uppercase flex items-center justify-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-brand-cyan" />
                      {cat.label.split(" (")[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Editor Modals / Inline Controls */}
      {activeCategory && (
        <div className="p-4 bg-slate-900/80 border border-brand-cyan/20 rounded-xl flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
              Add contributing cause to: <span className="text-brand-cyan">{activeCategory}</span>
            </label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="e.g. Technician suffered sudden distraction from radio noise..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan"
            />
          </div>
          <div className="flex gap-2 self-end">
            <button
              onClick={() => handleAddCause(activeCategory)}
              className="p-2 bg-brand-cyan hover:bg-cyan-400 text-slate-950 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setActiveCategory(null); setNewValue(""); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {editIndex && (
        <div className="p-4 bg-slate-900/80 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">
              Edit Factor in category: <span className="text-amber-400">{editIndex.category}</span>
            </label>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex gap-2 self-end">
            <button
              onClick={handleSaveEdit}
              className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setEditIndex(null); setEditText(""); }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Grid for tabular configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.key} className="glass-card rounded-xl p-4 border border-cyber-border/30">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Icon className="w-4 h-4 text-brand-cyan" />
                  {cat.label}
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
                  {fishboneData[cat.key]?.length || 0} nodes
                </span>
              </div>
              
              <ul className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {(fishboneData[cat.key] || []).map((cause, idx) => (
                  <li 
                    key={idx} 
                    className="text-xs text-slate-400 flex items-start gap-2 justify-between group hover:text-slate-200"
                  >
                    <span className="flex-1 leading-relaxed">{cause}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(cat.key, idx, cause)}
                        className="text-slate-500 hover:text-brand-cyan p-0.5"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCause(cat.key, idx)}
                        className="text-slate-500 hover:text-brand-red p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </li>
                ))}
                {(!fishboneData[cat.key] || fishboneData[cat.key].length === 0) && (
                  <li className="text-[11px] text-slate-500 italic">No causes registered in this category branch.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

    </div>
  );
}
