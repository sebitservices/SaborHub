import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faPlus, faSpinner, faCheck, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

const CategoryFormModal = ({ isOpen, onClose, onCategorySaved, editingCategory = null }) => {
  const isEditing = !!editingCategory;
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    color: "#6EE7B7" // Color por defecto (emerald-300)
  });
  
  const [usePreset, setUsePreset] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Categorías predefinidas
  const presetCategories = [
    { nombre: "Lácteos", color: "#2DD4BF" }, // teal-400
    { nombre: "Carnes", color: "#34D399" }, // emerald-400
    { nombre: "Verduras", color: "#6EE7B7" }, // emerald-300
    { nombre: "Frutas", color: "#14B8A6" }, // teal-500
    { nombre: "Bebidas", color: "#059669" }, // emerald-600
    { nombre: "Abarrotes", color: "#0D9488" }, // teal-600
    { nombre: "Condimentos", color: "#10B981" }, // emerald-500
    { nombre: "Congelados", color: "#0F766E" }, // teal-700
    { nombre: "Snacks", color: "#047857" }, // emerald-700
    { nombre: "Limpieza", color: "#0F766E" } // teal-700
  ];
  
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
    if (isEditing && editingCategory) {
      setFormData({
        nombre: editingCategory.nombre || "",
        descripcion: editingCategory.descripcion || "",
        color: editingCategory.color || "#6EE7B7"
      });
      setUsePreset(false); // En edición siempre usamos modo personalizado
    } else {
      // Resetear el formulario cuando se abre el modal
      setFormData({
        nombre: "",
        descripcion: "",
        color: "#6EE7B7"
      });
      setUsePreset(true);
    }
    setError("");
    setSuccess(false);
  }, [isOpen, editingCategory, isEditing]);
  
  // Manejar cambio de preset
  const handlePresetChange = (e) => {
    const selectedPreset = presetCategories.find(cat => cat.nombre === e.target.value);
    if (selectedPreset) {
      setFormData({
        ...formData,
        nombre: selectedPreset.nombre,
        color: selectedPreset.color
      });
    }
  };
  
  // Manejar cambios en campos de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Guardar categoría
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      setError("El nombre de la categoría es obligatorio");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      let savedCategory;
      const isNew = !isEditing;
      
      if (isEditing) {
        // Actualizar categoría existente
        await updateDoc(doc(db, "inventarioCategorias", editingCategory.id), {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          color: formData.color,
          actualizado: new Date().toISOString()
        });
        
        savedCategory = {
          id: editingCategory.id,
          ...formData,
          actualizado: new Date().toISOString()
        };
      } else {
        // Crear nueva categoría
        const docRef = await addDoc(collection(db, "inventarioCategorias"), {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          color: formData.color,
          creado: new Date().toISOString()
        });
        
        savedCategory = {
          id: docRef.id,
          ...formData,
          creado: new Date().toISOString()
        };
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        onCategorySaved(savedCategory, isNew);
        setTimeout(() => {
          onClose();
        }, 500);
      }, 1000);
    } catch (error) {
      console.error("Error al guardar categoría:", error);
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
            {isEditing ? 'Editar Categoría' : 'Añadir Categoría'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full p-1"
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
                <span>Categoría {isEditing ? 'actualizada' : 'creada'} exitosamente</span>
              </div>
            </div>
          )}

          {!isEditing && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-700 font-medium">Tipo de categoría</h3>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      checked={usePreset}
                      onChange={() => setUsePreset(true)}
                    />
                    <span className="ml-2 text-sm text-gray-700">Predefinida</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="radio" 
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      checked={!usePreset}
                      onChange={() => setUsePreset(false)}
                    />
                    <span className="ml-2 text-sm text-gray-700">Personalizada</span>
                  </label>
                </div>
              </div>
              
              {usePreset ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar categoría
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    onChange={handlePresetChange}
                    value={formData.nombre}
                  >
                    <option value="">-- Seleccione una categoría --</option>
                    {presetCategories.map((cat) => (
                      <option key={cat.nombre} value={cat.nombre}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          )}

          <div className={`mb-4 ${usePreset ? 'opacity-50' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la categoría
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              disabled={usePreset}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
          
          <div className={`mb-4 ${usePreset ? 'opacity-50' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción <span className="text-xs text-gray-400">(opcional)</span>
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              disabled={usePreset}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={3}
            ></textarea>
          </div>
          
          <div className={`mb-6 ${usePreset ? 'opacity-50' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                disabled={usePreset}
                className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                disabled={usePreset}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="text-emerald-600 hover:text-emerald-900 px-4 py-2 border border-emerald-200 rounded-md"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              disabled={loading || success}
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              ) : success ? (
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
              ) : (
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
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

export default CategoryFormModal;
