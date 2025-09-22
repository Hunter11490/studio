// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";

// Your web app's Firebase configuration
// IMPORTANT: Replace this with your actual Firebase config object
const firebaseConfig = {
  apiKey: "api-key",
  authDomain: "project-id.firebaseapp.com",
  projectId: "project-id",
  storageBucket: "project-id.appspot.com",
  messagingSenderId: "sender-id",
  appId: "app-id"
};

// Initialize Firebase
let app;
if (typeof window !== 'undefined') {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}


export default app;
