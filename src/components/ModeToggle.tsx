import { SuggestionMode } from "@/types/inventory";
import { Switch } from "@/components/ui/switch";
import { Brain, Shield } from "lucide-react";

interface ModeToggleProps {
  mode: SuggestionMode;
  onToggle: (mode: SuggestionMode) => void;
}

export function ModeToggle({ mode, onToggle }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Shield className="h-4 w-4 text-muted-foreground" />
      <span className={`text-sm ${mode === "manual" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
        Manual
      </span>
      <Switch
        checked={mode === "ai"}
        onCheckedChange={(checked) => onToggle(checked ? "ai" : "manual")}
      />
      <Brain className="h-4 w-4 text-primary" />
      <span className={`text-sm ${mode === "ai" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
        AI Predictions
      </span>
      <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        mode === "ai" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}>
        {mode === "ai" ? "Active" : "Threshold"}
      </span>
    </div>
  );
}
