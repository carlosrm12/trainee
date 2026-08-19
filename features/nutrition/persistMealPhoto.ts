import { randomUUID } from "expo-crypto";
import { File, Paths } from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const MAX_WIDTH = 1024;
const JPEG_QUALITY = 0.7;

export interface PersistedMealPhoto {
  uri: string; // copia persistente local (Paths.document), para mostrar y para retención de 14 días
  base64: string; // Base64 puro (sin prefijo data:), listo para mandar a Gemini
}

// Antes de enviar el Base64, la imagen se comprime/redimensiona (§5) — el
// payload típico de una foto de cámara moderna es innecesariamente grande
// para este uso.
//
// Fix post-paso 6: fotos tomadas con cámara (no de galería) crasheaban la
// app en Expo Go/Android sin ningún error en consola — síntoma de OOM
// nativo. Se cambió de la API contextual nueva de expo-image-manipulator
// (ImageManipulator.manipulate().resize().renderAsync(), basada en Skia,
// con reportes conocidos de manejo de memoria más pesado en Android) a la
// API legacy `manipulateAsync` — deprecada desde el SDK 52 pero mucho más
// madura para este caso puntual (fotos de cámara de alta resolución).
// Revisar si Expo soluciona el problema de memoria en la API nueva antes
// de volver a migrar.
export async function persistMealPhoto(
  pickedUri: string,
): Promise<PersistedMealPhoto> {
  const result = await manipulateAsync(
    pickedUri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: JPEG_QUALITY, format: SaveFormat.JPEG, base64: true },
  );

  if (!result.base64) {
    throw new Error("La manipulación de la imagen no devolvió base64.");
  }

  const dest = new File(Paths.document, `meal-${randomUUID()}.jpg`);
  const source = new File(result.uri);
  await source.copy(dest);

  return { uri: dest.uri, base64: result.base64 };
}
