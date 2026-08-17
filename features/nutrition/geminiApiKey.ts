import * as SecureStore from "expo-secure-store";

// Nunca hardcodear la key en el bundle ni en app.json (§14 del doc de Fase 2)
// — se guarda cifrada en el dispositivo vía expo-secure-store.
const STORAGE_KEY = "gemini_api_key";

export async function getGeminiApiKey(): Promise<string | null> {
  return SecureStore.getItemAsync(STORAGE_KEY);
}

export async function setGeminiApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, trimmed);
}

export async function clearGeminiApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
