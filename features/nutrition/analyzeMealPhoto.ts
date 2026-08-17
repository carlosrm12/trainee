// Llamada directa al REST API de Gemini desde el cliente, sin backend
// intermedio — uso 100% personal, aceptable según §14 del doc de Fase 2.
// Usa responseSchema para forzar salida JSON estructurada en vez de confiar
// en que el modelo "se porte bien" con un prompt de texto libre.

// Google bloqueó gemini-2.5-flash para API keys nuevas — se usa la serie
// Gemini 3.x, que reemplaza thinking_budget por thinking_level y desaconseja
// tocar temperature/top_p/top_k (no los usamos, no agregarlos).
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface MealAnalysisResult {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: number; // 0-1
}

export class GeminiAnalysisError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "GeminiAnalysisError";
    this.cause = cause;
  }
}

const ANALYSIS_PROMPT = `Sos un asistente de nutrición. Te voy a mandar una foto de un plato de comida. Analizá la imagen y devolvé una estimación de sus valores nutricionales.

Reglas:
- "name": nombre corto y descriptivo del plato en español (ej. "Pollo con arroz y ensalada"), no una lista de ingredientes.
- "calories": estimación total en kcal, número entero.
- "proteinG", "carbsG", "fatG": estimación en gramos, pueden tener decimales.
- "confidence": tu propia confianza en la estimación, de 0 a 1. Bajala si la foto está borrosa, mal iluminada, el plato está parcialmente fuera de cuadro, o hay ingredientes ocultos (salsas, aceite) difíciles de estimar.
- Si hay varias porciones o platos en la foto, estimá el total combinado.
- No agregues texto fuera del JSON. No expliques tu razonamiento.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    calories: { type: "INTEGER" },
    proteinG: { type: "NUMBER" },
    carbsG: { type: "NUMBER" },
    fatG: { type: "NUMBER" },
    confidence: { type: "NUMBER" },
  },
  required: ["name", "calories", "proteinG", "carbsG", "fatG", "confidence"],
};

// `base64Image` debe ser Base64 puro, SIN el prefijo `data:image/jpeg;base64,`
// (así es como lo devuelven tanto expo-image-picker con base64:true como
// expo-image-manipulator).
export async function analyzeMealPhoto(
  base64Image: string,
  apiKey: string,
): Promise<MealAnalysisResult> {
  if (!apiKey) {
    throw new GeminiAnalysisError("Falta configurar la API key de Gemini.");
  }

  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: ANALYSIS_PROMPT },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          // "low": esta tarea es una estimación directa de una imagen, no
          // necesita el razonamiento profundo del default "medium" — más
          // rápido y más barato sin perder calidad para este caso.
          thinkingConfig: { thinkingLevel: "LOW" },
        },
      }),
    });
  } catch (err) {
    // Sin red, timeout, etc — el llamador decide el fallback (§5: el
    // registro queda en estado "pending", reintentable desde el dashboard).
    throw new GeminiAnalysisError("No se pudo conectar con Gemini.", err);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new GeminiAnalysisError(
      `Gemini devolvió un error (${response.status}).`,
      errorBody,
    );
  }

  const data = await response.json();
  const rawText: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new GeminiAnalysisError(
      "Gemini no devolvió contenido analizable.",
      data,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new GeminiAnalysisError(
      "La respuesta de Gemini no es JSON válido.",
      err,
    );
  }

  return validateMealAnalysis(parsed);
}

// La IA nunca escribe directo a SQLite (§5) — pero antes de que el llamador
// siquiera muestre el resultado al usuario, esta función valida/sanitiza
// tipos: números fuera de rango, campos faltantes, etc. no deben tirar la
// app abajo, solo caer a un valor por defecto razonable.
function validateMealAnalysis(value: unknown): MealAnalysisResult {
  if (typeof value !== "object" || value === null) {
    throw new GeminiAnalysisError(
      "Respuesta de Gemini con formato inesperado.",
    );
  }
  const v = value as Record<string, unknown>;
  const name = typeof v.name === "string" ? v.name : "Comida sin identificar";
  const calories = toFiniteNumber(v.calories, 0);
  const proteinG = toFiniteNumber(v.proteinG, 0);
  const carbsG = toFiniteNumber(v.carbsG, 0);
  const fatG = toFiniteNumber(v.fatG, 0);
  const confidenceRaw = toFiniteNumber(v.confidence, 0.5);

  return {
    name,
    calories: Math.round(calories),
    proteinG,
    carbsG,
    fatG,
    confidence: Math.min(1, Math.max(0, confidenceRaw)),
  };
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}
