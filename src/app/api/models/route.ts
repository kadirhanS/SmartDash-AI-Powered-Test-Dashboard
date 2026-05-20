import { type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

interface OpenRouterModelRaw {
  id: string;
  name?: string;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface OpenRouterModelsResponse {
  data?: OpenRouterModelRaw[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// Priority free models that should always appear at the top
const PRIORITY_FREE_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.5-flash-preview-04-17:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

/**
 * Safely parse a pricing string to a number.
 */
function parsePricing(value: string | undefined | null): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Determine if a model is free (both prompt and completion pricing are 0).
 */
function isFreeModel(model: OpenRouterModelRaw): boolean {
  const prompt = parsePricing(model.pricing?.prompt);
  const completion = parsePricing(model.pricing?.completion);
  return prompt === 0 && completion === 0;
}

/**
 * GET /api/models?plan=free|paid
 *
 * Lists models from OpenRouter, filtered by plan type.
 */
export async function GET(request: NextRequest) {
  try {
    // ── Rate limit ──
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed, remaining, resetInMs } = checkRateLimit(
      `models:${ip}`,
      30,
      60_000,
    );
    if (!allowed) {
      return Response.json(
        {
          error: `Çok fazla istek gönderdiniz. Lütfen ${Math.ceil(resetInMs / 1000)} saniye bekleyin.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(resetInMs / 1000)),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }

    const { searchParams } = new URL(request.url);
    const plan = searchParams.get("plan") || "free";

    if (plan !== "free" && plan !== "paid") {
      return Response.json(
        { error: "Geçersiz plan parametresi. 'free' veya 'paid' kullanın." },
        { status: 400 },
      );
    }

    // ── Fetch models from OpenRouter ──
    const response = await fetch(
      "https://openrouter.ai/api/v1/models",
      {
        headers: {
          "Content-Type": "application/json",
        },
        // Cache for 5 minutes on the server (ISR-like)
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      return Response.json(
        { error: "Modeller alınamadı. Lütfen tekrar deneyin." },
        { status: 502 },
      );
    }

    const raw = (await response.json()) as OpenRouterModelsResponse;

    if (!Array.isArray(raw.data)) {
      return Response.json(
        { error: "Beklenmeyen yanıt formatı." },
        { status: 502 },
      );
    }

    // ── Filter by plan ──
    let filtered: OpenRouterModelRaw[];

    if (plan === "free") {
      filtered = raw.data.filter(isFreeModel);
    } else {
      filtered = raw.data.filter((m) => !isFreeModel(m));
    }

    // ── Map to our format ──
    const models = filtered.map((m) => ({
      id: m.id,
      name: m.name || m.id,
    }));

    // ── Sort: priority free models first, then alphabetical ──
    models.sort((a, b) => {
      const aIsPriority = PRIORITY_FREE_MODELS.includes(a.id);
      const bIsPriority = PRIORITY_FREE_MODELS.includes(b.id);

      if (aIsPriority && !bIsPriority) return -1;
      if (!aIsPriority && bIsPriority) return 1;

      // If both are priority (or both non-priority), sort by priority index
      const aIdx = PRIORITY_FREE_MODELS.indexOf(a.id);
      const bIdx = PRIORITY_FREE_MODELS.indexOf(b.id);

      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;

      return a.name.localeCompare(b.name);
    });

    return Response.json({
      models,
      plan,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Beklenmeyen bir hata oluştu.";

    return Response.json({ error: message }, { status: 500 });
  }
}
