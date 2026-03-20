import { useState, useCallback, useMemo } from "react";
import { Item, ConsumptionRecord, ActivityLog, SuggestionMode } from "@/types/inventory";
import * as store from "@/store/inventoryStore";
import { getAISuggestion, getManualAlert, ReorderSuggestion } from "@/lib/forecasting";

export function useInventory() {
  const [items, setItems] = useState<Item[]>(store.getItems());
  const [consumption, setConsumption] = useState<ConsumptionRecord[]>(store.getConsumptionRecords());
  const [activity, setActivity] = useState<ActivityLog[]>(store.getActivityLog());
  const [mode, setModeState] = useState<SuggestionMode>(store.getMode());

  const refresh = useCallback(() => {
    setItems(store.getItems());
    setConsumption(store.getConsumptionRecords());
    setActivity(store.getActivityLog());
  }, []);

  const addItem = useCallback((item: Omit<Item, "id" | "createdAt" | "updatedAt">) => {
    store.addItem(item);
    refresh();
  }, [refresh]);

  const updateItem = useCallback((id: string, updates: Partial<Item>) => {
    store.updateItem(id, updates);
    refresh();
  }, [refresh]);

  const adjustQuantity = useCallback((id: string, delta: number, reason?: ConsumptionRecord["reason"]) => {
    store.adjustQuantity(id, delta, reason);
    refresh();
  }, [refresh]);

  const deleteItem = useCallback((id: string) => {
    store.deleteItem(id);
    refresh();
  }, [refresh]);

  const setMode = useCallback((m: SuggestionMode) => {
    store.setMode(m);
    setModeState(m);
  }, []);

  const suggestions = useMemo((): ReorderSuggestion[] => {
    return items
      .map(item => {
        if (mode === "ai") {
          const itemRecords = consumption.filter(r => r.itemId === item.id);
          return getAISuggestion(item, itemRecords) || getManualAlert(item);
        }
        return getManualAlert(item);
      })
      .filter(Boolean) as ReorderSuggestion[];
  }, [items, consumption, mode]);

  return { items, consumption, activity, mode, suggestions, addItem, updateItem, adjustQuantity, deleteItem, setMode, refresh };
}
