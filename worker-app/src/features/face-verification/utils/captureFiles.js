import * as FileSystem from "expo-file-system";
export async function deleteCaptureFile(uri) {
  if (typeof uri !== "string") return;
  if (uri.startsWith("blob:")) {
    URL.revokeObjectURL(uri);
    return;
  }
  if (FileSystem.cacheDirectory && uri.startsWith(FileSystem.cacheDirectory)) {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      /* Cache cleanup retries at app lifecycle; never expose a local path. */
    }
  }
}
