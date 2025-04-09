import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // Importar createPortal
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { db, auth } from "../../firebase/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSpinner, faCheck, faExclamationTriangle, faLock } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";

const UserFormModal = ({ isOpen, onClose, onUserAdded }) => {
  const { currentUser } = useAuth(); // Obtener el usuario actual (admin)
  const [adminCredentials, setAdminCredentials] = useState({
    email: '',
    password: ''
  });
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "cajero",
    estado: "activo",
    permisos: {
      dashboard: false,
      mesas: false,
      pedidos: false,
      inventario: false,
      menu: false,
      reportes: false,
      configuracion: false,
    },
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Controlar animación de entrada/salida
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Resetear el formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        confirmPassword: "",
        rol: "cajero",
        estado: "activo",
        permisos: {
          dashboard: false,
          mesas: false,
          pedidos: false,
          inventario: false,
          menu: false,
          reportes: false,
          configuracion: false,
        },
      });
      setError("");
      setSuccess(false);
    }
  }, [isOpen]);

  // Permisos predeterminados según el rol
  const setDefaultPermissions = (rol) => {
    const permissions = {
      dashboard: rol === "administrador",
      mesas: ["administrador", "garzon"].includes(rol),
      pedidos: ["administrador", "garzon", "cajero"].includes(rol),
      inventario: ["administrador", "cocina"].includes(rol),
      menu: ["administrador", "cocina", "cajero"].includes(rol),
      reportes: rol === "administrador",
      configuracion: rol === "administrador",
    };

    setFormData((prev) => ({
      ...prev,
      rol,
      permisos: permissions,
    }));
  };

  // Manejar cambios en campos de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "rol") {
      setDefaultPermissions(value);
    }
  };

  // Manejar cambios en permisos (checkboxes)
  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [name]: checked,
      },
    }));
  };

  // Validar formulario
  const validateForm = () => {
    if (!formData.nombre.trim()) return "El nombre es obligatorio";
    if (!formData.apellido.trim()) return "El apellido es obligatorio";
    if (!formData.email.trim()) return "El email es obligatorio";
    if (!formData.password) return "La contraseña es obligatoria";
    if (formData.password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
    if (formData.password !== formData.confirmPassword) return "Las contraseñas no coinciden";
    return "";
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Si no tenemos las credenciales del admin, pedirlas primero
    if (!adminCredentials.password) {
      setShowAdminAuth(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const uid = userCredential.user.uid;
      const fechaCreacion = new Date().toISOString();
      
      // 2. Guardar datos adicionales en Firestore
      await setDoc(doc(db, "usuarios", uid), {
        uid,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        rol: formData.rol,
        estado: formData.estado,
        fechaCreacion,
        permisos: formData.permisos
      });

      // 3. Importante: Volver a iniciar sesión con el admin
      await signInWithEmailAndPassword(
        auth,
        adminCredentials.email,
        adminCredentials.password
      );

      setSuccess(true);
      
      // Proporcionar datos del usuario creado para actualizar la interfaz
      const userData = {
        uid,
        id: uid,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        rol: formData.rol,
        estado: formData.estado,
        name: `${formData.nombre} ${formData.apellido}`,
        role: formData.rol,
        status: formData.estado,
        permisos: formData.permisos
      };
      
      setTimeout(() => {
        // Limpiar credenciales del admin después de usarlas
        setAdminCredentials({email: '', password: ''});
        setShowAdminAuth(false);
        onUserAdded(userData);
        onClose();
      }, 1800); // Tiempo suficiente para ver el mensaje de éxito
    } catch (error) {
      console.error("Error al crear usuario:", error);
      if (error.code === "auth/email-already-in-use") {
        setError(
          <div>
            <p>El correo electrónico ya está registrado en el sistema.</p>
            <p className="mt-2 text-sm">
              Esto puede suceder cuando el usuario fue eliminado de la lista pero no del sistema de autenticación. 
              Por favor, utilice un correo electrónico diferente o contacte al administrador del sistema.
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Código de error: {error.code}
            </p>
          </div>
        );
      } else if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        setError("Credenciales de administrador incorrectas");
        
        // Si hay error de autenticación del admin, pedir credenciales nuevamente
        setShowAdminAuth(true);
      } else {
        setError(`Error al crear usuario: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Guardar credenciales del admin
  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Verificar que las credenciales sean correctas
      await signInWithEmailAndPassword(
        auth,
        adminCredentials.email,
        adminCredentials.password
      );
      
      // Si llegamos aquí, las credenciales son válidas
      setShowAdminAuth(false);
      // Ahora continuar con el proceso de creación de usuario
      await handleSubmit(e);
    } catch (error) {
      console.error("Error al verificar credenciales:", error);
      setError("Credenciales de administrador incorrectas");
    } finally {
      setLoading(false);
    }
  };

  // En el efecto de apertura del modal, guardar el email del admin actual
  useEffect(() => {
    if (isOpen && currentUser?.email) {
      setAdminCredentials(prev => ({...prev, email: currentUser.email}));
    }
  }, [isOpen, currentUser?.email]);

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

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;
  
  // Contenido del modal para autenticación
  const authModal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
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
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full p-1"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleAdminAuth} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <p className="mb-4 text-gray-700">
              Para crear un nuevo usuario, necesitamos confirmar tu identidad. Por favor introduce tu contraseña:
            </p>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de Administrador
              </label>
              <input
                type="email"
                value={adminCredentials.email}
                onChange={(e) => setAdminCredentials({...adminCredentials, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña de Administrador
              </label>
              <input
                type="password"
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials({...adminCredentials, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center justify-center min-w-[100px]"
              disabled={loading}
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              ) : null}
              {loading ? "Verificando..." : "Continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Contenido del modal para el formulario
  const formModal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${isAnimating ? 'bg-opacity-70' : 'bg-opacity-0'} backdrop-blur-sm`} 
        onClick={onClose}
      ></div>
      <div 
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all duration-300 ${
          isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
        style={{maxHeight: 'calc(100vh - 40px)'}}
      >
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">Agregar Nuevo Usuario</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full p-1"
            aria-label="Cerrar"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{maxHeight: 'calc(100vh - 130px)'}}>
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 animate-fadeIn">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 animate-fadeIn">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  <span>Usuario creado exitosamente</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  minLength={6}
                />
              </div>
              
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="administrador">Administrador</option>
                <option value="cajero">Cajero</option>
                <option value="garzon">Garzón/Mesero</option>
                <option value="cocina">Cocina</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>

            {/* Sección de permisos - visible solo si NO es administrador */}
            {formData.rol !== "administrador" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permisos de Acceso
                </label>
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-md">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="dashboard"
                        name="dashboard"
                        checked={formData.permisos.dashboard}
                        onChange={handlePermissionChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="dashboard" className="ml-2 text-sm text-gray-700">Dashboard</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="mesas"
                        name="mesas"
                        checked={formData.permisos.mesas}
                        onChange={handlePermissionChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="mesas" className="ml-2 text-sm text-gray-700">Mesas</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="pedidos"
                        name="pedidos"
                        checked={formData.permisos.pedidos}
                        onChange={handlePermissionChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="pedidos" className="ml-2 text-sm text-gray-700">Pedidos</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="inventario"
                        name="inventario"
                        checked={formData.permisos.inventario}
                        onChange={handlePermissionChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="inventario" className="ml-2 text-sm text-gray-700">Inventario</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="menu"
                        name="menu"
                        checked={formData.permisos.menu}
                        onChange={handlePermissionChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="menu" className="ml-2 text-sm text-gray-700">Menú</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="reportes"
                        name="reportes"
                        checked={formData.permisos.reportes}
                        onChange={handlePermissionChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="reportes" className="ml-2 text-sm text-gray-700">Reportes</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="configuracion"
                        name="configuracion"
                        checked={formData.permisos.configuracion}
                        onChange={handlePermissionChange}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                      />
                      <label htmlFor="configuracion" className="ml-2 text-sm text-gray-700">Configuración</label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 flex items-center justify-center min-w-[100px]"
                disabled={loading || success}
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                ) : success ? (
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                ) : null}
                {loading ? "Guardando..." : success ? "Guardado" : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // Usar createPortal para renderizar el modal fuera de la jerarquía normal de componentes
  return createPortal(
    showAdminAuth ? authModal : formModal,
    document.body // Renderizar en el body del documento
  );
};

export default UserFormModal;
