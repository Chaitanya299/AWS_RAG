import { useState } from "react";
import {
  Settings as SettingsIcon,
  KeyRound,
  Globe,
  Zap,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/settings-store";
import { toast } from "sonner";

export function SettingsPanel() {
  const { apiBaseUrl, apiKey, streamingEnabled, setApiBaseUrl, setApiKey, setStreamingEnabled } =
    useSettings();
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiBaseUrl);
  const [tempKey, setTempKey] = useState(apiKey);

  const handleSave = () => {
    setApiBaseUrl(tempUrl.trim().replace(/\/$/, ""));
    setApiKey(tempKey.trim());
    toast.success("Settings saved", { description: "Credentials stored in your browser." });
    setOpen(false);
  };

  const isConfigured = !!apiBaseUrl && !!apiKey;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setTempUrl(apiBaseUrl);
          setTempKey(apiKey);
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="glass border-border/60 gap-2 relative">
          <SettingsIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
          {!isConfigured && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-warning animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="glass border-l-border/60 w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            Connection Settings
          </SheetTitle>
          <SheetDescription>
            Configure your AWS Infrastructure Assistant API endpoint. Stored locally in this
            browser.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4">
          <div className="space-y-2">
            <Label
              htmlFor="api-url"
              className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"
            >
              <Globe className="h-3.5 w-3.5" />
              API Base URL
            </Label>
            <Input
              id="api-url"
              type="url"
              placeholder="https://api.example.com"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              className="font-mono text-sm bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="api-key"
              className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"
            >
              <KeyRound className="h-3.5 w-3.5" />
              X-API-KEY
            </Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="font-mono text-sm bg-background/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Auto-attached as <code className="text-accent">X-API-KEY</code> header on every
              request.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-background/30">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="stream-toggle" className="text-sm font-medium">
                  Streaming Mode
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Use /query/stream for token-by-token responses
                </p>
              </div>
            </div>
            <Switch
              id="stream-toggle"
              checked={streamingEnabled}
              onCheckedChange={setStreamingEnabled}
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90 gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
