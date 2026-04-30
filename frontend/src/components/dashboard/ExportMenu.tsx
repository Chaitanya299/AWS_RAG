import { Download, FileJson, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import type { ChatMessage } from "@/lib/types.ts";
import { toast } from "sonner";

interface ExportMenuProps {
  messages: ChatMessage[];
}

export function ExportMenu({ messages }: ExportMenuProps) {
  const disabled = messages.length === 0;

  const exportJson = () => {
    const data = {
      exported_at: new Date().toISOString(),
      message_count: messages.length,
      conversation: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).toISOString(),
        latency_ms: m.latency_ms,
        sources: m.sources?.map((s, i) => ({
          index: i + 1,
          score: s.score,
          metadata: s.metadata,
          content_preview: s.content.slice(0, 240),
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aws-rag-conversation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported as JSON");
  };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const maxW = pageW - margin * 2;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 153, 0);
    doc.text("AWS Infrastructure Assistant", margin, y);
    y += 18;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.setFont("helvetica", "normal");
    doc.text(`Conversation export · ${new Date().toLocaleString()}`, margin, y);
    y += 16;
    doc.setDrawColor(220);
    doc.line(margin, y, pageW - margin, y);
    y += 16;

    const ensureSpace = (h: number) => {
      if (y + h > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    };

    messages.forEach((m, idx) => {
      const role = m.role === "user" ? "USER" : "ASSISTANT";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(
        m.role === "user" ? 80 : 255,
        m.role === "user" ? 80 : 153,
        m.role === "user" ? 80 : 0,
      );
      ensureSpace(20);
      doc.text(`${role} · ${new Date(m.timestamp).toLocaleTimeString()}`, margin, y);
      y += 12;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30);
      const lines = doc.splitTextToSize(m.content || "(no content)", maxW);
      lines.forEach((line: string) => {
        ensureSpace(14);
        doc.text(line, margin, y);
        y += 13;
      });

      if (m.sources?.length) {
        y += 4;
        doc.setFontSize(9);
        doc.setTextColor(110);
        ensureSpace(14);
        doc.text(`Sources (${m.sources.length})`, margin, y);
        y += 11;
        m.sources.forEach((s, i) => {
          const file =
            (s.metadata?.file_path as string) || (s.metadata?.source as string) || `chunk-${i + 1}`;
          const txt = `[${i + 1}] ${file} · score ${(s.score * 100).toFixed(0)}%`;
          ensureSpace(11);
          doc.text(txt, margin + 8, y);
          y += 10;
        });
      }
      if (m.latency_ms != null) {
        doc.setFontSize(9);
        doc.setTextColor(140);
        ensureSpace(11);
        doc.text(`latency: ${m.latency_ms}ms`, margin, y);
        y += 11;
      }
      y += 8;
      if (idx < messages.length - 1) {
        ensureSpace(6);
        doc.setDrawColor(235);
        doc.line(margin, y, pageW - margin, y);
        y += 10;
      }
    });

    doc.save(`aws-rag-conversation-${Date.now()}.pdf`);
    toast.success("Conversation exported as PDF");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="glass border-border/60 gap-2"
          disabled={disabled}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass border-border/60">
        <DropdownMenuItem onClick={exportPdf} className="gap-2">
          <FileText className="h-4 w-4 text-primary" /> Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJson} className="gap-2">
          <FileJson className="h-4 w-4 text-accent" /> Download as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
