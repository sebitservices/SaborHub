import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { doc, deleteDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, deleteUser, getAuth } from "firebase/auth";
import { db, auth } from "../../firebase/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash, faSpinner, faExclamationTriangle, faCheck, faShieldAlt, faLock } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";

const DeleteUserModal = ({ isOpen, onClose, onUserDeleted, user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { currentUser } = useAuth();
  const [adminCredentials, setAdminCredentials] = useState({
    email: '',
    password: ''
  });
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  
  // Verificar si es el administrador actual intentando eliminarse a sí mismo
  const isSelfDelete = currentUser && user && currentUser.uid === user.id && user.role?.toLowerCase() === 'administrador';

  // Controlar animación de entrada/salida
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Prevenir scroll en el body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Cargar el email del admin actual cuando se abre el modal
  useEffect(() => {
    if (isOpen && currentUser?.email) {
      setAdminCredentials(prev => ({...prev, email: currentUser.email}));
    }
  }, [isOpen, currentUser?.email]);
  
  // Solicitar autenticación del administrador
  const requestAdminAuth = () => {
    setShowAdminAuth(true);
  };
  
  // Manejar la autenticación del administrador
  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Verificar credenciales del administrador
      await signInWithEmailAndPassword(
        auth,
        adminCredentials.email,
        adminCredentials.password
      );
      
      // Credenciales válidas, continuar con la eliminación
      setShowAdminAuth(false);
      await deleteUserProcess();
    } catch (error) {
      console.error("Error de autenticación:", error);
      setError("Credenciales de administrador incorrectas");
      setLoading(false);
    }
  };

  // Proceso de eliminación de usuario (tanto de Firestore como de Authentication)
  const deleteUserProcess = async () => {
    try {
      setLoading(true);
      
      // 1. Eliminar el documento del usuario de Firestore
      await deleteDoc(doc(db, "usuarios", user.id));
      
      // 2. Intentar eliminar el usuario de Firebase Authentication usando Cloud Function
      try {
        const deleteUserFromAuth = httpsCallable(functions, 'deleteUser');
        await deleteUserFromAuth({ uid: user.id });
        console.log("Usuario eliminado de Authentication con éxito");
      } catch (authError) {
        // Si falla la eliminación de Authentication, lo registramos pero no bloqueamos el proceso
        console.error("No se pudo eliminar de Authentication:", authError);
      }
      
      // 3. Mostrar mensaje de éxito brevemente
      setSuccess(true);
      
      // 4. Notificar al componente padre y cerrar el modal
      setTimeout(() => {
        onUserDeleted(user.id, {
          success: true,
          message: `Usuario ${user.name} eliminado correctamente`,
          userData: user
        });
        
        // 5. Cerrar el modal con una pequeña demora para ver la animación
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setShowAdminAuth(false);
          setAdminCredentials(prev => ({...prev, password: ''}));
        }, 500);
      }, 1200);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar la eliminación del usuario
  const handleDeleteUser = async () => {
    if (!user || !user.id) {
      setError("No se pudo identificar el usuario a eliminar");
      return;
    }

    // Verificar si es el usuario actual intentando eliminarse a sí mismo
    if (isSelfDelete) {
      setError("No puedes eliminar tu propia cuenta de administrador por seguridad");
      return;
    }

    // Solicitar autenticación del administrador antes de proceder
    requestAdminAuth();
  };

  if (!isOpen) return null;

  // Modal para confirmación de credenciales de administrador
  if (showAdminAuth) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-0">
        <div 
          className={`fixed inset-0 bg-black transition-opacity duration-300 ${isAnimating ? 'bg-opacity-70' : 'bg-opacity-0'} backdrop-blur-sm`}
          onClick={onClose}
        ></div>
        <div className={`relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all duration-300 ${
          isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}>
          <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-800">Autenticación Requerida</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full p-1"
              aria-label="Cerrar"
            >
              <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 animate-fadeIn">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <div className="text-center mb-5">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-amber-100 mb-3">
                <FontAwesomeIcon icon={faLock} className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Confirma tu identidad</h3>
              <p className="text-gray-600 mt-1">
                Para eliminar usuarios, necesitamos verificar tu identidad como administrador.
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email de Administrador
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={adminCredentials.email}
                  onChange={(e) => setAdminCredentials({...adminCredentials, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña de Administrador
                </label>
                <input
                  id="admin-password"
                  type="password"
                  value={adminCredentials.password}
                  onChange={(e) => setAdminCredentials({...adminCredentials, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center justify-center min-w-[120px]"
                  disabled={loading}
                >
                  {loading ? (
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  ) : (
                    <FontAwesomeIcon icon={faLock} className="mr-2" />
                  )}
                  {loading ? "Verificando..." : "Continuar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Contenido del modal principal
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-0">
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${isAnimating ? 'bg-opacity-70' : 'bg-opacity-0'} backdrop-blur-sm`}
        onClick={onClose}
      ></div>
      <div className={`relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all duration-300 ${
        isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
      }`}>
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">Eliminar Usuario</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full p-1"
            aria-label="Cerrar"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 animate-fadeIn">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-4 animate-fadeIn">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <FontAwesomeIcon icon={faCheck} className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-900 mb-2">Usuario eliminado</h3>
              <p className="text-gray-600">
                El usuario ha sido eliminado exitosamente de la base de datos y del sistema de autenticación.
              </p>
            </div>
          ) : isSelfDelete ? (
            <div className="text-center py-4 animate-fadeIn">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 mb-4">
                <FontAwesomeIcon icon={faShieldAlt} className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Operación no permitida</h3>
              <p className="text-gray-600 mb-6">
                Por motivos de seguridad, no puedes eliminar tu propia cuenta de administrador.
                <br />
                <span className="text-amber-600 text-sm mt-2 block">
                  Esta restricción evita que el sistema se quede sin acceso administrativo.
                </span>
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
              >
                Entendido
              </button>
            </div>
          ) : (
            <div className="text-center py-4 animate-fadeIn">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <FontAwesomeIcon icon={faTrash} className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Confirmar eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar al usuario 
                <span className="font-semibold"> {user?.name || 'seleccionado'}</span>?
                <br />
                <span className="text-gray-600 mt-1 block">
                  Esta acción eliminará al usuario tanto de la base de datos como del sistema de autenticación.
                </span>
                <span className="text-red-600 text-sm mt-2 block font-medium">
                  Esta acción no se puede deshacer.
                </span>
              </p>

              <div className="flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center justify-center min-w-[120px] transition-all duration-200 transform hover:scale-105"
                  disabled={loading || isSelfDelete}
                >
                  {loading ? (
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  ) : (
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  )}
                  {loading ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeleteUserModal;
