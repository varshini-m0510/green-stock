import { describe, it, expect, beforeEach } from "vitest";
import { getExpiryStatus, calculateDailyUsage, getAISuggestion, getManualAlert } from "@/lib/forecasting";
import { Item, ConsumptionRecord } from "@/types/inventory";

describe("Expiry Status", () => {
  it("returns critical for items expiring in 2 days", () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const result = getExpiryStatus(d.toISOString());
    expect(result.status).toBe("critical");
    expect(result.emoji).toBe("🔴");
  });

  it("returns warning for items expiring in 5 days", () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const result = getExpiryStatus(d.toISOString());
    expect(result.status).toBe("warning");
    expect(result.emoji).toBe("🟡");
  });

  it("returns good for items expiring in 15 days", () => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    const result = getExpiryStatus(d.toISOString());
    expect(result.status).toBe("good");
    expect(result.emoji).toBe("🟢");
  });

  it("returns expired for past dates", () => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    const result = getExpiryStatus(d.toISOString());
    expect(result.status).toBe("expired");
  });
});

describe("Daily Usage Calculation", () => {
  it("calculates correct daily usage from records", () => {
    const now = new Date();
    const records: ConsumptionRecord[] = [
      { id: "1", itemId: "x", quantity: -2, date: new Date(now.getTime() - 7 * 86400000).toISOString(), reason: "used" },
      { id: "2", itemId: "x", quantity: -1, date: new Date(now.getTime() - 3 * 86400000).toISOString(), reason: "used" },
      { id: "3", itemId: "x", quantity: -1, date: now.toISOString(), reason: "used" },
    ];
    const rate = calculateDailyUsage(records);
    // 4 units over 7 days ≈ 0.57/day
    expect(rate).toBeGreaterThan(0.5);
    expect(rate).toBeLessThan(0.7);
  });

  it("returns 0 for no records", () => {
    expect(calculateDailyUsage([])).toBe(0);
  });
});

describe("AI Suggestions", () => {
  const baseItem: Item = {
    id: "1", name: "Test", quantity: 3, expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    category: "Test", location: "", minThreshold: 2, maxThreshold: 10, unit: "pieces",
    createdAt: "", updatedAt: "",
  };

  it("returns suggestion for depleting item", () => {
    const now = Date.now();
    const records: ConsumptionRecord[] = [
      { id: "1", itemId: "1", quantity: -1, date: new Date(now - 3 * 86400000).toISOString(), reason: "used" },
      { id: "2", itemId: "1", quantity: -1, date: new Date(now - 1 * 86400000).toISOString(), reason: "used" },
      { id: "3", itemId: "1", quantity: -1, date: new Date(now).toISOString(), reason: "used" },
    ];
    const suggestion = getAISuggestion(baseItem, records);
    expect(suggestion).not.toBeNull();
    expect(suggestion!.type).toBe("ai");
    expect(suggestion!.message).toContain("run out in");
  });

  it("returns null for well-stocked item with no usage", () => {
    const result = getAISuggestion({ ...baseItem, quantity: 100 }, []);
    expect(result).toBeNull();
  });
});

describe("Manual Alerts", () => {
  it("returns alert when quantity <= minThreshold", () => {
    const item: Item = {
      id: "1", name: "Low Item", quantity: 1, expiryDate: "", category: "", location: "",
      minThreshold: 2, maxThreshold: 10, unit: "pieces", createdAt: "", updatedAt: "",
    };
    const alert = getManualAlert(item);
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("manual");
    expect(alert!.message).toContain("Low stock");
  });

  it("returns null when quantity > minThreshold", () => {
    const item: Item = {
      id: "1", name: "OK Item", quantity: 5, expiryDate: "", category: "", location: "",
      minThreshold: 2, maxThreshold: 10, unit: "pieces", createdAt: "", updatedAt: "",
    };
    expect(getManualAlert(item)).toBeNull();
  });
});
