import { useState, useMemo } from "react";
import { useInventory } from "@/hooks/useInventory";
import { Item } from "@/types/inventory";
import { ExpiryBadge } from "@/components/ExpiryBadge";
import { ItemForm } from "@/components/ItemForm";
import { BulkImportDialog } from "@/components/BulkImportDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Trash2, Pencil, Minus, PlusIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { getExpiryStatus } from "@/lib/forecasting";

export default function InventoryPage() {
  const { items, addItem, updateItem, adjustQuantity, deleteItem } = useInventory();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "expiry" | "quantity">("expiry");
  const [formOpen, setFormOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [editItem, setEditItem] = useState<Item | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [showDepleted, setShowDepleted] = useState(false);
  const [editDaysItem, setEditDaysItem] = useState<Item | null>(null);
  const [daysInput, setDaysInput] = useState("0");

  const categories = useMemo(() => [...new Set(items.map(i => i.category))], [items]);

  const getDaysToSoldOut = (item: Item): number | null => {
    if (!item.soldOutDate) return null;
    return Math.floor((new Date(item.soldOutDate).getTime() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const filtered = useMemo(() => {
    let result = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesExpiry = expiryFilter === "all" || getExpiryStatus(item.expiryDate).status === expiryFilter;
      const hasQuantity = showDepleted ? item.quantity === 0 : item.quantity > 0;
      return matchesSearch && matchesCategory && matchesExpiry && hasQuantity;
    });

    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "quantity") return a.quantity - b.quantity;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });
    return result;
  }, [items, search, categoryFilter, expiryFilter, sortBy, showDepleted]);

  function handleAdd(item: Omit<Item, "id" | "createdAt" | "updatedAt">) {
    addItem(item);
    toast.success(`Added ${item.name}`);
  }

  function handleBulkImport(items: Omit<Item, "id" | "createdAt" | "updatedAt">[]) {
    items.forEach((item) => {
      addItem(item);
    });
  }

  function handleEdit(item: Omit<Item, "id" | "createdAt" | "updatedAt">) {
    if (editItem) {
      updateItem(editItem.id, item);
      toast.success(`Updated ${item.name}`);
      setEditItem(undefined);
    }
  }

  function handleDelete() {
    if (deleteTarget) {
      deleteItem(deleteTarget.id);
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
    }
  }

  function handleSaveDays() {
    if (editDaysItem) {
      const days = parseInt(daysInput);
      if (isNaN(days) || days < 0) {
        toast.error("Please enter a valid number");
        return;
      }
      const createdAt = new Date(editDaysItem.createdAt);
      const soldOutDate = new Date(createdAt.getTime() + days * 24 * 60 * 60 * 1000);
      updateItem(editDaysItem.id, { soldOutDate: soldOutDate.toISOString() });
      toast.success(`Updated to ${days} days`);
      setEditDaysItem(null);
      setDaysInput("0");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold">Inventory</h1>
        <div className="flex gap-2">
          <Button onClick={() => setBulkImportOpen(true)} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" /> Bulk Import
          </Button>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={expiryFilter} onValueChange={setExpiryFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Expiry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="expired">🔴 Expired</SelectItem>
            <SelectItem value="critical">🔴 Critical</SelectItem>
            <SelectItem value="warning">🟡 Warning</SelectItem>
            <SelectItem value="good">🟢 Good</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="expiry">Sort: Expiry</SelectItem>
            <SelectItem value="name">Sort: Name</SelectItem>
            <SelectItem value="quantity">Sort: Quantity</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Checkbox id="show-depleted" checked={showDepleted} onCheckedChange={(checked) => setShowDepleted(checked === true)} />
          <label htmlFor="show-depleted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Show Depleted
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Qty</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Expiry</th>
              {showDepleted && <th className="px-4 py-3 text-center font-medium text-muted-foreground">Days to Deplete</th>}
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Location</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustQuantity(item.id, -1, "used")}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className={`min-w-[2rem] text-center font-mono font-semibold ${item.quantity <= item.minThreshold ? "text-destructive" : ""}`}>
                      {item.quantity}
                    </span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => adjustQuantity(item.id, 1)}>
                      <PlusIcon className="h-3 w-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground">{item.unit}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center"><ExpiryBadge expiryDate={item.expiryDate} /></td>
                {showDepleted && <td className="px-4 py-3 text-center font-mono font-semibold cursor-pointer hover:text-blue-500 hover:underline" onClick={() => { setEditDaysItem(item); setDaysInput((getDaysToSoldOut(item) ?? 0).toString()); }}>{getDaysToSoldOut(item) ?? "—"} days</td>}
                <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{item.location || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditItem(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(item)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={showDepleted ? 7 : 6} className="px-4 py-12 text-center text-muted-foreground">No items found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile FAB */}
      <Button
        onClick={() => setFormOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Form */}
      <ItemForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleAdd} />

      {/* Bulk Import */}
      <BulkImportDialog open={bulkImportOpen} onClose={() => setBulkImportOpen(false)} onImport={handleBulkImport} />

      {/* Edit Form */}
      {editItem && (
        <ItemForm open={!!editItem} onClose={() => setEditItem(undefined)} onSubmit={handleEdit} initialData={editItem} />
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone. The item will be permanently removed.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Days Confirmation */}
      <Dialog open={!!editDaysItem} onOpenChange={(v) => !v && setEditDaysItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Days to Deplete - {editDaysItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">How many days did it take to sell out?</p>
            <Input 
              type="number" 
              min="0" 
              placeholder="Enter number of days" 
              value={daysInput} 
              onChange={(e) => setDaysInput(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDaysItem(null)}>Cancel</Button>
            <Button onClick={handleSaveDays}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
