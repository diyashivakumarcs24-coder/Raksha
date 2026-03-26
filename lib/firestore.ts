import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// ─── Alert ────────────────────────────────────────────────────────────────────

export interface AlertData {
  userId?: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  audioURL?: string;
  videoURL?: string;
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

export async function updateAlertVideo(id: string, videoURL: string): Promise<void> {
  try {
    await updateDoc(doc(db, "alerts", id), { videoURL });
  } catch (error) {
    console.error("Error updating alert video:", error);
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

// ─── User Profile ─────────────────────────────────────────────────────────────

export type UserRole = "user" | "guardian" | "police" | "admin";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  emergencyContacts: string[]; // array of phone numbers
}

/** Create or overwrite a user profile in Firestore */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, "users", profile.uid), profile);
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

/** Fetch a user profile by uid */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}
