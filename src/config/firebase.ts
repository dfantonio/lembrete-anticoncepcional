import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { FirebaseConfig } from "../types";

// Configuração do Firebase
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyC5CTI9uIhTEbZhmk4JxqHgdGiAM093rmQ",
  authDomain: "app-anticoncepcional.firebaseapp.com",
  projectId: "app-anticoncepcional",
  storageBucket: "app-anticoncepcional.firebasestorage.app",
  messagingSenderId: "132084859607",
  appId: "1:132084859607:web:eea8b0bdc4bf85d0c6e692",
  measurementId: "G-4TT21RTJ16",
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);

// Exportar instâncias dos serviços
export const db = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Configurações do app
export const APP_ID = "lembrete-anticoncepcional";

// Caminhos das coleções no Firestore
export const COLLECTIONS = {
  DAILY_LOG: `artifacts/${APP_ID}/public/data/daily_log`,
  USERS_CONFIG: `artifacts/${APP_ID}/public/data/users_config`,
} as const;

export default app;
