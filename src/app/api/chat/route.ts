import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ClientMessage = {
  role: "user" | "bot";
  text: string;
};

type ApiBody = {
  message?: string;
  history?: ClientMessage[];
};

type GarmentVariantRow = {
  stock: number | null;
  garment_products: {
    name: string;
    base_price: number;
    has_sizes: boolean;
    garment_types: {
      name: string;
    } | null;
  } | null;
  sizes: {
    name: string;
    sort_order: number;
  } | null;
  colors: {
    name: string;
    sort_order: number;
  } | null;
};

const SYSTEM_PROMPT = `
You are the JNJ Printing website's information chatbot.

YOUR ONLY JOB is to answer general questions and inquiries about the business.
You CANNOT and MUST NOT place, create, modify, cancel, or process any orders.
You CANNOT confirm order statuses or delivery schedules.

You may answer general product availability questions if the database provides the answer,
such as available garment products, sizes, colors, and base prices.

If a customer asks to PLACE an order, MODIFY an order, CHECK a specific order status,
or do anything transactional, always respond with:
"I can only answer general questions here. For orders or specific concerns,
please contact our team directly or visit our order page."

Never invent prices, delivery dates, order statuses, sizes, colors, or stock.
Answer clearly, politely, and briefly.
`.trim();

const ORDER_INTENT_PATTERNS = [
  /\b(place|make|create|submit|send|start)\s+(an?\s+)?order\b/i,
  /\bi\s+want\s+to\s+order\b/i,
  /\bcan\s+i\s+order\b/i,
  /\bcancel\s+(my\s+)?order\b/i,
  /\bchange\s+my\s+order\b/i,
  /\bmodify\s+my\s+order\b/i,
  /\bwhere\s+is\s+my\s+order\b/i,
  /\bstatus\s+of\s+my\s+order\b/i,
  /\btrack\s+(my\s+)?order\b/i,
];

const ORDER_REDIRECT =
  "I can only answer general questions here. For placing orders or checking a specific order, please contact our team directly or visit our order page — they'll be happy to help!";

function hasOrderIntent(message: string): boolean {
  return ORDER_INTENT_PATTERNS.some((pattern) => pattern.test(message));
}

const MAX_INPUT_LENGTH = 400;
const TIMEOUT_MS = 15_000;

function sanitize(value: unknown): string {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .slice(0, MAX_INPUT_LENGTH);
}

const GARMENT_KEYWORDS = [
  "shirt",
  "tshirt",
  "t-shirt",
  "polo",
  "hoodie",
  "jersey",
  "uniform",
  "cap",
  "hat",
  "garment",
];

const SIZE_WORDS = [
  "size",
  "sizes",
  "xs",
  "small",
  "medium",
  "large",
  "xl",
  "xxl",
  "xxxl",
  "2xl",
  "3xl",
];

const COLOR_WORDS = [
  "color",
  "colors",
  "colour",
  "colours",
  "white",
  "black",
  "red",
  "blue",
  "navy",
  "gray",
  "grey",
  "green",
  "yellow",
  "pink",
  "purple",
  "orange",
  "maroon",
  "beige",
];

const SERVICES = [
  "rubberized",
  "DTF printing",
  "silkscreen",
  "sublimation",
  "vinyl",
] as const;

const SERVICE_QUERY_WORDS = [
  "service",
  "services",
  "printing",
  "print",
  "dtf",
  "rubberized",
  "silkscreen",
  "sublimation",
  "vinyl",
];

function isServiceQuestion(message: string): boolean {
  const lower = message.toLowerCase();

  return SERVICE_QUERY_WORDS.some((word) => lower.includes(word));
}

function getServiceReply(message: string): string | null {
  if (!isServiceQuestion(message)) return null;

  const asksForPrice = /\b(price|pricing|cost|how much|rate|rates)\b/i.test(
    message
  );

  const reply = `We offer these printing services: ${SERVICES.join(", ")}.`;

  if (asksForPrice) {
    return `${reply} For exact pricing, please contact our team directly because rates can depend on the garment, design, size, and quantity.`;
  }

  return `${reply} For exact availability, pricing, or service recommendations, please contact our team directly.`;
}

function isGarmentDatabaseQuestion(message: string): boolean {
  const lower = message.toLowerCase();

  const hasGarmentWord = GARMENT_KEYWORDS.some((word) => lower.includes(word));
  const hasSizeWord = SIZE_WORDS.some((word) => lower.includes(word));
  const hasColorWord = COLOR_WORDS.some((word) => lower.includes(word));

  // Keep broad questions like "Do you have a contact number?" out of the
  // garment variants query. Only query the DB when the message clearly refers
  // to garments, sizes, or colors.
  return hasGarmentWord || hasSizeWord || hasColorWord;
}

