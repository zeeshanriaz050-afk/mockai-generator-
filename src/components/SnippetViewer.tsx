import React, { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Zap,
  Layers,
  FileCode,
  Terminal,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { EndpointDef, SnippetLanguage } from "../types";
import { generateSnippet } from "../utils/snippetGenerator";

interface SnippetViewerProps {
  endpoint: EndpointDef;
  projectId: string;
}

const LANGUAGES: { id: SnippetLanguage; label: string; icon: string }[] = [
  { id: "fetch", label: "JavaScript fetch()", icon: "⚡" },
  { id: "axios", label: "Axios", icon: "📦" },
  { id: "react-hook", label: "React Hook", icon: "⚛️" },
  { id: "react-query", label: "TanStack Query", icon: "🔄" },
  { id: "nextjs", label: "Next.js (App Router)", icon: "🔺" },
  { id: "typescript", label: "TypeScript Types", icon: "🔷" },
  { id: "curl", label: "cURL (Terminal)", icon: "💻" },
];

export const SnippetViewer: React.FC<SnippetViewerProps> = ({
  endpoint,
  projectId,
}) => {
  const [activeLang, setActiveLang] = useState<SnippetLanguage>("fetch");
  const [copied, setCopied] = useState(false);

  const baseUrl = `${window.location.origin}/api/m/${projectId}`;
  const code = generateSnippet(activeLang, endpoint, baseUrl);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header & Language selector */}
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
            Frontend Glue Code
          </h3>
          <span className="text-[10px] text-zinc-400 font-mono hidden md:inline">
            1-Click Copy into your project
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md shadow-emerald-500/10 active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied Code!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Snippet</span>
            </>
          )}
        </button>
      </div>

      {/* Language tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/30 overflow-x-auto scrollbar-none">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setActiveLang(lang.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeLang === lang.id
                ? "bg-zinc-800 text-emerald-300 border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <span>{lang.icon}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>

      {/* Code Editor Preview */}
      <div className="relative flex-1 bg-zinc-950 overflow-auto p-4 font-mono text-xs leading-relaxed">
        <div className="absolute top-3 right-3 text-[10px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 pointer-events-none">
          {activeLang === "curl" ? "BASH" : activeLang === "typescript" ? "TYPESCRIPT" : "JAVASCRIPT"}
        </div>
        <pre className="text-zinc-200">
          <code>{code}</code>
        </pre>
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 bg-zinc-900/40 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
        <span>
          💡 Paste this directly into your frontend code (Next.js, Vite, CRA, Vue, or Angular).
        </span>
        <span className="font-mono text-emerald-400">
          Status: 200 OK Live
        </span>
      </div>
    </div>
  );
};
