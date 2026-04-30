import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronDown, ChevronUp, Hash, Copy, Info } from "lucide-react";
import { useState } from "react";
import type { SourceChunk } from "../../lib/types.ts";
import { Card } from "../ui/card.tsx";
import { toast } from "sonner";

interface SourcesSidebarProps {
  sources: SourceChunk[];
  selectedIndex: number | null;
  onSelect: (i: number | null) => void;
}

function ConfidenceGauge({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score));
  const color = pct > 0.75 ? "#10b981" : pct > 0.5 ? "#FF9900" : "#ef4444";
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative flex items-center justify-center h-10 w-10">
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="currentColor"
          strokeWidth="3"
          fill="transparent"
          className="text-muted/20"
        />
        <motion.circle
          cx="20"
          cy="20"
          r={radius}
          stroke={color}
          strokeWidth="3"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[9px] font-bold font-mono">{Math.round(pct * 100)}%</span>
    </div>
  );
}

function SourceCard({
  source,
  index,
  expanded,
  onToggle,
  highlighted,
}: {
  source: SourceChunk;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  highlighted: boolean;
}) {
  const filePath =
    (source.metadata?.file_path as string) ||
    (source.metadata?.source as string) ||
    (source.metadata?.title as string) ||
    `chunk-${index + 1}`;
  const page = source.metadata?.page;

  const copy = () => {
    navigator.clipboard.writeText(source.content);
    toast.success("Snippet copied");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      id={`source-${index}`}
    >
      <Card
        className={`p-3 transition-all cursor-pointer border-border/60 hover:border-primary/40 ${
          highlighted
            ? "border-primary/70 ring-2 ring-primary/30 bg-primary/5 shadow-lg shadow-primary/10"
            : ""
        }`}
        onClick={onToggle}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-[12px] font-bold font-mono border border-primary/20">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <p className="text-xs font-semibold truncate text-foreground" title={filePath}>
                  {filePath}
                </p>
              </div>
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {page != null && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Hash className="h-2.5 w-2.5" />
                  page {String(page)}
                </div>
              )}
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                <Info className="h-2.5 w-2.5" />
                Confidence
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <ConfidenceGauge score={source.score} />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-border/60">
                <div className="bg-background/40 rounded-lg p-2.5 mb-3 border border-border/40">
                  <pre className="text-[11px] font-mono whitespace-pre-wrap break-words text-muted-foreground max-h-60 overflow-y-auto leading-relaxed scrollbar-thin">
                    {source.content}
                  </pre>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                      Metadata
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copy();
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors bg-muted/40 px-2 py-0.5 rounded border border-border/40"
                    >
                      <Copy className="h-2.5 w-2.5" /> Copy Snippet
                    </button>
                  </div>

                  {Object.keys(source.metadata || {}).length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(source.metadata)
                        .filter(([k]) => !["file_path", "source", "title", "page"].includes(k))
                        .slice(0, 6)
                        .map(([k, v]) => (
                          <div
                            key={k}
                            className="flex flex-col p-1.5 rounded bg-muted/30 border border-border/20"
                          >
                            <span className="text-[9px] uppercase text-muted-foreground leading-none mb-1">
                              {k.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] font-mono text-foreground truncate">
                              {String(v)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export function SourcesSidebar({ sources, selectedIndex, onSelect }: SourcesSidebarProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
    onSelect(selectedIndex === i ? null : i);
  };

  if (!sources.length) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-muted-foreground">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <FileText className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">No sources yet</p>
        <p className="text-xs mt-1 max-w-[200px]">
          Reference chunks from retrieved documents will appear here after your first query.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sources.map((s, i) => (
        <SourceCard
          key={i}
          source={s}
          index={i}
          expanded={expanded.has(i) || selectedIndex === i}
          onToggle={() => toggle(i)}
          highlighted={selectedIndex === i}
        />
      ))}
    </div>
  );
}
