import { EndpointDef, SnippetLanguage } from "../types";

export function generateSnippet(
  language: SnippetLanguage,
  endpoint: EndpointDef,
  baseUrl: string
): string {
  const fullUrl = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method;
  const isBodyAllowed = ["POST", "PUT", "PATCH"].includes(method);
  const sampleBody = endpoint.requestBodySample
    ? JSON.stringify(endpoint.requestBodySample, null, 2)
    : '{\n  // Request payload here\n}';

  switch (language) {
    case "fetch": {
      if (method === "GET") {
        return `// ⚡ Standard Fetch API - GET Request
async function fetchData() {
  try {
    const response = await fetch("${fullUrl}", {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log("Mock data received:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch mock API:", error);
    throw error;
  }
}

// Call function
fetchData();`;
      } else {
        return `// ⚡ Standard Fetch API - ${method} Request
async function sendData() {
  try {
    const payload = ${sampleBody};

    const response = await fetch("${fullUrl}", {
      method: "${method}",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const result = await response.json();
    console.log("Response:", result);
    return result;
  } catch (error) {
    console.error("Failed request:", error);
    throw error;
  }
}

sendData();`;
      }
    }

    case "axios": {
      if (method === "GET") {
        return `// 📦 Axios HTTP Client - GET Request
import axios from "axios";

async function getMockData() {
  try {
    const { data } = await axios.get("${fullUrl}", {
      headers: {
        "Accept": "application/json",
      },
      // Optional timeout in ms
      timeout: 10000,
    });

    console.log("Axios data:", data);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error response:", error.response?.data);
    } else {
      console.error("Unexpected error:", error);
    }
    throw error;
  }
}`;
      } else {
        const axiosMethod = method.toLowerCase();
        return `// 📦 Axios HTTP Client - ${method} Request
import axios from "axios";

async function submitMockData() {
  const payload = ${sampleBody};

  try {
    const { data } = await axios.${axiosMethod}("${fullUrl}", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("${method} success:", data);
    return data;
  } catch (error) {
    console.error("Axios failed:", error);
    throw error;
  }
}`;
      }
    }

    case "react-hook": {
      const resourceName = endpoint.path.replace(/\//g, "_").replace(/[:\-]/g, "") || "data";
      return `// ⚛️ Ready-to-copy React Component Hook
import React, { useState, useEffect } from "react";

export function useMockApi() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch("${fullUrl}");
        if (!res.ok) throw new Error(\`Failed to fetch with status: \${res.status}\`);
        const json = await res.json();
        if (isMounted) setData(json);
      } catch (err: any) {
        if (isMounted) setError(err.message || "Failed to load");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => { isMounted = false; };
  }, []);

  return { data, loading, error };
}

// Example Component Usage:
export function MockApiWidget() {
  const { data, loading, error } = useMockApi();

  if (loading) return <div className="p-4 text-gray-500 animate-pulse">Loading mock data...</div>;
  if (error) return <div className="p-4 text-red-500 bg-red-50 rounded">Error: {error}</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="font-semibold mb-2">Endpoint: ${endpoint.path}</h3>
      <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60 font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}`;
    }

    case "react-query": {
      const queryKey = endpoint.path.split("/").filter(Boolean);
      return `// 🔄 TanStack React Query (v5)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// 1. Fetch Query Hook
export function use${capitalize(queryKey[0] || "MockData")}() {
  return useQuery({
    queryKey: ${JSON.stringify(queryKey)},
    queryFn: async () => {
      const res = await fetch("${fullUrl}");
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
${
  isBodyAllowed
    ? `
// 2. Mutation Hook for ${method}
export function useCreate${capitalize(queryKey[0] || "Item")}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: any) => {
      const res = await fetch("${fullUrl}", {
        method: "${method}",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (!res.ok) throw new Error("Mutation failed");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ${JSON.stringify(queryKey)} });
    },
  });
}`
    : ""
}`;
    }

    case "nextjs": {
      return `// 🔺 Next.js App Router (Server Component)
// app${endpoint.path}/page.tsx

async function getMockData() {
  const res = await fetch("${fullUrl}", {
    // Revalidate every 60 seconds (ISR) or use { cache: 'no-store' } for dynamic
    next: { revalidate: 60 },
    headers: {
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data from mock endpoint");
  }

  return res.json();
}

export default async function Page() {
  const data = await getMockData();

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Live Mock Data: ${endpoint.path}</h1>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-sm font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}`;
    }

    case "typescript": {
      return generateTypeScriptTypes(endpoint);
    }

    case "curl": {
      if (method === "GET") {
        return `# 💻 Test instantly in your terminal:
curl -X GET "${fullUrl}" \\
  -H "Accept: application/json"`;
      } else {
        const compactJson = JSON.stringify(endpoint.requestBodySample || { test: true });
        return `# 💻 Test ${method} in terminal:
curl -X ${method} "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${compactJson}'`;
      }
    }

    default:
      return "";
  }
}

function capitalize(str: string): string {
  if (!str) return "Item";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateTypeScriptTypes(endpoint: EndpointDef): string {
  const sample = endpoint.responseSample || endpoint.requestBodySample;
  if (!sample) {
    return `// TypeScript Interfaces
export interface ApiResponse {
  [key: string]: any;
}`;
  }

  const targetObj = Array.isArray(sample) ? sample[0] : sample;
  if (!targetObj || typeof targetObj !== "object") {
    return `// TypeScript Type
export type ApiResponse = ${typeof sample};`;
  }

  const lines: string[] = [];
  lines.push(`// 🔷 Auto-inferred TypeScript Interface`);
  lines.push(`export interface ${capitalize(endpoint.path.split("/").filter(Boolean)[0] || "Entity")} {`);

  for (const [key, value] of Object.entries(targetObj)) {
    const valType = inferType(value);
    lines.push(`  ${key}: ${valType};`);
  }

  lines.push(`}`);

  if (Array.isArray(sample)) {
    lines.push(
      `\nexport type ${capitalize(endpoint.path.split("/").filter(Boolean)[0] || "Entity")}ListResponse = ${capitalize(
        endpoint.path.split("/").filter(Boolean)[0] || "Entity"
      )}[];`
    );
  }

  return lines.join("\n");
}

function inferType(val: any): string {
  if (val === null || val === undefined) return "any";
  if (typeof val === "string") return "string";
  if (typeof val === "number") return "number";
  if (typeof val === "boolean") return "boolean";
  if (Array.isArray(val)) {
    if (val.length === 0) return "any[]";
    return `${inferType(val[0])}[]`;
  }
  if (typeof val === "object") {
    return "Record<string, any>";
  }
  return "any";
}
