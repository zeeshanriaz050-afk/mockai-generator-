export interface EndpointDef {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  requestBodySample?: any;
  responseSample?: any;
}

export interface MockResource {
  id: string | number;
  [key: string]: any;
}

export interface MockProject {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  collections: Record<string, MockResource[]>;
  initialCollections: Record<string, MockResource[]>;
  endpoints: EndpointDef[];
  latencyMs: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  resourceCount: number;
  endpointCount: number;
  resources: string[];
  latencyMs: number;
}

export type SnippetLanguage =
  | "fetch"
  | "axios"
  | "react-hook"
  | "react-query"
  | "nextjs"
  | "typescript"
  | "curl";
