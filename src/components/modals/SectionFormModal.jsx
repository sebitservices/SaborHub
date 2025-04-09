import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faSpinner, 
  faExclamationTriangle,
  faSave
} from "@fortawesome/free-solid-svg-icons";

const SectionFormModal = ({ isOpen, onClose, onSaveSections, editingSection = null }) => {
  const isEditing = !!editingSection;
  
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Control de animación
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);
  
  // Cargar datos de la sección si está en modo edición
  useEffect(() => {
    if (isEditing && editingSection) {
      setFormData({
        name: editingSection.name || "",
        description: editingSection.description || ""
      });
    } else {
      // Resetear el formulario si no estamos editando
      setFormData({
        name: "",
        description: ""
      });
    }
    
    setError("");
    setLoading(false);
  }, [isOpen, editingSection, isEditing]);
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Guardar cambios - Mejorado para una mejor transición
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("El nombre de la sección es obligatorio");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const sectionData = {
        name: formData.name,
        description: formData.description,
        orden: 0, // Valor por defecto, se ajustará después con otro método
        actualizado: new Date().toISOString()
      };
      
      let savedSection;
      
      if (isEditing) {
        // Actualizar sección existente
        const sectionRef = doc(db, "menuSecciones", editingSection.id);
        await updateDoc(sectionRef, sectionData);
        
        savedSection = {
          id: editingSection.id,
          ...sectionData
        };
      } else {
        // Crear nueva sección
        sectionData.creado = new Date().toISOString();
        const docRef = await addDoc(collection(db, "menuSecciones"), sectionData);
        
        savedSection = {
          id: docRef.id,
          ...sectionData
        };
      }
      
      // Primero notificar al componente padre del cambio
      onSaveSections(savedSection, !isEditing);
      
      // Luego cerrar el modal
      onClose();
      
    } catch (error) {
      console.error("Error al guardar sección:", error);
      setError(`Error: ${error.message}`);
      setLoading(false);
    }
  };
  
  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-0">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div 
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all duration-300 ${
          isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Sección' : 'Crear Nueva Sección'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg relative flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 mr-2 text-red-600" />
              <div className="text-sm">{error}</div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Sección *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                placeholder="Ej: Entrantes, Platos Principales, Postres..."
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Descripción opcional para esta sección"
              ></textarea>
            </div>
            
            {/* Botones */}
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
                disabled={loading}
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                ) : (
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                )}
                <span>
                  {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SectionFormModal;
