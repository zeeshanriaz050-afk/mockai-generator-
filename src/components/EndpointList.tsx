import React, { useState } from "react";
import { Search, Hash, Radio, Filter, Code, CheckCircle } from "lucide-react";
import { EndpointDef, MockProject } from "../types";

interface EndpointListProps {
  project: MockProject;
  selectedEndpoint: EndpointDef | null;
  onSelectEndpoint: (ep: EndpointDef) => void;
}

export const EndpointList: React.FC<EndpointListProps> = ({
  project,
  selectedEndpoint,
  onSelectEndpoint,
}) => {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const filteredEndpoints = project.endpoints.filter((ep) => {
    const matchesSearch =
      ep.path.toLowerCase().includes(search.toLowerCase()) ||
      ep.description.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === "ALL" || ep.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  // Group endpoints by root resource name (e.g., "products", "cart", "auth")
  const grouped: Record<string, EndpointDef[]> = {};
  filteredEndpoints.forEach((ep) => {
    const root = ep.path.split("/").filter(Boolean)[0] || "general";
    if (!grouped[root]) grouped[root] = [];
    grouped[root].push(ep);
  });

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "POST":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PUT":
      case "PATCH":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "DELETE":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Endpoints ({project.endpoints.length})
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            /api/m/{project.id}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter routes e.g. /products, auth..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        {/* Method filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {["ALL", "GET", "POST", "PUT", "DELETE"].map((m) => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                methodFilter === m
                  ? "bg-zinc-700 text-zinc-100 shadow-sm"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/80"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-1.5">
        {Object.keys(grouped).length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-400">
            No endpoints matching "{search}"
          </div>
        ) : (
          Object.entries(grouped).map(([groupName, eps]) => (
            <div key={groupName} className="py-1.5">
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-2.5 h-2.5 text-zinc-400" />
                <span>{groupName}</span>
                <span className="text-zinc-400">({eps.length})</span>
              </div>

              <div className="space-y-0.5 mt-0.5">
                {eps.map((ep, idx) => {
                  const isSelected =
                    selectedEndpoint &&
                    selectedEndpoint.method === ep.method &&
                    selectedEndpoint.path === ep.path;

                  return (
                    <button
                      key={`${ep.method}-${ep.path}-${idx}`}
                      onClick={() => onSelectEndpoint(ep)}
                      className={`w-full text-left p-2 rounded-lg transition-all flex items-start gap-2 group ${
                        isSelected
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-zinc-100 shadow-sm"
                          : "hover:bg-zinc-900 border border-transparent text-zinc-300"
                      }`}
                    >
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border tracking-wider shrink-0 ${getMethodBadgeClass(
                          ep.method
                        )}`}
                      >
                        {ep.method}
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate text-zinc-200 group-hover:text-emerald-300 transition-colors">
                          {ep.path}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {ep.description}
                        </p>
                      </div>

                      {isSelected && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
