import React, { useState, useEffect } from "react";
import {
  Send,
  Copy,
  Check,
  Clock,
  HardDrive,
  AlertTriangle,
  ExternalLink,
  Code2,
  Sliders,
  Settings,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { EndpointDef, MockProject } from "../types";

interface EndpointTesterProps {
  project: MockProject;
  endpoint: EndpointDef;
  onDataChanged?: () => void;
}

export const EndpointTester: React.FC<EndpointTesterProps> = ({
  project,
  endpoint,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<"params" | "body" | "headers" | "simulate">("params");
  const [customPath, setCustomPath] = useState(endpoint.path);
  const [requestBody, setRequestBody] = useState("");
  const [queryParams, setQueryParams] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
    { key: "Content-Type", value: "application/json" },
  ]);

  // Simulation controls
  const [simulatedDelay, setSimulatedDelay] = useState<number>(project.latencyMs || 0);
  const [forcedStatus, setForcedStatus] = useState<string>("default");

  // Execution state
  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseStatusText, setResponseStatusText] = useState<string>("");
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responseSize, setResponseSize] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<any>(endpoint.responseSample || null);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Sync state when endpoint changes
  useEffect(() => {
    let initialPath = endpoint.path;
    // Replace :id with first sample ID if available
    if (initialPath.includes(":id")) {
      const resource = initialPath.split("/")[1];
      const sampleItem = project.collections[resource]?.[0];
      if (sampleItem && sampleItem.id) {
        initialPath = initialPath.replace(":id", String(sampleItem.id));
      }
    }
    setCustomPath(initialPath);

    if (endpoint.requestBodySample) {
      setRequestBody(JSON.stringify(endpoint.requestBodySample, null, 2));
      setActiveTab("body");
    } else {
      setRequestBody("");
      setActiveTab("params");
    }

    setResponseData(endpoint.responseSample || null);
    setResponseStatus(200);
    setResponseStatusText("OK (Sample)");
    setResponseTime(null);
    setResponseSize(null);
  }, [endpoint, project]);

  // Execute request
  const handleSendRequest = async () => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      // Build full URL
      const origin = window.location.origin;
      let url = `${origin}/api/m/${project.id}${customPath.startsWith("/") ? customPath : "/" + customPath}`;

      // Append query parameters
      const validParams = queryParams.filter((p) => p.key.trim() !== "");
      const searchParams = new URLSearchParams();

      validParams.forEach((p) => searchParams.append(p.key.trim(), p.value));

      if (simulatedDelay > 0) {
        searchParams.append("delay", String(simulatedDelay));
      }
      if (forcedStatus !== "default") {
        searchParams.append("status", forcedStatus);
      }

      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }

      // Headers
      const reqHeaders: Record<string, string> = {};
      headers
        .filter((h) => h.key.trim())
        .forEach((h) => {
          reqHeaders[h.key.trim()] = h.value;
        });

      // Request options
      const options: RequestInit = {
        method: endpoint.method,
        headers: reqHeaders,
      };

      if (["POST", "PUT", "PATCH"].includes(endpoint.method) && requestBody.trim()) {
        try {
          // Validate JSON syntax
          JSON.parse(requestBody);
          options.body = requestBody;
        } catch (jsonErr: any) {
          setIsLoading(false);
          setResponseStatus(400);
          setResponseStatusText("Invalid JSON Body");
          setResponseData({ error: "Invalid JSON in request body", details: jsonErr.message });
          return;
        }
      }

      const res = await fetch(url, options);
      const endTime = performance.now();
      const elapsed = Math.round(endTime - startTime);

      setResponseStatus(res.status);
      setResponseStatusText(res.statusText || (res.ok ? "OK" : "Error"));
      setResponseTime(elapsed);

      const contentType = res.headers.get("content-type");
      let data: any;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponseData(data);
      const sizeBytes = new Blob([typeof data === "string" ? data : JSON.stringify(data)]).size;
      setResponseSize(formatBytes(sizeBytes));

      // If data mutation happened, trigger refresh
      if (["POST", "PUT", "PATCH", "DELETE"].includes(endpoint.method) && res.ok) {
        onDataChanged?.();
      }
    } catch (err: any) {
      const endTime = performance.now();
      setResponseStatus(500);
      setResponseStatusText("Fetch Failed");
      setResponseTime(Math.round(endTime - startTime));
      setResponseData({
        error: "Network fetch failed",
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleCopyResponse = async () => {
    if (!responseData) return;
    await navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const handleCopyUrl = async () => {
    const fullUrl = `${window.location.origin}/api/m/${project.id}${customPath}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getStatusBadge = (status: number | null) => {
    if (!status) return null;
    if (status >= 200 && status < 300) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    }
    if (status >= 400 && status < 500) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    }
    return "bg-rose-500/10 text-rose-400 border-rose-500/30";
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Top Request Bar */}
      <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 focus-within:border-emerald-500/70 transition-all">
          <span
            className={`px-2 py-0.5 rounded text-xs font-mono font-bold tracking-wider ${
              endpoint.method === "GET"
                ? "bg-sky-500/20 text-sky-400"
                : endpoint.method === "POST"
                ? "bg-emerald-500/20 text-emerald-400"
                : endpoint.method === "PUT"
                ? "bg-amber-500/20 text-amber-400"
                : "bg-rose-500/20 text-rose-400"
            }`}
          >
            {endpoint.method}
          </span>

          <span className="text-xs text-zinc-400 font-mono hidden md:inline">
            /api/m/{project.id}
          </span>

          <input
            type="text"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            className="flex-1 bg-transparent text-xs text-zinc-100 font-mono focus:outline-none"
            placeholder="/products"
          />

          <button
            onClick={handleCopyUrl}
            title="Copy Full Live URL"
            className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <button
          onClick={handleSendRequest}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>{isLoading ? "Executing..." : "Send Request"}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between px-3 border-b border-zinc-800 bg-zinc-900/40 text-xs">
        <div className="flex gap-1 py-1">
          <button
            onClick={() => setActiveTab("params")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "params"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Query Params
          </button>

          {["POST", "PUT", "PATCH"].includes(endpoint.method) && (
            <button
              onClick={() => setActiveTab("body")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === "body"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Body (JSON)
            </button>
          )}

          <button
            onClick={() => setActiveTab("headers")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "headers"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Headers
          </button>

          <button
            onClick={() => setActiveTab("simulate")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "simulate"
                ? "bg-zinc-800 text-emerald-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sliders className="w-3 h-3 text-emerald-400" />
            <span>Simulate</span>
          </button>
        </div>

        <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
          {endpoint.description}
        </span>
      </div>

      {/* Tab Panels */}
      <div className="p-3 bg-zinc-950/60 border-b border-zinc-800 max-h-48 overflow-y-auto">
        {/* Params Tab */}
        {activeTab === "params" && (
          <div className="space-y-2">
            <div className="text-[11px] text-zinc-400 mb-1 flex items-center justify-between">
              <span>URL Query Parameters (e.g. search, limit, category)</span>
              <button
                onClick={() => setQueryParams([...queryParams, { key: "", value: "" }])}
                className="text-emerald-400 hover:underline"
              >
                + Add Param
              </button>
            </div>
            {queryParams.map((param, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. limit)"
                  value={param.key}
                  onChange={(e) => {
                    const next = [...queryParams];
                    next[i].key = e.target.value;
                    setQueryParams(next);
                  }}
                  className="flex-1 px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 5)"
                  value={param.value}
                  onChange={(e) => {
                    const next = [...queryParams];
                    next[i].value = e.target.value;
                    setQueryParams(next);
                  }}
                  className="flex-1 px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
            ))}
          </div>
        )}

        {/* Body Tab */}
        {activeTab === "body" && (
          <div>
            <div className="flex items-center justify-between mb-1.5 text-[11px] text-zinc-400">
              <span>JSON Request Payload</span>
              <button
                onClick={() => {
                  try {
                    const formatted = JSON.stringify(JSON.parse(requestBody), null, 2);
                    setRequestBody(formatted);
                  } catch {
                    // ignore
                  }
                }}
                className="text-zinc-400 hover:text-zinc-200 font-mono text-[10px]"
              >
                Prettify JSON
              </button>
            </div>
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={4}
              placeholder='{ "title": "New item" }'
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/60 resize-none"
            />
          </div>
        )}

        {/* Headers Tab */}
        {activeTab === "headers" && (
          <div className="space-y-2">
            <div className="text-[11px] text-zinc-400 mb-1 flex items-center justify-between">
              <span>Request Headers</span>
              <button
                onClick={() => setHeaders([...headers, { key: "", value: "" }])}
                className="text-emerald-400 hover:underline"
              >
                + Add Header
              </button>
            </div>
            {headers.map((h, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Header Name"
                  value={h.key}
                  onChange={(e) => {
                    const next = [...headers];
                    next[i].key = e.target.value;
                    setHeaders(next);
                  }}
                  className="flex-1 px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={h.value}
                  onChange={(e) => {
                    const next = [...headers];
                    next[i].value = e.target.value;
                    setHeaders(next);
                  }}
                  className="flex-1 px-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded font-mono text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
            ))}
          </div>
        )}

        {/* Simulate Tab */}
        {activeTab === "simulate" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                Simulate Network Latency:{" "}
                <span className="text-emerald-400 font-mono">{simulatedDelay} ms</span>
              </label>
              <div className="flex gap-1.5">
                {[0, 100, 350, 1000, 2500].map((ms) => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => setSimulatedDelay(ms)}
                    className={`px-2 py-1 text-[10px] font-mono rounded border transition-all ${
                      simulatedDelay === ms
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {ms === 0 ? "0ms" : ms < 1000 ? `${ms}ms` : `${ms / 1000}s`}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Simulates real-world mobile 3G/4G network latency.
              </p>
            </div>

            <div>
              <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                Simulate HTTP Errors (Test Frontend UI):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Normal (200/201)", val: "default" },
                  { label: "400 Bad Request", val: "400" },
                  { label: "401 Unauthorized", val: "401" },
                  { label: "404 Not Found", val: "404" },
                  { label: "500 Server Error", val: "500" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setForcedStatus(item.val)}
                    className={`px-2 py-1 text-[10px] font-mono rounded border transition-all ${
                      forcedStatus === item.val
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Response Panel */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
        <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-zinc-300">Response</span>

            {responseStatus && (
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getStatusBadge(
                  responseStatus
                )}`}
              >
                {responseStatus} {responseStatusText}
              </span>
            )}

            {responseTime !== null && (
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                <Clock className="w-3 h-3" />
                {responseTime} ms
              </span>
            )}

            {responseSize !== null && (
              <span className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                <HardDrive className="w-3 h-3" />
                {responseSize}
              </span>
            )}
          </div>

          <button
            onClick={handleCopyResponse}
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {copiedResponse ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        </div>

        {/* JSON Viewer */}
        <div className="flex-1 overflow-auto p-3 font-mono text-xs bg-zinc-950/90 leading-relaxed">
          {responseData !== null ? (
            <pre className="text-emerald-400/90 whitespace-pre">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-400 text-xs">
              Click "Send Request" to invoke this live endpoint
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
