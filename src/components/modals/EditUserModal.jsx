import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSpinner, faCheck, faExclamationTriangle, faSave } from "@fortawesome/free-solid-svg-icons";

const EditUserModal = ({ isOpen, onClose, onUserUpdated, user }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    rol: "",
    estado: "",
    permisos: {
      dashboard: false,
      mesas: false,
      pedidos: false,
      inventario: false,
      menu: false,
      reportes: false,
      configuracion: false
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Mejorar animaciones de transición
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Cargar datos del usuario cuando se abre el modal
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        email: user.email || "",
        rol: user.role || "cajero",
        estado: user.status || "activo",
        permisos: user.permisos || {
          dashboard: false,
          mesas: false,
          pedidos: false,
          inventario: false,
          menu: false,
          reportes: false,
          configuracion: false
        }
      });
      setError("");
      setSuccess(false);
    }
  }, [isOpen, user]);

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

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Actualizar datos en Firestore
      const userRef = doc(db, "usuarios", user.id);
      await updateDoc(userRef, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        rol: formData.rol,
        estado: formData.estado,
        permisos: formData.permisos
      });

      setSuccess(true);
      
      // Devolver feedback con animación
      setTimeout(() => {
        onUserUpdated({
          ...user,
          nombre: formData.nombre,
          apellido: formData.apellido,
          role: formData.rol,
          status: formData.estado,
          permisos: formData.permisos,
          name: `${formData.nombre} ${formData.apellido}`
        });
        
        // Cerrar modal con retraso para ver mensaje de éxito
        setTimeout(() => {
          onClose();
        }, 800);
      }, 1000);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      setError(`Error al actualizar usuario: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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

  if (!isOpen) return null;

  // Contenido del modal
  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-0 overflow-hidden">
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
          <h2 className="text-xl font-semibold text-gray-800">Editar Usuario</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full p-1"
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
                  <span>Usuario actualizado exitosamente</span>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-gray-100"
                disabled
                required
              />
              <p className="text-xs text-gray-500 mt-1">El correo electrónico no se puede modificar</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
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
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
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
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
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
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
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
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
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
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
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
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
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
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
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
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center justify-center min-w-[120px] transition-all duration-200 transform hover:scale-105"
                disabled={loading || success}
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                ) : success ? (
                  <FontAwesomeIcon icon={faCheck} className="mr-2" />
                ) : (
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                )}
                {loading ? "Guardando..." : success ? "¡Guardado!" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EditUserModal;
