import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export interface AlertData {
  timestamp: string;
  latitude: number;
  longitude: number;
  audioURL?: string;
  status: "triggered";
}

export async function saveAlert(data: AlertData): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "alerts"), data);
    return docRef.id;
  } catch (error) {
    console.error("Error saving alert:", error);
    throw error;
  }
}

export async function updateAlertAudio(id: string, audioURL: string): Promise<void> {
  try {
    await updateDoc(doc(db, "alerts", id), { audioURL });
  } catch (error) {
    console.error("Error updating alert audio:", error);
    throw error;
  }
}

export async function getAlerts(): Promise<(AlertData & { id: string })[]> {
  try {
    const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as AlertData) }));
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }
}
