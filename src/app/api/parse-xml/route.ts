import { type NextRequest } from "next/server";
import { parseJUnitXml } from "@/lib/parse-xml";
import { checkRateLimit } from "@/lib/rate-limit";

// ── Constants ──
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * POST /api/parse-xml
 *
 * Accepts a JUnit XML file via multipart/form-data, parses it,
 * and returns the structured TestSuite as JSON.
 *
 * Next.js v16 App Router Route Handler (Web API standards).
 */
export async function POST(request: NextRequest) {
  try {
    // ── Rate limit ──
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { allowed, remaining, resetInMs } = checkRateLimit(
      `parse-xml:${ip}`,
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

    const formData = await request.formData();
    const file = formData.get("file");

    // ── Validate file exists ──
    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "Dosya gönderilmedi. Lütfen bir JUnit XML dosyası seçin." },
        { status: 400 },
      );
    }

    // ── Validate file type ──
    if (!file.name.toLowerCase().endsWith(".xml")) {
      return Response.json(
        { error: "Yalnızca .xml dosyaları kabul edilir." },
        { status: 400 },
      );
    }

    // ── Validate file is not empty ──
    if (file.size === 0) {
      return Response.json(
        { error: "Dosya boş. Lütfen geçerli bir JUnit XML dosyası seçin." },
        { status: 400 },
      );
    }

    // ── Validate file size (max 10 MB) ──
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          error: `Dosya çok büyük. Maksimum ${MAX_FILE_SIZE / 1024 / 1024} MB dosya yükleyebilirsiniz.`,
        },
        { status: 400 },
      );
    }

    // ── Parse ──
    const xmlContent = await file.text();
    const result = parseJUnitXml(xmlContent);

    return Response.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Beklenmeyen bir hata oluştu.";

    return Response.json({ error: message }, { status: 500 });
  }
}
