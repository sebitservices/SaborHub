import { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

// Crear el contexto
const AuthContext = createContext(null);

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRoles, setUserRoles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const fetchUserRoles = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      if (userDoc.exists()) {
        setUserRoles(userDoc.data());
      } else {
        console.log("No se encontró el documento del usuario");
        setUserRoles(null);
      }
    } catch (error) {
      console.error("Error al obtener roles del usuario:", error);
      // Si el error es por bloqueo, intentar reconectar
      if (error.code === 'failed-precondition' || error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        if (retryCount < MAX_RETRIES) {
          console.log(`Reintentando conexión... Intento ${retryCount + 1} de ${MAX_RETRIES}`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchUserRoles(user);
          }, 2000 * (retryCount + 1)); // Backoff exponencial
        } else {
          toast.error('Error de conexión. Por favor, desactiva el bloqueador de anuncios para esta página.');
        }
      }
      setUserRoles(null);
    }
  };

  useEffect(() => {
    let unsubscribe;
    
    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        
        if (user) {
          await fetchUserRoles(user);
        } else {
          setUserRoles(null);
        }
        
        setLoading(false);
      });
    } catch (error) {
      console.error("Error en la autenticación:", error);
      setLoading(false);
      toast.error('Error de conexión con el servicio de autenticación');
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [retryCount]); // Agregamos retryCount como dependencia

  const value = {
    currentUser,
    userRoles,
    loading,
    retryConnection: () => setRetryCount(0) // Función para reiniciar manualmente la conexión
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
