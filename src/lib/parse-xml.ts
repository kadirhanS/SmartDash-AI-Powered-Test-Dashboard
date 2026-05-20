import { XMLParser } from "fast-xml-parser";
import type { TestSuite, TestCase } from "./types";

/* ── Raw shape from fast-xml-parser ── */

interface RawProperty {
  "@_name": string;
  "@_value": string;
}

interface RawFailure {
  "@_message": string;
  "@_type": string;
  "#text"?: string;
}

interface RawError {
  "@_message": string;
  "@_type": string;
  "#text"?: string;
}

interface RawSkipped {
  "@_message"?: string;
}

interface RawTestCase {
  "@_name": string;
  "@_classname"?: string;
  "@_time": string | number;
  failure?: RawFailure;
  error?: RawError;
  skipped?: RawSkipped;
}

interface RawTestSuite {
  "@_name": string;
  "@_tests": string | number;
  "@_failures": string | number;
  "@_errors": string | number;
  "@_skipped": string | number;
  "@_time": string | number;
  "@_timestamp"?: string;
  properties?: {
    property: RawProperty | RawProperty[];
  };
  testcase?: RawTestCase | RawTestCase[];
}

/* ── Helpers ── */

function toNumber(value: string | number | undefined | null, fallback = 0): number {
  if (value == null) return fallback;
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toString(value: string | undefined | null, fallback = ""): string {
  return value ?? fallback;
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function mapStatus(testCase: RawTestCase): TestCase["status"] {
  if (testCase.skipped) return "skipped";
  if (testCase.error) return "error";
  if (testCase.failure) return "failed";
  return "passed";
}

function mapFailure(failure: RawFailure): TestCase["failure"] {
  return {
    message: toString(failure["@_message"]),
    type: toString(failure["@_type"]),
    stackTrace: toString(failure["#text"]).trim(),
  };
}

function mapError(error: RawError): TestCase["error"] {
  return {
    message: toString(error["@_message"]),
    type: toString(error["@_type"]),
    stackTrace: toString(error["#text"]).trim(),
  };
}

function mapSkipped(skipped: RawSkipped): TestCase["skipped"] {
  return {
    message: skipped["@_message"] ?? undefined,
  };
}

function mapTestCase(raw: RawTestCase): TestCase {
  return {
    name: toString(raw["@_name"]),
    classname: toString(raw["@_classname"]),
    time: toNumber(raw["@_time"]),
    status: mapStatus(raw),
    ...(raw.failure ? { failure: mapFailure(raw.failure) } : {}),
    ...(raw.error ? { error: mapError(raw.error) } : {}),
    ...(raw.skipped ? { skipped: mapSkipped(raw.skipped) } : {}),
  };
}

function mapProperties(
  rawProps: RawProperty | RawProperty[] | undefined,
): Record<string, string> | undefined {
  const arr = toArray(rawProps);
  if (arr.length === 0) return undefined;

  const result: Record<string, string> = {};
  for (const p of arr) {
    result[p["@_name"]] = p["@_value"];
  }
  return result;
}

/* ── Main Parser ── */

/**
 * Parse a JUnit XML string into a typed `TestSuite` object.
 * Works both on the server (Node.js) and client (browser).
 *
 * @throws {Error} If the XML is not valid JUnit XML or parsing fails.
 */
export function parseJUnitXml(xmlContent: string): TestSuite {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // Ensure these are always arrays even when there's only one child
    isArray: (name) => name === "testcase" || name === "property",
    textNodeName: "#text",
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = parser.parse(xmlContent) as Record<string, unknown>;
  } catch (e) {
    throw new Error(
      `XML ayrıştırma hatası: ${e instanceof Error ? e.message : "Bilinmeyen hata"}`,
    );
  }

  // Support both <testsuite> and <testsuites><testsuite>...</testsuites>
  let rawSuite: RawTestSuite | null = null;

  if (parsed.testsuite) {
    rawSuite = parsed.testsuite as RawTestSuite;
  } else if (parsed.testsuites) {
    const ts = (parsed.testsuites as { testsuite?: RawTestSuite | RawTestSuite[] }).testsuite;
    if (ts) {
      rawSuite = Array.isArray(ts) ? ts[0] : ts;
    }
  }

  if (!rawSuite || !rawSuite["@_name"]) {
    throw new Error(
      "Geçerli bir JUnit XML dosyası değil: <testsuite> öğesi bulunamadı",
    );
  }

  const rawCases = toArray(rawSuite.testcase);

  return {
    name: rawSuite["@_name"],
    tests: toNumber(rawSuite["@_tests"]),
    failures: toNumber(rawSuite["@_failures"]),
    errors: toNumber(rawSuite["@_errors"]),
    skipped: toNumber(rawSuite["@_skipped"]),
    time: toNumber(rawSuite["@_time"]),
    timestamp: rawSuite["@_timestamp"] ?? undefined,
    properties: mapProperties(rawSuite.properties?.property),
    testCases: rawCases.map(mapTestCase),
  };
}
