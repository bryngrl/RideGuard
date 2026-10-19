import type { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function appendPhoto(body: FormData, asset: ImagePickerAsset) {
  const extension = asset.uri.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  const mimeType = asset.mimeType ||
    (extension === "png" ? "image/png" : extension === "webp" ? "image/webp" :
      extension === "jpg" || extension === "jpeg" ? "image/jpeg" : "");
  if (!TYPES.has(mimeType)) {
    throw new Error("Choose a JPEG, PNG, or WebP photo.");
  }
  if (asset.fileSize && asset.fileSize > MAX_BYTES) {
    throw new Error("Choose a photo smaller than 5 MB.");
  }
  const name = asset.fileName || `photo.${mimeType.split("/")[1]}`;
  if (Platform.OS === "web") {
    const blob = await (await fetch(asset.uri)).blob();
    if (blob.size > MAX_BYTES) throw new Error("Choose a photo smaller than 5 MB.");
    body.append("photo", blob, name);
  } else {
    body.append("photo", { uri: asset.uri, name, type: mimeType } as any);
  }
}
