import Tesseract from "tesseract.js";
import { Item } from "@/types/inventory";

const CATEGORIES = ["Beverages", "Dairy", "Dairy Alternatives", "Vegetables", "Produce", "Bakery", "Lab Supplies", "Other"];
const UNITS = ["pieces", "bags", "cartons", "cups", "bottles", "loaves", "packs", "liters", "kg"];

export interface ParsedItem {
  name: string;
  quantity: number;
  expiryDate: string;
  category: string;
  location: string;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
}

/**
 * Extract text from an image using Tesseract.js OCR
 */
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    const imageUrl = URL.createObjectURL(file);
    const result = await Tesseract.recognize(imageUrl, "eng", {
      logger: (m) => console.log("OCR Progress:", m.progress),
    });
    URL.revokeObjectURL(imageUrl);
    return result.data.text;
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to extract text from image");
  }
}

/**
 * Parse extracted text into structured item data
 */
export function parseTextToItems(text: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  // Check if this might be CSV format
  const isCSVFormat = lines.some((line) => line.includes(","));

  if (isCSVFormat) {
    // Parse as CSV
    return parseCSVFormat(lines);
  }

  // Original parsing logic for free-form text
  let currentItem: Partial<ParsedItem> = {};

  for (const line of lines) {
    const trimmed = line.trim();

    // Try to parse each line for item information
    const nameMatch = trimmed.match(/^([a-zA-Z\s]+)/);
    const quantityMatch = trimmed.match(/(\d+)\s*(pieces|bags|cartons|cups|bottles|loaves|packs|liters|kg|pcs|pc|kg|g|ml|l|num)/i);
    const dateMatch = trimmed.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/);
    const categoryMatch = trimmed.match(new RegExp(`(${CATEGORIES.join("|")})`, "i"));

    if (nameMatch && nameMatch[1].trim().length > 2) {
      currentItem.name = nameMatch[1].trim();
    }

    if (quantityMatch) {
      currentItem.quantity = parseInt(quantityMatch[1]);
      const unitStr = quantityMatch[2].toLowerCase();
      const matchedUnit = UNITS.find((u) => u.startsWith(unitStr.charAt(0)) || u === unitStr);
      currentItem.unit = matchedUnit || "pieces";
    }

    if (dateMatch && !currentItem.expiryDate) {
      currentItem.expiryDate = formatDateToISO(dateMatch[1]);
    }

    if (categoryMatch) {
      currentItem.category = CATEGORIES.find((c) => c.toLowerCase() === categoryMatch[1].toLowerCase()) || "Other";
    }

    // If we have essential fields filled, create an item
    if (currentItem.name && currentItem.quantity && currentItem.category) {
      items.push({
        name: currentItem.name,
        quantity: currentItem.quantity,
        expiryDate: currentItem.expiryDate || getDefaultExpiryDate(),
        category: currentItem.category,
        location: currentItem.location || "",
        minThreshold: currentItem.minThreshold || 2,
        maxThreshold: currentItem.maxThreshold || 10,
        unit: currentItem.unit || "pieces",
      });
      currentItem = {};
    }
  }

  // Add last item if it has essential data
  if (currentItem.name && currentItem.quantity) {
    items.push({
      name: currentItem.name,
      quantity: currentItem.quantity,
      expiryDate: currentItem.expiryDate || getDefaultExpiryDate(),
      category: currentItem.category || "Other",
      location: currentItem.location || "",
      minThreshold: currentItem.minThreshold || 2,
      maxThreshold: currentItem.maxThreshold || 10,
      unit: currentItem.unit || "pieces",
    });
  }

  return items;
}

/**
 * Parse CSV format data
 */
function parseCSVFormat(lines: string[]): ParsedItem[] {
  const items: ParsedItem[] = [];

  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim().replace(/[|]/g, ""));

    if (parts.length === 0 || !parts[0]) continue;

    const name = parts[0];
    const quantity = parts[1] ? parseInt(parts[1]) : 1;

    if (isNaN(quantity) || quantity < 0) continue;

    let category = "Other";
    let unit = "pieces";

    // Try to identify category and unit from remaining parts
    for (let i = 2; i < parts.length; i++) {
      const part = parts[i].toLowerCase();
      
      // Check if it's a category
      const categoryMatch = CATEGORIES.find((c) => c.toLowerCase() === part);
      if (categoryMatch) {
        category = categoryMatch;
        continue;
      }

      // Check if it's a unit (or similar)
      const unitMatch = UNITS.find(
        (u) => u === part || part.includes(u) || u.includes(part.slice(0, 3))
      );
      if (unitMatch) {
        unit = unitMatch;
        continue;
      }

      // Check if part looks like a unit name (e.g., "loafes" -> "loaves")
      if (part.includes("bottle")) unit = "bottles";
      else if (part.includes("bag")) unit = "bags";
      else if (part.includes("loaf")) unit = "loaves";
      else if (part.includes("carton")) unit = "cartons";
      else if (part.includes("pack")) unit = "packs";
      else if (part.includes("liter")) unit = "liters";
      else if (part.includes("cup")) unit = "cups";
    }

    items.push({
      name,
      quantity,
      expiryDate: getDefaultExpiryDate(),
      category,
      location: "",
      minThreshold: 2,
      maxThreshold: 10,
      unit,
    });
  }

  return items;
}

/**
 * Get default expiry date (30 days from now)
 */
function getDefaultExpiryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split("T")[0];
}

/**
 * Convert date string to ISO format (YYYY-MM-DD)
 */
function formatDateToISO(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // Fallback: return today if parsing fails
    return new Date().toISOString().split("T")[0];
  }
  return date.toISOString().split("T")[0];
}

/**
 * Validate parsed items
 */
export function validateItems(items: ParsedItem[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  items.forEach((item, index) => {
    if (!item.name || item.name.trim().length === 0) {
      errors.push(`Item ${index + 1}: Name is required`);
    }
    if (item.quantity < 0) {
      errors.push(`Item ${index + 1}: Quantity must be non-negative`);
    }
    if (!item.expiryDate) {
      errors.push(`Item ${index + 1}: Expiry date is required`);
    }
    if (!item.category) {
      errors.push(`Item ${index + 1}: Category is required`);
    }
  });

  return { valid: errors.length === 0, errors };
}
