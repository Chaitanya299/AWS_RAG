import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface SidebarHeaderProps {
  title: string;
  Icon: LucideIcon;
  count?: number;
  iconColor?: string;
  loading?: boolean;
}

export function SidebarHeader({
  title,
  Icon,
  count,
  iconColor = "text-primary",
  loading = false,
}: SidebarHeaderProps) {
  return (
    <div className="flex-shrink-0 px-5 h-14 flex items-center justify-between border-b border-border/60 bg-background/50">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <Icon className={`h-4.5 w-4.5 ${iconColor} transition-transform hover:scale-110`} />
          {loading && (
            <motion.span
              layoutId="header-loading"
              className="absolute inset-0 rounded-full border border-primary/40"
              animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
        </div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground/90">{title}</h2>
      </div>
      {count != null && count > 0 && !loading && (
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-[11px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-mono font-bold border border-accent/20"
        >
          {count}
        </motion.span>
      )}
    </div>
  );
}
