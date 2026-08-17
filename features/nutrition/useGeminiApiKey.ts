import { useCallback, useEffect, useState } from "react";
import {
  clearGeminiApiKey,
  getGeminiApiKey,
  setGeminiApiKey,
} from "./geminiApiKey";

export function useGeminiApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const key = await getGeminiApiKey();
    setApiKeyState(key);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(async (key: string) => {
    await setGeminiApiKey(key);
    setApiKeyState(key.trim() || null);
  }, []);

  const clear = useCallback(async () => {
    await clearGeminiApiKey();
    setApiKeyState(null);
  }, []);

  return { apiKey, loading, save, clear, reload: load };
}
