import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check, ExternalLink, FileText, Hash } from "lucide-react";
import { useState } from "react";
import type { SourceChunk } from "@/lib/types";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface MarkdownProps {
  content: string;
  streaming?: boolean;
  onCitationClick?: (index: number) => void;
  sources?: SourceChunk[];
}

export function Markdown({ content, streaming, onCitationClick, sources = [] }: MarkdownProps) {
  return (
    <div className={`prose-chat text-sm ${streaming ? "stream-cursor" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom renderer for text to detect [n] patterns
          text(props) {
            const { children } = props;
            if (typeof children !== "string") return <>{children}</>;

            // Regex to find [n] where n is a number
            const parts = children.split(/(\[\d+\])/g);
            return (
              <>
                {parts.map((part, i) => {
                  const match = part.match(/^\[(\d+)\]$/);
                  if (match) {
                    const index = parseInt(match[1], 10) - 1;
                    const s = sources[index];

                    const badge = (
                      <button
                        key={i}
                        onClick={() => onCitationClick?.(index)}
                        className="inline-flex items-center justify-center min-w-[1.4rem] h-5 mx-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-bold font-mono border border-primary/30 hover:bg-primary/25 transition-colors cursor-pointer align-baseline translate-y-[-1px]"
                      >
                        {match[1]}
                      </button>
                    );

                    if (!s) return badge;

                    return (
                      <HoverCard key={i} openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          {badge}
                        </HoverCardTrigger>
                        <HoverCardContent side="top" className="w-80 glass border-border/60 p-0 overflow-hidden shadow-2xl z-50">
                          <div className="p-3 border-b border-border/40 bg-primary/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-bold truncate max-w-[180px]">
                                {(s.metadata?.file_path as string) || (s.metadata?.source as string) || `Source ${index + 1}`}
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
                            <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-4 font-normal">
                              {s.content}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                               <span className="text-[9px] text-primary font-bold uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded">
                                 {Math.round(s.score * 100)}% Match
                               </span>
                               <span className="text-[9px] text-muted-foreground italic">Click to view source</span>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  }
                  return part;
                })}
              </>
            );
          },
          code(props) {
            const { children, className } = props;
            const inline = !className;
            const match = /language-(\w+)/.exec(className || "");
            const codeStr = String(children).replace(/\n$/, "");
            if (inline) {
              return <code className={className}>{children}</code>;
            }
            return <CodeBlock language={match?.[1] ?? "text"} value={codeStr} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="relative group">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border text-[11px] text-muted-foreground font-mono">
        <span>{language}</span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "0.8rem 1rem",
          background: "oklch(0.14 0.012 250)",
          fontSize: "0.78rem",
          lineHeight: "1.55",
        }}
        codeTagProps={{ style: { fontFamily: "ui-monospace, monospace" } }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
