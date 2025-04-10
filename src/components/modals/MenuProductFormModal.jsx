import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addDoc, collection, doc, updateDoc, getDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";
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
  faInfoCircle,
  faPlus,
  faTrash,
  faSearch,
  faUtensils
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
    orden: 0,
    receta: []
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [modificadores, setModificadores] = useState([]);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [nuevoModificador, setNuevoModificador] = useState({
    nombre: '',
    tipo: 'single',
    opciones: [],
    required: false,
    min_selections: 0,
    max_selections: 1,
    incluido_menu: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIngrediente, setSelectedIngrediente] = useState(null);
  
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
        orden: editingProduct.orden || 0,
        receta: editingProduct.receta || []
      });
      
      // Si el producto tiene una imagen, mostrarla en la vista previa
      if (editingProduct.imagen_url) {
        setImagePreview(editingProduct.imagen_url);
      } else {
        setImagePreview(null);
      }

      if (editingProduct?.modificadores) {
        setModificadores(editingProduct.modificadores);
      } else {
        setModificadores([]);
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
        orden: 0,
        receta: []
      });
      setImagePreview(null);
      setModificadores([]);
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
  
  const handleAddModificador = () => {
    if (!nuevoModificador.nombre) return;
    
    setModificadores([...modificadores, {
      ...nuevoModificador,
      id: Date.now().toString()
    }]);
    
    setNuevoModificador({
      nombre: '',
      tipo: 'single',
      opciones: [],
      required: false,
      min_selections: 0,
      max_selections: 1,
      incluido_menu: true
    });
  };

  const handleAddOpcion = (modificadorId) => {
    const nuevaOpcion = {
      id: Date.now().toString(),
      nombre: '',
      precio_adicional: 0
    };

    setModificadores(modificadores.map(mod => 
      mod.id === modificadorId 
        ? { ...mod, opciones: [...mod.opciones, nuevaOpcion] }
        : mod
    ));
  };

  // Función para buscar ingredientes
  const searchIngredientes = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const inventarioRef = collection(db, 'inventario');
      // Obtener todos los productos y filtrar localmente
      const q = query(inventarioRef, limit(20));
      const snapshot = await getDocs(q);
      
      const searchTermLower = searchTerm.toLowerCase();
      const results = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(item => 
          item.nombre?.toLowerCase().includes(searchTermLower) ||
          item.codigo?.toLowerCase().includes(searchTermLower)
        )
        .slice(0, 5); // Limitar a 5 resultados

      setSearchResults(results);
    } catch (error) {
      console.error('Error al buscar ingredientes:', error);
      setError('Error al buscar ingredientes');
    } finally {
      setIsSearching(false);
    }
  };

  // Función para agregar ingrediente a la receta
  const handleAddIngrediente = (ingrediente) => {
    const nuevoIngrediente = {
      id: ingrediente.id,
      nombre: ingrediente.nombre,
      cantidad: 0,
      unidad: ingrediente.unidad_medida || 'gr',
      costo_unitario: ingrediente.precio_compra || 0,
      stock_actual: ingrediente.stock_actual || 0
    };

    setFormData(prev => ({
      ...prev,
      receta: [...prev.receta, nuevoIngrediente]
    }));

    // Limpiar búsqueda
    setSearchTerm('');
    setSearchResults([]);
    setSelectedIngrediente(null);
  };

  // Función para eliminar ingrediente de la receta
  const handleRemoveIngrediente = (index) => {
    setFormData(prev => ({
      ...prev,
      receta: prev.receta.filter((_, i) => i !== index)
    }));
  };

  // Función para actualizar cantidad o unidad de un ingrediente
  const handleUpdateIngrediente = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      receta: prev.receta.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  // Función para agregar ingrediente a una opción de modificador
  const handleAddIngredienteToOpcion = (modificadorId, opcionId, ingrediente) => {
    const nuevoIngrediente = {
      id: ingrediente.id,
      nombre: ingrediente.nombre,
      cantidad: 0,
      unidad: ingrediente.unidad_medida || 'gr',
      costo_unitario: ingrediente.precio_compra || 0,
      stock_actual: ingrediente.stock_actual || 0
    };

    setModificadores(modificadores.map(mod => {
      if (mod.id === modificadorId) {
        return {
          ...mod,
          opciones: mod.opciones.map(opc => {
            if (opc.id === opcionId) {
              return {
                ...opc,
                ingredientes: [...(opc.ingredientes || []), nuevoIngrediente]
              };
            }
            return opc;
          })
        };
      }
      return mod;
    }));

    // Limpiar búsqueda
    setSearchTerm('');
    setSearchResults([]);
  };

  // Función para eliminar ingrediente de una opción
  const handleRemoveIngredienteFromOpcion = (modificadorId, opcionId, ingredienteIndex) => {
    setModificadores(modificadores.map(mod => {
      if (mod.id === modificadorId) {
        return {
          ...mod,
          opciones: mod.opciones.map(opc => {
            if (opc.id === opcionId) {
              return {
                ...opc,
                ingredientes: opc.ingredientes.filter((_, index) => index !== ingredienteIndex)
              };
            }
            return opc;
          })
        };
      }
      return mod;
    }));
  };

  // Función para actualizar cantidad o unidad de un ingrediente en una opción
  const handleUpdateIngredienteInOpcion = (modificadorId, opcionId, ingredienteIndex, field, value) => {
    setModificadores(modificadores.map(mod => {
      if (mod.id === modificadorId) {
        return {
          ...mod,
          opciones: mod.opciones.map(opc => {
            if (opc.id === opcionId) {
              return {
                ...opc,
                ingredientes: opc.ingredientes.map((ing, index) => 
                  index === ingredienteIndex ? { ...ing, [field]: value } : ing
                )
              };
            }
            return opc;
          })
        };
      }
      return mod;
    }));
  };

  const renderModificadoresTab = () => (
    <div className="space-y-6">
      {/* Formulario para nuevo modificador */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-800">Agregar Modificador</h4>
          <div className="flex items-center text-sm text-gray-500">
            <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
            <span>Personaliza las opciones del producto</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del modificador
              </label>
              <input
                type="text"
                value={nuevoModificador.nombre}
                onChange={(e) => setNuevoModificador({...nuevoModificador, nombre: e.target.value})}
                placeholder="Ej: Tamaño, Extras, Toppings"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de selección
              </label>
              <select
                value={nuevoModificador.tipo}
                onChange={(e) => setNuevoModificador({...nuevoModificador, tipo: e.target.value})}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              >
                <option value="single">Selección única</option>
                <option value="multiple">Selección múltiple</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={nuevoModificador.required}
                  onChange={(e) => setNuevoModificador({...nuevoModificador, required: e.target.checked})}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-600">Obligatorio</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={nuevoModificador.incluido_menu}
                  onChange={(e) => setNuevoModificador({...nuevoModificador, incluido_menu: e.target.checked})}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-600">Incluido en el menú</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            {nuevoModificador.tipo === 'multiple' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mínimo selecciones
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={nuevoModificador.min_selections}
                    onChange={(e) => setNuevoModificador({
                      ...nuevoModificador, 
                      min_selections: parseInt(e.target.value) || 0
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo selecciones
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={nuevoModificador.max_selections}
                    onChange={(e) => setNuevoModificador({
                      ...nuevoModificador, 
                      max_selections: parseInt(e.target.value) || 1
                    })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={nuevoModificador.required}
                  onChange={(e) => setNuevoModificador({...nuevoModificador, required: e.target.checked})}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-600">Obligatorio</span>
              </label>

              <button
                type="button"
                onClick={handleAddModificador}
                disabled={!nuevoModificador.nombre.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Agregar modificador
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de modificadores */}
      <div className="space-y-4">
        {modificadores.map((modificador) => (
          <div key={modificador.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h5 className="text-lg font-medium text-gray-800">{modificador.nombre}</h5>
                <p className="text-sm text-gray-500">
                  {modificador.tipo === 'single' ? 'Selección única' : 'Selección múltiple'}
                  {modificador.required && ' • Obligatorio'}
                  {modificador.tipo === 'multiple' && ` • Mín: ${modificador.min_selections}, Máx: ${modificador.max_selections}`}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    modificador.incluido_menu 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {modificador.incluido_menu ? 'Incluido en menú' : 'Costo adicional'}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteModificador(modificador.id)}
                disabled={loadingDelete}
                className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 ${
                  loadingDelete ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Eliminar modificador"
              >
                {loadingDelete ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faTrash} />
                )}
              </button>
            </div>
            
            {/* Opciones del modificador */}
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h6 className="text-sm font-medium text-gray-700">
                  Opciones disponibles
                  {!modificador.incluido_menu && (
                    <span className="ml-2 text-xs text-amber-600">
                      (Con costo adicional)
                    </span>
                  )}
                </h6>
                <button
                  type="button"
                  onClick={() => handleAddOpcion(modificador.id)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-1" />
                  Agregar opción
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {modificador.opciones.map((opcion, index) => (
                  <div key={opcion.id} className="flex gap-3 items-center bg-white p-3 rounded-md shadow-sm">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={opcion.nombre}
                        onChange={(e) => {
                          const nuevasOpciones = [...modificador.opciones];
                          nuevasOpciones[index].nombre = e.target.value;
                          setModificadores(modificadores.map(mod =>
                            mod.id === modificador.id
                              ? { ...mod, opciones: nuevasOpciones }
                              : mod
                          ));
                        }}
                        placeholder="Nombre de la opción"
                        className="w-full rounded-md border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>
                    {!modificador.incluido_menu && (
                      <div className="w-36">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={opcion.precio_adicional}
                            onChange={(e) => {
                              const nuevasOpciones = [...modificador.opciones];
                              nuevasOpciones[index].precio_adicional = parseInt(e.target.value) || 0;
                              setModificadores(modificadores.map(mod =>
                                mod.id === modificador.id
                                  ? { ...mod, opciones: nuevasOpciones }
                                  : mod
                              ));
                            }}
                            placeholder="Precio extra"
                            className="w-full pl-7 rounded-md border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const nuevasOpciones = modificador.opciones.filter((_, i) => i !== index);
                        setModificadores(modificadores.map(mod =>
                          mod.id === modificador.id
                            ? { ...mod, opciones: nuevasOpciones }
                            : mod
                        ));
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                      title="Eliminar opción"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                ))}
                
                {modificador.opciones.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No hay opciones agregadas
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {modificadores.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <FontAwesomeIcon icon={faPlus} className="text-gray-400 text-3xl mb-2" />
            <p className="text-gray-500">No hay modificadores agregados</p>
            <p className="text-sm text-gray-400">Agrega modificadores para personalizar el producto</p>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="text-emerald-600 hover:text-emerald-900 px-4 py-2 border border-emerald-200 rounded-md"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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
    </div>
  );

  const renderRecetaTab = () => (
    <div className="space-y-6">
      {/* Sección de ingredientes del producto base */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-medium text-gray-800">Ingredientes del Producto</h4>
            <p className="text-sm text-gray-500">Agrega los ingredientes necesarios para preparar este producto</p>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <FontAwesomeIcon icon={faUtensils} className="mr-2" />
            <span>Receta base</span>
          </div>
        </div>

        {/* Buscador de ingredientes */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchIngredientes(e.target.value);
              }}
              placeholder="Buscar ingrediente..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {/* Resultados de búsqueda */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                {searchResults.map((ingrediente) => (
                  <button
                    key={ingrediente.id}
                    onClick={() => handleAddIngrediente(ingrediente)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium">{ingrediente.nombre}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({ingrediente.codigo || 'Sin código'})
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className={`${
                        ingrediente.stock_actual <= ingrediente.stock_minimo 
                          ? 'text-red-600 font-semibold' 
                          : 'text-gray-600'
                      }`}>
                        Stock: {ingrediente.stock_actual} {ingrediente.unidad_medida}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Lista de ingredientes agregados */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="mb-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 mb-2 px-4">
              <div className="col-span-4">Ingrediente</div>
              <div className="col-span-3">Cantidad</div>
              <div className="col-span-3">Unidad</div>
              <div className="col-span-2">Acciones</div>
            </div>

            {formData.receta.length > 0 ? (
              <div className="space-y-2">
                {formData.receta.map((ingrediente, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 bg-white p-3 rounded-md items-center">
                    <div className="col-span-4">
                      {ingrediente.nombre}
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="0"
                        value={ingrediente.cantidad}
                        onChange={(e) => handleUpdateIngrediente(index, 'cantidad', parseFloat(e.target.value) || 0)}
                        className="w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <select
                        value={ingrediente.unidad}
                        onChange={(e) => handleUpdateIngrediente(index, 'unidad', e.target.value)}
                        className="w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="gr">Gramos</option>
                        <option value="ml">Mililitros</option>
                        <option value="unidad">Unidades</option>
                        <option value="kg">Kilogramos</option>
                        <option value="lt">Litros</option>
                      </select>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveIngrediente(index)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FontAwesomeIcon icon={faUtensils} className="text-gray-400 text-3xl mb-2" />
                <p className="text-gray-500">No hay ingredientes agregados</p>
                <p className="text-sm text-gray-400">Busca y agrega los ingredientes necesarios</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección de ingredientes de modificadores */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-lg font-medium text-gray-800">Ingredientes de Modificadores</h4>
            <p className="text-sm text-gray-500">Gestiona los ingredientes de cada opción de modificador</p>
          </div>
        </div>

        {modificadores.length > 0 ? (
          <div className="space-y-4">
            {modificadores.map((modificador) => (
              <div key={modificador.id} className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-2">{modificador.nombre}</h5>
                
                {modificador.opciones.map((opcion) => (
                  <div key={opcion.id} className="ml-4 mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-sm font-medium text-gray-600">{opcion.nombre}</h6>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Buscar ingrediente..."
                          className="text-sm px-3 py-1 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            searchIngredientes(e.target.value);
                          }}
                        />
                        {searchResults.length > 0 && (
                          <div className="absolute z-10 w-64 right-0 mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                            {searchResults.map((ingrediente) => (
                              <button
                                key={ingrediente.id}
                                onClick={() => handleAddIngredienteToOpcion(modificador.id, opcion.id, ingrediente)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                              >
                                {ingrediente.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Lista de ingredientes de la opción */}
                    {opcion.ingredientes && opcion.ingredientes.length > 0 ? (
                      <div className="space-y-2">
                        {opcion.ingredientes.map((ingrediente, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 bg-white p-2 rounded-md items-center text-sm">
                            <div className="col-span-4">
                              {ingrediente.nombre}
                            </div>
                            <div className="col-span-3">
                              <input
                                type="number"
                                min="0"
                                value={ingrediente.cantidad}
                                onChange={(e) => handleUpdateIngredienteInOpcion(
                                  modificador.id,
                                  opcion.id,
                                  index,
                                  'cantidad',
                                  parseFloat(e.target.value) || 0
                                )}
                                className="w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                            <div className="col-span-3">
                              <select
                                value={ingrediente.unidad}
                                onChange={(e) => handleUpdateIngredienteInOpcion(
                                  modificador.id,
                                  opcion.id,
                                  index,
                                  'unidad',
                                  e.target.value
                                )}
                                className="w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500"
                              >
                                <option value="gr">Gramos</option>
                                <option value="ml">Mililitros</option>
                                <option value="unidad">Unidades</option>
                                <option value="kg">Kilogramos</option>
                                <option value="lt">Litros</option>
                              </select>
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredienteFromOpcion(modificador.id, opcion.id, index)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-2">
                        Sin ingredientes configurados
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No hay modificadores agregados</p>
            <p className="text-sm text-gray-400">Agrega modificadores en la pestaña correspondiente</p>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="text-emerald-600 hover:text-emerald-900 px-4 py-2 border border-emerald-200 rounded-md"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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
    </div>
  );

  // Función para eliminar modificador
  const handleDeleteModificador = async (modificadorId) => {
    if (!editingProduct?.id) {
      // Si es un producto nuevo, solo eliminamos del estado
      setModificadores(modificadores.filter(m => m.id !== modificadorId));
      return;
    }

    setLoadingDelete(true);
    try {
      // Actualizar el documento en Firestore
      const productRef = doc(db, "menuSecciones", formData.categoria, "productos", editingProduct.id);
      
      // Obtener los modificadores actuales y filtrar el que queremos eliminar
      const nuevosModificadores = modificadores.filter(m => m.id !== modificadorId);
      
      // Actualizar el documento con los nuevos modificadores
      await updateDoc(productRef, {
        modificadores: nuevosModificadores,
        actualizado: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      // Actualizar el estado local
      setModificadores(nuevosModificadores);
      
      // Mostrar mensaje de éxito temporal
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Error al eliminar modificador:", error);
      setError("Error al eliminar el modificador. Por favor, intenta de nuevo.");
    } finally {
      setLoadingDelete(false);
    }
  };

  // Guardar producto
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
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
        modificadores,  // Agregar modificadores al producto
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
                ? 'text-emerald-600 border-b-2 border-emerald-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('producto')}
          >
            Producto
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center text-sm font-medium transition-colors ${
              activeTab === 'modificadores' 
                ? 'text-emerald-600 border-b-2 border-emerald-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('modificadores')}
          >
            Modificadores
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center text-sm font-medium transition-colors ${
              activeTab === 'receta' 
                ? 'text-emerald-600 border-b-2 border-emerald-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('receta')}
          >
            Receta
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
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
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
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
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
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
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
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
                        className={`mt-3 px-3 py-2 w-full border border-gray-300 rounded-md text-sm ${imagePreview ? 'file:bg-emerald-700 file:text-white' : 'file:bg-emerald-600 file:text-white'} file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 file:cursor-pointer focus:outline-none`}
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
                    <FontAwesomeIcon icon={faSave} className="mr-2" />
                  )}
                  <span>
                    {loading ? 'Guardando...' : success ? 'Guardado' : isEditing ? 'Actualizar' : 'Guardar'}
                  </span>
                </button>
              </div>
            </form>
          ) : activeTab === 'modificadores' ? (
            renderModificadoresTab()
          ) : (
            renderRecetaTab()
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MenuProductFormModal;