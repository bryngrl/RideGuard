import { File } from "expo-file-system";
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
    const response = await fetch(asset.uri);
    if (!response.ok) throw new Error("Photo unavailable. Choose it again.");
    const blob = await response.blob();
    if (!blob.size) throw new Error("Photo unavailable. Choose it again.");
    if (blob.size > MAX_BYTES) throw new Error("Choose a photo smaller than 5 MB.");
    body.append("photo", blob, name);
  } else {
    const file = new File(asset.uri);
    if (!file.exists || !file.size) throw new Error("Photo unavailable. Choose it again.");
    if (file.size > MAX_BYTES) throw new Error("Choose a photo smaller than 5 MB.");
    body.append("photo", file);
  }
}
