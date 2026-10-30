import React, { useState } from "react";
import {
  Sparkles,
  Server,
  Copy,
  Check,
  RotateCcw,
  Download,
  Plus,
  ChevronDown,
  Layers,
  ExternalLink,
  Code2
} from "lucide-react";
import { MockProject, ProjectSummary } from "../types";
import { exportOpenApi } from "../utils/openapiExporter";

interface HeaderProps {
  project: MockProject | null;
  projectsList: ProjectSummary[];
  onSelectProject: (id: string) => void;
  onOpenNewModal: () => void;
  onResetProject: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  projectsList,
  onSelectProject,
  onOpenNewModal,
  onResetProject,
  isResetting,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const baseUrl = project ? `${window.location.origin}/api/m/${project.id}` : "";

  const handleCopyUrl = async () => {
    if (!baseUrl) return;
    await navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadOpenApi = () => {
    if (!project) return;
    const jsonStr = exportOpenApi(project, window.location.origin);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.id}-openapi.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-zinc-100 tracking-tight flex items-center gap-1.5">
                MockAI <span className="text-emerald-400 font-mono text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Studio</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Instant AI Mock API & Frontend Glue Generator
            </p>
          </div>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Project Switcher */}
          {project && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 hover:border-zinc-600 text-xs text-zinc-200 transition-all font-medium"
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span className="max-w-[120px] sm:max-w-[180px] truncate">{project.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl z-20 py-1 overflow-hidden">
                    <div className="px-3 py-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                      Switch Mock Project
                    </div>
                    <div className="max-h-60 overflow-y-auto py-1">
                      {projectsList.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            onSelectProject(p.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 transition-colors ${
                            p.id === project.id
                              ? "bg-emerald-500/10 text-emerald-300 font-medium"
                              : "text-zinc-300 hover:bg-zinc-800/70"
                          }`}
                        >
                          <span className="truncate">{p.name}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            /{p.id} • {p.endpointCount} endpoints
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Live Base URL copy button */}
          {project && (
            <div className="hidden md:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[200px]">/api/m/{project.id}</span>
              </div>
              <button
                onClick={handleCopyUrl}
                title="Copy Live Base URL"
                className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-medium transition-all"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Reset Project Seed */}
          {project && (
            <button
              onClick={onResetProject}
              disabled={isResetting}
              title="Reset mock data to initial seeds"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800 transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin text-amber-400" : ""}`} />
              <span className="hidden sm:inline">Reset Seed</span>
            </button>
          )}

          {/* OpenAPI Export */}
          {project && (
            <button
              onClick={handleDownloadOpenApi}
              title="Export OpenAPI 3.0 (Swagger) Specification"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OpenAPI</span>
            </button>
          )}

          {/* New Mock API Button */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md shadow-emerald-500/10 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
