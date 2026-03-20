import { Item, ConsumptionRecord } from "@/types/inventory";

const today = new Date();
const d = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};
const past = (days: number) => d(-days);

export const seedItems: Item[] = [
  { id: "1", name: "Organic Coffee Beans", quantity: 5, expiryDate: d(45), category: "Beverages", location: "Pantry Shelf A", minThreshold: 2, maxThreshold: 10, unit: "bags", createdAt: past(30), updatedAt: past(2) },
  { id: "2", name: "Almond Milk", quantity: 3, expiryDate: d(5), category: "Dairy Alternatives", location: "Fridge 2", minThreshold: 2, maxThreshold: 6, unit: "cartons", createdAt: past(14), updatedAt: past(1) },
  { id: "3", name: "Fresh Spinach", quantity: 2, expiryDate: d(2), category: "Vegetables", location: "Fridge 1", minThreshold: 3, maxThreshold: 8, unit: "bags", createdAt: past(5), updatedAt: past(1) },
  { id: "4", name: "Greek Yogurt", quantity: 8, expiryDate: d(10), category: "Dairy", location: "Fridge 1", minThreshold: 4, maxThreshold: 12, unit: "cups", createdAt: past(7), updatedAt: past(3) },
  { id: "5", name: "Whole Wheat Bread", quantity: 1, expiryDate: d(1), category: "Bakery", location: "Pantry Shelf B", minThreshold: 2, maxThreshold: 5, unit: "loaves", createdAt: past(4), updatedAt: past(0) },
  { id: "6", name: "Cherry Tomatoes", quantity: 4, expiryDate: d(6), category: "Vegetables", location: "Fridge 1", minThreshold: 2, maxThreshold: 8, unit: "packs", createdAt: past(3), updatedAt: past(1) },
  { id: "7", name: "Orange Juice", quantity: 6, expiryDate: d(12), category: "Beverages", location: "Fridge 2", minThreshold: 2, maxThreshold: 8, unit: "bottles", createdAt: past(10), updatedAt: past(2) },
  { id: "8", name: "Lab Ethanol", quantity: 3, expiryDate: d(90), category: "Lab Supplies", location: "Storage Room", minThreshold: 1, maxThreshold: 5, unit: "liters", createdAt: past(60), updatedAt: past(15) },
  { id: "9", name: "Avocados", quantity: 6, expiryDate: d(3), category: "Produce", location: "Counter", minThreshold: 3, maxThreshold: 10, unit: "pieces", createdAt: past(2), updatedAt: past(0) },
  { id: "10", name: "Oat Milk", quantity: 1, expiryDate: d(8), category: "Dairy Alternatives", location: "Fridge 2", minThreshold: 2, maxThreshold: 6, unit: "cartons", createdAt: past(7), updatedAt: past(1) },
  { id: "11", name: "Mixed Salad Greens", quantity: 2, expiryDate: d(-1), category: "Vegetables", location: "Fridge 1", minThreshold: 2, maxThreshold: 6, unit: "bags", createdAt: past(5), updatedAt: past(2) },
  { id: "12", name: "Kombucha", quantity: 10, expiryDate: d(20), category: "Beverages", location: "Fridge 2", minThreshold: 4, maxThreshold: 15, unit: "bottles", createdAt: past(8), updatedAt: past(3) },
];

export const seedConsumption: ConsumptionRecord[] = [
  { id: "101", itemId: "1", quantity: -1, date: past(28), reason: "used" },
  { id: "102", itemId: "1", quantity: -1, date: past(21), reason: "used" },
  { id: "103", itemId: "1", quantity: -1, date: past(14), reason: "used" },
  { id: "104", itemId: "1", quantity: -1, date: past(7), reason: "used" },
  { id: "105", itemId: "2", quantity: -1, date: past(10), reason: "used" },
  { id: "106", itemId: "2", quantity: -1, date: past(5), reason: "used" },
  { id: "107", itemId: "2", quantity: -1, date: past(2), reason: "used" },
  { id: "108", itemId: "3", quantity: -1, date: past(3), reason: "used" },
  { id: "109", itemId: "3", quantity: -1, date: past(1), reason: "used" },
  { id: "110", itemId: "4", quantity: -2, date: past(5), reason: "used" },
  { id: "111", itemId: "4", quantity: -1, date: past(2), reason: "used" },
  { id: "112", itemId: "5", quantity: -1, date: past(2), reason: "used" },
  { id: "113", itemId: "5", quantity: -1, date: past(1), reason: "used" },
  { id: "114", itemId: "6", quantity: -1, date: past(2), reason: "used" },
  { id: "115", itemId: "7", quantity: -1, date: past(7), reason: "used" },
  { id: "116", itemId: "7", quantity: -1, date: past(3), reason: "used" },
  { id: "117", itemId: "9", quantity: -2, date: past(1), reason: "used" },
  { id: "118", itemId: "10", quantity: -1, date: past(4), reason: "used" },
  { id: "119", itemId: "10", quantity: -1, date: past(1), reason: "used" },
  { id: "120", itemId: "11", quantity: -1, date: past(3), reason: "wasted" },
  { id: "121", itemId: "12", quantity: -2, date: past(5), reason: "used" },
  { id: "122", itemId: "12", quantity: -1, date: past(2), reason: "used" },
];
