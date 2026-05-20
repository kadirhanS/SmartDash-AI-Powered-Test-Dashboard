import { type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/validate-key
 *
 * Validates an OpenRouter API key by sending a 1-token test request.
 *
 * Request body: { apiKey: string }
 *
 * Responses:
 *   200 → { valid: true }
 *   200 → { valid: true, warning: "..." }  (402 / other provider errors)
 *   200 → { valid: false, message: "..." } (401 / 403)
 *   429 → Rate limit exceeded
 */
export async function POST(request: NextRequest) {
  try {
    // ── Rate limit ──
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed, remaining, resetInMs } = checkRateLimit(
      `validate-key:${ip}`,
      20,
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

    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      return Response.json(
        { valid: false, message: "API anahtarı gerekli." },
        { status: 400 },
      );
    }

    // ── Send a minimal 1-token test request to OpenRouter ──
    // We use a free model so there's no cost to the user for validation.
    // If the model returns an error (rate limit, overloaded, etc.) the key
    // is still valid — only 401/403 mean the key itself is bad.
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://smartdash.vercel.app",
          "X-Title": "SmartDash",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free",
          messages: [
            { role: "user", content: "test" },
          ],
          max_tokens: 1,
        }),
      },
    );

    // 401/403 = definitely invalid key
    if (response.status === 401 || response.status === 403) {
      return Response.json(
        {
          valid: false,
          message: "Geçersiz veya iptal edilmiş API anahtarı.",
        },
        { status: 200 },
      );
    }

    // 402 = key is valid but has no balance (affects paid models only)
    if (response.status === 402) {
      return Response.json(
        {
          valid: true,
          warning: "Anahtar geçerli ancak bakiye yetersiz. Ücretsiz modeller çalışır, ücretli modeller için bakiye yükleyin.",
        },
        { status: 200 },
      );
    }

    // Everything else means the key is valid
    // (200=success, 429=rate limit, 503=provider overload, etc.)
    return Response.json({ valid: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Beklenmeyen bir hata oluştu.";

    return Response.json({ valid: false, message }, { status: 500 });
  }
}
