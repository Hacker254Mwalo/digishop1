import { invokeLLM } from "./_core/llm";
import { listOrderRequests, listProducts, listRepairTickets } from "./db";

type RepairHelperInput = {
  deviceType: "phone" | "laptop" | "electronics";
  brand: string;
  model: string;
  issue: string;
};

type RepairHelperResult = {
  summary: string;
  recommendedPath: "repair" | "parts" | "inspection";
  suggestedPriority: "low" | "normal" | "high" | "urgent";
  questions: string[];
  aiPowered: boolean;
};

function textFromResult(result: Awaited<ReturnType<typeof invokeLLM>>) {
  const content = result.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  return content?.filter(part => part.type === "text").map(part => part.text).join(" ") ?? "";
}

function fallbackRepairHelper(input: RepairHelperInput): RepairHelperResult {
  const issue = input.issue.toLowerCase();
  const urgent = /(smoke|burn|hot|swollen|spark|water|wet|stolen|unsafe)/.test(issue);
  const parts = /(charger|charging|cable|battery|screen|display|cover|case|keyboard|adapter)/.test(issue);
  const path = parts ? "parts" : urgent ? "inspection" : "repair";
  const summary = urgent
    ? "This may need a prompt safety check. Stop using the device if it is hot, swollen, wet or producing smoke, and contact the service desk before charging it again."
    : parts
      ? "This sounds like a part or accessory-related issue. The team should confirm the exact model and fit before recommending or supplying a replacement."
      : "The service desk should inspect the device and confirm the cause before promising a repair or price.";
  return {
    summary,
    recommendedPath: path,
    suggestedPriority: urgent ? "urgent" : issue.includes("not working") || issue.includes("cannot") ? "high" : "normal",
    questions: ["When did the problem begin?", "Was the device dropped, exposed to water or repaired before?", `Does the ${input.deviceType} still switch on or respond?`],
    aiPowered: false,
  };
}

export async function repairHelper(input: RepairHelperInput): Promise<RepairHelperResult> {
  const fallback = fallbackRepairHelper(input);
  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are the careful intake assistant for Digital Phone Hub in Siaya, Kenya. Do not diagnose with certainty, promise a price, or recommend unsafe steps. Return only valid JSON with keys summary, recommendedPath (repair|parts|inspection), suggestedPriority (low|normal|high|urgent), questions (array of exactly 3 short questions). Mention that final diagnosis requires inspection when appropriate." },
        { role: "user", content: JSON.stringify({ deviceType: input.deviceType, brand: input.brand, model: input.model, issue: input.issue }) },
      ],
      model: process.env.AI_MODEL || "gpt-5-mini",
      maxCompletionTokens: 320,
      reasoning: { effort: "minimal" },
      outputSchema: {
        name: "repair_intake",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            recommendedPath: { type: "string", enum: ["repair", "parts", "inspection"] },
            suggestedPriority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
            questions: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
          },
          required: ["summary", "recommendedPath", "suggestedPriority", "questions"],
          additionalProperties: false,
        },
      },
    });
    const parsed = JSON.parse(textFromResult(result)) as Partial<RepairHelperResult>;
    if (!parsed.summary || !Array.isArray(parsed.questions)) return fallback;
    return {
      summary: parsed.summary,
      recommendedPath: parsed.recommendedPath === "parts" || parsed.recommendedPath === "inspection" ? parsed.recommendedPath : "repair",
      suggestedPriority: parsed.suggestedPriority === "urgent" || parsed.suggestedPriority === "high" || parsed.suggestedPriority === "low" ? parsed.suggestedPriority : "normal",
      questions: parsed.questions.slice(0, 3).map(String),
      aiPowered: true,
    };
  } catch {
    return fallback;
  }
}

function compactAdminContext(products: any[], repairs: any[], orders: any[]) {
  return {
    inventory: products.map(product => ({ sku: product.sku, name: product.name, category: product.category, type: product.productType, price: product.price, stock: product.stock, reorderLevel: product.reorderLevel, availability: product.availability, compatibility: product.compatibility })).slice(0, 120),
    repairs: repairs.map(row => ({ reference: row.ticket.reference, status: row.ticket.status, issue: row.ticket.issue, device: `${row.device?.brand ?? ""} ${row.device?.model ?? ""}`.trim(), priority: row.ticket.priority })).slice(0, 80),
    orders: orders.map(row => ({ reference: row.order.reference, status: row.order.status, fulfillment: row.order.fulfillment, total: row.order.total, items: row.items.map((item: any) => `${item.productNameSnapshot} x${item.quantity}`).slice(0, 10) })).slice(0, 80),
  };
}

