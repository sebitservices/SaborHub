// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB8oBjIiWxYmPQX1M6G3E3mk_y_jD7uXvU",
  authDomain: "saborhub-f9066.firebaseapp.com",
  projectId: "saborhub-f9066",
  storageBucket: "saborhub-f9066.firebasestorage.app",
  messagingSenderId: "1098222539305",
  appId: "1:1098222539305:web:0e804adf6305f0afa80238"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Si estás en desarrollo, conectar al emulador de funciones local (opcional)
if (process.env.NODE_ENV === 'development') {
  // Descomenta la siguiente línea si usas emuladores locales
  // connectFunctionsEmulator(functions, "localhost", 5001);
}

export default app;
