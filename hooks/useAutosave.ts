"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function useAutosave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
  onError,
}: UseAutosaveOptions<T>) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef<string>("");
  const savingRef = useRef(false);

  const save = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;

    try {
      await onSave(data);
      lastSavedRef.current = JSON.stringify(data);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error("Autosave failed"));
    } finally {
      savingRef.current = false;
    }
  }, [data, onSave, onError]);

  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(data);
    if (currentData === lastSavedRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    save();
  }, [save]);

  return { forceSave, isSaving: savingRef.current };
}