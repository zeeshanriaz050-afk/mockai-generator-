/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Layers,
  Code2,
  Terminal,
  Database,
  Sliders,
  Send,
  Zap,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Share2,
  ExternalLink,
  ChevronRight,
  Plus
} from "lucide-react";
import { Header } from "./components/Header";
import { PromptHero } from "./components/PromptHero";
import { EndpointList } from "./components/EndpointList";
import { EndpointTester } from "./components/EndpointTester";
import { SnippetViewer } from "./components/SnippetViewer";
import { DataStudio } from "./components/DataStudio";
import { MockProject, ProjectSummary, EndpointDef } from "./types";

export default function App() {
  const [projectsList, setProjectsList] = useState<ProjectSummary[]>([]);
  const [currentProject, setCurrentProject] = useState<MockProject | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef | null>(null);

  // Tabs on right view
  const [activeMainTab, setActiveMainTab] = useState<"tester" | "snippets" | "data">("tester");

  // Loading & Generation states
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch initial project list and load the first active project
  const fetchProjects = async (preferredId?: string) => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      const list: ProjectSummary[] = data.projects || [];
      setProjectsList(list);

      const targetId = preferredId || (list.length > 0 ? list[0].id : null);
      if (targetId) {
        await loadProject(targetId);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Failed to load project");
      const data = await res.json();
      const project: MockProject = data.project;
      setCurrentProject(project);

      // Select first endpoint by default if none selected or not in current project
      if (project.endpoints && project.endpoints.length > 0) {
        setSelectedEndpoint(project.endpoints[0]);
      } else {
        setSelectedEndpoint(null);
      }
    } catch (err) {
      console.error("Failed to load single project:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle generation from prompt
  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Generation failed");
      }

      const data = await res.json();
      const newProject: MockProject = data.project;

      await fetchProjects(newProject.id);
      setIsNewModalOpen(false);
      showToast(`✨ Generated "${newProject.name}" with ${newProject.endpoints.length} live endpoints!`);
    } catch (err: any) {
      console.error("Generate error:", err);
      showToast(`⚠️ ${err.message || "Could not generate mock API"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset collections back to original seed data
  const handleReset = async () => {
    if (!currentProject) return;
    setIsResetting(true);
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/reset`, {
        method: "POST",
      });
      if (res.ok) {
        await loadProject(currentProject.id);
        showToast("🔄 Mock data reset to initial seeds!");
      }
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setIsResetting(false);
    }
  };

  // Reload current project state after mutations (POST / DELETE)
  const handleDataChanged = async () => {
    if (currentProject) {
      await loadProject(currentProject.id);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-zinc-900 border border-emerald-500/40 text-zinc-100 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Header
        project={currentProject}
        projectsList={projectsList}
        onSelectProject={(id) => loadProject(id)}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onResetProject={handleReset}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
        {/* Top Hero Generator Section */}
        <PromptHero
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        {/* Workspace Area: Left Endpoints list, Right Tabs (Tester / Frontend Glue / Data Studio) */}
        {currentProject && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[640px]">
            {/* Left Sidebar: Endpoints list */}
            <div className="lg:col-span-4 xl:col-span-4 h-full min-h-[400px]">
              <EndpointList
                project={currentProject}
                selectedEndpoint={selectedEndpoint}
                onSelectEndpoint={(ep) => setSelectedEndpoint(ep)}
              />
            </div>

            {/* Right Main Panel */}
            <div className="lg:col-span-8 xl:col-span-8 flex flex-col h-full min-h-[540px]">
              {/* Tab Switcher */}
              <div className="flex items-center justify-between mb-3 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveMainTab("tester")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeMainTab === "tester"
                        ? "bg-zinc-800 text-emerald-300 shadow-sm border border-zinc-700/80"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>API Tester & Runner</span>
                  </button>

                  <button
                    onClick={() => setActiveMainTab("snippets")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeMainTab === "snippets"
                        ? "bg-zinc-800 text-emerald-300 shadow-sm border border-zinc-700/80"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Frontend Glue Snippets</span>
                  </button>

                  <button
                    onClick={() => setActiveMainTab("data")}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeMainTab === "data"
                        ? "bg-zinc-800 text-emerald-300 shadow-sm border border-zinc-700/80"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mock Data Studio</span>
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400 pr-2 font-mono">
                  <span>Base:</span>
                  <code className="text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    /api/m/{currentProject.id}
                  </code>
                </div>
              </div>

              {/* View Panel Content */}
              <div className="flex-1 min-h-0">
                {activeMainTab === "tester" && selectedEndpoint && (
                  <EndpointTester
                    project={currentProject}
                    endpoint={selectedEndpoint}
                    onDataChanged={handleDataChanged}
                  />
                )}

                {activeMainTab === "snippets" && selectedEndpoint && (
                  <SnippetViewer
                    endpoint={selectedEndpoint}
                    projectId={currentProject.id}
                  />
                )}

                {activeMainTab === "data" && (
                  <DataStudio
                    project={currentProject}
                    onRefresh={handleDataChanged}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* New Mock API Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">
                    Create New Mock API
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Synthesize live endpoints and realistic dummy data instantly with Gemini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm font-mono px-2 py-1 rounded hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <PromptHero
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              isInitialView={true}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 py-4 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">MockAI Studio</span>
            <span>•</span>
            <span>Real REST Endpoints for Frontend Devs, Students & Hackathons</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400 text-[11px]">
            <span>Supports JavaScript Fetch, Axios, React Hook, TanStack Query</span>
            <span>•</span>
            <span className="font-mono text-emerald-400">Status: All Mock Services Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
