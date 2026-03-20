import { useMemo, useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { ModeToggle } from "@/components/ModeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { getExpiryStatus } from "@/lib/forecasting";
import { TrendingDown, PieChartIcon, Recycle, Sparkles, Loader } from "lucide-react";
import { toast } from "sonner";
import { buildInventoryContext, callAI } from "@/lib/aiAnalysis";
import TrendChat from "@/components/TrendChat";

const PIE_COLORS = [
  "hsl(152, 55%, 33%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(80, 50%, 50%)",
];

export default function AnalyticsPage() {
  const { items, consumption, mode, suggestions, setMode, adjustQuantity } = useInventory();
  const [wasteItemId, setWasteItemId] = useState("");
  const [wasteQty, setWasteQty] = useState("1");
  const [consumeItemId, setConsumeItemId] = useState("");
  const [consumeQty, setConsumeQty] = useState("1");
  const [donateItemId, setDonateItemId] = useState("");
  const [donateQty, setDonateQty] = useState("1");

  // AI Analysis state
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const availableItems = useMemo(() => items.filter(item => item.quantity > 0), [items]);

  // Expiry distribution chart data
  const expiryData = useMemo(() => {
    const groups = { good: 0, warning: 0, critical: 0, expired: 0 };
    items.filter(item => item.quantity > 0).forEach(item => { groups[getExpiryStatus(item.expiryDate).status]++; });
    return [
      { name: "Good (>7d)", value: groups.good, fill: PIE_COLORS[0] },
      { name: "Warning (3-7d)", value: groups.warning, fill: PIE_COLORS[1] },
      { name: "Critical (<3d)", value: groups.critical, fill: PIE_COLORS[2] },
      { name: "Expired", value: groups.expired, fill: PIE_COLORS[3] },
    ].filter(d => d.value > 0);
  }, [items]);

  // Waste vs used breakdown
  const wasteData = useMemo(() => {
    const used = consumption.filter(r => r.reason === "used").reduce((s, r) => s + Math.abs(r.quantity), 0);
    const wasted = consumption.filter(r => r.reason === "wasted").reduce((s, r) => s + Math.abs(r.quantity), 0);
    const donated = consumption.filter(r => r.reason === "donated").reduce((s, r) => s + Math.abs(r.quantity), 0);
    return [
      { name: "Used", value: used },
      { name: "Wasted", value: wasted },
      { name: "Donated", value: donated },
    ];
  }, [consumption]);

  function logWaste() {
    if (!wasteItemId) { toast.error("Select an item"); return; }
    const qty = Number(wasteQty);
    if (qty <= 0) { toast.error("Quantity must be > 0"); return; }
    adjustQuantity(wasteItemId, -qty, "wasted");
    toast.success("Waste logged");
    setWasteItemId("");
    setWasteQty("1");
  }

  function logConsumption() {
    if (!consumeItemId) { toast.error("Select an item"); return; }
    const qty = Number(consumeQty);
    if (qty <= 0) { toast.error("Quantity must be > 0"); return; }
    adjustQuantity(consumeItemId, -qty, "used");
    toast.success("Consumption logged");
    setConsumeItemId("");
    setConsumeQty("1");
  }

  function logDonation() {
    if (!donateItemId) { toast.error("Select an item"); return; }
    const qty = Number(donateQty);
    if (qty <= 0) { toast.error("Quantity must be > 0"); return; }
    adjustQuantity(donateItemId, -qty, "donated");
    toast.success("Donation logged");
    setDonateItemId("");
    setDonateQty("1");
  }

  async function askAI(question: string) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error("API key not configured. Add VITE_OPENAI_API_KEY or VITE_GEMINI_API_KEY to .env");
      return;
    }

    setAiLoading(true);
    setAiResponse("");
    try {
      const context = buildInventoryContext(items, consumption);
      const response = await callAI(question, context, apiKey);
      setAiResponse(response);
      setAiQuestion(question);
    } catch (error: any) {
      toast.error(error.message || "Failed to get AI response");
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <ModeToggle mode={mode} onToggle={setMode} />
      </div>

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="h-4 w-4" />
            {mode === "ai" ? "AI Reorder Suggestions" : "Threshold Alerts"} ({suggestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {suggestions.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">All items stocked well ✨</p>}
          {suggestions.map((s, i) => (
            <div key={i} className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${s.type === "ai" ? "bg-primary" : "bg-warning"}`} />
                <span className="text-sm font-semibold">{s.item.name}</span>
                <span className="ml-auto text-xs text-muted-foreground uppercase">{s.type}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.message}</p>
              {s.type === "ai" && <p className="mt-1 text-xs text-muted-foreground">Daily usage: {s.dailyUsageRate}/day • Depletes in ~{s.daysUntilDepletion}d</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" /> AI Inventory Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" size="sm" onClick={() => askAI("Why is my waste percentage high? What can I do about it?")} disabled={aiLoading}>
              {aiLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              💧 Analyze Waste
            </Button>
            <Button variant="outline" size="sm" onClick={() => askAI("Summarize my inventory health and give me top 3 recommendations")} disabled={aiLoading}>
              {aiLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              📊 Inventory Summary
            </Button>
            <Button variant="outline" size="sm" onClick={() => askAI("Which items should I increase stock for based on consumption trends?")} disabled={aiLoading}>
              {aiLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              📈 Reorder Plan
            </Button>
            <Button variant="outline" size="sm" onClick={() => askAI("What items expire too frequently? How can I reduce expiry?")} disabled={aiLoading}>
              {aiLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              ⏰ Expiry Analysis
            </Button>
          </div>

          {aiResponse && (
            <div className="rounded-lg border bg-muted p-4">
              <p className="mb-2 text-sm font-semibold text-muted-foreground">Q: {aiQuestion}</p>
              <p className="text-sm leading-relaxed">{aiResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expiry Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-4 w-4" /> Expiry Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expiryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {expiryData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Waste Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Recycle className="h-4 w-4" /> Consumption Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={wasteData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(152, 55%, 33%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Consumption Logger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Recycle className="h-4 w-4" /> Log Consumption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label>Item</Label>
              <Select value={consumeItemId} onValueChange={setConsumeItemId}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>{availableItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1">
              <Label>Qty</Label>
              <Input type="number" min="1" value={consumeQty} onChange={e => setConsumeQty(e.target.value)} />
            </div>
            <Button onClick={logConsumption}>Log Consumption</Button>
          </div>
        </CardContent>
      </Card>

      {/* Donation Logger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Recycle className="h-4 w-4" /> Log Donation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label>Item</Label>
              <Select value={donateItemId} onValueChange={setDonateItemId}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>{availableItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1">
              <Label>Qty</Label>
              <Input type="number" min="1" value={donateQty} onChange={e => setDonateQty(e.target.value)} />
            </div>
            <Button onClick={logDonation}>Log Donation</Button>
          </div>
        </CardContent>
      </Card>

      {/* Waste Logger */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Recycle className="h-4 w-4" /> Log Waste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label>Item</Label>
              <Select value={wasteItemId} onValueChange={setWasteItemId}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>{availableItems.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-24 space-y-1">
              <Label>Qty</Label>
              <Input type="number" min="1" value={wasteQty} onChange={e => setWasteQty(e.target.value)} />
            </div>
            <Button onClick={logWaste} variant="destructive">Log Waste</Button>
          </div>
        </CardContent>
      </Card>

      {/* Trend Chat */}
      <TrendChat />
    </div>
  );
}
