import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    return signOut(auth);
  };

  // Función para restablecer contraseña
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Obtener información adicional del usuario desde Firestore
  const getUserInfo = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "usuarios", uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.rol || null);
        setUserPermissions(userData.permisos || null);
        return userData;
      } else {
        console.log("No se encontró información adicional del usuario en Firestore");
        setUserRole(null);
        setUserPermissions(null);
        return null;
      }
    } catch (error) {
      console.error("Error al obtener información del usuario:", error);
      return null;
    }
  };

  // Efecto para escuchar cambios en la autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await getUserInfo(user.uid);
      } else {
        setUserRole(null);
        setUserPermissions(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    resetPassword,
    userRole,
    userPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
