import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, AlertTriangle, FileText, Activity, X, HelpCircle } from "lucide-react";
import { ChatMessage, Incident } from "../types";

interface AIChatAssistantProps {
  activeIncident: Incident | null;
  onClose?: () => void;
}

export default function AIChatAssistant({ activeIncident, onClose }: AIChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "### Welcome to HSE IntelliInvestigate AI\nI am configured with specialized knowledge of oil & gas, marine logistics, heavy power grid, and civil construction safety frameworks (ISO 45001).\n\nIf you have a case loaded, I can analyze the root causes, compile immediate toolbox safety alerts, or identify evidence gaps. What would you like to build or analyze?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          incidentContext: activeIncident
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact HSE Intelligence backend");
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.content || "Error generating intelligence response. Please check network logs.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ Failed to sync with AI engine: ${err.message || "Endpoint error"}. Fallback simulated response active.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionChips = [
    { label: "Generate Toolbox Talk", prompt: "Generate a custom Toolbox Talk safety sheet based on our loaded incident." },
    { label: "Assess Evidence Gaps", prompt: "Identify missing evidence files and document discrepancies for this case." },
    { label: "Analyze Root Causes", prompt: "Explain the underlying organizational root causes and swiss-cheese gaps for this event." },
    { label: "Draft Site Directive", prompt: "Draft an immediate site safety stand-down directive for operations supervisors." }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-xl border-l border-white/10">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-orange glow-orange" />
          <div>
            <h3 className="text-xs font-bold tracking-widest font-mono text-slate-100">HSE INTELLIGENCE ASSISTANT</h3>
            {activeIncident ? (
              <span className="text-[9px] text-brand-orange font-mono truncate max-w-[180px] block font-semibold">CASE: {activeIncident.incidentNumber} LOADED</span>
            ) : (
              <span className="text-[9px] text-slate-500 font-mono block">NO ACTIVE CASE LOADED</span>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Scroll Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-brand-orange/15 border border-brand-orange/25 self-end text-slate-200' 
                : 'bg-slate-900/40 backdrop-blur-md border border-white/5 self-start text-slate-300'
            }`}
          >
            {/* Markdown Simple Text Renderer */}
            <div className="space-y-2 whitespace-pre-wrap font-sans">
              {msg.content.split("\n\n").map((para, pIdx) => {
                if (para.startsWith("### ")) {
                  return <h4 key={pIdx} className="text-sm font-bold font-display text-slate-100 mt-2">{para.replace("### ", "")}</h4>;
                }
                if (para.startsWith("#### ")) {
                  return <h5 key={pIdx} className="text-xs font-bold text-brand-orange font-mono uppercase tracking-tight mt-1">{para.replace("#### ", "")}</h5>;
                }
                if (para.startsWith("- ") || para.startsWith("* ")) {
                  return (
                    <ul key={pIdx} className="list-disc pl-4 space-y-1">
                      {para.split("\n").map((li, lIdx) => (
                        <li key={lIdx}>{li.replace(/^[\-\*]\s+/, "")}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={pIdx}>{para}</p>;
              })}
            </div>
            
            <span className="text-[8px] font-mono text-slate-500 text-right mt-2 block">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={scrollRef}></div>
      </div>

      {/* Suggestion Chips Selector */}
      <div className="p-3 border-t border-white/5 bg-slate-950/20 space-y-1.5">
        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block pl-1">SUGGESTED DIRECTIVES</span>
        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
          {suggestionChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(chip.prompt)}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-2.5 h-2.5 text-brand-orange" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat input box */}
      <div className="p-4 border-t border-white/10 bg-slate-900/60 backdrop-blur-md flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask HSE AI investigator anything..."
          className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-orange transition-all"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading}
          className="p-2 bg-gradient-to-br from-brand-orange to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-xl cursor-pointer transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
