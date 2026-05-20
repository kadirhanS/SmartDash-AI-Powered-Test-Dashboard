"use client";

import { useState, useCallback, useEffect } from "react";
import type { TestSuite } from "@/lib/types";

const STORAGE_KEY = "smartdash-run-history";
const MAX_HISTORY = 50;

export interface HistoryItem {
  id: string;
  fileName: string;
  timestamp: number;
  testCount: number;
  passedCount: number;
  failedCount: number;
  data: TestSuite;
}

export function useRunHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as HistoryItem[];
        setHistory(parsed);
      }
    } catch {
      // Ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Persist to localStorage whenever history changes
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch {
        // localStorage might be full
      }
    }
  }, [history, loaded]);

  const addToHistory = useCallback((data: TestSuite, fileName: string): HistoryItem => {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      fileName,
      timestamp: Date.now(),
      testCount: data.testCases.length,
      passedCount: data.testCases.filter((tc) => tc.status === "passed").length,
      failedCount: data.testCases.filter(
        (tc) => tc.status === "failed" || tc.status === "error",
      ).length,
      data,
    };

    setHistory((prev) => {
      // Don't add duplicate (same fileName + same testCount)
      const isDuplicate = prev.some(
        (h) => h.fileName === fileName && h.testCount === data.testCases.length,
      );
      if (isDuplicate) return prev;

      const updated = [item, ...prev];
      return updated.slice(0, MAX_HISTORY);
    });

    setActiveId(item.id);
    return item;
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setActiveId(null);
  }, []);

  const selectHistoryItem = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  return {
    history,
    loaded,
    activeId,
    addToHistory,
    removeFromHistory,
    clearHistory,
    selectHistoryItem,
  };
}
