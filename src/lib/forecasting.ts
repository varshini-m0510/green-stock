import { Item, ConsumptionRecord } from "@/types/inventory";

export interface ReorderSuggestion {
  item: Item;
  daysUntilDepletion: number;
  suggestedOrderQty: number;
  dailyUsageRate: number;
  message: string;
  type: "ai" | "manual";
}

/**
 * Calculate moving average daily usage rate from consumption records.
 * Uses the last 30 days of data by default.
 */
export function calculateDailyUsage(records: ConsumptionRecord[], windowDays = 30): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  
  const recent = records.filter(r => new Date(r.date) >= cutoff);
  if (recent.length === 0) return 0;

  const totalConsumed = recent.reduce((sum, r) => sum + Math.abs(r.quantity), 0);
  
  // Calculate actual span of days with data
  const dates = recent.map(r => new Date(r.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const spanDays = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));
  
  return totalConsumed / spanDays;
}

/**
 * AI-mode: predict depletion and suggest reorder quantity
 */
export function getAISuggestion(item: Item, records: ConsumptionRecord[]): ReorderSuggestion | null {
  const dailyRate = calculateDailyUsage(records);
  
  if (dailyRate === 0) return null;
  
  const daysUntilDepletion = Math.floor(item.quantity / dailyRate);
  const leadTimeDays = 3; // assumed delivery lead time
  const bufferDays = 2;
  const suggestedQty = Math.ceil(dailyRate * (leadTimeDays + bufferDays + 7)); // order for ~12 days
  
  if (daysUntilDepletion > 14) return null; // no urgency
  
  return {
    item,
    daysUntilDepletion,
    suggestedOrderQty: Math.min(suggestedQty, item.maxThreshold - item.quantity),
    dailyUsageRate: Math.round(dailyRate * 100) / 100,
    message: `Based on your usage (${dailyRate.toFixed(1)}/day), ${item.name} will run out in ${daysUntilDepletion} days. Consider ordering ${Math.max(1, Math.min(suggestedQty, item.maxThreshold - item.quantity))} ${item.unit}.`,
    type: "ai",
  };
}

/**
 * Manual/fallback mode: simple threshold alerts
 */
export function getManualAlert(item: Item): ReorderSuggestion | null {
  if (item.quantity > item.minThreshold) return null;
  
  const suggestedQty = item.maxThreshold - item.quantity;
  return {
    item,
    daysUntilDepletion: -1,
    suggestedOrderQty: suggestedQty,
    dailyUsageRate: 0,
    message: `Low stock: ${item.name} (Current: ${item.quantity} ${item.unit}, Minimum: ${item.minThreshold} ${item.unit})`,
    type: "manual",
  };
}

/**
 * Get expiry status
 */
export function getExpiryStatus(expiryDate: string): { status: "expired" | "critical" | "warning" | "good"; label: string; emoji: string } {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { status: "expired", label: "Expired", emoji: "🔴" };
  if (diffDays <= 3) return { status: "critical", label: `${diffDays}d left`, emoji: "🔴" };
  if (diffDays <= 7) return { status: "warning", label: `${diffDays}d left`, emoji: "🟡" };
  return { status: "good", label: `${diffDays}d left`, emoji: "🟢" };
}

/**
 * Calculate estimated waste saved (mock calculation based on items tracked)
 */
export function estimateWasteSaved(records: ConsumptionRecord[]): number {
  const wastedRecords = records.filter(r => r.reason === "wasted");
  const usedRecords = records.filter(r => r.reason === "used" || r.reason === "donated");
  
  // Assume average item value of $3, and tracking prevents ~30% of potential waste
  const totalTracked = usedRecords.length + wastedRecords.length;
  const wasteRate = wastedRecords.length / Math.max(1, totalTracked);
  const estimatedPreventedWaste = Math.round(totalTracked * (1 - wasteRate) * 0.3 * 3);
  
  return estimatedPreventedWaste;
}
