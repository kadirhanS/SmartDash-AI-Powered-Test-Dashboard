import { type NextRequest } from "next/server";
import { generateAIAnalysis } from "@/lib/openrouter";
import { checkRateLimit } from "@/lib/rate-limit";
import type { TestSuite } from "@/lib/types";

/**
 * POST /api/analyze
 *
 * Runs an AI-powered analysis on the provided test suite data.
 *
 * Request body: { apiKey: string, model: string, testSuite: TestSuite }
 *
 * Success (200): AIAnalysisResponse
 * Error (400): Missing required fields
 * Error (401): Invalid API key
 * Error (429): Rate limit exceeded
 * Error (500): Unexpected error
 */
export async function POST(request: NextRequest) {
  try {
    // ── Rate limit ──
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed, remaining, resetInMs } = checkRateLimit(
      `analyze:${ip}`,
      10,
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
    const { apiKey, model, testSuite } = body as {
      apiKey?: string;
      model?: string;
      testSuite?: TestSuite;
    };

    // ── Validate required fields ──
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      return Response.json(
        { error: "API anahtarı gerekli." },
        { status: 400 },
      );
    }

    if (!model || typeof model !== "string" || model.trim() === "") {
      return Response.json(
        { error: "Model adı gerekli." },
        { status: 400 },
      );
    }

    if (!testSuite || typeof testSuite !== "object") {
      return Response.json(
        { error: "Test verisi gerekli." },
        { status: 400 },
      );
    }

    if (!Array.isArray(testSuite.testCases)) {
      return Response.json(
        { error: "Geçersiz test verisi: testCases dizisi bulunamadı." },
        { status: 400 },
      );
    }

    // ── Run analysis ──
    const result = await generateAIAnalysis(
      apiKey.trim(),
      model.trim(),
      testSuite,
    );

    return Response.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Beklenmeyen bir hata oluştu.";

    // Map known error messages to appropriate status codes
    if (
      message.includes("API anahtarı") ||
      message.includes("Geçersiz") ||
      message.includes("iptal")
    ) {
      return Response.json({ error: message }, { status: 401 });
    }

    if (message.includes("bakiye") || message.includes("Bakiye")) {
      return Response.json({ error: message }, { status: 402 });
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
