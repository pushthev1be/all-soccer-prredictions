import { useState, useEffect, useCallback } from "react";

interface UseAutoSaveOptions<T> {
  key: string;
  interval?: number;
  onSave?: (data: T) => void;
  onLoad?: (data: T) => void;
}

export function useAutoSave<T extends Record<string, any>>(initialData: T, options: UseAutoSaveOptions<T>) {
  const { key, interval = 3000, onSave, onLoad } = options;

  const [data, setData] = useState<T>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          onLoad?.(parsed);
          return { ...initialData, ...parsed };
        } catch {
          return initialData;
        }
      }
    }
    return initialData;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const save = useCallback(
    (currentData: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(currentData));
        setLastSaved(new Date());
        setIsDirty(false);
        onSave?.(currentData);
        return true;
      } catch (error) {
        console.error("Failed to save draft:", error);
        return false;
      }
    },
    [key, onSave]
  );

  useEffect(() => {
    if (!isDirty || Object.keys(data).length === 0) return;

    const timer = setTimeout(() => {
      save(data);
    }, interval);

    return () => clearTimeout(timer);
  }, [data, isDirty, interval, save]);

  const updateData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setData((prev) => {
      const newData = typeof updates === "function" ? updates(prev) : { ...prev, ...updates };
      setIsDirty(true);
      return newData;
    });
  }, []);

  const manualSave = useCallback(() => save(data), [data, save]);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
    setData(initialData);
    setLastSaved(null);
    setIsDirty(false);
  }, [key, initialData]);

  return {
    data,
    updateData,
    save: manualSave,
    clearDraft,
    lastSaved,
    isDirty,
    hasDraft: typeof window !== "undefined" && !!localStorage.getItem(key),
  };
}
