import { Clock, FileText, MessageSquare, Trash2 } from "lucide-react";
import { useSessionLogs } from "@/lib/session-logs.ts";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function SessionLogs() {
  const { logs, clear } = useSessionLogs();

  return (
    <div className="glass rounded-xl border border-border/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">Session Logs</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-mono">
            {logs.length}
          </span>
        </div>
        {logs.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clear}>
            <Trash2 className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-muted-foreground">
          No queries yet — your session history will appear here.
        </div>
      ) : (
        <ScrollArea className="max-h-72">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="text-[10px] uppercase tracking-wider h-9">Time</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider h-9 w-full min-w-[120px]">
                  Query
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider h-9 text-right min-w-[70px]">
                  Latency
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider h-9 text-center w-16">
                  Sources
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider h-9 text-center w-16">
                  Mode
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => {
                const tier =
                  log.latency_ms < 800
                    ? "text-success"
                    : log.latency_ms < 2000
                      ? "text-primary"
                      : "text-destructive";
                return (
                  <TableRow key={log.id} className="border-border/40 hover:bg-muted/30">
                    <TableCell className="text-[11px] font-mono text-muted-foreground py-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTime(log.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-2 min-w-0">
                      <div className="truncate max-w-[120px] sm:max-w-none" title={log.question}>
                        {log.question}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs tabular-nums py-2 ${tier}`}>
                      {log.latency_ms}ms
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <FileText className="h-2.5 w-2.5" />
                        {log.source_count}
                      </span>
                    </TableCell>
                    <TableCell className="text-center py-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          log.streamed
                            ? "bg-accent/15 text-accent"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {log.streamed ? "STREAM" : "SYNC"}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}
