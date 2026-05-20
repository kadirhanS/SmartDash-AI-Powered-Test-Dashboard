import type { TestSuite } from "./types";
import type { AIAnalysisResponse } from "./ai-types";

/**
 * Generate an AI-powered analysis of a test suite using OpenRouter.
 *
 * Sends the test data as JSON to the specified model and parses the
 * structured response into an AIAnalysisResponse object.
 */
export async function generateAIAnalysis(
  apiKey: string,
  model: string,
  testSuite: TestSuite,
): Promise<AIAnalysisResponse> {
  // ── Build a Turkish prompt ──
  const systemPrompt = `Sen bir QA mühendisi asistanısın. Görevin test sonuçlarını analiz edip geliştirici ekibine (developer) yönelik aksiyon önerileri sunmak. Test edilen kodları QA mühendisi yazmadı, bu nedenle öneriler suçlayıcı değil, yapıcı ve geliştiriciye yol gösterici olmalı. Her öneri "kodda şu iyileştirme yapılabilir" şeklinde developer'a hitap etmeli.

Verilen JUnit test sonuçlarını analiz edip aşağıdaki JSON yapısında bir rapor döndüreceksin.

YANITINI SADECE JSON OLARAK VER. Ekstra metin, açıklama veya formatlama EKLEME.

JSON yapısı:
{
  "summary": "Test sonuçlarının kısa bir özeti (2-3 cümle, Türkçe)",
  "overallHealth": "good" | "fair" | "poor" | "critical",
  "totalTests": sayı,
  "passedTests": sayı,
  "failedTests": sayı,
  "passRate": yüzde (0-100 arası sayı),
  "comments": [
    {
      "testName": "test adı",
      "status": "passed" | "failed" | "error" | "skipped",
      "analysis": "Bu testin durumuyla ilgili analiz — geliştiriciye hitaben (Türkçe, 1-2 cümle)",
      "suggestion": "İyileştirme önerisi — geliştiriciye hitaben (Türkçe, 1 cümle)",
      "severity": "low" | "medium" | "high" | "critical"
    }
  ],
  "recommendations": [
    "Genel iyileştirme önerisi 1 — geliştiriciye hitaben (Türkçe)",
    "Genel iyileştirme önerisi 2 — geliştiriciye hitaben (Türkçe)"
  ]
}

ÖNEMLİ KURALLAR:
- overallHealth: passRate >= 90 ise "good", >= 70 ise "fair", >= 50 ise "poor", altı ise "critical"
- SADECE başarısız (failed/error) testler için comment ekle. Passed ve skipped testleri comments dizisine EKLEME.
- Her başarısız test için: hatanın sebebini analiz et, geliştiriciye yönelik düzeltme önerisi sun, severity belirle.
- severity: assertion hatası ise "high", exception ise "critical", beklenmeyen durum ise "medium", uyarı ise "low"
- recommendations: en az 3, en fazla 6 öneri. Proje kalitesini artırmaya yönelik, geliştirici ekibine yol gösteren aksiyonlar.
- Tüm öneri ve analizlerde developer'a hitap et, yapıcı dil kullan (ör: "geliştirici şu iyileştirmeyi yapabilir").`;

  const userPrompt = `İşte analiz edilecek JUnit test suite verisi (JSON):

${JSON.stringify(testSuite, null, 2)}

Lütfen bu test sonuçlarını analiz et ve yukarıda belirtilen JSON yapısında rapor hazırla.`;

  // ── Call OpenRouter ──
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://smartdash.vercel.app",
        "X-Title": "SmartDash",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    },
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Geçersiz veya iptal edilmiş API anahtarı.");
    }
    if (response.status === 402) {
      throw new Error("Bakiye yetersiz. Lütfen hesabınıza bakiye yükleyin.");
    }
    if (response.status === 429) {
      throw new Error("Çok fazla istek gönderildi. Lütfen bekleyip tekrar deneyin.");
    }
    throw new Error(
      `OpenRouter hatası (${response.status}): ${response.statusText}`,
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI yanıtı boş geldi. Lütfen tekrar deneyin.");
  }

  // ── Parse JSON from response ──
  // The model might wrap JSON in markdown code blocks
  let jsonStr = content.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr) as AIAnalysisResponse;
    return validateAndNormalize(parsed, testSuite);
  } catch {
    // Try to salvage partial JSON
    const partialMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (partialMatch) {
      try {
        const parsed = JSON.parse(partialMatch[0]) as AIAnalysisResponse;
        return validateAndNormalize(parsed, testSuite);
      } catch {
        throw new Error(
          "AI yanıtı JSON formatında değil. Lütfen tekrar deneyin.",
        );
      }
    }
    throw new Error(
      "AI yanıtı JSON formatında değil. Lütfen tekrar deneyin.",
    );
  }
}

/**
 * Validate and normalize the parsed AI response, filling in
 * any missing fields with sensible defaults.
 */
function validateAndNormalize(
  parsed: Partial<AIAnalysisResponse>,
  testSuite: TestSuite,
): AIAnalysisResponse {
  const totalTests = parsed.totalTests ?? testSuite.tests;
  const passedTests = parsed.passedTests ??
    testSuite.testCases.filter((tc) => tc.status === "passed").length;
  const failedTests = parsed.failedTests ??
    testSuite.testCases.filter((tc) => tc.status === "failed" || tc.status === "error").length;
  const passRate = parsed.passRate ?? (totalTests > 0 ? (passedTests / totalTests) * 100 : 0);

  return {
    summary: parsed.summary || "Analiz tamamlandı.",
    overallHealth: parsed.overallHealth ?? (passRate >= 90 ? "good" : passRate >= 70 ? "fair" : passRate >= 50 ? "poor" : "critical"),
    totalTests,
    passedTests,
    failedTests,
    passRate,
    comments: Array.isArray(parsed.comments) ? parsed.comments : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
  };
}
