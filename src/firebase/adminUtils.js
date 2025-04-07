import { httpsCallable } from "firebase/functions";
import { functions } from "./config";

/**
 * Elimina un usuario de Firebase Authentication mediante una función cloud
 * @param {string} uid - ID del usuario a eliminar
 * @returns {Promise} Promesa que resuelve cuando el usuario ha sido eliminado
 */
export const deleteAuthUser = async (uid) => {
  try {
    // Esta función llamaría a una Cloud Function de Firebase 
    // que tiene permisos de administrador para eliminar usuarios
    const deleteUser = httpsCallable(functions, 'deleteUser');
    await deleteUser({ uid });
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar usuario de Authentication:", error);
    throw error;
  }
};

/**
 * Verifica credenciales de administrador
 * @param {object} credentials - Credenciales del administrador
 * @returns {Promise<boolean>} Promesa que resuelve a true si las credenciales son válidas
 */
export const verifyAdminCredentials = async (credentials) => {
  try {
    // Esta función verificaría las credenciales del administrador
    const verifyAdmin = httpsCallable(functions, 'verifyAdmin');
    const result = await verifyAdmin(credentials);
    return result.data.isAdmin;
  } catch (error) {
    console.error("Error al verificar credenciales:", error);
    return false;
  }
};
