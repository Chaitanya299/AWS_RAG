export interface QueryRequest {
  question: string;
}

export interface SourceChunk {
  content: string;
  metadata: Record<string, unknown> & {
    file_path?: string;
    page?: number;
    source?: string;
    title?: string;
  };
  score: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
  latency_ms: number;
}

export interface HealthResponse {
  status: string;
  [key: string]: unknown;
}

export interface SessionLog {
  id: string;
  question: string;
  answer: string;
  latency_ms: number;
  source_count: number;
  timestamp: number;
  streamed: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  latency_ms?: number;
  timestamp: number;
  streaming?: boolean;
  thinkingStep?: string;
}
