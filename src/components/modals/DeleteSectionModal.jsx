import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash, faExclamationTriangle, faSpinner } from "@fortawesome/free-solid-svg-icons";

const DeleteSectionModal = ({ isOpen, onClose, onConfirm, section }) => {
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
  
  const handleConfirm = async () => {
    if (!section) return;
    
    setLoading(true);
    setError("");
    
    try {
      const success = await onConfirm(section.id);
      
      if (success) {
        setTimeout(() => {
          onClose();
        }, 300);
      }
    } catch (error) {
      console.error("Error al eliminar la sección:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Si el modal no está abierto o no hay sección seleccionada, no renderizar nada
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
            Confirmar Eliminación
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full p-1"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center mb-5">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
              <FontAwesomeIcon icon={faExclamationTriangle} size="lg" />
            </div>
          </div>
          
          <p className="text-center text-gray-700 text-lg mb-2">
            ¿Estás seguro que deseas eliminar esta sección?
          </p>
          
          {section && (
            <div className="bg-gray-100 p-3 rounded-lg mb-4 text-center">
              <p className="font-semibold text-gray-900">{section.name}</p>
            </div>
          )}
          
          <p className="text-center text-gray-500 mb-4 text-sm">
            Esta acción eliminará esta sección del menú y todos los productos que contiene. Esta acción no se puede deshacer.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-center">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <div className="flex justify-center space-x-3 pt-4">
            <button
              onClick={onClose}
              className="text-emerald-600 hover:text-emerald-900 px-4 py-2 border border-emerald-200 rounded-md"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  <span>Eliminar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteSectionModal;
