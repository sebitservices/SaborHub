import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBoxOpen, 
  faTags, 
  faChartLine,
  faWarehouse,
  faClipboardList,
  faExclamationTriangle,
  faPlus,
  faEdit,
  faTrash,
  faSpinner,
  faTruck, // Nuevo icono para proveedores
  faFilter,
  faCloudDownload,
  faBoxes,
  faMoneyBillWave,
  faCircleExclamation,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import CategoryFormModal from '../components/modals/CategoryFormModal';
import DeleteCategoryModal from '../components/modals/DeleteCategoryModal';
import Notification from '../components/ui/Notification';
import ProviderFormModal from '../components/modals/ProviderFormModal';
import DeleteProviderModal from '../components/modals/DeleteProviderModal';
import ProductFormModal from '../components/modals/ProductFormModal';
import DeleteProductModal from '../components/modals/DeleteProductModal';

const Inventario = () => {
  const [activeTab, setActiveTab] = useState('inventario');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Nuevo estado para manejar notificaciones y modal de eliminación
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    message: '',
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [providers, setProviders] = useState([]);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [isDeleteProviderModalOpen, setIsDeleteProviderModalOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState(null);

  // Estados para productos
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);

  const tabs = [
    { id: 'inventario', label: 'Inventario', icon: faBoxOpen },
    { id: 'categorias', label: 'Categorías', icon: faTags },
    { id: 'proveedores', label: 'Proveedores', icon: faTruck }, // Nueva pestaña
    { id: 'reportes', label: 'Reportes', icon: faChartLine }
  ];

  // Cargar categorías cuando se active la pestaña correspondiente
  useEffect(() => {
    if (activeTab === 'categorias') {
      fetchCategories();
    }
  }, [activeTab]);

  // Cargar proveedores cuando se active la pestaña correspondiente
  useEffect(() => {
    if (activeTab === 'proveedores') {
      fetchProviders();
    }
  }, [activeTab]);

  // Cargar productos cuando se active la pestaña correspondiente
  useEffect(() => {
    if (activeTab === 'inventario') {
      fetchProducts();
    }
  }, [activeTab]);

  // Modificar esta función para cargar categorías al iniciar componente
  useEffect(() => {
    // Cargar categorías siempre, independientemente de la pestaña
    fetchCategories();
  }, []);

  // Función para obtener las categorías
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const categoriesCollection = collection(db, 'inventarioCategorias');
      const categorySnapshot = await getDocs(categoriesCollection);
      
      if (categorySnapshot.empty) {
        setCategories([]);
      } else {
        const categoriesData = categorySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCategories(categoriesData);
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err);
      setError('Error al cargar las categorías. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener los proveedores
  const fetchProviders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const providersCollection = collection(db, 'proveedores');
      const providerSnapshot = await getDocs(providersCollection);
      
      if (providerSnapshot.empty) {
        setProviders([]);
      } else {
        const providersData = providerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setProviders(providersData);
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
      setError('Error al cargar los proveedores. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener los productos con cálculo de inventario corregido
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const productsCollection = collection(db, 'inventario');
      const productSnapshot = await getDocs(productsCollection);
      
      if (productSnapshot.empty) {
        setProducts([]);
        setLowStockProducts([]);
        setTotalInventoryValue(0);
      } else {
        const productsData = productSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Log para depuración
        console.log("Productos cargados:", productsData);
        
        // Identificar productos con stock bajo
        const lowStock = productsData.filter(product => {
          return product.stock_actual <= product.stock_minimo;
        });
        
        setLowStockProducts(lowStock);
        setProducts(productsData);

        // Ya no calculamos el valor del inventario
        setTotalInventoryValue(0);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('Error al cargar los productos. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear precios en formato chileno
  const formatCLPCurrency = (amount) => {
    return `$${amount.toLocaleString('es-CL', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })}`;
  };

  // Función para mostrar notificaciones
  const showNotification = (type, message, duration = 4000) => {
    setNotification({
      visible: true,
      type,
      message,
      duration
    });
  };

  // Función para cerrar notificación
  const closeNotification = () => {
    setNotification(prev => ({
      ...prev,
      visible: false
    }));
  };

  // Función para abrir modal de eliminar categoría
  const openDeleteModal = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  // Función para cerrar modal de eliminar categoría
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTimeout(() => setCategoryToDelete(null), 300);
  };

  // Función actualizada para eliminar categoría
  const handleDeleteCategory = async (categoryId) => {
    try {
      await deleteDoc(doc(db, 'inventarioCategorias', categoryId));
      
      // Actualizar el estado local
      setCategories(prevCategories => 
        prevCategories.filter(category => category.id !== categoryId)
      );
      
      // Mostrar notificación de éxito
      showNotification(
        'success', 
        'La categoría ha sido eliminada exitosamente.'
      );
      
      return true; // Devolver true indica éxito para el modal
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      showNotification(
        'error', 
        `Error al eliminar categoría: ${error.message}`
      );
      throw error; // Propagar el error para que el modal lo maneje
    }
  };

  // Función para abrir el modal de edición
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  // Función para añadir nueva categoría
  const openCategoryModal = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  // Función para cerrar modal y limpiar estado
  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setTimeout(() => setEditingCategory(null), 300);
  };

  // Función actualizada para añadir/editar categoría
  const handleCategorySaved = (action, categoryData) => {
    fetchCategories(); // Recargar las categorías
    
    // Mostrar notificación según la acción (crear o editar)
    showNotification(
      'success',
      action === 'create' ? 
        'La categoría ha sido creada exitosamente.' : 
        'La categoría ha sido actualizada exitosamente.'
    );
  };

  // Funciones para manejar los modales de proveedores
  const openProviderModal = () => {
    setEditingProvider(null);
    setIsProviderModalOpen(true);
  };

  const closeProviderModal = () => {
    setIsProviderModalOpen(false);
    setTimeout(() => setEditingProvider(null), 300);
  };

  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setIsProviderModalOpen(true);
  };

  const openDeleteProviderModal = (provider) => {
    setProviderToDelete(provider);
    setIsDeleteProviderModalOpen(true);
  };

  const closeDeleteProviderModal = () => {
    setIsDeleteProviderModalOpen(false);
    setTimeout(() => setProviderToDelete(null), 300);
  };

  const handleDeleteProvider = async (providerId) => {
    try {
      await deleteDoc(doc(db, 'proveedores', providerId));
      
      // Actualizar el estado local
      setProviders(prevProviders => 
        prevProviders.filter(provider => provider.id !== providerId)
      );
      
      // Mostrar notificación de éxito
      showNotification(
        'success', 
        'El proveedor ha sido eliminado exitosamente.'
      );
      
      return true;
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      showNotification(
        'error', 
        `Error al eliminar proveedor: ${error.message}`
      );
      throw error;
    }
  };

  const handleProviderSaved = (action) => {
    fetchProviders();
    showNotification(
      'success',
      action === 'create' ? 
        'El proveedor ha sido creado exitosamente.' : 
        'El proveedor ha sido actualizado exitosamente.'
    );
  };

  // Funciones para productos
  const openProductModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setTimeout(() => setEditingProduct(null), 300);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const openDeleteProductModal = (product) => {
    setProductToDelete(product);
    setIsDeleteProductModalOpen(true);
  };

  const closeDeleteProductModal = () => {
    setIsDeleteProductModalOpen(false);
    setTimeout(() => setProductToDelete(null), 300);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, 'inventario', productId));
      
      // Actualizar el estado local
      setProducts(prevProducts => 
        prevProducts.filter(product => product.id !== productId)
      );
      
      // Actualizar productos con stock bajo
      setLowStockProducts(prev => 
        prev.filter(product => product.id !== productId)
      );
      
      // Recalcular valor del inventario con la misma lógica que en fetchProducts
      const remainingProducts = products.filter(product => product.id !== productId);
      let newTotal = 0;
      
      remainingProducts.forEach(product => {
        const precioCompra = parseFloat(product.precio_compra) || 0;
        const stockActual = parseFloat(product.stock_actual) || 0;
        const unidadesPorMedida = parseFloat(product.unidades_por_medida) || 1;
        
        let valorInventarioItem;
        
        if (unidadesPorMedida > 1) {
          const precioUnitario = precioCompra / unidadesPorMedida;
          const unidadesSueltas = product.tiene_unidades_sueltas ? 
            (parseFloat(product.cantidad_unidades_sueltas) || 0) : 0;
          const unidadesTotales = (stockActual * unidadesPorMedida) + unidadesSueltas;
          valorInventarioItem = unidadesTotales * precioUnitario;
        } else {
          valorInventarioItem = precioCompra * stockActual;
        }
        
        if (valorInventarioItem > 0) {
          newTotal += valorInventarioItem;
        }
      });
      
      setTotalInventoryValue(newTotal);
      
      // Mostrar notificación de éxito
      showNotification(
        'success', 
        'El producto ha sido eliminado exitosamente.'
      );
      
      return true;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      showNotification(
        'error', 
        `Error al eliminar producto: ${error.message}`
      );
      throw error;
    }
  };

  // Asegurar que se actualice la vista cuando se guarda un producto
  const handleProductSaved = (product, isNew) => {
    // Recargar productos
    fetchProducts();
    
    // También recargar categorías para asegurar que tengamos la última información
    fetchCategories();
    
    showNotification(
      'success',
      isNew ? 
        `El producto "${product.nombre}" ha sido agregado exitosamente.` : 
        `El producto "${product.nombre}" ha sido actualizado exitosamente.`
    );
  };

  // Filtrar productos
  const getFilteredProducts = () => {
    let filtered = [...products];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.nombre?.toLowerCase().includes(term) || 
        product.codigo?.toLowerCase().includes(term) ||
        product.descripcion?.toLowerCase().includes(term)
      );
    }
    
    // Aplicar filtro de categoría
    if (activeFilter !== "todos") {
      if (activeFilter === "stock_bajo") {
        filtered = filtered.filter(product => 
          product.stock_actual <= product.stock_minimo
        );
      } else {
        filtered = filtered.filter(product => product.categoria === activeFilter);
      }
    }
    
    return filtered;
  };

  // Función para obtener el nombre de la categoría
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Sin categoría';
    
    const category = categories.find(cat => cat.id === categoryId);
    
    // Verificar si se encontró la categoría
    if (category) {
      return category.nombre;
    }
    
    // Si no se encuentra la categoría pero hay un ID, mostrar algo más descriptivo
    return `Categoría ID: ${categoryId.substring(0, 5)}...`;
  };

  // Añadir función auxiliar para calcular y mostrar precio unitario
  const calcularPrecioUnitario = (product) => {
    if (!product) return 0;
    
    const precioCompra = parseFloat(product.precio_compra) || 0;
    const unidadesPorMedida = parseFloat(product.unidades_por_medida) || 1;
    
    if (unidadesPorMedida > 1) {
      return precioCompra / unidadesPorMedida;
    }
    
    return precioCompra;
  };

  // Renderizar la tabla de categorías
  const renderCategoriesTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <FontAwesomeIcon icon={faSpinner} spin className="text-amber-500 text-3xl" />
          <span className="ml-2 text-gray-600">Cargando categorías...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
          <p className="text-red-700">{error}</p>
          <button 
            className="mt-2 px-4 py-1 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200"
            onClick={fetchCategories}
          >
            Intentar nuevamente
          </button>
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay categorías registradas.</p>
          <button
            onClick={openCategoryModal}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center mx-auto"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Crear primera categoría
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de creación</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map(category => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="h-4 w-4 rounded-full mr-3"
                      style={{ backgroundColor: category.color || '#6EE7B7' }}
                    ></div>
                    <span className="font-medium text-gray-900">{category.nombre}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">
                    {category.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {category.creado ? new Date(category.creado).toLocaleDateString('es-ES') : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="text-amber-600 hover:text-amber-900 mx-2"
                    title="Editar categoría"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => openDeleteModal(category)}
                    className="text-red-600 hover:text-red-900 mx-2"
                    title="Eliminar categoría"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar la tabla de proveedores
  const renderProvidersTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center p-8">
          <FontAwesomeIcon icon={faSpinner} spin className="text-amber-500 text-3xl" />
          <span className="ml-2 text-gray-600">Cargando proveedores...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
          <p className="text-red-700">{error}</p>
          <button 
            className="mt-2 px-4 py-1 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200"
            onClick={fetchProviders}
          >
            Intentar nuevamente
          </button>
        </div>
      );
    }

    if (providers.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay proveedores registrados.</p>
          <button
            onClick={openProviderModal}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center mx-auto"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Añadir primer proveedor
          </button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {providers.map(provider => (
              <tr key={provider.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{provider.nombre}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{provider.rut || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{provider.contacto || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{provider.telefono || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{provider.email || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditProvider(provider)}
                    className="text-amber-600 hover:text-amber-900 mx-2"
                    title="Editar proveedor"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => openDeleteProviderModal(provider)}
                    className="text-red-600 hover:text-red-900 mx-2"
                    title="Eliminar proveedor"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizado del contenido de la pestaña de Inventario
  const renderInventarioTab = () => {
    return (
      <div className="animate-fadeIn w-full">
        {/* Panel de información */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <FontAwesomeIcon icon={faBoxes} className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total de Productos</p>
                <p className="text-2xl font-semibold text-gray-800">{products.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 mr-4">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-amber-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Productos con Stock Bajo</p>
                <p className="text-2xl font-semibold text-gray-800">{lowStockProducts.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sección de productos */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FontAwesomeIcon icon={faBoxOpen} className="mr-3 text-amber-600" />
              Productos en Inventario
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <input 
                  type="text" 
                  className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                  placeholder="Buscar producto..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />
                </div>
              </div>
              
              <button 
                onClick={openProductModal}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Nuevo Producto
              </button>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                activeFilter === 'todos' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setActiveFilter('todos')}
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2 text-xs" />
              Todos
            </button>
            
            <button
              className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                activeFilter === 'stock_bajo' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
              }`}
              onClick={() => setActiveFilter('stock_bajo')}
            >
              <FontAwesomeIcon icon={faCircleExclamation} className="mr-2 text-xs" />
              Stock Bajo
            </button>
            
            {categories.map(category => (
              <button
                key={category.id}
                className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
                  activeFilter === category.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setActiveFilter(category.id)}
                style={activeFilter === category.id ? {backgroundColor: `${category.color}30`, color: category.color} : {}}
              >
                <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: category.color}}></span>
                {category.nombre}
              </button>
            ))}
          </div>
          
          {/* Tabla de productos */}
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <FontAwesomeIcon icon={faSpinner} spin className="text-amber-500 text-3xl" />
              <span className="ml-2 text-gray-600">Cargando productos...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
              <p className="text-red-700">{error}</p>
              <button 
                className="mt-2 px-4 py-1 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200"
                onClick={fetchProducts}
              >
                Intentar nuevamente
              </button>
            </div>
          ) : getFilteredProducts().length === 0 ? (
            <div className="text-center py-8">
              {products.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-4">No hay productos en el inventario.</p>
                  <button
                    onClick={openProductModal}
                    className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center mx-auto"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Agregar primer producto
                  </button>
                </>
              ) : (
                <p className="text-gray-500">No se encontraron productos que coincidan con el filtro.</p>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredProducts().map(product => {
                      const isLowStock = product.stock_actual <= product.stock_minimo;
                      const tieneUnidadesCompuestas = product.unidades_por_medida > 1;
                      
                      return (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">{product.nombre}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{product.codigo || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {getCategoryName(product.categoria)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${isLowStock ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                              {product.stock_actual || 0} {product.unidad_medida}
                              {isLowStock && (
                                <FontAwesomeIcon icon={faCircleExclamation} className="ml-2 text-red-500" />
                              )}
                            </div>
                            {isLowStock && (
                              <div className="text-xs text-red-500">Mínimo: {product.stock_minimo}</div>
                            )}
                            {/* Mostrar unidades totales si es un producto compuesto */}
                            {tieneUnidadesCompuestas && (
                              <div className="text-xs text-gray-500">
                                Total: {product.stock_total_unidades || 0} {
                                  product.unidad_medida === 'caja' ? 'unidades' : 
                                  product.unidad_medida === 'kg' ? 'gramos' : 
                                  product.unidad_medida === 'l' ? 'ml' : 'unidades'
                                }
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="text-amber-600 hover:text-amber-900 mx-2"
                              title="Editar producto"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => openDeleteProductModal(product)}
                              className="text-red-600 hover:text-red-900 mx-2"
                              title="Eliminar producto"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                <div>
                  Mostrando {getFilteredProducts().length} de {products.length} productos
                </div>
                
                <button className="flex items-center text-amber-600 hover:text-amber-800">
                  <FontAwesomeIcon icon={faCloudDownload} className="mr-1" />
                  Exportar
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Productos con Stock Bajo */}
        {lowStockProducts.length > 0 && (
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FontAwesomeIcon icon={faCircleExclamation} className="mr-3 text-amber-600" />
              Productos con Stock Bajo
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockProducts.map(product => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600 font-medium">
                          {product.stock_actual} {product.unidad_medida}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.stock_minimo} {product.unidad_medida}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {product.ubicacion || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Modales para productos */}
        <ProductFormModal 
          isOpen={isProductModalOpen}
          onClose={closeProductModal}
          onProductSaved={handleProductSaved}
          editingProduct={editingProduct}
        />
        
        <DeleteProductModal 
          isOpen={isDeleteProductModalOpen}
          onClose={closeDeleteProductModal}
          onConfirm={handleDeleteProduct}
          product={productToDelete}
        />
      </div>
    );
  };

  const renderInventarioTabOld = () => {
    return (
      <div className="animate-fadeIn w-full">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faWarehouse} className="mr-3 text-amber-600" />
            Gestión de Inventario
          </h2>
          <p className="text-gray-600">
            Administra tu inventario de productos e ingredientes. Controla existencias, 
            establece alertas de stock, registra entradas y salidas de productos.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Productos con Stock Bajo</h3>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center text-amber-700">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 mr-2" />
                <span>Esta sección está en desarrollo.</span>
              </div>
              <p className="text-sm text-amber-600 mt-2">
                Aquí se mostrarán los productos que están por debajo del umbral mínimo de stock.
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Movimientos Recientes</h3>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center text-amber-700">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 mr-2" />
                <span>Esta sección está en desarrollo.</span>
              </div>
              <p className="text-sm text-amber-600 mt-2">
                Aquí se mostrarán los últimos movimientos de inventario (entradas y salidas).
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Lista de Productos</h3>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center text-amber-700">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 mr-2" />
                <span>Esta sección está en desarrollo.</span>
              </div>
              <p className="text-sm text-amber-600 mt-2">
                Aquí se mostrará la lista completa de productos en inventario con opciones para
                agregar, editar y eliminar productos.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoriasTab = () => {
    return (
      <div className="animate-fadeIn w-full">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faTags} className="mr-3 text-amber-600" />
            Categorías de Inventario
          </h2>
          <p className="text-gray-600">
            Organiza tu inventario mediante categorías personalizadas. Crea, edita y gestiona
            categorías para clasificar tus productos e ingredientes.
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Listado de Categorías</h3>
            <button 
              onClick={openCategoryModal}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Nueva Categoría
            </button>
          </div>
          
          {renderCategoriesTable()}
        </div>
        
        <CategoryFormModal 
          isOpen={isCategoryModalOpen}
          onClose={closeCategoryModal}
          onCategorySaved={(category, isNew) => handleCategorySaved(isNew ? 'create' : 'update', category)}
          editingCategory={editingCategory}
        />
        
        <DeleteCategoryModal 
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDeleteCategory}
          category={categoryToDelete}
        />
      </div>
    );
  };

  // Nueva función para renderizar la pestaña de Proveedores
  const renderProveedoresTab = () => {
    return (
      <div className="animate-fadeIn w-full">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faTruck} className="mr-3 text-amber-600" />
            Gestión de Proveedores
          </h2>
          <p className="text-gray-600">
            Administra tus proveedores de insumos y productos. Mantén un registro de contactos, historial de compras 
            y catálogo de productos por proveedor.
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Listado de Proveedores</h3>
            <button 
              onClick={openProviderModal}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Nuevo Proveedor
            </button>
          </div>
          
          {renderProvidersTable()}
        </div>
        
        <ProviderFormModal 
          isOpen={isProviderModalOpen}
          onClose={closeProviderModal}
          onProviderSaved={(provider, isNew) => handleProviderSaved(isNew ? 'create' : 'update', provider)}
          editingProvider={editingProvider}
        />
        
        <DeleteProviderModal 
          isOpen={isDeleteProviderModalOpen}
          onClose={closeDeleteProviderModal}
          onConfirm={handleDeleteProvider}
          provider={providerToDelete}
        />
      </div>
    );
  };

  const renderReportesTab = () => {
    return (
      <div className="animate-fadeIn w-full">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faChartLine} className="mr-3 text-amber-600" />
            Reportes de Inventario
          </h2>
          <p className="text-gray-600">
            Genera informes detallados sobre el estado de tu inventario, movimientos, valoración
            económica y proyecciones de stock.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Movimientos por Período</h3>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center text-amber-700">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 mr-2" />
                <span>Esta sección está en desarrollo.</span>
              </div>
              <p className="text-sm text-amber-600 mt-2">
                Aquí podrás generar reportes de movimientos de inventario por período.
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Valoración de Inventario</h3>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center text-amber-700">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 mr-2" />
                <span>Esta sección está en desarrollo.</span>
              </div>
              <p className="text-sm text-amber-600 mt-2">
                Aquí podrás ver el valor económico total de tu inventario actual.
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Rotación de Productos</h3>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center text-amber-700">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 mr-2" />
                <span>Esta sección está en desarrollo.</span>
              </div>
              <p className="text-sm text-amber-600 mt-2">
                Aquí podrás ver estadísticas de rotación de productos para optimizar tu inventario.
              </p>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Productos Críticos</h3>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center text-amber-700">
                <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 mr-2" />
                <span>Esta sección está en desarrollo.</span>
              </div>
              <p className="text-sm text-amber-600 mt-2">
                Aquí se mostrarán los productos que requieren atención urgente.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'inventario':
        return renderInventarioTab();
      case 'categorias':
        return renderCategoriasTab();
      case 'proveedores':
        return renderProveedoresTab();
      case 'reportes':
        return renderReportesTab();
      default:
        return renderInventarioTab();
    }
  };

  return (
    <Layout>
      <div className="pb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Control de Inventario</h1>
        <p className="text-gray-600 mb-6">
          Gestiona productos, ingredientes, stocks y realiza un seguimiento de movimientos.
        </p>
        
        {/* Tabs Navigation */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 flex border-b border-gray-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`py-4 px-6 font-medium flex items-center transition-colors duration-300 whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'text-amber-600 border-b-2 border-amber-500 -mb-px' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <FontAwesomeIcon icon={tab.icon} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        {renderTabContent()}
        
        {/* Notificaciones */}
        <Notification
          type={notification.type}
          message={notification.message}
          isVisible={notification.visible}
          duration={notification.duration}
          onClose={closeNotification}
        />
      </div>
    </Layout>
  );
};

export default Inventario;