function fallbackCopilot(question: string, context: ReturnType<typeof compactAdminContext>) {
  const q = question.toLowerCase();
  if (q.includes("stock") || q.includes("reorder") || q.includes("inventory")) {
    const items = context.inventory.filter(item => item.stock <= item.reorderLevel);
    return items.length ? `Stock attention: ${items.map(item => `${item.name} (${item.stock} left, alert at ${item.reorderLevel})`).join(", ")}.` : "No active listing is currently at or below its reorder alert level.";
  }
  if (q.includes("repair") || q.includes("ticket") || q.includes("queue")) {
    const active = context.repairs.filter(item => !["collected", "cancelled"].includes(item.status));
    return active.length ? `${active.length} repair request(s) are active. The oldest visible references are ${active.slice(0, 5).map(item => `${item.reference} (${item.status})`).join(", ")}.` : "There are no active repair requests in the current queue.";
  }
  if (q.includes("order") || q.includes("follow")) {
    const pending = context.orders.filter(item => item.status === "new");
    return pending.length ? `${pending.length} order request(s) are new and need confirmation: ${pending.map(item => item.reference).join(", ")}.` : "There are no new shop orders waiting for confirmation.";
  }
  return "I can review stock, repair queue and new orders. Try: ‘Which products need restocking?’, ‘Summarise active repairs’, or ‘Which orders need follow-up?’";
}

export async function adminCopilot(question: string) {
  const [products, repairs, orders] = await Promise.all([listProducts(), listRepairTickets(), listOrderRequests()]);
  const context = compactAdminContext(products, repairs, orders);
  const fallback = fallbackCopilot(question, context);
  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are the read-only operations copilot for Digital Phone Hub. Use only the supplied inventory, repair and order context. Never invent data. Do not expose customer names, phone numbers or emails. Give a concise practical answer in plain English. You may recommend an owner action, but you cannot change records." },
        { role: "user", content: JSON.stringify({ question, context }) },
      ],
      model: process.env.AI_MODEL || "gpt-5-mini",
      maxCompletionTokens: 520,
      reasoning: { effort: "minimal" },
    });
    const answer = textFromResult(result).trim();
    return { answer: answer || fallback, aiPowered: Boolean(answer) };
  } catch {
    return { answer: fallback, aiPowered: false };
  }
}

export async function productAdvisor(query: string) {
  const products = await listProducts();
  const catalogue = products.map(product => ({ sku: product.sku, name: product.name, category: product.category, compatibility: product.compatibility, description: product.description, availability: product.availability, stock: product.stock })).slice(0, 160);
  const fallbackMatches = products.filter(product => `${product.name} ${product.category} ${product.compatibility ?? ""} ${product.description ?? ""}`.toLowerCase().split(/\s+/).some(word => query.toLowerCase().includes(word) || word.includes(query.toLowerCase()))).slice(0, 5);
  const fallback = { advice: fallbackMatches.length ? "These listings look closest to what you described. Confirm the exact model with the service desk before ordering a part." : "Tell us the device brand, model and what you need. We will narrow down the right part or accessory.", skus: fallbackMatches.map(product => product.sku), aiPowered: false };
  try {
    const result = await invokeLLM({
      model: process.env.AI_MODEL || "gpt-5-mini",
      messages: [
        { role: "system", content: "You help customers find products in a small phone and electronics shop. Use only the supplied catalogue. Never invent stock, price or compatibility. Recommend up to 5 SKU values and give one short practical note. If compatibility is uncertain, say the service desk should confirm before ordering." },
        { role: "user", content: JSON.stringify({ request: query, catalogue }) },
      ],
      maxCompletionTokens: 280,
      reasoning: { effort: "minimal" },
      outputSchema: { name: "product_advice", strict: true, schema: { type: "object", properties: { advice: { type: "string" }, skus: { type: "array", items: { type: "string" }, maxItems: 5 } }, required: ["advice", "skus"], additionalProperties: false } },
    });
    const parsed = JSON.parse(textFromResult(result)) as { advice?: string; skus?: string[] };
    const allowed = new Set(catalogue.map(item => item.sku));
    const skus = (parsed.skus ?? []).filter(sku => allowed.has(sku)).slice(0, 5);
    return { advice: parsed.advice || fallback.advice, skus, aiPowered: true };
  } catch {
    return fallback;
  }
}