function extractSearchTerms(message: string) {
  const lower = message.toLowerCase();

  const productTerms = GARMENT_KEYWORDS.filter((word) => lower.includes(word));
  const sizeTerms = SIZE_WORDS.filter((word) => lower.includes(word));
  const colorTerms = COLOR_WORDS.filter((word) => lower.includes(word));

  return {
    productTerms,
    sizeTerms,
    colorTerms,
  };
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function formatMoney(value: number) {
  return `₱${Number(value).toFixed(2)}`;
}

async function getGarmentDatabaseReply(message: string): Promise<string | null> {
  if (!isGarmentDatabaseQuestion(message)) {
    return null;
  }

  const { productTerms, sizeTerms, colorTerms } = extractSearchTerms(message);

  let query = createAdminClient()
    .from("garment_product_variants")
    .select(
      `
      stock,
      garment_products!inner (
        name,
        base_price,
        has_sizes,
        garment_types (
          name
        )
      ),
      sizes (
        name,
        sort_order
      ),
      colors (
        name,
        sort_order
      )
    `
    )
    .eq("active", true)
    .eq("garment_products.active", true)
    .limit(50);

  if (productTerms.length > 0) {
    const productFilters = productTerms
      .map((term) => `name.ilike.%${term}%`)
      .join(",");

    query = query.or(productFilters, {
      foreignTable: "garment_products",
    });
  }

  if (sizeTerms.length > 0) {
    const sizeFilters = sizeTerms
      .map((term) => `name.ilike.%${term}%`)
      .join(",");

    query = query.or(sizeFilters, {
      foreignTable: "sizes",
    });
  }

  if (colorTerms.length > 0) {
    const colorFilters = colorTerms
      .map((term) => `name.ilike.%${term}%`)
      .join(",");

    query = query.or(colorFilters, {
      foreignTable: "colors",
    });
  }

  const { data, error } = await query;

  if (error) {
    console.error("[chat/route] Supabase garment lookup failed:", error);
    return null;
  }

  const rows = (data || []) as unknown as GarmentVariantRow[];

  if (rows.length === 0) {
    return "I couldn't find that garment size or color in our available options right now. Please contact our team for the latest availability.";
  }

  const asksForPrice = /\b(price|pricing|cost|how much|rate)\b/i.test(message);
  const asksForSizes = /\b(size|sizes|small|medium|large|xl|xxl|xxxl|2xl|3xl)\b/i.test(
    message
  );
  const asksForColors = /\b(color|colors|colour|colours|white|black|red|blue|navy|gray|grey|green|yellow|pink|purple|orange|maroon|beige)\b/i.test(
    message
  );

  const grouped: Record<
    string,
    {
      basePrice: number;
      sizes: string[];
      colors: string[];
      stocks: number[];
    }
  > = {};

  for (const row of rows) {
    const product = row.garment_products;
    if (!product) continue;

    if (!grouped[product.name]) {
      grouped[product.name] = {
        basePrice: Number(product.base_price),
        sizes: [],
        colors: [],
        stocks: [],
      };
    }

    if (row.sizes?.name) grouped[product.name].sizes.push(row.sizes.name);
    if (row.colors?.name) grouped[product.name].colors.push(row.colors.name);
    if (typeof row.stock === "number") grouped[product.name].stocks.push(row.stock);
  }

  const lines = Object.entries(grouped).map(([productName, info]) => {
    const parts: string[] = [];

    if (asksForPrice || (!asksForSizes && !asksForColors)) {
      parts.push(`base price ${formatMoney(info.basePrice)}`);
    }

    if (asksForSizes || (!asksForPrice && !asksForColors)) {
      const sizes = unique(info.sizes).join(", ");
      if (sizes) parts.push(`sizes: ${sizes}`);
    }

    if (asksForColors || (!asksForPrice && !asksForSizes)) {
      const colors = unique(info.colors).join(", ");
      if (colors) parts.push(`colors: ${colors}`);
    }

    return `${productName}: ${parts.join("; ")}.`;
  });

  return `${lines.join("\n")}\n\nFor exact stock and ordering, please contact our team directly.`;
}

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count += 1;
  return true;
}

const responseCache = new Map<string, { reply: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60_000;

function getCached(key: string): string | null {
  const entry = responseCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }

  return entry.reply;
}

