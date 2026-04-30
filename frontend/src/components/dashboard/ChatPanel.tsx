import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Square, Sparkles, Zap, AlertCircle, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useSettings } from "../../lib/settings-store.ts";
import { postQuery, streamQuery } from "../../lib/api-client.ts";
import { useSessionLogs } from "../../lib/session-logs.ts";
import type { ChatMessage, SourceChunk } from "../../lib/types.ts";
import { ChatBubble } from "./ChatBubble.tsx";
import { ThinkingBubble } from "./ThinkingStepper.tsx";

const SUGGESTIONS = [
  "What are the AWS best practices for protecting against DDoS attacks?",
  "How do I optimize costs for a high-traffic RDS instance?",
  "Explain the differences between VPC Peering and Transit Gateway.",
  "How can I implement a serverless CI/CD pipeline using AWS CodePipeline?",
];

interface ChatPanelProps {
  onAssistantMessage: (m: ChatMessage) => void;
  onCitationClick: (sourceIndex: number) => void;
  onActiveChange: (m: ChatMessage | null) => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChatPanel({ onAssistantMessage, onCitationClick, onActiveChange }: ChatPanelProps) {
  const { apiBaseUrl, streamingEnabled } = useSettings();
  const addLog = useSessionLogs((s) => s.addLog);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinkingStep, setThinkingStep] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Notify parent of last assistant message for source graph display
  useEffect(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && !m.streaming);
    onActiveChange(lastAssistant ?? null);
  }, [messages, onActiveChange]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const standardMutation = useMutation({
    mutationFn: async (question: string) => {
      const start = performance.now();
      const res = await postQuery({ question });
      return { res, elapsed: Math.round(performance.now() - start) };
    },
  });

  const isLoading = standardMutation.isPending || messages.some((m) => m.streaming);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;
    if (!apiBaseUrl) {
      setError("Configure your API Base URL in Settings to start querying.");
      return;
    }
    setError(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: question,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);

    if (streamingEnabled) {
      const assistantId = uid();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
      };
      setMessages((m) => [...m, assistantMsg]);
      setThinkingStep("Retrieving context…");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const collectedSources: SourceChunk[] = [];
        const result = await streamQuery(
          { question },
          {
            signal: controller.signal,
            onStep: (step) => setThinkingStep(step),
            onToken: (token) => {
              setThinkingStep(undefined);
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: msg.content + token } : msg,
                ),
              );
            },
            onSources: (sources) => {
              collectedSources.splice(0, collectedSources.length, ...sources);
              setMessages((m) =>
                m.map((msg) => (msg.id === assistantId ? { ...msg, sources } : msg)),
              );
            },
          },
        );

        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  streaming: false,
                  latency_ms: result.latency_ms,
                  sources: result.sources.length ? result.sources : collectedSources,
                }
              : msg,
          ),
        );
        const finalMsg: ChatMessage = {
          ...assistantMsg,
          content: "",
          streaming: false,
          latency_ms: result.latency_ms,
          sources: result.sources.length ? result.sources : collectedSources,
        };
        // pull final content from state for log/parent
        setMessages((m) => {
          const final = m.find((x) => x.id === assistantId);
          if (final) {
            onAssistantMessage(final);
            addLog({
              id: assistantId,
              question,
              answer: final.content,
              latency_ms: final.latency_ms ?? result.latency_ms,
              source_count: final.sources?.length ?? 0,
              timestamp: Date.now(),
              streamed: true,
            });
          }
          return m;
        });
        void finalMsg;
      } catch (err) {
        const isAbort = (err as Error).name === "AbortError";
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  streaming: false,
                  content:
                    msg.content +
                    (isAbort ? "\n\n_(stopped)_" : `\n\n_Error: ${(err as Error).message}_`),
                }
              : msg,
          ),
        );
        if (!isAbort) setError((err as Error).message);
      } finally {
        setThinkingStep(undefined);
        abortRef.current = null;
      }
    } else {
      try {
        setThinkingStep("Synthesizing answer…");
        const { res, elapsed } = await standardMutation.mutateAsync(question);
        const assistantMsg: ChatMessage = {
          id: uid(),
          role: "assistant",
          content: res.answer,
          sources: res.sources,
          latency_ms: res.latency_ms ?? elapsed,
          timestamp: Date.now(),
        };
        setMessages((m) => [...m, assistantMsg]);
        onAssistantMessage(assistantMsg);
        addLog({
          id: assistantMsg.id,
          question,
          answer: res.answer,
          latency_ms: assistantMsg.latency_ms ?? elapsed,
          source_count: res.sources?.length ?? 0,
          timestamp: Date.now(),
          streamed: false,
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setThinkingStep(undefined);
      }
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-10 py-8">
        <motion.div layout className="max-w-5xl mx-auto space-y-8">
          {messages.length === 0 && !isLoading && <EmptyState onPick={(q) => setInput(q)} />}

          <AnimatePresence initial={false} mode="popLayout">
            {messages.map((msg) => (
              <motion.div key={msg.id} layout>
                <ChatBubble message={msg} onCitationClick={onCitationClick} />
              </motion.div>
            ))}
          </AnimatePresence>

          {(standardMutation.isPending ||
            (thinkingStep &&
              messages[messages.length - 1]?.streaming &&
              !messages[messages.length - 1]?.content)) && (
            <motion.div layout>
              <ThinkingBubble step={thinkingStep} />
            </motion.div>
          )}

          <div ref={endRef} />
        </motion.div>
      </div>

      {/* Input */}
      <div className="border-t border-border/60 bg-background/40 backdrop-blur-xl px-4 sm:px-8 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md p-2"
            >
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}
          <div className="relative glass border border-border/60 rounded-2xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ask about AWS architecture, services, IaC, security…"
              rows={1}
              className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 px-4 py-3.5 pr-28 min-h-[52px] max-h-40 text-sm placeholder:text-muted-foreground/70"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">
                {streamingEnabled ? (
                  <>
                    <Zap className="h-2.5 w-2.5 text-accent" /> Stream
                  </>
                ) : (
                  "Sync"
                )}
              </span>
              {isLoading ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={stop}
                  variant="destructive"
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim()}
                  className="h-8 w-8 p-0 rounded-lg bg-gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
            Press <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">Enter</kbd> to
            send ·{" "}
            <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">Shift+Enter</kbd> for
            new line
          </p>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 min-h-[70vh] text-center"
    >
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-primary mb-6 pulse-ring shadow-lg shadow-primary/20">
        <Cloud className="h-8 w-8 text-primary-foreground" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-3">
        <span className="text-gradient-primary">AWS Infrastructure</span> Assistant
      </h2>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
        Enterprise-grade RAG intelligence for AWS architecture, services, IaC and security — with
        traceable, cited sources you can audit.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left items-stretch">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
            onClick={() => onPick(s)}
            className="group glass border border-border/60 hover:border-primary/40 rounded-xl p-4 text-xs transition-all hover:bg-primary/5 text-left h-full flex flex-col justify-center shadow-sm hover:shadow-primary/5"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors font-medium leading-relaxed">
                {s}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
