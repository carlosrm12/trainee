import type { NutritionProfile } from "@/domain/entities";
import type { DailyTotals } from "./computeMealTotals";

// Mismo modelo/endpoint que analyzeMealPhoto.ts — ver el comentario ahí
// sobre por qué gemini-3.5-flash y thinkingLevel "LOW".
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export class DayReportError extends Error {
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "DayReportError";
    this.cause = cause;
  }
}

// Prompt genérico funcional — este paso (7) lo deja andando; el afinado de
// tono/casos sintéticos es trabajo separado del paso 8 (§10 del doc), no
// se hace acá. Ya sigue los criterios explícitos de §10 punto 1: segunda
// persona directa, sin lenguaje de coach genérico, sin disclaimers, límite
// de 2-3 oraciones, y obliga a mencionar un número concreto.
function buildPrompt(
  date: string,
  totals: DailyTotals,
  profile: NutritionProfile,
): string {
  return `Sos un asistente de nutrición. Te paso los datos reales de comidas que la persona registró el ${date}, comparados contra sus metas diarias. Escribí un reporte breve.
 
Reglas estrictas:
- Segunda persona, directa.
- Nada de lenguaje de coach genérico ("¡vas excelente, sigue así!").
- Sin disclaimers tipo "consultá a un profesional".
- Máximo 2-3 oraciones.
- Mencioná al menos un número o comida concreta de los datos de abajo — nunca una afirmación vaga sin dato real detrás.
- No agregues texto fuera del reporte en sí (sin saludos, sin "Aquí tienes:").
 
Consumido: ${totals.calories} kcal, ${totals.proteinG}g proteína, ${totals.carbsG}g carbohidratos, ${totals.fatG}g grasas.
Meta diaria: ${profile.dailyCalorieTarget ?? "sin definir"} kcal, ${
    profile.dailyProteinG ?? "sin definir"
  }g proteína, ${profile.dailyCarbsG ?? "sin definir"}g carbohidratos, ${
    profile.dailyFatG ?? "sin definir"
  }g grasas.
Objetivo general: ${profile.goal ?? "sin definir"}.`;
}

export async function generateDayReport(
  date: string,
  totals: DailyTotals,
  profile: NutritionProfile,
  apiKey: string,
): Promise<string> {
  if (!apiKey) {
    throw new DayReportError("Falta configurar la API key de Gemini.");
  }

  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(date, totals, profile) }] }],
        generationConfig: {
          thinkingConfig: { thinkingLevel: "LOW" },
        },
      }),
    });
  } catch (err) {
    throw new DayReportError("No se pudo conectar con Gemini.", err);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new DayReportError(
      `Gemini devolvió un error (${response.status}).`,
      errorBody,
    );
  }

  const data = await response.json();
  const rawText: string | undefined =
    data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new DayReportError("Gemini no devolvió contenido analizable.", data);
  }

  return rawText.trim();
}
