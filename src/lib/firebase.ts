import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  setDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export async function testConnection() {
  try {
    // Testing connection to a dummy doc to verify rules/connectivity
    await getDocFromServer(doc(firestore, 'system', 'connection-test'));
    console.log("Firebase connection successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.error("Firebase is offline. Check configuration.");
    } else {
      console.warn("Connection test handled (expected if path is locked):", error);
    }
  }
}

export { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc,
  Timestamp,
  writeBatch,
  onAuthStateChanged,
  signInWithPopup
};
export type { User };
