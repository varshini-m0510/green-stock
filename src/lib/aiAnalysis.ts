import { Item, ConsumptionRecord } from "@/types/inventory";

export interface InventoryContext {
  totalItems: number;
  totalQuantity: number;
  itemsWithZeroStock: number;
  expiringItems: number;
  lowStockItems: number;
  totalConsumed: number;
  totalWasted: number;
  totalDonated: number;
  wastePercentage: number;
  averageDaysToDeplete: number;
  topWastedItems: Array<{ name: string; quantity: number }>;
  topConsumedItems: Array<{ name: string; quantity: number }>;
}

export function buildInventoryContext(items: Item[], consumption: ConsumptionRecord[]): InventoryContext {
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const zeroStockItems = items.filter(i => i.quantity === 0).length;
  const expiringItems = items.filter(i => {
    const daysToExpiry = Math.floor((new Date(i.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysToExpiry <= 7 && daysToExpiry >= 0;
  }).length;
  const lowStockItems = items.filter(i => i.quantity > 0 && i.quantity <= i.minThreshold).length;

  const consumed = consumption.filter(r => r.reason === "used").reduce((sum, r) => sum + Math.abs(r.quantity), 0);
  const wasted = consumption.filter(r => r.reason === "wasted").reduce((sum, r) => sum + Math.abs(r.quantity), 0);
  const donated = consumption.filter(r => r.reason === "donated").reduce((sum, r) => sum + Math.abs(r.quantity), 0);
  const totalConsumed = consumed + wasted + donated;
  const wastePercentage = totalConsumed > 0 ? Math.round((wasted / totalConsumed) * 100) : 0;

  const itemsWithDepletion = items.filter(i => i.soldOutDate).length;
  const averageDaysToDeplete = itemsWithDepletion > 0
    ? Math.round(
        items
          .filter(i => i.soldOutDate)
          .reduce((sum, i) => sum + Math.floor((new Date(i.soldOutDate!).getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24)), 0) /
          itemsWithDepletion
      )
    : 0;

  // Top wasted & consumed items
  const consumptionByItem = consumption.reduce(
    (acc, r) => {
      const item = items.find(i => i.id === r.itemId);
      if (!item) return acc;
      if (!acc[item.name]) acc[item.name] = { name: item.name, used: 0, wasted: 0, donated: 0 };
      if (r.reason === "used") acc[item.name].used += Math.abs(r.quantity);
      if (r.reason === "wasted") acc[item.name].wasted += Math.abs(r.quantity);
      if (r.reason === "donated") acc[item.name].donated += Math.abs(r.quantity);
      return acc;
    },
    {} as Record<string, { name: string; used: number; wasted: number; donated: number }>
  );

  const topWasted = Object.values(consumptionByItem)
    .sort((a, b) => b.wasted - a.wasted)
    .slice(0, 3)
    .map(i => ({ name: i.name, quantity: i.wasted }));

  const topConsumed = Object.values(consumptionByItem)
    .sort((a, b) => b.used - a.used)
    .slice(0, 3)
    .map(i => ({ name: i.name, quantity: i.used }));

  return {
    totalItems: items.length,
    totalQuantity,
    itemsWithZeroStock: zeroStockItems,
    expiringItems,
    lowStockItems,
    totalConsumed: consumed,
    totalWasted: wasted,
    totalDonated: donated,
    wastePercentage,
    averageDaysToDeplete,
    topWastedItems: topWasted,
    topConsumedItems: topConsumed,
  };
}

export async function callAI(question: string, context: InventoryContext, apiKey: string): Promise<string> {
  const contextStr = `
Current Inventory Status:
- Total Items: ${context.totalItems}
- Total Stock (units): ${context.totalQuantity}
- Zero Stock Items: ${context.itemsWithZeroStock}
- Expiring Soon (≤7 days): ${context.expiringItems}
- Low Stock Items: ${context.lowStockItems}

Consumption Breakdown:
- Total Used: ${context.totalConsumed} units
- Total Wasted: ${context.totalWasted} units (${context.wastePercentage}% of total)
- Total Donated: ${context.totalDonated} units
- Average Days to Deplete: ${context.averageDaysToDeplete} days

Top Issues:
- Most Wasted: ${context.topWastedItems.map(i => `${i.name} (${i.quantity} units)`).join(", ") || "None"}
- Most Consumed: ${context.topConsumedItems.map(i => `${i.name} (${i.quantity} units)`).join(", ") || "None"}

User Question: ${question}

Provide a concise, actionable answer based on the inventory data above.`;

  try {
    // Try Gemini API (requires VITE_GEMINI_API_KEY)
    if (apiKey.includes("gemini") || apiKey.startsWith("AIza")) {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: contextStr }] }],
        }),
      });

      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error(data.error?.message || "Gemini API error");
    }

    // Default: OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: contextStr }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }
    return data.choices?.[0]?.message?.content || "No response from AI";
  } catch (error) {
    throw error;
  }
}

export async function callTrendAI(question: string, apiKey: string, location: string = "Bengaluru, India"): Promise<string> {
  const trendContextStr = `
You are a market trend advisor for a grocery/retail store in ${location}.

Context:
- Location: ${location}
- Current Date: ${new Date().toLocaleDateString()}
- Season: ${getSeasonFor(location)}

Help identify trending items based on:
1. Current weather conditions in ${location}
2. Seasonal produce/products available now
3. Local cultural events and holidays
4. Social media trends visible in the region
5. Consumer behavior patterns in ${location}

User Question: ${question}

Provide specific, actionable recommendations for items that are trending or will trend soon in ${location}.
Be concise and practical for a small grocery store owner.`;

  try {
    if (apiKey.startsWith("AIza")) {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: trendContextStr }] }],
        }),
      });

      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error(data.error?.message || "Gemini API error");
    }

    // OpenAI fallback
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: trendContextStr }],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI API error");
    }
    return data.choices?.[0]?.message?.content || "No response from AI";
  } catch (error) {
    throw error;
  }
}

function getSeasonFor(location: string): string {
  const month = new Date().getMonth();
  if (location.includes("Bengaluru") || location.includes("India")) {
    // Southern India seasons
    if (month >= 1 && month <= 3) return "Summer (March-May)";
    if (month >= 4 && month <= 7) return "Monsoon (June-September)";
    if (month >= 8 && month <= 11) return "Post-monsoon/Winter (October-February)";
  }
  return "Current season";
}
