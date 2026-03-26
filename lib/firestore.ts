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
  where,
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

/** Fetch alerts for a specific user */
export async function getAlertsByUser(userId: string): Promise<(AlertData & { id: string })[]> {
  try {
    const q = query(
      collection(db, "alerts"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as AlertData) }));
  } catch (error) {
    console.error("Error fetching user alerts:", error);
    return [];
  }
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

export interface EvidenceData {
  userId: string;
  videoUrl: string;
  timestamp: string;
  alertId?: string;
}

export async function saveEvidence(data: EvidenceData): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "evidence"), data);
    return docRef.id;
  } catch (error) {
    console.error("Error saving evidence:", error);
    throw error;
  }
}

export async function getEvidenceByUser(userId: string): Promise<(EvidenceData & { id: string })[]> {
  try {
    const q = query(
      collection(db, "evidence"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as EvidenceData) }));
  } catch (error) {
    console.error("Error fetching evidence:", error);
    return [];
  }
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export type UserRole = "user" | "guardian" | "police" | "admin";

export interface HomeLocation {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  emergencyContacts: string[];
  homeLocation?: HomeLocation;
  linkedGuardianUid?: string; // guardian's uid linked to this user
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await setDoc(doc(db, "users", profile.uid), profile);
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

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

export async function updateUserHomeLocation(uid: string, home: HomeLocation): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), { homeLocation: home });
  } catch (error) {
    console.error("Error updating home location:", error);
    throw error;
  }
}

/** Find users whose linkedGuardianUid matches this guardian */
export async function getLinkedUsers(guardianUid: string): Promise<UserProfile[]> {
  try {
    const q = query(
      collection(db, "users"),
      where("linkedGuardianUid", "==", guardianUid)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch {
    return [];
  }
}
