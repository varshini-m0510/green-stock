import { Item, ConsumptionRecord, ActivityLog, SuggestionMode } from "@/types/inventory";
import { seedItems, seedConsumption } from "@/data/seedData";

const ITEMS_KEY = "greentech_items";
const CONSUMPTION_KEY = "greentech_consumption";
const ACTIVITY_KEY = "greentech_activity";
const MODE_KEY = "greentech_mode";
const SEEDED_KEY = "greentech_seeded";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

function ensureSeeded() {
  if (!localStorage.getItem(SEEDED_KEY)) {
    save(ITEMS_KEY, seedItems);
    save(CONSUMPTION_KEY, seedConsumption);
    save(ACTIVITY_KEY, []);
    localStorage.setItem(SEEDED_KEY, "true");
  }
}

ensureSeeded();

// Items
export function getItems(): Item[] { return load(ITEMS_KEY, []); }
export function getItem(id: string): Item | undefined { return getItems().find(i => i.id === id); }

export function addItem(item: Omit<Item, "id" | "createdAt" | "updatedAt">): Item {
  const items = getItems();
  const newItem: Item = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  items.push(newItem);
  save(ITEMS_KEY, items);
  addActivity("created", newItem.name, `Added ${newItem.quantity} ${newItem.unit}`);
  return newItem;
}

export function updateItem(id: string, updates: Partial<Item>): Item | null {
  const items = getItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  save(ITEMS_KEY, items);
  addActivity("updated", items[idx].name, "Item updated");
  return items[idx];
}

export function adjustQuantity(id: string, delta: number, reason: ConsumptionRecord["reason"] = "used"): Item | null {
  const items = getItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return null;
  const newQty = Math.max(0, items[idx].quantity + delta);
  const updates: Partial<Item> = { quantity: newQty, updatedAt: new Date().toISOString() };
  if (newQty === 0 && items[idx].quantity > 0) {
    updates.soldOutDate = new Date().toISOString();
  }
  items[idx] = { ...items[idx], ...updates };
  save(ITEMS_KEY, items);

  // Record consumption
  const records = getConsumptionRecords();
  records.push({ id: crypto.randomUUID(), itemId: id, quantity: delta, date: new Date().toISOString(), reason });
  save(CONSUMPTION_KEY, records);

  const daysToSoldOut = items[idx].soldOutDate ? Math.floor((new Date(items[idx].soldOutDate!).getTime() - new Date(items[idx].createdAt).getTime()) / (1000 * 60 * 60 * 24)) : null;
  const timeInfo = daysToSoldOut !== null ? ` [Sold out in ${daysToSoldOut} days]` : "";
  addActivity("quantity_changed", items[idx].name, `${delta > 0 ? "+" : ""}${delta} ${items[idx].unit} (${reason})${timeInfo}`);
  return items[idx];
}

export function deleteItem(id: string): boolean {
  const items = getItems();
  const item = items.find(i => i.id === id);
  if (!item) return false;
  save(ITEMS_KEY, items.filter(i => i.id !== id));
  addActivity("deleted", item.name, "Item removed");
  return true;
}

// Consumption
export function getConsumptionRecords(): ConsumptionRecord[] { return load(CONSUMPTION_KEY, []); }
export function getItemConsumption(itemId: string): ConsumptionRecord[] {
  return getConsumptionRecords().filter(r => r.itemId === itemId);
}

// Activity
export function getActivityLog(): ActivityLog[] { return load(ACTIVITY_KEY, []); }
function addActivity(action: ActivityLog["action"], itemName: string, details: string) {
  const log = getActivityLog();
  log.unshift({ id: crypto.randomUUID(), action, itemName, details, timestamp: new Date().toISOString() });
  save(ACTIVITY_KEY, log.slice(0, 50));
}

// Mode
export function getMode(): SuggestionMode { return load(MODE_KEY, "ai"); }
export function setMode(mode: SuggestionMode) { save(MODE_KEY, mode); }
