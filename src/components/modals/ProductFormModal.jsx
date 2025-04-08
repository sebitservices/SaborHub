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
  faWarning,
  faInfoCircle 
} from "@fortawesome/free-solid-svg-icons";

const ProductFormModal = ({ isOpen, onClose, onProductSaved, editingProduct = null }) => {
  const isEditing = !!editingProduct;
  
  const [formData, setFormData] = useState({
    nombre: "",
    codigo: "",
    descripcion: "",
    categoria: "",
    proveedor: "",
    unidad_medida: "unidad",
    stock_actual: "",
    stock_minimo: "",
    ubicacion: "",
    notas: "",
    // Campos para unidades compuestas
    unidades_por_medida: "",       // Cuántas unidades hay en cada caja/paquete
    tiene_unidades_sueltas: false, // Si hay cajas/paquetes abiertos
    cantidad_unidades_sueltas: "", // Cuántas unidades sueltas hay
  });
  
  // Estados para controlar si mostrar campos adicionales
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);
  const [unidadCompuesta, setUnidadCompuesta] = useState(false);
  
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
      const categoriesCollection = collection(db, 'inventarioCategorias');
      const categoriesSnapshot = await getDocs(query(categoriesCollection));
      
      if (!categoriesSnapshot.empty) {
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      }
      
      // Cargar proveedores
      const providersCollection = collection(db, 'proveedores');
      const providersSnapshot = await getDocs(query(providersCollection));
      
      if (!providersSnapshot.empty) {
        const providersData = providersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProviders(providersData);
      }
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
    } finally {
      setLoadingData(false);
    }
  };
  
  // Función para determinar si una unidad de medida es compuesta (requiere campos adicionales)
  const isCompoundUnit = (unit) => {
    return ['caja', 'paquete', 'kg', 'l'].includes(unit);
  };
  
  // Cargar datos si estamos editando
  useEffect(() => {
    if (isEditing && editingProduct) {
      const isCompound = isCompoundUnit(editingProduct.unidad_medida);
      setUnidadCompuesta(isCompound);
      setShowAdditionalFields(isCompound);
      
      setFormData({
        nombre: editingProduct.nombre || "",
        codigo: editingProduct.codigo || "",
        descripcion: editingProduct.descripcion || "",
        categoria: editingProduct.categoria || "",
        proveedor: editingProduct.proveedor || "",
        unidad_medida: editingProduct.unidad_medida || "unidad",
        stock_actual: editingProduct.stock_actual?.toString() || "",
        stock_minimo: editingProduct.stock_minimo?.toString() || "",
        ubicacion: editingProduct.ubicacion || "",
        notas: editingProduct.notas || "",
        // Cargar datos de unidades compuestas si existen
        unidades_por_medida: editingProduct.unidades_por_medida?.toString() || "",
        tiene_unidades_sueltas: editingProduct.tiene_unidades_sueltas || false,
        cantidad_unidades_sueltas: editingProduct.cantidad_unidades_sueltas?.toString() || ""
      });
    } else {
      // Resetear el formulario cuando se abre el modal
      setFormData({
        nombre: "",
        codigo: "",
        descripcion: "",
        categoria: "",
        proveedor: "",
        unidad_medida: "unidad",
        stock_actual: "",
        stock_minimo: "",
        ubicacion: "",
        notas: "",
        unidades_por_medida: "",
        tiene_unidades_sueltas: false,
        cantidad_unidades_sueltas: ""
      });
      
      // Resetear estados auxiliares
      setUnidadCompuesta(false);
      setShowAdditionalFields(false);
    }
    
    setError("");
    setSuccess(false);
    setStockWarning(false);
  }, [isOpen, editingProduct, isEditing]);
  
  // Manejar cambios en campos de texto
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Manejar checkbox
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    }
    // Si es un campo numérico como stock, validar
    else if (['stock_actual', 'stock_minimo', 'unidades_por_medida', 'cantidad_unidades_sueltas'].includes(name)) {
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
    // Caso especial para unidad_medida
    else if (name === 'unidad_medida') {
      const isCompound = isCompoundUnit(value);
      setUnidadCompuesta(isCompound);
      setShowAdditionalFields(isCompound);
      
      // Resetear los campos relacionados si cambia la unidad de medida
      setFormData(prev => ({
        ...prev,
        [name]: value,
        unidades_por_medida: isCompound ? prev.unidades_por_medida : "",
        tiene_unidades_sueltas: isCompound ? prev.tiene_unidades_sueltas : false,
        cantidad_unidades_sueltas: isCompound ? prev.cantidad_unidades_sueltas : ""
      }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Calcular stock total considerando unidades completas y sueltas
  const calculateTotalStock = () => {
    if (!unidadCompuesta) return parseFloat(formData.stock_actual) || 0;
    
    const unidadesCompletas = parseFloat(formData.stock_actual) || 0;
    const unidadesPorMedida = parseFloat(formData.unidades_por_medida) || 0;
    const unidadesSueltas = formData.tiene_unidades_sueltas ? (parseFloat(formData.cantidad_unidades_sueltas) || 0) : 0;
    
    // Calcular stock total en unidades individuales
    return (unidadesCompletas * unidadesPorMedida) + unidadesSueltas;
  };
  
  // Obtener etiqueta para la unidad base
  const getBaseUnitLabel = () => {
    switch (formData.unidad_medida) {
      case 'caja': return 'unidades';
      case 'paquete': return 'unidades';
      case 'kg': return 'gramos';
      case 'l': return 'mililitros';
      default: return 'unidades';
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
    
    // Validación adicional para unidades compuestas
    if (unidadCompuesta && !formData.unidades_por_medida) {
      setError(`Por favor, especifica cuántas ${getBaseUnitLabel()} hay en cada ${formData.unidad_medida}`);
      return;
    }
    
    // Si tiene unidades sueltas pero no indicó cantidad
    if (unidadCompuesta && formData.tiene_unidades_sueltas && !formData.cantidad_unidades_sueltas) {
      setError(`Por favor, especifica cuántas ${getBaseUnitLabel()} sueltas hay`);
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Convertir campos numéricos
      const productData = {
        ...formData,
        stock_actual: formData.stock_actual ? parseFloat(formData.stock_actual) : 0,
        stock_minimo: formData.stock_minimo ? parseFloat(formData.stock_minimo) : 0,
        
        // Campos para unidades compuestas
        unidades_por_medida: formData.unidades_por_medida ? parseFloat(formData.unidades_por_medida) : null,
        tiene_unidades_sueltas: unidadCompuesta ? formData.tiene_unidades_sueltas : false,
        cantidad_unidades_sueltas: formData.cantidad_unidades_sueltas ? parseFloat(formData.cantidad_unidades_sueltas) : 0,
        
        // Calcular stock total en unidades base
        stock_total_unidades: calculateTotalStock()
      };
      
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
  
  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-0">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
        onClick={onClose}
      ></div>
      
      <div 
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 transform transition-all duration-300 ${
          isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
        style={{ maxHeight: 'calc(100vh - 32px)' }}
      >
        <div className="flex items-center justify-between p-4 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg relative flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 mr-2 text-red-600" />
              <div className="text-sm">{error}</div>
            </div>
          )}
          
          {stockWarning && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg relative flex items-center">
              <FontAwesomeIcon icon={faWarning} className="w-5 h-5 mr-2 text-amber-600" />
              <div className="text-sm">
                El stock actual está por debajo o es igual al stock mínimo. Se marcará como stock bajo.
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Primera fila - Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  placeholder="Ej: Harina de trigo"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Ej: PROD-001"
                />
              </div>
            </div>

            {/* Segunda fila - Descripción */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="Añade una descripción del producto..."
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

            {/* Cuarta fila - Unidad de medida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              
              {/* Campos adicionales para unidades compuestas */}
              {showAdditionalFields && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.unidad_medida === 'caja' || formData.unidad_medida === 'paquete' 
                      ? `Unidades por ${formData.unidad_medida}` 
                      : formData.unidad_medida === 'kg' 
                        ? 'Gramos por kilogramo' 
                        : formData.unidad_medida === 'l' 
                          ? 'Mililitros por litro'
                          : 'Cantidad base'}
                  </label>
                  <input
                    type="text"
                    name="unidades_por_medida"
                    value={formData.unidades_por_medida}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder={formData.unidad_medida === 'caja' 
                      ? "Ej: 24 (unidades por caja)" 
                      : formData.unidad_medida === 'kg'
                        ? "1000 (g por kg)"
                        : formData.unidad_medida === 'l'
                          ? "1000 (ml por l)"
                          : "Cantidad"}
                    inputMode="numeric"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.unidad_medida === 'caja' 
                      ? "Cuántas unidades vienen en cada caja" 
                      : formData.unidad_medida === 'paquete'
                        ? "Cuántas unidades vienen en cada paquete"
                        : formData.unidad_medida === 'kg'
                          ? "Normalmente 1000 g = 1 kg"
                          : formData.unidad_medida === 'l'
                            ? "Normalmente 1000 ml = 1 l"
                            : "Cantidad base"}
                  </p>
                </div>
              )}
            </div>
            
            {/* Quinta fila - Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {unidadCompuesta ? `Stock (en ${formData.unidad_medida}s completas)` : 'Stock Actual'}
                </label>
                <input
                  type="text"
                  name="stock_actual"
                  value={formData.stock_actual}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder={unidadCompuesta ? `Ej: 10 ${formData.unidad_medida}s` : "Stock actual"}
                  inputMode="decimal"
                />
                {unidadCompuesta && (
                  <p className="mt-1 text-xs text-gray-500">
                    Cantidad de {formData.unidad_medida}s completos en inventario
                  </p>
                )}
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
                  placeholder="Stock mínimo"
                  inputMode="decimal"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nivel para alertas de stock bajo
                </p>
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
                  placeholder="Ej: Bodega A, Estante 2"
                />
              </div>
            </div>
            
            {/* Campos adicionales para unidades sueltas */}
            {unidadCompuesta && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <div className="flex items-start mb-2">
                  <FontAwesomeIcon icon={faInfoCircle} className="text-blue-500 mt-1 mr-2" />
                  <div>
                    <h4 className="text-blue-800 font-medium">Unidades sueltas o parciales</h4>
                    <p className="text-sm text-blue-700">
                      Si tienes {formData.unidad_medida}s abiertas o unidades sueltas, regístralas aquí
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="tiene_unidades_sueltas"
                    name="tiene_unidades_sueltas"
                    checked={formData.tiene_unidades_sueltas}
                    onChange={handleChange}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tiene_unidades_sueltas" className="ml-2 block text-sm text-blue-700">
                    Tengo {formData.unidad_medida}s abiertas o unidades sueltas
                  </label>
                </div>
                
                {formData.tiene_unidades_sueltas && (
                  <div className="pl-6 border-l-2 border-blue-200">
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Cantidad de {getBaseUnitLabel()} sueltas
                    </label>
                    <input
                      type="text"
                      name="cantidad_unidades_sueltas"
                      value={formData.cantidad_unidades_sueltas}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white"
                      placeholder={`Ej: 5 ${getBaseUnitLabel()}`}
                      inputMode="decimal"
                    />
                    <p className="mt-1 text-xs text-blue-600">
                      {formData.unidad_medida === 'caja' 
                        ? "Unidades individuales (fuera de cajas completas)"
                        : formData.unidad_medida === 'paquete'
                          ? "Unidades individuales (fuera de paquetes completos)"
                          : formData.unidad_medida === 'kg'
                            ? "Gramos sueltos (menos de 1 kg)"
                            : formData.unidad_medida === 'l'
                              ? "Mililitros sueltos (menos de 1 litro)"
                              : "Unidades sueltas"}
                    </p>
                  </div>
                )}
                
                {/* Mostrar stock total calculado */}
                {(formData.stock_actual || formData.tiene_unidades_sueltas && formData.cantidad_unidades_sueltas) && (
                  <div className="mt-4 bg-white p-3 rounded border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">
                      Stock total: {calculateTotalStock()} {getBaseUnitLabel()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      ({formData.stock_actual || 0} {formData.unidad_medida}s × {formData.unidades_por_medida || 0} {getBaseUnitLabel()})
                      {formData.tiene_unidades_sueltas && formData.cantidad_unidades_sueltas 
                        ? ` + ${formData.cantidad_unidades_sueltas} ${getBaseUnitLabel()} sueltas` 
                        : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Notas */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas adicionales
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="Información adicional, instrucciones, etc."
              ></textarea>
            </div>
            
            {/* Botones */}
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
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProductFormModal;
