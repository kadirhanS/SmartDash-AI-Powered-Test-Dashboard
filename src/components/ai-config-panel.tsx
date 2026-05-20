"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Lock,
  Zap,
  Bot,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { TestSuite } from "@/lib/types";
import type { OpenRouterModel, AIAnalysisResponse } from "@/lib/ai-types";

// ── Props ──

export interface AIConfigPanelProps {
  testSuite: TestSuite | null;
  onAnalysisComplete: (result: AIAnalysisResponse) => void;
  onAnalysisStart: () => void;
  isAnalyzing: boolean;
}

type ValidationStatus = "idle" | "validating" | "valid" | "invalid" | "saved";

// ── Component ──

export default function AIConfigPanel({
  testSuite,
  onAnalysisComplete,
  onAnalysisStart,
  isAnalyzing,
}: AIConfigPanelProps) {
  // API Key state — loaded lazily from sessionStorage (avoids useEffect setState cascade)
  const [apiKey, setApiKey] = useState(() => {
    try {
      return sessionStorage.getItem("sdApiKey") || "";
    } catch {
      return "";
    }
  });
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>(() => {
    try {
      return sessionStorage.getItem("sdApiKey") ? "saved" : "idle";
    } catch {
      return "idle";
    }
  });
  const [validationMessage, setValidationMessage] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("sdApiKey") ? "Kaydedildi — Doğrulamak için tıklayın" : null;
    } catch {
      return null;
    }
  });

  // Plan & model state
  const [plan, setPlan] = useState<"free" | "paid">("free");
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // ── Save API key to sessionStorage on change ──
  const saveApiKey = useCallback((key: string) => {
    try {
      sessionStorage.setItem("sdApiKey", key);
    } catch {
      // sessionStorage might be full or unavailable
    }
  }, []);

  const handleKeyChange = (value: string) => {
    setApiKey(value);
    if (value.trim()) {
      saveApiKey(value);
      if (validationStatus === "valid" || validationStatus === "invalid") {
        setValidationStatus("saved");
        setValidationMessage("Kaydedildi — Doğrulamak için tıklayın");
      }
    } else {
      setValidationStatus("idle");
      setValidationMessage(null);
    }
  };

  // ── Validate API Key ──
  const handleValidate = async () => {
    if (!apiKey.trim()) return;

    setValidationStatus("validating");
    setValidationMessage(null);

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (data.valid) {
        setValidationStatus("valid");
        setValidationMessage(data.warning || "Anahtar geçerli ✓");
      } else {
        setValidationStatus("invalid");
        setValidationMessage(data.message || "Geçersiz API anahtarı.");
      }
    } catch {
      setValidationStatus("invalid");
      setValidationMessage("Doğrulama sırasında bir hata oluştu.");
    }
  };

  // ── Fetch models on mount and when plan changes ──
  // All setState calls happen asynchronously (after await), avoiding cascading renders
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/models?plan=${plan}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Modeller alınamadı");
        }

        setModels(data.models || []);
        if (data.models?.length > 0) {
          setSelectedModel(data.models[0].id);
        } else {
          setSelectedModel("");
        }
        setModelsError(null);
      } catch (err) {
        setModelsError(
          err instanceof Error ? err.message : "Modeller alınamadı",
        );
        setModels([]);
        setSelectedModel("");
      } finally {
        setIsLoadingModels(false);
      }
    };

    load();
  }, [plan]);

  // ── Plan change handler ──
  const handlePlanChange = useCallback((newPlan: "free" | "paid") => {
    setPlan(newPlan);
    setIsLoadingModels(true);
    setModelsError(null);
  }, []);

  // ── Run AI Analysis ──
  const [localAnalysisError, setLocalAnalysisError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!apiKey.trim() || !selectedModel || !testSuite) return;

    setLocalAnalysisError(null);
    onAnalysisStart();

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: selectedModel,
          testSuite,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLocalAnalysisError(data.error || "Analiz sırasında bir hata oluştu");
        return;
      }

      onAnalysisComplete(data as AIAnalysisResponse);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Analiz sırasında beklenmeyen bir hata oluştu";
      setLocalAnalysisError(message);
    }
  };

  // ── Derived state ──
  const canAnalyze =
    !!apiKey.trim() &&
    !!selectedModel &&
    !!testSuite &&
    !isAnalyzing &&
    validationStatus !== "invalid";

  // ── Render ──

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-muted-foreground" />
          <CardTitle>AI Analiz Konfigürasyonu</CardTitle>
        </div>
        <CardDescription>
          OpenRouter API anahtarınızı girin ve analiz modelini seçin
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── API Key Input ── */}
        <div className="space-y-2">
          <label htmlFor="api-key" className="text-sm font-medium">API Anahtarı</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="api-key"
                type="password"
                placeholder="sk-or-..."
                value={apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                className="pl-8 pr-3"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidate}
              disabled={
                !apiKey.trim() || validationStatus === "validating"
              }
              className="shrink-0"
            >
              {validationStatus === "validating" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Doğrula"
              )}
            </Button>
          </div>

          {/* Validation status feedback */}
          {validationStatus !== "idle" && validationMessage && (
            <div className="flex items-center gap-1.5 text-xs">
              {validationStatus === "valid" && (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  <span className="text-emerald-600">{validationMessage}</span>
                </>
              )}
              {validationStatus === "invalid" && (
                <>
                  <XCircle className="size-3.5 text-red-500" />
                  <span className="text-red-600">{validationMessage}</span>
                </>
              )}
              {validationStatus === "saved" && (
                <>
                  <Key className="size-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{validationMessage}</span>
                </>
              )}
              {validationStatus === "validating" && (
                <>
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground">Doğrulanıyor...</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Security Warning ── */}
        <Alert variant="default" className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <Lock className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">
            Güvenlik Uyarısı
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            API anahtarınız yalnızca bu sekmede saklanır.
            <br />
            Sekmeyi/kapatıcıyı kapattığınızda otomatik olarak silinir.
            <br />
            Anahtarınız sunucuda asla saklanmaz — doğrudan OpenRouter&apos;a gönderilir.
          </AlertDescription>
        </Alert>

        <Separator />

        {/* ── Plan Selection ── */}
        <div className="space-y-2">
          <label htmlFor="plan-select" className="text-sm font-medium">Plan</label>
          <div className="flex gap-2" id="plan-select">
            <Button
              variant={plan === "free" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePlanChange("free")}
              className="flex-1"
            >
              <Zap className="size-4" />
              Ücretsiz
            </Button>
            <Button
              variant={plan === "paid" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePlanChange("paid")}
              className="flex-1"
            >
              <Sparkles className="size-4" />
              Ücretli
            </Button>
          </div>
        </div>

        {/* ── Model Selection ── */}
        <div className="space-y-2">
          <label htmlFor="model-select" className="text-sm font-medium">Model</label>
          {isLoadingModels ? (
            <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Modeller yükleniyor...
            </div>
          ) : modelsError ? (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertTriangle className="size-3.5" />
              {modelsError}
            </div>
          ) : models.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              Bu planda model bulunamadı.
            </div>
          ) : (
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={cn(
                "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:pointer-events-none disabled:opacity-50",
                "dark:bg-gray-800 dark:text-white dark:border-gray-600",
              )}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-gray-800 dark:text-white">
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <Separator />

        {/* ── Analyze Button ── */}
        <div className="space-y-1">
          <Button
            className="w-full"
            size="default"
            onClick={handleAnalyze}
            disabled={!canAnalyze}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analiz Ediliyor...
              </>
            ) : (
              <>
                <Bot className="size-4" />
                AI ile Analiz Et
              </>
            )}
          </Button>

          {!apiKey.trim() && (
            <p className="text-xs text-muted-foreground">
              Önce API anahtarı girin
            </p>
          )}
          {apiKey.trim() && !testSuite && (
            <p className="text-xs text-muted-foreground">
              Önce bir XML dosyası yükleyin
            </p>
          )}
          {apiKey.trim() && testSuite && !selectedModel && (
            <p className="text-xs text-muted-foreground">
              Kullanılabilir model bulunamadı
            </p>
          )}
          {localAnalysisError && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>{localAnalysisError}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
