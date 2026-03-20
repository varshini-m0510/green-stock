import { useState } from "react";
import { Item } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Barcode } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["Beverages", "Dairy", "Dairy Alternatives", "Vegetables", "Produce", "Bakery", "Lab Supplies", "Other"];
const UNITS = ["pieces", "bags", "cartons", "cups", "bottles", "loaves", "packs", "liters", "kg"];

interface ItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<Item, "id" | "createdAt" | "updatedAt">) => void;
  initialData?: Item;
}

interface FormErrors {
  name?: string;
  quantity?: string;
  expiryDate?: string;
  category?: string;
  minThreshold?: string;
  maxThreshold?: string;
}

export function ItemForm({ open, onClose, onSubmit, initialData }: ItemFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() ?? "");
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate ?? "");
  const [category, setCategory] = useState(initialData?.category ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [minThreshold, setMinThreshold] = useState(initialData?.minThreshold?.toString() ?? "2");
  const [maxThreshold, setMaxThreshold] = useState(initialData?.maxThreshold?.toString() ?? "10");
  const [unit, setUnit] = useState(initialData?.unit ?? "pieces");
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const e: FormErrors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) < 0) e.quantity = "Quantity must be a number ≥ 0";
    if (!expiryDate) e.expiryDate = "Expiry date is required";
    if (!category) e.category = "Category is required";
    if (Number(minThreshold) < 0) e.minThreshold = "Must be ≥ 0";
    if (Number(maxThreshold) <= Number(minThreshold)) e.maxThreshold = "Must be greater than minimum";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      quantity: Number(quantity),
      expiryDate,
      category,
      location: location.trim(),
      minThreshold: Number(minThreshold),
      maxThreshold: Number(maxThreshold),
      unit,
    });
    onClose();
  }

  function simulateBarcode() {
    setName("Scanned Item " + Math.floor(Math.random() * 1000));
    setCategory("Other");
    toast.info("Barcode scanned (simulated)");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{initialData ? "Edit Item" : "Add New Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className={errors.name ? "border-destructive" : ""} placeholder="e.g. Organic Coffee" />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <Button type="button" variant="outline" size="icon" className="mt-6" onClick={simulateBarcode} title="Simulate barcode scan">
              <Barcode className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={errors.quantity ? "border-destructive" : ""} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="expiry">Expiry Date *</Label>
            <Input id="expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={errors.expiryDate ? "border-destructive" : ""} />
            {errors.expiryDate && <p className="text-xs text-destructive">{errors.expiryDate}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className={errors.category ? "border-destructive" : ""}><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Fridge 1, Shelf A" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="min">Min Threshold</Label>
              <Input id="min" type="number" min="0" value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)} className={errors.minThreshold ? "border-destructive" : ""} />
              {errors.minThreshold && <p className="text-xs text-destructive">{errors.minThreshold}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="max">Max Threshold</Label>
              <Input id="max" type="number" min="1" value={maxThreshold} onChange={(e) => setMaxThreshold(e.target.value)} className={errors.maxThreshold ? "border-destructive" : ""} />
              {errors.maxThreshold && <p className="text-xs text-destructive">{errors.maxThreshold}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">{initialData ? "Save Changes" : "Add Item"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
