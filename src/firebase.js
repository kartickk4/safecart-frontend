import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

if (!import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.PROD) {
  console.warn("⚠️ Production Notice: VITE_FIREBASE_API_KEY is not defined in environment variables. Using project default credentials.");
}

// Initialize Firebase once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export Authentication instance and Firebase Auth helpers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup };
export default app;
