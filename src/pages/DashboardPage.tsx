import { useInventory } from "@/hooks/useInventory";
import { getExpiryStatus, estimateWasteSaved } from "@/lib/forecasting";
import { ModeToggle } from "@/components/ModeToggle";
import { ExpiryBadge } from "@/components/ExpiryBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, Clock, Leaf, TrendingDown, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { items, consumption, activity, mode, suggestions, setMode } = useInventory();

  const expiringCount = items.filter(i => {
    const s = getExpiryStatus(i.expiryDate);
    return (s.status === "critical" || s.status === "warning" || s.status === "expired") && i.quantity > 0;
  }).length;

  const lowStockCount = items.filter(i => i.quantity <= i.minThreshold).length;
  const wasteSaved = estimateWasteSaved(consumption);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track, optimize, reduce waste</p>
        </div>
        <ModeToggle mode={mode} onToggle={setMode} />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className="font-display text-3xl font-bold">{items.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent><p className="font-display text-3xl font-bold text-warning">{expiringCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent><p className="font-display text-3xl font-bold text-destructive">{lowStockCount}</p></CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Waste Saved</CardTitle>
            <Leaf className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><p className="font-display text-3xl font-bold text-primary">~${wasteSaved}</p><p className="text-xs text-muted-foreground">estimated this month</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reorder Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4" />
              {mode === "ai" ? "AI Reorder Suggestions" : "Threshold Alerts"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No alerts — everything looks good! ✨</p>
            )}
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                <div className={`mt-0.5 h-2 w-2 rounded-full ${s.type === "ai" ? "bg-primary animate-pulse-green" : "bg-warning"}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.item.name}</p>
                  <p className="text-xs text-muted-foreground">{s.message}</p>
                </div>
                <ExpiryBadge expiryDate={s.item.expiryDate} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${
                  a.action === "created" ? "bg-primary" :
                  a.action === "deleted" ? "bg-destructive" :
                  "bg-muted-foreground"
                }`} />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{a.itemName}</span>{" "}
                  <span className="text-muted-foreground">{a.details}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}</span>
              </div>
            ))}
            {activity.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No activity yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items expiring soon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items Expiring Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items
              .filter(i => {
                const s = getExpiryStatus(i.expiryDate);
                return s.status !== "good" && i.quantity > 0;
              })
              .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
              .slice(0, 6)
              .map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} {item.unit} • {item.location}</p>
                  </div>
                  <ExpiryBadge expiryDate={item.expiryDate} />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