function setCache(key: string, reply: string) {
  responseCache.set(key, {
    reply,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  if (responseCache.size > 200) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function askOpenAICompatible({
  apiKey,
  baseUrl,
  model,
  message,
  history,
  extraHeaders = {},
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  message: string;
  history: ClientMessage[];
  extraHeaders?: Record<string, string>;
}): Promise<string> {
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    ...history.slice(-8).map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text,
    })),
    {
      role: "user",
      content: message,
    },
  ];

  const res = await fetchWithTimeout(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 250,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[OpenAI-compat] ${res.status} – ${body.slice(0, 120)}`);
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("[OpenAI-compat] Empty response");
  }

  return reply.trim();
}

async function askGemini({
  apiKey,
  model,
  message,
  history,
}: {
  apiKey: string;
  model: string;
  message: string;
  history: ClientMessage[];
}): Promise<string> {
  const conversationText = history
    .slice(-8)
    .map(
      (msg) => `${msg.role === "user" ? "Customer" : "Assistant"}: ${msg.text}`
    )
    .join("\n");

  const prompt = `${SYSTEM_PROMPT}

Conversation:
${conversationText}

Customer: ${message}
Assistant:`;

  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 250,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[Gemini] ${res.status} – ${body.slice(0, 120)}`);
  }

  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("[Gemini] Empty response");
  }

  return reply.trim();
}

function buildProviders(message: string, history: ClientMessage[]) {
  return [
    {
      name: "Groq",
      fn: async () => {
        if (!process.env.GROQ_API_KEY || !process.env.GROQ_MODEL) return "";

        return askOpenAICompatible({
          apiKey: process.env.GROQ_API_KEY,
          model: process.env.GROQ_MODEL,
          baseUrl: "https://api.groq.com/openai/v1/chat/completions",
          message,
          history,
        });
      },
    },
    {
      name: "OpenRouter",
      fn: async () => {
        if (!process.env.OPENROUTER_API_KEY || !process.env.OPENROUTER_MODEL) {
          return "";
        }

        return askOpenAICompatible({
          apiKey: process.env.OPENROUTER_API_KEY,
          model: process.env.OPENROUTER_MODEL,
          baseUrl: "https://openrouter.ai/api/v1/chat/completions",
          message,
          history,
          extraHeaders: {
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "JNJ Printing Info Bot",
          },
        });
      },
    },
    {
      name: "Gemini",
      fn: async () => {
        if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) return "";

        return askGemini({
          apiKey: process.env.GEMINI_API_KEY,
          model: process.env.GEMINI_MODEL,
          message,
          history,
        });
      },
    },
  ];
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        reply:
          "You're sending messages too quickly. Please wait a moment and try again.",
      },
      {
        status: 429,
      }
    );
  }

  try {
    const body = (await req.json()) as ApiBody;

    const message = sanitize(body.message);

    const history: ClientMessage[] = Array.isArray(body.history)
      ? body.history.slice(-8).map((m) => ({
          role: m.role === "user" ? "user" : "bot",
          text: sanitize(m.text),
        }))
      : [];

    if (!message) {
      return NextResponse.json(
        {
          reply: "Please type a message first.",
        },
        {
          status: 400,
        }
      );
    }

    if (hasOrderIntent(message)) {
      return NextResponse.json({
        reply: ORDER_REDIRECT,
      });
    }

    const serviceReply = getServiceReply(message);

    if (serviceReply) {
      return NextResponse.json({
        reply: serviceReply,
      });
    }

    const garmentReply = await getGarmentDatabaseReply(message);

    if (garmentReply) {
      return NextResponse.json({
        reply: garmentReply,
      });
    }

    const cacheKey = history.length === 0 ? message.toLowerCase() : null;

    if (cacheKey) {
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json({
          reply: cached,
        });
      }
    }

    const providers = buildProviders(message, history);

    for (const { name, fn } of providers) {
      try {
        const reply = await fn();

        if (reply) {
          if (cacheKey) setCache(cacheKey, reply);

          return NextResponse.json({
            reply,
          });
        }
      } catch (err) {
        console.error(`[chat/route] Provider "${name}" failed:`, err);
      }
    }

    return NextResponse.json({
      reply:
        "Thanks for reaching out! We couldn't connect right now. Please contact our team directly and they'll be happy to assist.",
    });
  } catch (err) {
    console.error("[chat/route] Unhandled error:", err);

    return NextResponse.json(
      {
        reply:
          "Sorry, something went wrong on our end. Please try again or contact support directly.",
      },
      {
        status: 500,
      }
    );
  }
}
