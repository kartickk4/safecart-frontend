import { initializeApp, getApps } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDb0HRSlYk7mX9y_R8hnUHeeaz9kvHz238",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "securekaro-f19f2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "securekaro-f19f2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "securekaro-f19f2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "928059002317",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:928059002317:web:81299b824052a8043f0884",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RNSCQ7E4VS"
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
