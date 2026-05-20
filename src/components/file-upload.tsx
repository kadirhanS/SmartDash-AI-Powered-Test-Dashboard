"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileUploadSkeleton } from "@/components/skeletons";
import type { TestSuite } from "@/lib/types";

interface FileUploadProps {
  onFileParsed: (data: TestSuite, fileName: string) => void;
  onFileRemove: () => void;
}

export default function FileUpload({ onFileParsed, onFileRemove }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): boolean => {
    if (!f.name.toLowerCase().endsWith(".xml")) {
      setError("Yalnızca .xml dosyaları kabul edilir");
      return false;
    }
    if (f.size === 0) {
      setError("Dosya boş");
      return false;
    }
    setError(null);
    return true;
  };

  const parseFile = async (f: File) => {
    setIsParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", f);

      const res = await fetch("/api/parse-xml", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "XML ayrıştırılamadı");
      }

      onFileParsed(data as TestSuite, f.name);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Beklenmeyen bir hata oluştu";
      setError(message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileAccepted = (f: File) => {
    setFile(f);
    parseFile(f);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && validateFile(droppedFile)) {
      handleFileAccepted(droppedFile);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      handleFileAccepted(selectedFile);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileRemove();
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {!file ? (
          /* ── Drop Zone ── */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            )}
          >
            <Upload className="size-10 text-muted-foreground" />

            <div className="text-center">
              <p className="text-sm font-medium">
                XML dosyasını sürükleyip bırakın
              </p>
              <p className="mt-1 text-xs text-muted-foreground">veya</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Dosya Seç
            </Button>

            <input
              ref={inputRef}
              type="file"
              accept=".xml"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <span>{error}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setError(null);
                  }}
                  className="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-destructive/10 transition-colors"
                  aria-label="Hatayı kapat"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Yalnızca JUnit XML (.xml) dosyaları desteklenir
            </p>
          </div>
        ) : isParsing ? (
          /* ── Parsing skeleton ── */
          <FileUploadSkeleton />
        ) : (
          /* ── Uploaded File Info ── */
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
            <FileText className="size-8 shrink-0 text-primary" />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(file.size)}
              </p>
            </div>

            <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={isParsing}
              aria-label="Dosyayı kaldır"
              title="Dosyayı kaldır"
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
