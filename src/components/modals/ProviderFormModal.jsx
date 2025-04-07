import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlus, faSpinner, faCheck, faExclamationTriangle, faSave } from "@fortawesome/free-solid-svg-icons";

const ProviderFormModal = ({ isOpen, onClose, onProviderSaved, editingProvider = null }) => {
  const isEditing = !!editingProvider;
  
  const [formData, setFormData] = useState({
    nombre: "",
    rut: "", // Nuevo campo de RUT
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    notas: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Control de animación
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);
  
  // Cargar datos si estamos editando
  useEffect(() => {
    if (isEditing && editingProvider) {
      setFormData({
        nombre: editingProvider.nombre || "",
        rut: editingProvider.rut || "", // Cargar RUT si existe
        contacto: editingProvider.contacto || "",
        telefono: editingProvider.telefono || "",
        email: editingProvider.email || "",
        direccion: editingProvider.direccion || "",
        notas: editingProvider.notas || ""
      });
    } else {
      // Resetear el formulario cuando se abre el modal
      setFormData({
        nombre: "",
        rut: "", // Resetear RUT
        contacto: "",
        telefono: "",
        email: "",
        direccion: "",
        notas: ""
      });
    }
    setError("");
    setSuccess(false);
  }, [isOpen, editingProvider, isEditing]);
  
  // Formatear RUT (XX.XXX.XXX-Y)
  const formatRut = (value) => {
    // Eliminar caracteres no numéricos y la letra K (que puede ser dígito verificador)
    let rutClean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (rutClean.length === 0) return '';
    
    // Extraer dígito verificador
    let dv = rutClean.slice(-1);
    // Obtener el número sin dígito verificador
    let rutNum = rutClean.slice(0, -1);
    
    // Formatear con puntos y guión
    let formatted = '';
    let i = rutNum.length;
    
    while (i > 0) {
      let segmento = i >= 3 ? rutNum.slice(i - 3, i) : rutNum.slice(0, i);
      formatted = segmento + (formatted ? '.' + formatted : '');
      i -= 3;
    }
    
    return formatted + '-' + dv;
  };
  
  // Manejar cambios en campos de texto con formato especial para RUT
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'rut') {
      setFormData(prev => ({ ...prev, [name]: formatRut(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Guardar proveedor
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError("El nombre del proveedor es obligatorio");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      let savedProvider;
      const isNew = !isEditing;
      const providerData = {
        nombre: formData.nombre,
        rut: formData.rut, // Incluir RUT en los datos a guardar
        contacto: formData.contacto,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        notas: formData.notas,
      };
      
      if (isEditing) {
        // Actualizar proveedor existente
        await updateDoc(doc(db, "proveedores", editingProvider.id), {
          ...providerData,
          actualizado: new Date().toISOString()
        });
        
        savedProvider = {
          id: editingProvider.id,
          ...providerData,
          actualizado: new Date().toISOString()
        };
      } else {
        // Crear nuevo proveedor
        const docRef = await addDoc(collection(db, "proveedores"), {
          ...providerData,
          creado: new Date().toISOString()
        });
        
        savedProvider = {
          id: docRef.id,
          ...providerData,
          creado: new Date().toISOString()
        };
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        onProviderSaved(savedProvider, isNew);
        setTimeout(() => {
          onClose();
        }, 500);
      }, 1000);
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Prevenir scroll en el body
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
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-0">
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${isAnimating ? 'bg-opacity-70' : 'bg-opacity-0'} backdrop-blur-sm`} 
        onClick={onClose}
      ></div>
      <div 
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all duration-300 ${
          isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Editar Proveedor' : 'Añadir Proveedor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full p-1"
            aria-label="Cerrar"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

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
                <span>Proveedor {isEditing ? 'actualizado' : 'creado'} exitosamente</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Proveedor <span className="text-red-500">*</span>
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
          
          {/* Nuevo campo de RUT */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT <span className="text-xs text-gray-500">(formato XX.XXX.XXX-X)</span>
            </label>
            <input
              type="text"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              placeholder="12.345.678-9"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Persona de Contacto
            </label>
            <input
              type="text"
              name="contacto"
              value={formData.contacto}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas <span className="text-xs text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 resize-none"
              rows={3}
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center justify-center min-w-[100px]"
              disabled={loading || success}
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              ) : success ? (
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
              ) : (
                <FontAwesomeIcon icon={isEditing ? faSave : faPlus} className="mr-2" />
              )}
              {loading ? "Guardando..." : success ? "¡Guardado!" : isEditing ? "Actualizar" : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ProviderFormModal;
