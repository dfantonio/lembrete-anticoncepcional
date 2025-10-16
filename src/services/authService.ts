import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  User,
} from "firebase/auth";
import { auth } from "../config/firebase";

export class AuthService {
  /**
   * Inicia autenticação anônima
   * Retorna o userId persistente para o dispositivo
   */
  static async signInAnonymously(): Promise<string> {
    try {
      const userCredential = await signInAnonymously(auth);
      const userId = userCredential.user.uid;
      console.log("✅ Usuário autenticado anonimamente:", userId);
      return userId;
    } catch (error) {
      console.error("❌ Erro na autenticação anônima:", error);
      throw error;
    }
  }

  /**
   * Observa mudanças no estado de autenticação
   * Útil para detectar quando o usuário faz login/logout
   */
  static onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Obtém o usuário atual
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Obtém o userId atual
   */
  static getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  /**
   * Faz logout do usuário
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log("✅ Usuário deslogado");
    } catch (error) {
      console.error("❌ Erro no logout:", error);
      throw error;
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  static isAuthenticated(): boolean {
    return !!auth.currentUser;
  }
}
