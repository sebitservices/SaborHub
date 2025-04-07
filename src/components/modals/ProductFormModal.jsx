import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addDoc, collection, doc, updateDoc, getDocs, query } from "firebase/firestore";
import { db } from "../../firebase/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faPlus, 
  faSpinner, 
  faCheck, 
  faExclamationTriangle, 
  faSave, 
  faWarning 
} from "@fortawesome/free-solid-svg-icons";

const ProductFormModal = ({ isOpen, onClose, onProductSaved, editingProduct = null }) => {
  const isEditing = !!editingProduct;
  
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    categoria: "",
    proveedor: "",
    precio_compra: "",
    unidad_medida: "unidad",
    stock_actual: "",
    stock_minimo: "",
    ubicacion: "",
    notas: ""
  });
  
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [stockWarning, setStockWarning] = useState(false);
  
  // Control de animación
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      fetchRelatedData();
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);
  
  // Cargar categorías y proveedores
  const fetchRelatedData = async () => {
    setLoadingData(true);
    try {
      // Cargar categorías
      const categoriesSnapshot = await getDocs(query(collection(db, 'inventarioCategorias')));
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
      
      // Cargar proveedores
      const providersSnapshot = await getDocs(query(collection(db, 'proveedores')));
      const providersData = providersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProviders(providersData);
    } catch (err) {
      console.error("Error al cargar datos relacionados:", err);
      setError("No se pudieron cargar categorías o proveedores");
    } finally {
      setLoadingData(false);
    }
  };
  
  // Cargar datos si estamos editando
  useEffect(() => {
    if (isEditing && editingProduct) {
      setFormData({
        nombre: editingProduct.nombre || "",
        codigo: editingProduct.codigo || "",
        descripcion: editingProduct.descripcion || "",
        categoria: editingProduct.categoria || "",
        proveedor: editingProduct.proveedor || "",
        precio_compra: editingProduct.precio_compra !== undefined ? formatPriceForInput(editingProduct.precio_compra) : "",
        unidad_medida: editingProduct.unidad_medida || "unidad",
        stock_actual: editingProduct.stock_actual?.toString() || "",
        stock_minimo: editingProduct.stock_minimo?.toString() || "",
        ubicacion: editingProduct.ubicacion || "",
        notas: editingProduct.notas || ""
      });

      console.log("Categoria del producto editando:", editingProduct.categoria);
    } else {
      // Resetear el formulario cuando se abre el modal
      setFormData({
        nombre: "",
        codigo: "",
        descripcion: "",
        categoria: "",
        proveedor: "",
        precio_compra: "",
        unidad_medida: "unidad",
        stock_actual: "",
        stock_minimo: "",
        ubicacion: "",
        notas: ""
      });
    }
    setError("");
    setSuccess(false);
    setStockWarning(false);
  }, [isOpen, editingProduct, isEditing]);
  
  // Formatear precio para input (con coma decimal)
  const formatPriceForInput = (price) => {
    if (price === null || price === undefined) return '';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  
  // Parsear el precio desde la entrada del usuario
  const parsePriceInput = (value) => {
    // Eliminar puntos de separación de miles
    return value.replace(/\./g, '');
  };
  
  // Formatear automáticamente el precio mientras el usuario escribe
  const formatPriceWhileTyping = (value) => {
    // Eliminar cualquier caracter que no sea dígito
    const numericValue = value.replace(/\D/g, '');
    
    // Aplicar separadores de miles (punto para formato chileno)
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  
  // Manejar cambios en campos de texto con formato especial para precio
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'precio_compra') {
      // Formatear el precio mientras se escribe
      const formattedValue = formatPriceWhileTyping(value);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } 
    // Si es un campo numérico como stock, validar
    else if (['stock_actual', 'stock_minimo'].includes(name)) {
      // Permitir solo números y punto decimal
      if (!/^[0-9]*\.?[0-9]*$/.test(value) && value !== '') {
        return;
      }
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Verificar stock bajo
      if (name === 'stock_actual' || name === 'stock_minimo') {
        const stockActual = name === 'stock_actual' ? parseFloat(value) : parseFloat(formData.stock_actual);
        const stockMinimo = name === 'stock_minimo' ? parseFloat(value) : parseFloat(formData.stock_minimo);
        
        if (!isNaN(stockActual) && !isNaN(stockMinimo) && stockActual <= stockMinimo) {
          setStockWarning(true);
        } else {
          setStockWarning(false);
        }
      }
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Guardar producto - asegurándose de que la categoría se guarde correctamente
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.nombre.trim()) {
      setError("El nombre del producto es obligatorio");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Convertir precio a número entero (sin puntos de separación)
      const precioCompra = parsePriceInput(formData.precio_compra);
      
      // Convertir campos numéricos
      const productData = {
        ...formData,
        precio_compra: precioCompra ? parseInt(precioCompra) : 0,
        stock_actual: formData.stock_actual ? parseFloat(formData.stock_actual) : 0,
        stock_minimo: formData.stock_minimo ? parseFloat(formData.stock_minimo) : 0
      };
      
      // Asegurarse de que la categoría sea string y no esté vacía
      if (!productData.categoria) {
        productData.categoria = ""; // Garantizar que sea string vacío si no hay categoría
      }
      
      console.log("Guardando producto con categoría:", productData.categoria);
      
      let savedProduct;
      const isNew = !isEditing;
      
      if (isEditing) {
        // Actualizar producto existente
        await updateDoc(doc(db, "inventario", editingProduct.id), {
          ...productData,
          actualizado: new Date().toISOString()
        });
        
        savedProduct = {
          id: editingProduct.id,
          ...productData,
          actualizado: new Date().toISOString()
        };
      } else {
        // Crear nuevo producto
        const docRef = await addDoc(collection(db, "inventario"), {
          ...productData,
          creado: new Date().toISOString()
        });
        
        savedProduct = {
          id: docRef.id,
          ...productData,
          creado: new Date().toISOString()
        };
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        onProductSaved(savedProduct, isNew);
        setTimeout(() => {
          onClose();
        }, 500);
      }, 1000);
    } catch (error) {
      console.error("Error al guardar producto:", error);
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
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 transform transition-all duration-300 ${
          isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
        style={{ maxHeight: 'calc(100vh - 32px)' }}
      >
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b rounded-t-lg">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Editar Producto' : 'Añadir Producto al Inventario'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-full p-1"
            aria-label="Cerrar"
          >
            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
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
                  <span>Producto {isEditing ? 'actualizado' : 'añadido'} exitosamente</span>
                </div>
              </div>
            )}
            
            {loadingData && (
              <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700 animate-fadeIn">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  <span>Cargando datos necesarios...</span>
                </div>
              </div>
            )}

            {/* Primera fila */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Producto <span className="text-red-500">*</span>
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código/SKU
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Segunda fila */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 resize-none"
                rows={2}
              ></textarea>
            </div>

            {/* Tercera fila - Categoría y Proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">-- Seleccionar Categoría --</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.nombre}
                    </option>
                  ))}
                </select>
                {/* Mostrar mensaje si no hay categorías */}
                {categories.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No hay categorías disponibles. Añade categorías desde la sección de Categorías.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <select
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cuarta fila - Precios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio de Compra
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    name="precio_compra"
                    value={formData.precio_compra}
                    onChange={handleChange}
                    className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Precio en CLP"
                    inputMode="numeric"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Ingrese el precio sin decimales (formato chileno)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad de Medida
                </label>
                <select
                  name="unidad_medida"
                  value={formData.unidad_medida}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="unidad">Unidad</option>
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="g">Gramo (g)</option>
                  <option value="l">Litro (l)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="caja">Caja</option>
                  <option value="paquete">Paquete</option>
                </select>
              </div>
            </div>

            {/* Quinta fila - Stock y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Actual
                </label>
                <input
                  type="text"
                  name="stock_actual"
                  value={formData.stock_actual}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 ${
                    stockWarning ? 'border-amber-500 bg-amber-50' : 'border-gray-300'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Mínimo
                </label>
                <input
                  type="text"
                  name="stock_minimo"
                  value={formData.stock_minimo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  type="text"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Ej: Almacén principal, Estante 3"
                />
              </div>
            </div>
            
            {stockWarning && (
              <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-700">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faWarning} className="mr-2" />
                  <span>El stock actual está en o por debajo del nivel mínimo.</span>
                </div>
              </div>
            )}

            {/* Sexta fila - Notas */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas <span className="text-xs text-gray-400">(opcional)</span>
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 resize-none"
                rows={2}
                placeholder="Información adicional sobre el producto"
              ></textarea>
            </div>

            {/* Botones de acción */}
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
      </div>
    </div>,
    document.body
  );
};

export default ProductFormModal;
