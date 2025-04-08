import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addDoc, collection, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, storage } from "../../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faSpinner, 
  faCheck, 
  faExclamationTriangle, 
  faSave,
  faUpload,
  faImage,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";

const MenuProductFormModal = ({ isOpen, onClose, onSaveProduct, editingProduct = null, section }) => {
  const isEditing = !!editingProduct;
  const [activeTab, setActiveTab] = useState('producto');
  
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    descripcion: "",
    categoria: section?.id || "",
    imagen: null,
    destacado: false,
    disponible: true,
    tiempo_preparacion: "",
    alergenos: "",
    orden: 0
  });
  
  const [imagePreview, setImagePreview] = useState(null);
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
    if (isEditing && editingProduct) {
      // Resetear a la pestaña de producto al editar
      setActiveTab('producto');
      
      setFormData({
        nombre: editingProduct.nombre || "",
        precio: formatPriceForDisplay(editingProduct.precio) || "",
        descripcion: editingProduct.descripcion || "",
        categoria: editingProduct.categoria || section?.id || "",
        destacado: editingProduct.destacado || false,
        disponible: editingProduct.disponible !== false, // Por defecto true, a menos que sea explícitamente false
        tiempo_preparacion: editingProduct.tiempo_preparacion?.toString() || "",
        alergenos: editingProduct.alergenos || "",
        orden: editingProduct.orden || 0
      });
      
      // Si el producto tiene una imagen, mostrarla en la vista previa
      if (editingProduct.imagen_url) {
        setImagePreview(editingProduct.imagen_url);
      } else {
        setImagePreview(null);
      }
    } else {
      // Resetear a la pestaña de producto al crear nuevo
      setActiveTab('producto');
      
      // Resetear el formulario cuando se abre el modal para agregar un nuevo producto
      setFormData({
        nombre: "",
        precio: "",
        descripcion: "",
        categoria: section?.id || "",
        imagen: null,
        destacado: false,
        disponible: true,
        tiempo_preparacion: "",
        alergenos: "",
        orden: 0
      });
      setImagePreview(null);
    }
    
    setError("");
    setSuccess(false);
  }, [isOpen, editingProduct, isEditing, section]);
  
  // Formatear precio para mostrar (formato chileno: $1.000)
  const formatPriceForDisplay = (price) => {
    if (!price && price !== 0) return "";
    
    const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^\d.-]/g, '')) : price;
    return numPrice.toLocaleString('es-CL');
  };
  
  // Parsear el precio desde el formato visual al formato para guardar
  const parsePriceForSave = (displayPrice) => {
    if (!displayPrice) return 0;
    // Eliminar todos los caracteres no numéricos excepto puntos y comas
    return parseFloat(displayPrice.replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.'));
  };
  
  // Manejar cambios en campos de texto
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Manejar checkbox
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
    // Manejar el campo de precio (formato chileno)
    else if (name === 'precio') {
      // Quitar todo excepto números
      const numericValue = value.replace(/\D/g, '');
      
      if (numericValue === '') {
        setFormData(prev => ({ ...prev, precio: '' }));
        return;
      }
      
      // Convertir a número y formatear
      const numValue = parseInt(numericValue, 10);
      if (!isNaN(numValue)) {
        const formattedPrice = numValue.toLocaleString('es-CL');
        setFormData(prev => ({ ...prev, precio: formattedPrice }));
      }
    }
    // Manejar tiempo de preparación (solo números)
    else if (name === 'tiempo_preparacion') {
      if ((/^\d*$/).test(value) || value === '') {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
    // Manejar el resto de campos de texto
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Manejar cambios en el campo de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Verificar tipo de archivo
    if (!file.type.match('image.*')) {
      setError("Por favor, seleccione una imagen válida");
      return;
    }
    
    // Verificar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen debe tener un tamaño máximo de 2MB");
      return;
    }
    
    setFormData(prev => ({ ...prev, imagen: file }));
    
    // Crear URL para previsualización
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Función para subir imagen a Firebase Storage
  const uploadImage = async (file, productId) => {
    if (!file) return null;
    
    const fileExtension = file.name.split('.').pop();
    const fileName = `menu_productos/${productId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error al subir imagen:", error);
      throw error;
    }
  };
  
  // Guardar producto
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.nombre.trim()) {
      setError("El nombre del producto es obligatorio");
      return;
    }
    
    if (!formData.precio) {
      setError("El precio del producto es obligatorio");
      return;
    }
    
    // Verificar que la categoría esté establecida
    if (!formData.categoria) {
      setError("La categoría es obligatoria");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Convertir campos numéricos
      let productData = {
        ...formData,
        precio: parsePriceForSave(formData.precio),
        tiempo_preparacion: formData.tiempo_preparacion ? parseInt(formData.tiempo_preparacion) : null,
        // Agregar campos con nombres en inglés para compatibilidad
        name: formData.nombre,
        price: parsePriceForSave(formData.precio),
        description: formData.descripcion,
        category: formData.categoria,
      };
      
      // Eliminar el campo imagen para no guardarlo en Firestore
      delete productData.imagen;
      
      let savedProduct;
      const isNew = !isEditing;
      
      if (isEditing) {
        // Actualizar producto existente
        const productRef = doc(db, "menuSecciones", formData.categoria, "productos", editingProduct.id);
        
        // Si hay una nueva imagen, subirla primero
        if (formData.imagen) {
          const imageUrl = await uploadImage(formData.imagen, editingProduct.id);
          productData.imagen_url = imageUrl;
          productData.image_url = imageUrl; // Campo en inglés para compatibilidad
        }
        
        // Actualizar en Firestore
        await updateDoc(productRef, {
          ...productData,
          actualizado: new Date().toISOString(),
          updated: new Date().toISOString() // Campo en inglés para compatibilidad
        });
        
        // Obtener datos actualizados
        const updatedDoc = await getDoc(productRef);
        savedProduct = {
          id: editingProduct.id,
          ...updatedDoc.data(),
        };
      } else {
        // Crear nuevo producto
        const productsRef = collection(db, "menuSecciones", formData.categoria, "productos");
        const newProductRef = await addDoc(productsRef, {
          ...productData,
          creado: new Date().toISOString(),
          created: new Date().toISOString(), // Campo en inglés para compatibilidad
          orden: formData.orden || 0,
          order: formData.orden || 0 // Campo en inglés para compatibilidad
        });
        
        // Si hay imagen, subirla y actualizar el documento
        if (formData.imagen) {
          const imageUrl = await uploadImage(formData.imagen, newProductRef.id);
          await updateDoc(newProductRef, { 
            imagen_url: imageUrl,
            image_url: imageUrl // Campo en inglés para compatibilidad
          });
          productData.imagen_url = imageUrl;
          productData.image_url = imageUrl;
        }
        
        savedProduct = {
          id: newProductRef.id,
          ...productData,
          creado: new Date().toISOString(),
          created: new Date().toISOString()
        };
      }
      
      setSuccess(true);
      
      // Esperar un momento antes de cerrar para mostrar el mensaje de éxito
      setTimeout(() => {
        onSaveProduct(savedProduct, isNew);
        setTimeout(() => {
          onClose();
        }, 300);
      }, 1000);
    } catch (error) {
      console.error("Error al guardar producto:", error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-0">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      <div 
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 transform transition-all duration-300 ${
          isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
        style={{ maxHeight: 'calc(100vh - 32px)' }}
      >
        <div className="flex items-center justify-between p-4 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? `Editar ${editingProduct.nombre}` : 'Agregar Nuevo Producto al Menú'}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Pestañas */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 px-4 text-center text-sm font-medium transition-colors ${
              activeTab === 'producto' 
                ? 'text-amber-600 border-b-2 border-amber-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('producto')}
          >
            Producto
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center text-sm font-medium transition-colors ${
              activeTab === 'modificadores' 
                ? 'text-amber-600 border-b-2 border-amber-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('modificadores')}
          >
            Modificadores
          </button>
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg relative flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 mr-2 text-red-600" />
              <div className="text-sm">{error}</div>
            </div>
          )}
          
          {activeTab === 'producto' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Nombre del producto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Ej: Pizza Margherita"
                      required
                    />
                  </div>
                  
                  {/* Precio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio *
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        name="precio"
                        value={formData.precio}
                        onChange={handleChange}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="0"
                        inputMode="numeric"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Formato: $1.000 (pesos chilenos)</p>
                  </div>
                  
                  {/* Tiempo de preparación */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tiempo de Preparación (minutos)
                    </label>
                    <input
                      type="text"
                      name="tiempo_preparacion"
                      value={formData.tiempo_preparacion}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Ej: 15"
                      inputMode="numeric"
                    />
                  </div>
                  
                  {/* Alérgenos */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alérgenos
                    </label>
                    <input
                      type="text"
                      name="alergenos"
                      value={formData.alergenos}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Ej: Gluten, Lácteos, Frutos secos"
                    />
                  </div>
                  
                  {/* Opciones de disponibilidad */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="disponible"
                        name="disponible"
                        checked={formData.disponible}
                        onChange={handleChange}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <label htmlFor="disponible" className="block text-sm text-gray-700">
                        Disponible para ordenar
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="destacado"
                        name="destacado"
                        checked={formData.destacado}
                        onChange={handleChange}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <label htmlFor="destacado" className="block text-sm text-gray-700">
                        Destacar en el menú
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      placeholder="Breve descripción del producto..."
                    ></textarea>
                  </div>
                  
                  {/* Imagen del producto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Imagen del Producto
                    </label>
                    <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-4 transition-all hover:bg-gray-50">
                      {imagePreview ? (
                        <div className="relative w-full mb-3">
                          <img 
                            src={imagePreview} 
                            alt="Vista previa" 
                            className="w-full h-48 object-cover rounded-md shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => { setImagePreview(null); setFormData(prev => ({...prev, imagen: null})); }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FontAwesomeIcon icon={faImage} className="h-10 w-10 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">
                            Arrastra y suelta una imagen, o haz clic para seleccionar
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG, GIF (máx. 2MB)
                          </p>
                        </div>
                      )}
                      
                      <input
                        id="imagen"
                        name="imagen"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className={`mt-3 px-3 py-2 w-full border border-gray-300 rounded-md text-sm ${imagePreview ? 'file:bg-amber-700 file:text-white' : 'file:bg-amber-600 file:text-white'} file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 file:cursor-pointer focus:outline-none`}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
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
                  className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center space-x-2"
                  disabled={loading || success}
                >
                  {loading ? (
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  ) : success ? (
                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  ) : (
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                  )}
                  <span>
                    {loading ? 'Guardando...' : success ? 'Guardado' : isEditing ? 'Actualizar' : 'Guardar'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="py-10 px-5 text-center">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-4 inline-block mx-auto">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 text-4xl mb-4" />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">¡Próximamente!</h3>
                <p className="text-blue-700 max-w-md mx-auto">
                  Estamos desarrollando esta funcionalidad para permitirte gestionar modificadores
                  y variantes para tus productos (ingredientes adicionales, tamaños, etc).
                </p>
              </div>
              
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Los modificadores te permitirán ofrecer opciones personalizables a tus clientes,
                como agregar ingredientes extras, cambiar el tamaño o elegir entre diferentes variantes.
              </p>
              
              <button
                type="button"
                onClick={() => setActiveTab('producto')}
                className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 focus:outline-none"
              >
                Volver a detalles del producto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MenuProductFormModal;
