import React, { useState } from "react";
import { Sparkles, ArrowRight, Wand2, Lightbulb, Zap, Globe2 } from "lucide-react";

interface PromptHeroProps {
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  isInitialView?: boolean;
}

const PRESET_PROMPTS = [
  {
    label: "🛍️ Clothing Boutique Store (Urdu/Hindi/English)",
    prompt: "Mujhe ek online clothing store ki APIs chahiye jisme products, cart, aur user login ke endpoints hon",
    category: "E-Commerce",
  },
  {
    label: "🍕 Food Delivery & Restaurant App",
    prompt: "A food delivery platform with restaurants, menu items with categories, order checkout, and live delivery status",
    category: "On-Demand",
  },
  {
    label: "🪙 Crypto & Portfolio Tracker",
    prompt: "Cryptocurrency market tracker with Bitcoin, Ethereum, live price changes, sparklines, and user wallet holdings",
    category: "Fintech",
  },
  {
    label: "🚀 SaaS Projects & Team Workspace",
    prompt: "SaaS dashboard with projects, team members with roles, task assignments, and subscription plans",
    category: "Productivity",
  },
  {
    label: "🏥 Doctor Appointments Booking",
    prompt: "Healthcare booking app with doctors list, clinic locations, time slots, and patient appointment requests",
    category: "Healthcare",
  },
];

export const PromptHero: React.FC<PromptHeroProps> = ({
  onGenerate,
  isGenerating,
  isInitialView = false,
}) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    await onGenerate(prompt.trim());
  };

  const handleSelectPreset = (presetText: string) => {
    setPrompt(presetText);
  };

  return (
    <div
      className={`w-full rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-950/80 to-zinc-950 p-5 sm:p-7 relative overflow-hidden transition-all shadow-xl shadow-black/40`}
    >
      {/* Decorative ambient background glow */}
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              AI Mock Generator
            </span>
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Globe2 className="w-3.5 h-3.5 text-zinc-400" />
              English, Roman Urdu & Hindi supported
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Gemini 3.8 Flash • Instant Live REST
          </div>
        </div>

        <h2 className="text-lg sm:text-2xl font-bold text-zinc-100 mb-2 tracking-tight">
          Describe the API you need in plain English or Roman Urdu
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mb-5 max-w-2xl">
          Instantly generates live interactive REST endpoints, realistic dummy data (prices, images, status), and ready-to-copy frontend fetch & React hook snippets.
        </p>

        {/* Prompt Input Form */}
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="relative rounded-xl border border-zinc-700/80 bg-zinc-900/90 focus-within:border-emerald-500/80 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-inner">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "Mujhe ek online clothing store ki APIs chahiye jisme products, cart, aur user login ke endpoints hon" or "Crypto market tracking API with wallet holdings"'
              rows={isInitialView ? 3 : 2}
              disabled={isGenerating}
              className="w-full bg-transparent px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none resize-none font-sans"
            />

            <div className="flex items-center justify-between border-t border-zinc-800/80 px-3 py-2 bg-zinc-950/40 rounded-b-xl">
              <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">
                Press Enter or click generate
              </span>

              <button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:pointer-events-none text-zinc-950 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                {isGenerating ? (
                  <>
                    <Wand2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Mock API...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Generate Instant API</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Preset Prompt Suggestions */}
        <div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Try these pre-built prompts:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(item.prompt)}
                disabled={isGenerating}
                className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 transition-all active:scale-98 flex items-center gap-1.5"
              >
                <span className="text-zinc-400 font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
