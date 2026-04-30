import axios, { type AxiosInstance } from "axios";
import { useSettings } from "./settings-store.ts";
import type { HealthResponse, QueryRequest, QueryResponse, SourceChunk } from "./types.ts";

function getClient(): AxiosInstance {
  let { apiBaseUrl } = useSettings.getState();

  // Robust base URL discovery
  if (!apiBaseUrl && typeof window !== "undefined") {
    apiBaseUrl = window.location.origin;
  }

  const client = axios.create({
    baseURL: apiBaseUrl || "",
    timeout: 60_000,
  });

  // Interceptor: attach X-API-KEY to every request
  client.interceptors.request.use((config) => {
    const { apiKey } = useSettings.getState();
    if (apiKey) {
      config.headers.set("X-API-KEY", apiKey);
    }
    return config;
  });

  return client;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const { apiBaseUrl } = useSettings.getState();
  const { data } = await getClient().get<HealthResponse>("/api/health");
  return data;
}

export async function postQuery(body: QueryRequest): Promise<QueryResponse> {
  const { apiBaseUrl } = useSettings.getState();
  const { data } = await getClient().post<QueryResponse>("/api/query", body);
  return data;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onSources?: (sources: SourceChunk[]) => void;
  onLatency?: (ms: number) => void;
  onStep?: (step: string) => void;
  signal?: AbortSignal;
}

/**
 * Stream tokens from /query/stream. Supports either:
 *  - Server-Sent Events (text/event-stream) with `data: {...}` lines
 *  - Plain text streaming chunks (raw token text)
 *
 * Recognized JSON event payloads:
 *   { type: "token", content: "..." }
 *   { type: "sources", sources: SourceChunk[] }
 *   { type: "latency", latency_ms: number }
 *   { type: "step", step: "Retrieving context..." }
 *   { type: "done" }
 */
export async function streamQuery(
  body: QueryRequest,
  cb: StreamCallbacks,
): Promise<{ latency_ms: number; sources: SourceChunk[] }> {
  const { apiBaseUrl, apiKey } = useSettings.getState();
  if (!apiBaseUrl) throw new Error("API base URL not configured");

  const start = performance.now();
  const res = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/stream-query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-API-KEY": apiKey } : {}),
    },
    body: JSON.stringify(body),
    signal: cb.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sources: SourceChunk[] = [];
  let latency_ms = 0;

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    // SSE format
    let payload = trimmed;
    if (payload.startsWith("data:")) payload = payload.slice(5).trim();
    if (payload === "[DONE]") return;

    try {
      const evt = JSON.parse(payload);
      if (evt.type === "token" && typeof evt.content === "string") {
        cb.onToken(evt.content);
      } else if (evt.type === "sources" && Array.isArray(evt.sources)) {
        sources = evt.sources;
        cb.onSources?.(sources);
      } else if (evt.type === "latency" && typeof evt.latency_ms === "number") {
        latency_ms = evt.latency_ms;
        cb.onLatency?.(latency_ms);
      } else if (evt.type === "step" && typeof evt.step === "string") {
        cb.onStep?.(evt.step);
      } else if (typeof evt.token === "string") {
        cb.onToken(evt.token);
      } else if (typeof evt.content === "string") {
        cb.onToken(evt.content);
      }
    } catch {
      // Not JSON — treat as raw token text
      cb.onToken(payload);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Split on newlines for SSE / NDJSON
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) handleLine(line);
  }
  if (buffer.trim()) handleLine(buffer);

  if (!latency_ms) latency_ms = Math.round(performance.now() - start);
  return { latency_ms, sources };
}
