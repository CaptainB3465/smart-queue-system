import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp, where, limit, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmUNME-QNuHlLi8w0DL0Fjwh-6GFnrqUQ",
  authDomain: "smartqueueapp-76cdc.firebaseapp.com",
  projectId: "smartqueueapp-76cdc",
  storageBucket: "smartqueueapp-76cdc.firebasestorage.app",
  messagingSenderId: "223583755028",
  appId: "1:223583755028:web:93a9b413e6e82ef3c20001"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Export Firestore utilities
export { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp, where, limit, setDoc, getDoc };

