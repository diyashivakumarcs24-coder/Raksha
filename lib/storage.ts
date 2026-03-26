import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadAudio(blob: Blob, filename: string): Promise<string> {
  try {
    const storageRef = ref(storage, `recordings/${filename}`);
    await uploadBytes(storageRef, blob, { contentType: "audio/webm" });
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw error;
  }
}
