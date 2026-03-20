export interface Item {
  id: string;
  name: string;
  quantity: number;
  expiryDate: string;
  category: string;
  location: string;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  soldOutDate?: string;
}

export interface ConsumptionRecord {
  id: string;
  itemId: string;
  quantity: number;
  date: string;
  reason?: "used" | "wasted" | "donated";
}

export interface ActivityLog {
  id: string;
  action: "created" | "updated" | "deleted" | "quantity_changed" | "wasted";
  itemName: string;
  details: string;
  timestamp: string;
}

export type ExpiryStatus = "expired" | "critical" | "warning" | "good";
export type SuggestionMode = "ai" | "manual";
