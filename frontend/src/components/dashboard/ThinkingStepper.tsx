import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Search, Brain, FileSearch, CheckCircle2 } from "lucide-react";

const STEPS = [
  { key: "retrieving", label: "Retrieving context…", Icon: Search },
  { key: "ranking", label: "Ranking sources…", Icon: FileSearch },
  { key: "synthesizing", label: "Synthesizing answer…", Icon: Brain },
];

interface ThinkingStepperProps {
  currentStep?: string;
}

export function ThinkingStepper({ currentStep }: ThinkingStepperProps) {
  // If backend sends step events, use them; otherwise auto-cycle.
  const matched = STEPS.findIndex(
    (s) =>
      currentStep?.toLowerCase().includes(s.key) ||
      currentStep?.toLowerCase().includes(s.label.toLowerCase().slice(0, 6)),
  );
  const activeIndex = matched >= 0 ? matched : -1;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        <span className="text-xs font-medium">Thinking</span>
      </div>
      <div className="space-y-1.5">
        {STEPS.map((step, i) => {
          const isActive = activeIndex === -1 ? true : i <= activeIndex;
          const isCurrent = activeIndex === -1 || i === activeIndex;
          const isComplete = activeIndex > i;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: isActive ? 1 : 0.35, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-2.5 text-xs"
            >
              <div className="relative flex items-center justify-center h-5 w-5">
                {isComplete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <>
                    <step.Icon
                      className={`h-3.5 w-3.5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}
                    />
                    {isCurrent && (
                      <motion.span
                        className="absolute inset-0 rounded-full border border-primary/40"
                        animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity }}
                      />
                    )}
                  </>
                )}
              </div>
              <span className={isCurrent ? "text-foreground" : "text-muted-foreground"}>
                {step.label}
              </span>
              {isCurrent && (
                <div className="ml-auto flex gap-0.5">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1 w-1 rounded-full bg-primary"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.15 }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function ThinkingBubble({ step }: { step?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="glass border border-border/60 rounded-2xl rounded-tl-sm p-5 max-w-md shadow-lg"
      >
        <ThinkingStepper currentStep={step} />
      </motion.div>
    </AnimatePresence>
  );
}
