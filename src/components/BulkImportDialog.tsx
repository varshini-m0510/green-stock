import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { LoaderCircle, Upload, Edit2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Item } from "@/types/inventory";
import { extractTextFromImage, parseTextToItems, validateItems, ParsedItem } from "@/lib/imageOCR";

const CATEGORIES = ["Beverages", "Dairy", "Dairy Alternatives", "Vegetables", "Produce", "Bakery", "Lab Supplies", "Other"];
const UNITS = ["pieces", "bags", "cartons", "cups", "bottles", "loaves", "packs", "liters", "kg"];

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (items: Omit<Item, "id" | "createdAt" | "updatedAt">[]) => void;
}

export function BulkImportDialog({ open, onClose, onImport }: BulkImportDialogProps) {
  const [stage, setStage] = useState<"upload" | "preview" | "edit">("upload");
  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ParsedItem | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await extractTextFromImage(file);
      setExtractedText(text);
      const parsed = parseTextToItems(text);
      setItems(parsed);

      const validation = validateItems(parsed);
      if (!validation.valid) {
        setErrors(validation.errors);
      } else {
        setErrors([]);
      }

      if (parsed.length > 0) {
        setStage("preview");
        toast.success(`Extracted ${parsed.length} item${parsed.length !== 1 ? "s" : ""}`);
      } else {
        toast.error("No items could be extracted from the image");
        setShowTextInput(true);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process image");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [showTextInput, setShowTextInput] = useState(false);

  const handleManualTextParse = () => {
    if (!extractedText.trim()) {
      toast.error("Please enter some text");
      return;
    }
    const parsed = parseTextToItems(extractedText);
    setItems(parsed);

    const validation = validateItems(parsed);
    if (!validation.valid) {
      setErrors(validation.errors);
    } else {
      setErrors([]);
    }

    if (parsed.length > 0) {
      setStage("preview");
      setShowTextInput(false);
    } else {
      toast.error("No items could be parsed from the text");
    }
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...items[index] });
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;

    const validation = validateItems([editingItem]);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }

    const newItems = [...items];
    newItems[editingIndex!] = editingItem;
    setItems(newItems);
    setEditingIndex(null);
    setEditingItem(null);
    toast.success("Item updated");
  };

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    toast.success("Item removed");
  };

  const handleImportAll = () => {
    const validation = validateItems(items);
    if (!validation.valid) {
      toast.error(`Validation errors: ${validation.errors.join(", ")}`);
      return;
    }

    onImport(items as Omit<Item, "id" | "createdAt" | "updatedAt">[]);
    toast.success(`Added ${items.length} items to inventory`);
    handleClose();
  };

  const handleClose = () => {
    setStage("upload");
    setExtractedText("");
    setItems([]);
    setErrors([]);
    setEditingIndex(null);
    setEditingItem(null);
    setShowTextInput(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Bulk Import Items</DialogTitle>
          </DialogHeader>

          {stage === "upload" && (
            <div className="space-y-6">
              <div className="rounded-lg border-2 border-dashed p-12 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 font-medium">Upload an image of your inventory</p>
                <p className="text-sm text-muted-foreground">JPG, PNG, or GIF. Text will be extracted using OCR.</p>
                <div className="mt-4">
                  <input type="file" accept="image/*" onChange={handleFileUpload} disabled={loading} className="hidden" id="image-upload" />
                  <Button asChild disabled={loading} className="gap-2">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                      {loading ? "Processing..." : "Choose Image"}
                    </label>
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button variant="outline" onClick={() => setShowTextInput(true)} className="w-full">
                  Paste Extracted Text Manually
                </Button>
              </div>
            </div>
          )}

          {stage === "upload" && showTextInput && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900">
                <p className="font-medium mb-2">Supported formats:</p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li><strong>CSV:</strong> Apple, 5, Fruits</li>
                  <li><strong>CSV with unit:</strong> Milk, 2, Dairy, bottles</li>
                  <li><strong>Free form:</strong> Item name with quantity and category info</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label>Enter or paste extracted text:</Label>
                <Textarea value={extractedText} onChange={(e) => setExtractedText(e.target.value)} placeholder="Example:&#10;Apple, 5, Fruits&#10;Milk, 2, Dairy, bottles&#10;Bread, 1, Bakery" rows={6} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTextInput(false)}>
                  Cancel
                </Button>
                <Button onClick={handleManualTextParse} disabled={!extractedText.trim()}>
                  Parse Text
                </Button>
              </div>
            </div>
          )}

          {stage === "preview" && (
            <div className="space-y-4">
              {errors.length > 0 && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-destructive">Validation Errors:</p>
                      <ul className="mt-2 space-y-1 text-sm text-destructive/90">
                        {errors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>📋 Review before importing:</strong> Please check each item, especially expiry dates which were set to 30 days by default. Click any item to edit.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium">
                  Found {items.length} item{items.length !== 1 ? "s" : ""}
                </p>
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit} • {item.category} • Expires: {item.expiryDate}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => handleEditItem(idx)} className="h-8 w-8">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteItem(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {stage === "preview" && (
              <>
                <Button variant="outline" onClick={() => {setStage("upload"); setItems([]);}}>
                  Back
                </Button>
                <Button onClick={handleImportAll} disabled={items.length === 0}>
                  Import All ({items.length})
                </Button>
              </>
            )}
            {stage === "upload" && (
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <AlertDialog open={editingIndex !== null} onOpenChange={(v) => !v && setEditingIndex(null)}>
        <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Item</AlertDialogTitle>
          </AlertDialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-qty">Quantity</Label>
                  <Input id="edit-qty" type="number" min="0" value={editingItem.quantity} onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unit</Label>
                  <Select value={editingItem.unit} onValueChange={(u) => setEditingItem({ ...editingItem, unit: u })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expiry">Expiry Date</Label>
                <Input id="edit-expiry" type="date" value={editingItem.expiryDate} onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editingItem.category} onValueChange={(c) => setEditingItem({ ...editingItem, category: c })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" value={editingItem.location} onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })} placeholder="e.g., Fridge 1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-min">Min Threshold</Label>
                  <Input id="edit-min" type="number" min="0" value={editingItem.minThreshold} onChange={(e) => setEditingItem({ ...editingItem, minThreshold: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-max">Max Threshold</Label>
                  <Input id="edit-max" type="number" min="1" value={editingItem.maxThreshold} onChange={(e) => setEditingItem({ ...editingItem, maxThreshold: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEdit}>Save</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
