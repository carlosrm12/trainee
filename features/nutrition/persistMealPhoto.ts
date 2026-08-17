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
export async function persistMealPhoto(
  pickedUri: string,
): Promise<PersistedMealPhoto> {
  const manipulated = await ImageManipulator.manipulate(pickedUri)
    .resize({ width: MAX_WIDTH })
    .renderAsync();
  const result = await manipulated.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });

  if (!result.base64) {
    throw new Error("No se pudo generar el Base64 de la foto.");
  }

  const dest = new File(Paths.document, `meal-${randomUUID()}.jpg`);
  const source = new File(result.uri);
  await source.copy(dest);

  return { uri: dest.uri, base64: result.base64 };
}
