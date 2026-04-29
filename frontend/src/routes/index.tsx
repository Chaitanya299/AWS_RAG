import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, FileText, Activity, KeyRound } from "lucide-react";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { SourcesSidebar } from "@/components/dashboard/SourcesSidebar";
import { SidebarHeader } from "@/components/dashboard/SidebarHeader";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";
import { ExportMenu } from "@/components/dashboard/ExportMenu";
import { HealthIndicator, LatencyGauge } from "@/components/dashboard/MetricsPanel";
import { SessionLogs } from "@/components/dashboard/SessionLogs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettings } from "@/lib/settings-store.ts";
import type { ChatMessage } from "@/lib/types";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { apiKey, apiBaseUrl } = useSettings();
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [activeMessage, setActiveMessage] = useState<ChatMessage | null>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);

  const sources = activeMessage?.sources ?? [];
  const lastLatency = activeMessage?.latency_ms ?? null;
  const isConfigured = !!apiKey && !!apiBaseUrl;

  const handleAssistantMessage = (m: ChatMessage) => {
    setAllMessages((prev) => {
      const exists = prev.some((p) => p.id === m.id);
      return exists ? prev.map((p) => (p.id === m.id ? m : p)) : [...prev, m];
    });
  };

  const handleCitationClick = (i: number) => {
    setSelectedSource(i);
    document.getElementById(`source-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      {/* Top bar */}
      <header className="flex-shrink-0 glass border-b border-border/60 px-6 h-16 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20"
          >
            <Cloud className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight truncate uppercase tracking-widest text-foreground/90">
              AWS Infrastructure Assistant
            </h1>
            <div className="flex items-center gap-2 -mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                Production RAG Intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ExportMenu messages={allMessages} />
          <SettingsPanel />
        </div>
      </header>

      {/* Modern Bento Grid Layout */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full lg:h-[calc(100vh-160px)]">
          {/* Main Chat Area (7/12 width) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[600px] lg:min-h-0 bg-background/40 backdrop-blur-md rounded-3xl border border-border/60 overflow-hidden shadow-2xl">
            <div className="flex-shrink-0 px-6 h-14 flex items-center justify-between border-b border-border/60 bg-primary/5">
              <div className="flex items-center gap-2.5">
                <Cloud className="h-4.5 w-4.5 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground/90">Assistant Terminal</h2>
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]" />
                 <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Active</span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <ChatPanel
                onAssistantMessage={handleAssistantMessage}
                onCitationClick={handleCitationClick}
                onActiveChange={setActiveMessage}
              />
            </div>
          </div>

          {/* Side Content Container (5/12 width) */}
          <div className="lg:col-span-5 xl:col-span-4 grid grid-cols-1 gap-6">
            {/* References Card */}
            <div className="flex flex-col bg-background/40 backdrop-blur-md rounded-3xl border border-border/60 overflow-hidden shadow-xl min-h-[400px]">
              <SidebarHeader title="References" Icon={FileText} count={sources.length} iconColor="text-accent" />
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <SourcesSidebar
                    sources={sources}
                    selectedIndex={selectedSource}
                    onSelect={setSelectedSource}
                  />
                </div>
              </ScrollArea>
            </div>

            {/* Telemetry Grid (Nested) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col bg-background/40 backdrop-blur-md rounded-3xl border border-border/60 p-4 shadow-lg hover:border-primary/30 transition-colors group">
                 <div className="flex items-center gap-2 mb-4">
                   <Activity className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Latency</span>
                 </div>
                 <LatencyGauge latency={lastLatency} />
              </div>
              <div className="flex flex-col bg-background/40 backdrop-blur-md rounded-3xl border border-border/60 p-4 shadow-lg hover:border-primary/30 transition-colors">
                 <div className="flex items-center gap-2 mb-4">
                   <Cloud className="h-4 w-4 text-accent" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Health</span>
                 </div>
                 <HealthIndicator recentLatency={lastLatency} />
              </div>
            </div>

            {/* Logs Card */}
            <div className="flex flex-col bg-background/40 backdrop-blur-md rounded-3xl border border-border/60 overflow-hidden shadow-lg h-full max-h-[300px]">
               <div className="flex-shrink-0 px-5 h-12 flex items-center border-b border-border/60 bg-background/20">
                 <Activity className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Session Logs</span>
               </div>
               <ScrollArea className="flex-1">
                 <SessionLogs />
               </ScrollArea>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
