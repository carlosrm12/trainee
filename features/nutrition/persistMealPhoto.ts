import { randomUUID } from "expo-crypto";
import { File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const MAX_WIDTH = 1024;
const JPEG_QUALITY = 0.7;

export interface PersistedMealPhoto {
  uri: string; // copia persistente local (Paths.document), para mostrar y para retención de 14 días
  base64: string; // Base64 puro (sin prefijo data:), listo para mandar a Gemini
}

// Antes de enviar el Base64, la imagen se comprime/redimensiona (§5) — el
// payload típico de una foto de cámara moderna es innecesariamente grande
// para este uso. Se persiste esa misma versión comprimida (no la original)
// como copia local: ahorra espacio y evita mantener dos archivos por comida.
//
// Fix post-paso 6: fotos tomadas con cámara (no de galería) crasheaban la
// app en Expo Go sin ningún error en consola — síntoma típico de OOM en
// Android. Causa probable: `saveAsync({ base64: true })` generaba el
// string base64 en el mismo paso que renderiza la imagen a resolución
// completa (una foto de cámara puede ser 12-48MP), duplicando el pico de
// memoria justo en el momento más caro. Se separa en dos pasos: primero
// guardar el archivo ya redimensionado en disco, y RECIÉN DESPUÉS —con el
// bitmap grande ya liberado— leer el base64 desde ese archivo chico.
export async function persistMealPhoto(
  pickedUri: string,
): Promise<PersistedMealPhoto> {
  const manipulated = await ImageManipulator.manipulate(pickedUri)
    .resize({ width: MAX_WIDTH })
    .renderAsync();
  const result = await manipulated.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
  });

  const dest = new File(Paths.document, `meal-${randomUUID()}.jpg`);
  const source = new File(result.uri);
  await source.copy(dest);

  const base64 = await dest.base64();

  return { uri: dest.uri, base64 };
}
