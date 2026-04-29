import { motion } from "framer-motion";
import { User, Sparkles, Clock, FileText, Hash } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { Markdown } from "./Markdown";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ChatBubbleProps {
  message: ChatMessage;
  onCitationClick?: (sourceIndex: number) => void;
}

/**
 * Renders inline numeric citations like [1] [2] as clickable badges,
 * by splitting markdown around bracketed digit groups before rendering.
 * Strategy: post-process markdown content to replace [n] with a sentinel
 * the Markdown component renders as-is — but to keep clickable, we render
 * the answer + a footer of citation badges (clean, low-risk).
 */
export function ChatBubble({ message, onCitationClick }: ChatBubbleProps) {
  const isUser = message.role === "user";
  const sources = message.sources ?? [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        layout: { duration: 0.3 },
      }}
      className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center shadow-md ${
          isUser
            ? "bg-secondary text-secondary-foreground border border-border/60"
            : "bg-gradient-primary text-primary-foreground"
        }`}
      >
        {isUser ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </div>

      <div className={`flex-1 max-w-[92%] ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <motion.div
          layout
          className={`rounded-2xl px-5 py-4 shadow-sm ${
            isUser
              ? "bg-secondary border border-border/50 rounded-tr-sm"
              : "glass border border-border/60 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <Markdown
              content={message.content || (message.streaming ? "" : "_(no answer)_")}
              streaming={message.streaming}
              onCitationClick={onCitationClick}
              sources={sources}
            />
          )}
        </motion.div>

        {!isUser && sources.length > 0 && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, layout: { duration: 0.3 } }}
            className="mt-3 flex flex-wrap items-center gap-2 px-1"
          >
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mr-1">
              Citations
            </span>
            {sources.map((s, i) => (
              <HoverCard key={i} openDelay={200} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <button
                    onClick={() => onCitationClick?.(i)}
                    className="group inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="text-[10px] font-bold font-mono text-primary">{i + 1}</span>
                    <div className="h-2 w-[1px] bg-primary/20" />
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                      {Math.round(s.score * 100)}%
                    </span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent side="top" className="w-80 glass border-border/60 p-0 overflow-hidden shadow-2xl">
                  <div className="p-3 border-b border-border/40 bg-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold truncate max-w-[180px]">
                        {(s.metadata?.file_path as string) || (s.metadata?.source as string) || `Source ${i + 1}`}
                      </span>
                    </div>
                    {s.metadata?.page != null && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                        <Hash className="h-2.5 w-2.5" />
                        p.{s.metadata.page}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-4">
                      {s.content}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                       <span className="text-[9px] text-primary font-bold uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded">
                         {Math.round(s.score * 100)}% Match
                       </span>
                       <span className="text-[9px] text-muted-foreground italic">Click to view full source</span>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
            {message.latency_ms != null && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-mono">
                <Clock className="h-3 w-3" />
                {message.latency_ms}ms
              </span>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
