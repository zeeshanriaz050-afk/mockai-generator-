import React, { useState } from "react";
import {
  Database,
  Table as TableIcon,
  LayoutGrid,
  Plus,
  Trash2,
  Search,
  ExternalLink,
  Tag,
  DollarSign,
  Package,
  Layers,
  Sparkles
} from "lucide-react";
import { MockProject, MockResource } from "../types";

interface DataStudioProps {
  project: MockProject;
  onRefresh: () => Promise<void>;
}

export const DataStudio: React.FC<DataStudioProps> = ({ project, onRefresh }) => {
  const collectionNames = Object.keys(project.collections);
  const [selectedCollection, setSelectedCollection] = useState<string>(
    collectionNames[0] || ""
  );
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRecordJson, setNewRecordJson] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const activeItems: MockResource[] =
    project.collections[selectedCollection] || [];

  const filteredItems = activeItems.filter((item) => {
    return JSON.stringify(item).toLowerCase().includes(search.toLowerCase());
  });

  const handleDeleteItem = async (id: string | number) => {
    try {
      const res = await fetch(
        `${window.location.origin}/api/m/${project.id}/${selectedCollection}/${id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleOpenAddModal = () => {
    // Generate template from first item
    if (activeItems.length > 0) {
      const sample = { ...activeItems[0] };
      delete (sample as any).id;
      delete (sample as any).createdAt;
      setNewRecordJson(JSON.stringify(sample, null, 2));
    } else {
      setNewRecordJson('{\n  "title": "New item",\n  "status": "active"\n}');
    }
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveNewRecord = async () => {
    try {
      const parsed = JSON.parse(newRecordJson);
      const res = await fetch(
        `${window.location.origin}/api/m/${project.id}/${selectedCollection}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        }
      );
      if (!res.ok) throw new Error("Failed to create record");
      setIsAddModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      setAddError(err.message || "Invalid JSON syntax");
    }
  };

  // Extract columns for table view
  const allKeys = Array.from(
    new Set(
      activeItems.flatMap((item) =>
        Object.keys(item).filter(
          (k) => typeof item[k] !== "object" || Array.isArray(item[k])
        )
      )
    )
  ).slice(0, 7);

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Top bar */}
      <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider shrink-0 mr-1">
            Collections:
          </span>
          {collectionNames.map((col) => {
            const count = project.collections[col]?.length || 0;
            return (
              <button
                key={col}
                onClick={() => setSelectedCollection(col)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCollection === col
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800"
                }`}
              >
                <span>{col}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search data..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-700"
            />
          </div>

          {/* View toggle */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("cards")}
              title="Cards View"
              className={`p-1.5 rounded ${
                viewMode === "cards" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded ${
                viewMode === "table" ? "bg-zinc-800 text-emerald-400" : "text-zinc-400"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add record */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Record</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-zinc-950">
        {filteredItems.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-zinc-400 text-xs">
            <Package className="w-8 h-8 text-zinc-400 mb-2" />
            <p>No records found in '{selectedCollection}'</p>
          </div>
        ) : viewMode === "cards" ? (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, index) => {
              const hasImage = typeof item.image === "string" && item.image.startsWith("http");
              const title = item.name || item.title || item.symbol || `Record #${item.id || index + 1}`;

              return (
                <div
                  key={String(item.id || index)}
                  className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 overflow-hidden flex flex-col group hover:border-zinc-700 transition-all shadow-sm"
                >
                  {hasImage && (
                    <div className="relative h-40 w-full overflow-hidden bg-zinc-950">
                      <img
                        src={item.image}
                        alt={String(title)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-mono text-zinc-200">
                        {item.id}
                      </div>
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-sm text-zinc-100 truncate">
                        {String(title)}
                      </h4>
                      {!hasImage && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {String(item.id || `#${index + 1}`)}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                        {String(item.description)}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="mt-auto space-y-1.5 pt-2 border-t border-zinc-800/60 text-xs">
                      {item.price !== undefined && (
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-400">Price:</span>
                          <span className="font-mono font-semibold text-emerald-400">
                            ${Number(item.price).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {item.category && (
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-400">Category:</span>
                          <span className="capitalize">{String(item.category)}</span>
                        </div>
                      )}
                      {item.stock !== undefined && (
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-400">In Stock:</span>
                          <span className="font-mono">{String(item.stock)}</span>
                        </div>
                      )}
                      {item.rating && (
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-400">Rating:</span>
                          <span className="text-amber-400 font-mono">★ {item.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Delete item button */}
                    <div className="mt-3 pt-2 flex items-center justify-end">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[11px] text-zinc-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-xl border border-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  {allKeys.map((key) => (
                    <th key={key} className="px-3 py-2.5">
                      {key}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
                {filteredItems.map((item, idx) => (
                  <tr key={String(item.id || idx)} className="hover:bg-zinc-900/50">
                    {allKeys.map((key) => {
                      const val = item[key];
                      return (
                        <td key={key} className="px-3 py-2 text-zinc-300 max-w-[200px] truncate">
                          {Array.isArray(val)
                            ? val.join(", ")
                            : typeof val === "boolean"
                            ? val ? "true" : "false"
                            : String(val ?? "-")}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-zinc-400 hover:text-rose-400 p-1"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-100 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Record to '{selectedCollection}'
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Enter the JSON record to immediately insert into the live mock server.
            </p>

            {addError && (
              <div className="mb-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
                {addError}
              </div>
            )}

            <textarea
              value={newRecordJson}
              onChange={(e) => setNewRecordJson(e.target.value)}
              rows={8}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/60 mb-4 resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewRecord}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
