import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, Cloud, Wifi, WifiOff } from "lucide-react";
import { fetchHealth } from "../../lib/api-client.ts";
import { useSettings } from "../../lib/settings-store.ts";
import { Card } from "../ui/card";

interface HealthIndicatorProps {
  recentLatency: number | null;
}

export function HealthIndicator({ recentLatency }: HealthIndicatorProps) {
  const { apiBaseUrl } = useSettings();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["health", apiBaseUrl],
    queryFn: fetchHealth,
    enabled: !!apiBaseUrl,
    refetchInterval: 15_000,
    retry: 1,
  });

  const status = !apiBaseUrl
    ? "unconfigured"
    : isLoading
      ? "checking"
      : isError
        ? "down"
        : "healthy";

  const meta = {
    healthy: {
      color: "text-success",
      dot: "bg-success",
      label: "Operational",
      ring: "shadow-[0_0_12px_oklch(0.72_0.17_155_/_50%)]",
    },
    checking: {
      color: "text-muted-foreground",
      dot: "bg-muted-foreground",
      label: "Checking…",
      ring: "",
    },
    down: {
      color: "text-destructive",
      dot: "bg-destructive",
      label: "Unreachable",
      ring: "shadow-[0_0_12px_oklch(0.62_0.22_25_/_50%)]",
    },
    unconfigured: { color: "text-warning", dot: "bg-warning", label: "Not configured", ring: "" },
  }[status];

  return (
    <Card className="glass p-4 border-border/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Cloud className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              System Health
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`relative flex h-2 w-2`}>
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${meta.dot} ${status === "healthy" ? "animate-ping" : ""}`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${meta.dot} ${meta.ring}`}
                />
              </span>
              <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
            </div>
          </div>
        </div>
        {status === "healthy" ? (
          <Wifi className="h-3.5 w-3.5 text-success/70" />
        ) : (
          <WifiOff className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </div>
      {data && typeof data === "object" && (
        <div className="mt-2.5 pt-2.5 border-t border-border/50 flex items-center gap-2 text-[10px] text-muted-foreground/80 font-medium">
          <Activity className="h-3 w-3 opacity-70" />
          <span className="truncate">
            {Object.entries(data)
              .slice(0, 2)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(" · ")}
          </span>
        </div>
      )}
    </Card>
  );
}

export function LatencyGauge({ latency }: { latency: number | null }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (latency == null) return;
    const start = displayed;
    const delta = latency - start;
    const duration = 600;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(start + delta * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latency]);

  const value = latency ?? 0;
  // Map latency to gauge fill (0–10000ms)
  const pct = Math.min(1, value / 10000);
  const tier = value === 0 ? "fast" : value < 5000 ? "fast" : value < 10000 ? "ok" : "slow";
  const tierColor = {
    fast: "var(--color-success)",
    ok: "var(--color-primary)",
    slow: "var(--color-destructive)",
  }[tier];
  const tierLabel = { fast: "Fast", ok: "Normal", slow: "Slow" }[tier];

  const radius = 38;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference * (1 - pct);

  return (
    <Card className="glass p-4 border-border/60">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Latency
        </p>
        {latency != null && (
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: `${tierColor}20`, color: tierColor }}
          >
            {tierLabel}
          </span>
        )}
      </div>
      <div className="relative flex flex-col items-center justify-center w-full min-h-[110px] py-1">
        <div className="w-full max-w-[180px] aspect-[140/78] relative flex items-center justify-center">
          <svg width="100%" height="100%" viewBox="0 0 100 56" className="overflow-visible">
            <path
              d={`M 12 50 A ${radius} ${radius} 0 0 1 88 50`}
              stroke="oklch(1 0 0 / 8%)"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <motion.path
              d={`M 12 50 A ${radius} ${radius} 0 0 1 88 50`}
              stroke={tierColor}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={false}
              animate={{ strokeDashoffset: offset }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
              style={{ filter: `drop-shadow(0 0 8px ${tierColor})` }}
            />
          </svg>
          <div className="absolute top-[55%] left-0 right-0 text-center -translate-y-1/2">
            <div className="text-2xl font-bold font-mono tabular-nums tracking-tight">
              {latency == null ? "—" : displayed}
              <span className="text-xs font-normal text-muted-foreground ml-0.5">ms</span>
            </div>
            <p className="text-[9px] uppercase tracking-tighter text-muted-foreground/60 leading-none">
              last response
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
