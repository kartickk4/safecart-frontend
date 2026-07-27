import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDb0HRSlYk7mX9y_R8hnUHeeaz9kvHz238",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "safecart-f19f2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "safecart-f19f2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "safecart-f19f2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "928059002317",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:928059002317:web:81299b824052a8043f0884",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RNSCQ7E4VS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication instance and Firebase Phone Auth helpers
export const auth = getAuth(app);
export { RecaptchaVerifier, signInWithPhoneNumber };
export default app;
