import {
  ALLOWED_VEHICLE_IMAGE_TYPES,
  MAX_VEHICLE_IMAGE_BYTES,
  MAX_VEHICLE_IMAGE_PIXELS,
  MAX_VEHICLE_IMAGE_SIDE,
} from "../config/appConfig";

const readDimensions = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const result = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No pudimos leer la imagen seleccionada."));
    };
    img.src = url;
  });

export async function validateVehicleImage(file: File): Promise<string | null> {
  if (!ALLOWED_VEHICLE_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_VEHICLE_IMAGE_TYPES)[number])) {
    return "Formato no permitido. Usá JPG, PNG o WebP.";
  }
  if (file.size > MAX_VEHICLE_IMAGE_BYTES) {
    return "La imagen supera el máximo permitido de 12 MB.";
  }
  try {
    const { width, height } = await readDimensions(file);
    if (width > MAX_VEHICLE_IMAGE_SIDE || height > MAX_VEHICLE_IMAGE_SIDE) {
      return "La imagen supera el máximo de 8000 × 8000 píxeles.";
    }
    if (width * height > MAX_VEHICLE_IMAGE_PIXELS) {
      return "La imagen supera el máximo permitido de 24 megapíxeles.";
    }
  } catch {
    return "No pudimos validar la imagen seleccionada. Probá con otro archivo.";
  }
  return null;
}
