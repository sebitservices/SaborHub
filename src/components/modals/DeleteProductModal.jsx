import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrash, faExclamationTriangle, faSpinner, faCheck } from "@fortawesome/free-solid-svg-icons";

const DeleteProductModal = ({ isOpen, onClose, onConfirm, product }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Controlar animaciones
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Restablecer estados cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setSuccess(false);
      setError("");
    }
  }, [isOpen]);

  // Manejar la eliminación
  const handleDelete = async () => {
    setLoading(true);
    setError("");
    
    try {
      await onConfirm(product.id);
      setSuccess(true);
      
      // Cerrar el modal después del éxito
      setTimeout(() => {
        onClose();
        // Resetear el estado después de cerrar
        setTimeout(() => {
          setSuccess(false);
        }, 300);
      }, 1000);
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Evitar scroll del body cuando el modal está abierto
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${isAnimating ? 'bg-opacity-70' : 'bg-opacity-0'} backdrop-blur-sm`}
        onClick={!loading ? onClose : undefined}
      ></div>
      <div 
        className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all duration-300 ${
          isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-800">
            Eliminar Producto
          </h3>
          <button
            onClick={!loading ? onClose : undefined}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-full p-1"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 text-center">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {success ? (
            <div className="animate-fadeIn">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <FontAwesomeIcon icon={faCheck} className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-900 mb-2">¡Producto eliminado!</h3>
              <p className="text-sm text-gray-600">
                El producto ha sido eliminado exitosamente del inventario.
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <FontAwesomeIcon icon={faTrash} className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">¿Eliminar este producto?</h3>
              <p className="text-sm text-gray-500 mb-4">
                Estás a punto de eliminar <span className="font-semibold">{product?.nombre}</span> del inventario. 
                Esta acción no se puede deshacer y podría afectar a reportes históricos y recetas asociadas.
              </p>
              
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={!loading ? onClose : undefined}
                  className="text-emerald-600 hover:text-emerald-900 px-4 py-2 border border-emerald-200 rounded-md"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  disabled={loading || success}
                >
                  {loading ? (
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  ) : (
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                  )}
                  {loading ? "Eliminando..." : "Eliminar"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteProductModal;
