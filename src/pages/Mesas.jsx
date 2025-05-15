import { useState, useEffect, Fragment } from 'react';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/layout/Layout';
import Modal from '../components/ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Transition } from '@headlessui/react';
import {
  faUtensils,
  faUsers,
  faClock,
  faCircle,
  faEllipsisVertical,
  faPlus,
  faPencil,
  faTrash,
  faCog,
  faEdit,
  faExclamationTriangle,
  faLink,
  faCalendarPlus,
  faChair,
  faUnlink,
  faTimes,
  faShoppingCart,
  faSearch,
  faMinus,
  faChevronRight,
  faPrint
} from '@fortawesome/free-solid-svg-icons';
import { crearArea, obtenerAreas, eliminarArea, crearMesa, obtenerMesas, eliminarMesa } from '../firebase/services';
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc, getDoc, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { Menu } from '@headlessui/react';
import { storage } from '../firebase/config';
import { ref, getDownloadURL } from 'firebase/storage';

const Mesas = () => {
  const [activeTab, setActiveTab] = useState('mesas');
  const [selectedArea, setSelectedArea] = useState('todas');
  const [selectedEstado, setSelectedEstado] = useState('todos');
  const [showNewAreaModal, setShowNewAreaModal] = useState(false);
  const [showNewMesaModal, setShowNewMesaModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [newAreaName, setNewAreaName] = useState('');
  const [areas, setAreas] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [nuevaMesa, setNuevaMesa] = useState({ numero: '', area: '' });
  const [loading, setLoading] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [showUnirMesasModal, setShowUnirMesasModal] = useState(false);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [mesasUnidas, setMesasUnidas] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mesaActiva, setMesaActiva] = useState(null);
  const [searchMenu, setSearchMenu] = useState('');
  const [pedidoActual, setPedidoActual] = useState([]);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [menuSections, setMenuSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [productImages, setProductImages] = useState({});
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [modifierQuantity, setModifierQuantity] = useState(1);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [isResumenDrawerOpen, setIsResumenDrawerOpen] = useState(false);
  const [showCancelarPedidoModal, setShowCancelarPedidoModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showQuitarModal, setShowQuitarModal] = useState(false);
  const [cantidadAQuitar, setCantidadAQuitar] = useState(1);
  const [productoAQuitar, setProductoAQuitar] = useState(null);
  const [pedidoTemporal, setPedidoTemporal] = useState([]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar secciones del menú cuando se abre el drawer
  useEffect(() => {
    if (isDrawerOpen) {
      fetchMenuSections();
    }
  }, [isDrawerOpen]);

  // Efecto para filtrar secciones basado en la búsqueda
  useEffect(() => {
    if (!menuSections.length) return;

    const filtered = menuSections.map(section => ({
      ...section,
      products: section.products.filter(product =>
        product.nombre.toLowerCase().includes(searchMenu.toLowerCase()) ||
        (product.descripcion && product.descripcion.toLowerCase().includes(searchMenu.toLowerCase()))
      )
    })).filter(section => section.products.length > 0);

    setFilteredSections(filtered);
  }, [searchMenu, menuSections]);

  // Función para obtener la URL de la imagen
  const getImageUrl = async (imagePath) => {
    if (!imagePath) {
      console.warn('getImageUrl: No se proporcionó imagePath');
      return null;
    }

    // Si ya es una URL completa, retornarla directamente
    if (imagePath.startsWith('http')) {
      console.log('getImageUrl: Ya es una URL completa', { imagePath });
      return imagePath;
    }
    
    console.log('getImageUrl: Iniciando obtención de imagen', {
      imagePath,
      rutaCompleta: `menu_productos/${imagePath}`
    });

    try {
      const storageRef = ref(storage, `menu_productos/${imagePath}`);
      console.log('getImageUrl: StorageRef creado correctamente');
      
      const url = await getDownloadURL(storageRef);
      console.log('getImageUrl: URL obtenida exitosamente', { url });
      return url;
    } catch (error) {
      console.error('getImageUrl: Error al obtener la URL', {
        error: error.message,
        code: error.code,
        imagePath,
        rutaCompleta: `menu_productos/${imagePath}`
      });
      return null;
    }
  };

  // Función para cargar secciones del menú
  const fetchMenuSections = async () => {
    setLoadingMenu(true);
    try {
      const sectionsCollection = collection(db, 'menuSecciones');
      const sectionsSnapshot = await getDocs(query(sectionsCollection, orderBy('orden', 'asc')));
      
      const sectionsData = [];
      
      for (const docSnapshot of sectionsSnapshot.docs) {
        const sectionData = {
          id: docSnapshot.id,
          name: docSnapshot.data().nombre, // Asegurarnos de que el nombre esté presente
          ...docSnapshot.data(),
          products: []
        };
        
        console.log('Procesando sección:', {
          id: sectionData.id,
          nombre: sectionData.name
        });

        try {
          const productsCollection = collection(db, 'menuSecciones', docSnapshot.id, 'productos');
          const productsSnapshot = await getDocs(query(productsCollection, orderBy('orden', 'asc')));
          
          if (!productsSnapshot.empty) {
            const productsData = productsSnapshot.docs.map(productDoc => {
              const productData = productDoc.data();
              console.log('Datos del producto cargado:', {
                id: productDoc.id,
                nombre: productData.nombre,
                imagen: productData.imagen
              });
              return {
                id: productDoc.id,
                ...productData
              };
            });

            // Cargar imágenes inmediatamente para cada producto
            productsData.forEach(product => {
              if (product.imagen) {
                getImageUrl(product.imagen)
                  .then(url => {
                    if (url) {
                      setProductImages(prev => ({
                        ...prev,
                        [product.id]: url
                      }));
                    }
                  })
                  .catch(error => {
                    console.error('Error al cargar imagen para producto:', {
                      productId: product.id,
                      nombre: product.nombre,
                      error: error.message
                    });
                  });
              }
            });

            sectionData.products = productsData;
          }
        } catch (error) {
          console.error(`Error al cargar productos de la sección ${docSnapshot.id}:`, error);
        }
        
        sectionsData.push(sectionData);
      }
      
      console.log('Datos de secciones cargados:', 
        sectionsData.map(section => ({
          id: section.id,
          nombre: section.name,
          numProductos: section.products.length
        }))
      );
      
      setMenuSections(sectionsData);
      setFilteredSections(sectionsData);
    } catch (error) {
      console.error('Error al cargar el menú:', error);
      toast.error('Error al cargar el menú');
    } finally {
      setLoadingMenu(false);
    }
  };

  // Función para cargar las imágenes de los productos
  const loadProductImages = async (sections) => {
    console.log('loadProductImages: Iniciando carga de imágenes', {
      numSections: sections.length,
      sections: sections.map(s => ({
        nombre: s.nombre,
        numProducts: s.products.length
      }))
    });
    
    for (const section of sections) {
      console.log(`loadProductImages: Procesando sección ${section.nombre}`);
      
      for (const product of section.products) {
        console.log('loadProductImages: Procesando producto', {
          productId: product.id,
          nombre: product.nombre,
          imagen: product.imagen
        });

        if (!product.imagen || product.imagen.trim() === '') {
          console.warn('loadProductImages: Producto sin imagen', {
            productId: product.id,
            nombre: product.nombre
          });
          continue;
        }

        try {
          const url = await getImageUrl(product.imagen);
          console.log('loadProductImages: Resultado de getImageUrl', {
            productId: product.id,
            url: url
          });

          if (url) {
            setProductImages(prev => {
              const newState = {
                ...prev,
                [product.id]: url
              };
              console.log('loadProductImages: Estado actualizado de productImages', {
                productId: product.id,
                totalImages: Object.keys(newState).length
              });
              return newState;
            });
          }
        } catch (error) {
          console.error('loadProductImages: Error procesando imagen', {
            productId: product.id,
            nombre: product.nombre,
            error: error.message
          });
        }
      }
    }
  };

  // Efecto para cargar imágenes cuando cambian las secciones
  useEffect(() => {
    if (menuSections.length > 0) {
      console.log('Secciones actualizadas, cargando imágenes...');
      loadProductImages(menuSections);
    }
  }, [menuSections]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [areasData, mesasData] = await Promise.all([
        obtenerAreas(),
        obtenerMesas()
      ]);
      setAreas(areasData);
      setMesas(mesasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddArea = async (e) => {
    e.preventDefault();
    if (!newAreaName.trim()) {
      toast.error('El nombre del área es requerido');
      return;
    }

    try {
      setLoading(true);
      const nuevaArea = {
        nombre: newAreaName.trim()
      };
      
      const areaCreada = await crearArea(nuevaArea);
      setAreas([...areas, areaCreada]);
      setNewAreaName('');
      setShowNewAreaModal(false);
      toast.success('Área creada exitosamente');
    } catch (error) {
      console.error('Error al crear área:', error);
      toast.error('Error al crear el área');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMesa = async (e) => {
    e.preventDefault();
    if (!nuevaMesa.numero || !nuevaMesa.area) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    try {
      setLoading(true);
      const mesaData = {
        ...nuevaMesa,
        estado: 'libre',
        tiempo: null
      };
      
      const mesaCreada = await crearMesa(mesaData);
      setMesas([...mesas, mesaCreada]);
      setNuevaMesa({ numero: '', area: '' });
      setShowNewMesaModal(false);
      toast.success('Mesa creada exitosamente');
    } catch (error) {
      console.error('Error al crear mesa:', error);
      toast.error('Error al crear la mesa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      if (itemToDelete.type === 'area') {
        await eliminarArea(itemToDelete.id);
        setAreas(areas.filter(area => area.id !== itemToDelete.id));
        toast.success('Área eliminada exitosamente');
      } else {
        await eliminarMesa(itemToDelete.id);
        setMesas(mesas.filter(mesa => mesa.id !== itemToDelete.id));
        toast.success('Mesa eliminada exitosamente');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error(`Error al eliminar ${itemToDelete.type === 'area' ? 'el área' : 'la mesa'}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirmModal(false);
      setItemToDelete(null);
    }
  };

  const confirmDelete = (id, type, nombre) => {
    setItemToDelete({ id, type, nombre });
    setShowDeleteConfirmModal(true);
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'libre': return 'bg-emerald-500';
      case 'ocupada': return 'bg-red-500';
      case 'reservada': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDesunirMesa = (mesa) => {
    try {
      const grupoUnido = obtenerGrupoUnido(mesa.id);
      if (grupoUnido) {
        setMesasUnidas(mesasUnidas.filter(grupo => grupo.id !== grupoUnido.id));
        toast.success('Mesa desunida exitosamente');
      }
    } catch (error) {
      console.error('Error al desunir mesa:', error);
      toast.error('Error al desunir la mesa');
    }
  };

  const actualizarEstadoMesa = async (mesaId, nuevoEstado) => {
    try {
      const mesaRef = doc(db, 'mesas', mesaId);
      const updateData = {
        estado: nuevoEstado
      };
      
      await updateDoc(mesaRef, updateData);
      
      // Actualizar estado local
      const mesasActualizadas = mesas.map(m => 
        m.id === mesaId ? { ...m, estado: nuevoEstado } : m
      );
      setMesas(mesasActualizadas);
    } catch (error) {
      console.error('Error al actualizar estado de la mesa:', error);
      toast.error('Error al actualizar el estado de la mesa');
    }
  };

  const handleMesaAction = async (action, mesa) => {
    switch(action) {
      case 'abrir':
        if (mesa.estado === 'ocupada' || mesa.estado === 'reservada') {
          // Si la mesa está ocupada o reservada, siempre mostrar el resumen
          console.log('Abriendo mesa ocupada:', mesa.numero);
          setMesaActiva(mesa);
          const pedidoCargado = await cargarPedidoActivo(mesa.id);
          // Siempre mostrar el resumen drawer, incluso si no hay pedido
          setIsResumenDrawerOpen(true);
        } else {
          // Si la mesa está libre, mostrar el drawer de productos
          setMesaActiva(mesa);
          setPedidoConfirmado(false);
          setIsDrawerOpen(true);
          actualizarEstadoMesa(mesa.id, 'ocupada');
        }
        break;
      case 'reservar':
        actualizarEstadoMesa(mesa.id, 'reservada');
        toast.info(`Reservando mesa ${mesa.numero}`);
        break;
      case 'unir':
        setMesaSeleccionada(mesa);
        setShowUnirMesasModal(true);
        break;
      case 'desunir':
        handleDesunirMesa(mesa);
        break;
      default:
        break;
    }
  };

  const handleUnirMesas = async (mesaPrincipal, mesaSecundaria) => {
    try {
      // Crear un nuevo grupo de mesas unidas
      const grupoUnido = {
        id: Date.now().toString(),
        mesas: [mesaPrincipal.id, mesaSecundaria.id],
        areaId: mesaPrincipal.area
      };

      setMesasUnidas([...mesasUnidas, grupoUnido]);
      setShowUnirMesasModal(false);
      setMesaSeleccionada(null);
      toast.success('Mesas unidas exitosamente');
    } catch (error) {
      console.error('Error al unir mesas:', error);
      toast.error('Error al unir las mesas');
    }
  };

  const estanMesasUnidas = (mesaId) => {
    return mesasUnidas.some(grupo => grupo.mesas.includes(mesaId));
  };

  const obtenerGrupoUnido = (mesaId) => {
    return mesasUnidas.find(grupo => grupo.mesas.includes(mesaId));
  };

  const obtenerMesasUnidasInfo = (mesaId) => {
    const grupo = obtenerGrupoUnido(mesaId);
    if (!grupo) return null;

    const mesasDelGrupo = mesas.filter(m => grupo.mesas.includes(m.id));
    const otrasMesas = mesasDelGrupo.filter(m => m.id !== mesaId);
    return {
      grupo,
      mesasDelGrupo,
      otrasMesas
    };
  };

  const agruparMesasUnidas = (mesasArray) => {
    const grupos = [];
    const mesasUsadas = new Set();

    // Primero agrupamos las mesas unidas
    mesasArray.forEach(mesa => {
      if (mesasUsadas.has(mesa.id)) return;

      const mesasInfo = obtenerMesasUnidasInfo(mesa.id);
      if (mesasInfo) {
        const grupoMesas = mesasInfo.mesasDelGrupo;
        grupos.push(grupoMesas);
        grupoMesas.forEach(m => mesasUsadas.add(m.id));
      }
    });

    // Luego agregamos las mesas individuales
    mesasArray.forEach(mesa => {
      if (!mesasUsadas.has(mesa.id)) {
        grupos.push([mesa]);
        mesasUsadas.add(mesa.id);
      }
    });

    return grupos;
  };

  const ordenarMesas = (mesasArray) => {
    return [...mesasArray].sort((a, b) => {
      // Extraer el área de cada mesa
      const areaA = areas.find(area => area.id === a.area)?.nombre || '';
      const areaB = areas.find(area => area.id === b.area)?.nombre || '';

      // Si las áreas son diferentes, ordenar por área primero
      if (areaA !== areaB) {
        return areaA.localeCompare(areaB);
      }

      // Si las áreas son iguales, ordenar por número
      // Extraer números de los identificadores de mesa
      const numA = a.numero.match(/\d+/g);
      const numB = b.numero.match(/\d+/g);

      // Si ambos tienen números, comparar numéricamente
      if (numA && numB) {
        return parseInt(numA[0]) - parseInt(numB[0]);
      }

      // Si no hay números o son diferentes formatos, ordenar alfabéticamente
      return a.numero.localeCompare(b.numero);
    });
  };

  const renderMesasTab = () => (
    <div className="space-y-6">
      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <FontAwesomeIcon icon={faUtensils} className="text-emerald-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Mesas Totales</p>
              <p className="text-2xl font-semibold text-gray-800">{mesas.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <FontAwesomeIcon icon={faUsers} className="text-red-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Mesas Ocupadas</p>
              <p className="text-2xl font-semibold text-gray-800">
                {mesas.filter(m => m.estado === 'ocupada').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <FontAwesomeIcon icon={faCircle} className="text-emerald-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Mesas Libres</p>
              <p className="text-2xl font-semibold text-gray-800">
                {mesas.filter(m => m.estado === 'libre').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-amber-100 rounded-lg">
              <FontAwesomeIcon icon={faClock} className="text-amber-600 text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Reservadas</p>
              <p className="text-2xl font-semibold text-gray-800">
                {mesas.filter(m => m.estado === 'reservada').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Área y Estado */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filtro de Áreas */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Áreas del Restaurante</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedArea('todas')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedArea === 'todas'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todas las áreas
                </button>
                {areas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => setSelectedArea(area.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedArea === area.id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {area.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro de Estados */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtrar por Estado</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedEstado('todos')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedEstado === 'todos'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos los estados
                </button>
                <button
                  onClick={() => setSelectedEstado('libre')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedEstado === 'libre'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <FontAwesomeIcon icon={faCircle} className="mr-2" />
                  Libres
                </button>
                <button
                  onClick={() => setSelectedEstado('ocupada')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedEstado === 'ocupada'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  Ocupadas
                </button>
                <button
                  onClick={() => setSelectedEstado('reservada')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedEstado === 'reservada'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  <FontAwesomeIcon icon={faClock} className="mr-2" />
                  Reservadas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {agruparMesasUnidas(
          ordenarMesas(
            mesas.filter((mesa) => {
              const cumpleArea = selectedArea === 'todas' ? true : mesa.area === selectedArea;
              const cumpleEstado = selectedEstado === 'todos' ? true : mesa.estado === selectedEstado;
              return cumpleArea && cumpleEstado;
            })
          )
        ).map((grupo, index) => {
          if (grupo.length === 1) {
            // Mesa individual
            return renderMesa(grupo[0]);
          } else {
            // Grupo de mesas unidas
            return (
              <div key={index} className="relative space-y-2">
                {ordenarMesas(grupo).map((mesa, mesaIndex) => (
                  <div 
                    key={mesa.id} 
                    className={`relative ${mesaIndex > 0 ? '-mt-1' : ''}`}
                  >
                    {mesaIndex > 0 && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-1 bg-blue-400"></div>
                    )}
                    {renderMesa(mesa)}
                  </div>
                ))}
              </div>
            );
          }
        })}
      </div>

      {/* Modal para unir mesas */}
      <Modal
        isOpen={showUnirMesasModal}
        onClose={() => {
          setShowUnirMesasModal(false);
          setMesaSeleccionada(null);
        }}
        title={`Unir Mesa ${mesaSeleccionada?.numero} con otra mesa`}
      >
        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Selecciona la mesa con la que deseas unir la Mesa {mesaSeleccionada?.numero} del área {areas.find(a => a.id === mesaSeleccionada?.area)?.nombre}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {mesas
              .filter(m => 
                m.id !== mesaSeleccionada?.id && 
                m.area === mesaSeleccionada?.area &&
                !estanMesasUnidas(m.id)
              )
              .map(mesa => (
                <button
                  key={mesa.id}
                  onClick={() => handleUnirMesas(mesaSeleccionada, mesa)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex flex-col items-center"
                >
                  <div className="text-lg font-semibold text-gray-700">
                    Mesa {mesa.numero}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {mesa.estado}
                  </div>
                </button>
              ))}
          </div>

          {mesas.filter(m => 
            m.id !== mesaSeleccionada?.id && 
            m.area === mesaSeleccionada?.area &&
            !estanMesasUnidas(m.id)
          ).length === 0 && (
            <div className="text-center py-6">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-400 text-2xl mb-2" />
              <p className="text-gray-500">
                No hay mesas disponibles para unir en esta área
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );

  const renderGestionTab = () => (
    <div className="space-y-6">
      {/* Gestión de Áreas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Gestión de Áreas</h2>
            <button
              onClick={() => setShowNewAreaModal(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Nueva Área
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre del Área
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {areas.map((area) => (
                  <tr key={area.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {area.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => confirmDelete(area.id, 'area', area.nombre)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Gestión de Mesas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Gestión de Mesas</h2>
            <button
              onClick={() => setShowNewMesaModal(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Nueva Mesa
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Área
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mesas.map((mesa) => (
                  <tr key={mesa.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Mesa {mesa.numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {areas.find(a => a.id === mesa.area)?.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mesa.estado === 'libre' ? 'bg-green-100 text-green-800' :
                        mesa.estado === 'ocupada' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {mesa.estado.charAt(0).toUpperCase() + mesa.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => confirmDelete(mesa.id, 'mesa', mesa.numero)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para Nueva Área */}
      <Modal
        isOpen={showNewAreaModal}
        onClose={() => setShowNewAreaModal(false)}
        title="Crear Nueva Área"
      >
        <form onSubmit={handleAddArea} className="mt-2">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Área
            </label>
            <input
              type="text"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="Ej: Terraza, Salón Principal"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              disabled={loading}
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowNewAreaModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Área'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Nueva Mesa */}
      <Modal
        isOpen={showNewMesaModal}
        onClose={() => setShowNewMesaModal(false)}
        title="Crear Nueva Mesa"
      >
        <form onSubmit={handleCreateMesa} className="mt-2">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Mesa
            </label>
            <input
              type="text"
              value={nuevaMesa.numero}
              onChange={(e) => setNuevaMesa({...nuevaMesa, numero: e.target.value})}
              placeholder="Ej: 01, T1, B1"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Área
            </label>
            <select
              value={nuevaMesa.area}
              onChange={(e) => setNuevaMesa({...nuevaMesa, area: e.target.value})}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              disabled={loading}
            >
              <option value="">Selecciona un área</option>
              {areas.map(area => (
                <option key={area.id} value={area.id}>{area.nombre}</option>
              ))}
            </select>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowNewMesaModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Mesa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          setShowDeleteConfirmModal(false);
          setItemToDelete(null);
        }}
        title="Confirmar Eliminación"
      >
        <div className="mt-2">
          <div className="flex items-center gap-3 text-yellow-600 mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl" />
            <p className="text-sm text-gray-500">
              ¿Estás seguro de que deseas eliminar {itemToDelete?.type === 'area' ? 'el área' : 'la mesa'} 
              <span className="font-medium"> {itemToDelete?.nombre}</span>?
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setItemToDelete(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={loading}
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );

  // Modificar el renderMesa para ajustar el diseño cuando está unida
  const renderMesa = (mesa) => {
    const estadoConfig = {
      libre: {
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        textColor: 'text-emerald-700',
        icon: faCircle,
        iconColor: 'text-emerald-500',
        label: 'Libre'
      },
      ocupada: {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        icon: faUsers,
        iconColor: 'text-red-500',
        label: 'Ocupada'
      },
      reservada: {
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        icon: faClock,
        iconColor: 'text-amber-500',
        label: 'Reservada'
      },
      default: {
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-700',
        icon: faCircle,
        iconColor: 'text-gray-500',
        label: 'Estado Desconocido'
      }
    };

    const config = estadoConfig[mesa.estado] || estadoConfig.default;
    const mesasInfo = obtenerMesasUnidasInfo(mesa.id);
    const estaUnida = !!mesasInfo;
    const areaNombre = areas.find(a => a.id === mesa.area)?.nombre || '';

    return (
      <div key={mesa.id} className="relative h-[100px]">
        {/* Si la mesa está ocupada, toda la tarjeta es clickeable */}
        {mesa.estado === 'ocupada' ? (
          <button 
            onClick={() => handleMesaAction('abrir', mesa)}
            className={`w-full h-full text-left relative rounded-lg border ${
              estaUnida ? 'border-blue-400 border-dashed' : config.borderColor
            } ${config.bgColor} p-2 transition-all duration-200 hover:shadow-md flex flex-col justify-between group`}
          >
            {/* Contenido de la mesa */}
            <MesaContent 
              mesa={mesa} 
              config={config} 
              estaUnida={estaUnida} 
              mesasInfo={mesasInfo} 
              areaNombre={areaNombre} 
            />
          </button>
        ) : (
          <Menu as="div" className="w-full h-full">
            <Menu.Button className={`w-full h-full text-left relative rounded-lg border ${
              estaUnida ? 'border-blue-400 border-dashed' : config.borderColor
            } ${config.bgColor} p-2 transition-all duration-200 hover:shadow-md flex flex-col justify-between`}>
              {/* Contenido de la mesa */}
              <MesaContent 
                mesa={mesa} 
                config={config} 
                estaUnida={estaUnida} 
                mesasInfo={mesasInfo} 
                areaNombre={areaNombre} 
              />
            </Menu.Button>

            <Menu.Items className="absolute left-1/2 -translate-x-1/2 bottom-[105%] w-48 bg-white rounded-lg shadow-lg ring-1 ring-black/5 focus:outline-none z-20">
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleMesaAction('abrir', mesa)}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } w-full flex items-center px-3 py-1.5 text-sm text-gray-700`}
                    >
                      <FontAwesomeIcon icon={faChair} className="w-4 h-4 mr-2 text-gray-500" />
                      Abrir Mesa
                    </button>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleMesaAction('reservar', mesa)}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } w-full flex items-center px-3 py-1.5 text-sm text-gray-700`}
                    >
                      <FontAwesomeIcon icon={faCalendarPlus} className="w-4 h-4 mr-2 text-gray-500" />
                      Reservar Mesa
                    </button>
                  )}
                </Menu.Item>

                {!estanMesasUnidas(mesa.id) && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleMesaAction('unir', mesa)}
                        className={`${
                          active ? 'bg-gray-50' : ''
                        } w-full flex items-center px-3 py-1.5 text-sm text-gray-700`}
                      >
                        <FontAwesomeIcon icon={faLink} className="w-4 h-4 mr-2 text-gray-500" />
                        Unir Mesa
                      </button>
                    )}
                  </Menu.Item>
                )}
              </div>
            </Menu.Items>
          </Menu>
        )}

        {/* Botón de desunir si la mesa está unida */}
        {estaUnida && (
          <button
            onClick={() => handleMesaAction('desunir', mesa)}
            className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 z-10 hover:bg-blue-600"
          >
            <FontAwesomeIcon icon={faUnlink} className="w-3 h-3" />
            <span>{mesasInfo.otrasMesas.map(m => m.numero).join('+')}</span>
          </button>
        )}
      </div>
    );
  };

  // Componente auxiliar para el contenido de la mesa
  const MesaContent = ({ mesa, config, estaUnida, mesasInfo, areaNombre }) => (
    <>
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {areaNombre}
            </p>
            <p className="text-base font-bold text-gray-800 truncate">
              Mesa {mesa.numero}
            </p>
          </div>
          <div className={`p-1.5 rounded-full ${config.bgColor} ${config.iconColor} flex-shrink-0`}>
            <FontAwesomeIcon icon={config.icon} className="text-sm" />
          </div>
        </div>
      </div>

      <div className="text-xs flex items-center">
        <span className="text-gray-500 flex-shrink-0">Estado:</span>
        <span className={`ml-1 font-medium ${config.textColor} truncate`}>
          {config.label}
        </span>
      </div>
    </>
  );

  const cerrarDrawer = () => {
    setIsDrawerOpen(false);
    setIsResumenDrawerOpen(false);
    setMesaActiva(null);
    setPedidoActual([]);
    setPedidoConfirmado(false);
    setSearchMenu('');
    setPedidoActivo(null);
  };

  const cerrarResumenDrawer = () => {
    setIsResumenDrawerOpen(false);
  };

  // Función para remover un producto del pedido
  const removeFromOrder = (productKey) => {
    setPedidoActual(prev => {
      const existingItem = prev.find(item => item.productKey === productKey);
      if (existingItem && existingItem.cantidad > 1) {
        return prev.map(item =>
          item.productKey === productKey
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        );
      }
      return prev.filter(item => item.productKey !== productKey);
    });
  };

  // Función para eliminar completamente un producto del pedido
  const deleteFromOrder = (productKey) => {
    setPedidoActual(prev => prev.filter(item => item.productKey !== productKey));
  };

  // Función para generar un ID único para cada combinación de producto y modificadores
  const generateProductKey = (productId, modifiers = {}) => {
    if (!modifiers || Object.keys(modifiers).length === 0) {
      return `${productId}-simple`;
    }
    
    const sortedModifiers = Object.entries(modifiers)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => {
        if (value.seleccion) {
          if (Array.isArray(value.seleccion)) {
            return `${key}:${value.seleccion.map(s => s.id).sort().join(',')}`;
          }
          return `${key}:${value.seleccion.id}`;
        }
        return `${key}:${value}`;
      })
      .join('|');
    
    return `${productId}-${sortedModifiers}`;
  };

  // Función para agregar un producto al pedido
  const addToOrder = (product) => {
    setPedidoActual(prev => {
      const productKey = generateProductKey(product.id);
      const existingItem = prev.find(item => item.productKey === productKey);
      
      if (existingItem) {
        return prev.map(item =>
          item.productKey === productKey
            ? { ...item, cantidad: (item.cantidad || 1) + 1 }
            : item
        );
      }
      
      return [...prev, { 
        ...product, 
        cantidad: 1,
        productKey
      }];
    });
    toast.success(`${product.nombre} agregado al pedido`);
  };

  // Función para iniciar el proceso de agregar al carrito
  const startAddToOrder = (product) => {
    if (product.modificadores && product.modificadores.length > 0) {
      setSelectedProduct(product);
      setShowModifiersModal(true);
    } else {
      addToOrder(product);
    }
  };

  // Modificar la función confirmarPedido
  const confirmarPedido = async () => {
    if (pedidoActual.length === 0) {
      toast.warning('No hay productos en el pedido');
      return;
    }

    try {
      const pedidosRef = collection(db, 'pedidos');
      
      // Buscar si ya existe un pedido activo para esta mesa
      const q = query(
        pedidosRef,
        where('mesaId', '==', mesaActiva.id),
        where('estado', '==', 'activo')
      );
      const querySnapshot = await getDocs(q);
      
      let pedidoRef;
      let productosActualizados = [];
      const horaActual = new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Preparar los nuevos productos con hora
      const nuevosProductos = pedidoActual.map(producto => ({
        ...producto,
        hora: horaActual,
        estado: 'pendiente'
      }));

      if (!querySnapshot.empty) {
        // Actualizar pedido existente
        pedidoRef = doc(db, 'pedidos', querySnapshot.docs[0].id);
        const pedidoExistente = querySnapshot.docs[0].data();
        productosActualizados = [...(pedidoExistente.productos || []), ...nuevosProductos];
      } else {
        // Crear nuevo pedido
        pedidoRef = doc(pedidosRef);
        productosActualizados = nuevosProductos;
      }

      // Actualizar o crear el pedido
      await setDoc(pedidoRef, {
        mesaId: mesaActiva.id,
        estado: 'activo',
        productos: productosActualizados,
        fechaCreacion: querySnapshot.empty ? new Date().toISOString() : undefined,
        fechaActualizacion: new Date().toISOString()
      }, { merge: true });

      // Actualizar estado de la mesa
      await actualizarEstadoMesa(mesaActiva.id, 'ocupada');
      
      // Cargar el pedido actualizado en el drawer de resumen
      const pedidoActualizado = await cargarPedidoActivo(mesaActiva.id);
      
      // Cerrar el drawer de productos y mostrar el de resumen
      setIsDrawerOpen(false);
      setPedidoConfirmado(true);
      setIsResumenDrawerOpen(true);
      setPedidoActual([]);
      
      toast.success('Pedido confirmado exitosamente');
    } catch (error) {
      console.error('Error al confirmar pedido:', error);
      toast.error('Error al confirmar el pedido');
    }
  };

  // Modificar la función cargarPedidoActivo
  const cargarPedidoActivo = async (mesaId) => {
    try {
      const pedidosRef = collection(db, 'pedidos');
      const q = query(
        pedidosRef,
        where('mesaId', '==', mesaId),
        where('estado', '==', 'activo')
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const pedidoData = querySnapshot.docs[0].data();
        const pedido = {
          id: querySnapshot.docs[0].id,
          ...pedidoData,
          productos: pedidoData.productos.map(producto => ({
            ...producto,
            hora: producto.hora || new Date().toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          }))
        };
        setPedidoActivo(pedido);
        return pedido;
      } else {
        setPedidoActivo(null);
        return null;
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
      toast.error('Error al cargar el pedido');
      return null;
    }
  };

  const cancelarPedido = async () => {
    try {
      // Si hay un pedido activo, cancelarlo
      if (pedidoActivo?.id) {
        const pedidoRef = doc(db, 'pedidos', pedidoActivo.id);
        await updateDoc(pedidoRef, {
          estado: 'cancelado',
          fechaCancelacion: new Date().toISOString()
        });
      }

      // Actualizar estado de la mesa
      if (mesaActiva?.id) {
        const mesaRef = doc(db, 'mesas', mesaActiva.id);
        
        // Si la mesa está unida, liberar todas las mesas del grupo
        const mesasUnidas = obtenerMesasUnidasInfo(mesaActiva.id);
        if (mesasUnidas && mesasUnidas.length > 0) {
          // Actualizar todas las mesas unidas
          const actualizaciones = mesasUnidas.map(mesaId => 
            updateDoc(doc(db, 'mesas', mesaId), {
              estado: 'libre',
              unidaCon: null
            })
          );
          await Promise.all(actualizaciones);
        } else {
          // Actualizar solo la mesa actual
          await updateDoc(mesaRef, {
            estado: 'libre',
            unidaCon: null
          });
        }

        // Actualizar estados locales
        setMesas(prevMesas => 
          prevMesas.map(mesa => {
            if (mesa.id === mesaActiva.id || (mesasUnidas && mesasUnidas.includes(mesa.id))) {
              return {
                ...mesa,
                estado: 'libre',
                unidaCon: null
              };
            }
            return mesa;
          })
        );
      }

      // Limpiar estados
      setPedidoActivo(null);
      setMesaActiva(null);
      
      // Cerrar modales y drawers
      setShowCancelarPedidoModal(false);
      setIsResumenDrawerOpen(false);
      setIsDrawerOpen(false);

      toast.success(pedidoActivo?.id ? 'Pedido cancelado correctamente' : 'Mesa liberada correctamente');
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      toast.error('Error al cancelar el pedido');
    }
  };

  // Agregar función para eliminar producto del pedido activo
  const eliminarProductoPedido = async (index) => {
    try {
      const pedidoRef = doc(db, 'pedidos', pedidoActivo.id);
      const nuevosProductos = [...pedidoActivo.productos];
      nuevosProductos.splice(index, 1);
      
      await setDoc(pedidoRef, {
        productos: nuevosProductos,
        fechaActualizacion: new Date().toISOString()
      });

      setPedidoActivo(prev => ({
        ...prev,
        productos: nuevosProductos
      }));
      
      // Si no quedan productos, actualizar estado de la mesa
      if (nuevosProductos.length === 0) {
        await actualizarEstadoMesa(mesaActiva.id, 'libre');
        setIsResumenDrawerOpen(false);
      }
      
      toast.success('Producto eliminado del pedido');
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  // Agregar función para ajustar cantidad
  const ajustarCantidadPedido = async (index, incremento) => {
    try {
      const pedidoRef = doc(db, 'pedidos', pedidoActivo.id);
      const nuevosProductos = [...pedidoActivo.productos];
      const producto = nuevosProductos[index];

      if (incremento) {
        producto.cantidad += 1;
      } else {
        if (producto.cantidad > 1) {
          producto.cantidad -= 1;
        } else {
          return eliminarProductoPedido(index);
        }
      }

      await setDoc(pedidoRef, {
        productos: nuevosProductos,
        fechaActualizacion: new Date().toISOString()
      });

      setPedidoActivo(prev => ({
        ...prev,
        productos: nuevosProductos
      }));
      toast.success('Cantidad actualizada');
    } catch (error) {
      console.error('Error al ajustar cantidad:', error);
      toast.error('Error al actualizar la cantidad');
    }
  };

  // Función para manejar el clic en un producto
  const handleProductClick = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    setMenuPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + scrollTop
    });
    setProductoAQuitar(item);
    setShowProductMenu(true);
  };

  // Función para iniciar el proceso de quitar productos
  const iniciarQuitarProducto = (item) => {
    setShowProductMenu(false);
    if (item.cantidad > 1) {
      setProductoAQuitar(item);
      setCantidadAQuitar(1);
      setShowQuitarModal(true);
    } else {
      quitarProductoDelPedido(item, 1);
    }
  };

  // Función para quitar productos del pedido
  const quitarProductoDelPedido = async (producto, cantidad) => {
    try {
      if (!pedidoActivo?.id || !producto) return;

      const pedidoRef = doc(db, 'pedidos', pedidoActivo.id);
      const nuevosProductos = [...pedidoActivo.productos];
      const index = nuevosProductos.findIndex(p => 
        p.id === producto.id && 
        JSON.stringify(p.modifiers) === JSON.stringify(producto.modifiers)
      );

      if (index === -1) return;

      if (nuevosProductos[index].cantidad <= cantidad) {
        nuevosProductos.splice(index, 1);
      } else {
        nuevosProductos[index].cantidad -= cantidad;
      }

      await updateDoc(pedidoRef, {
        productos: nuevosProductos
      });

      // Actualizar el estado local
      setPedidoActivo(prev => ({
        ...prev,
        productos: nuevosProductos
      }));

      setShowQuitarModal(false);
    } catch (error) {
      console.error('Error al quitar productos:', error);
    }
  };

  // Efecto para cerrar el menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProductMenu) {
        setShowProductMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showProductMenu]);

  const renderProductoResumen = (item, index) => (
    <div 
      key={`${item.id}-${index}`}
      className="flex items-start space-x-2 p-3 hover:bg-gray-50 rounded-lg transition-colors relative group cursor-pointer"
      onClick={(e) => handleProductClick(e, item)}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center">
              <span className="w-8 text-lg font-medium text-gray-900">
                {index + 1}
              </span>
              <h4 className="font-medium text-gray-900">{item.nombre}</h4>
            </div>
            {item.modifiers && Object.keys(item.modifiers).length > 0 && (
              <ul className="mt-1 space-y-1 ml-8">
                {Object.entries(item.modifiers).map(([key, value]) => (
                  <li key={key} className="text-sm text-gray-500">
                    {key}: {value}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2 ml-8 mt-1 text-sm text-gray-500">
              <span>{item.hora || '00:00'}</span>
              {item.cantidad > 1 && (
                <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                  x{item.cantidad}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="font-medium text-gray-900">
              ${formatCurrency(item.precio * item.cantidad)}
            </span>
          </div>
        </div>
      </div>

      {/* Menú contextual */}
      {showProductMenu && productoAQuitar?.id === item.id && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48"
          style={{
            top: menuPosition.y,
            left: menuPosition.x - 96 // Centrar el menú (ancho del menú / 2)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => iniciarQuitarProducto(item)}
          >
            Quitar del pedido
          </button>
        </div>
      )}
    </div>
  );

  // Modificar el ResumenDrawer
  const ResumenDrawer = () => (
    <Transition.Root show={isResumenDrawerOpen} as={Fragment}>
      <div className="fixed inset-0 overflow-hidden z-50">
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div 
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              onClick={() => {
                setShowProductMenu(false);
                cerrarResumenDrawer();
              }}
            />
          </Transition.Child>

          <section className="absolute inset-y-0 right-0 max-w-full flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="relative w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                  {/* Header Principal */}
                  <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between px-4 py-3">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Mesa {mesaActiva?.numero}
                      </h2>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          className="text-red-400 hover:text-red-500"
                          onClick={() => setShowCancelarPedidoModal(true)}
                        >
                          <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subheader con emoji y botón de agregar */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-lg">
                        <span className="mr-2">🍽️</span>
                        <span>Mesa {mesaActiva?.numero}</span>
                      </div>
                      <button
                        onClick={() => {
                          setIsResumenDrawerOpen(false);
                          setIsDrawerOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
                        <span>Agregar productos</span>
                      </button>
                    </div>
                  </div>

                  {/* Estado de Orden */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {pedidoActivo?.productos?.length > 0 ? 'Resumen del pedido' : 'Mesa sin pedidos'}
                      </span>
                      <div className="flex items-center">
                        <span className={`h-2 w-2 rounded-full ${pedidoActivo?.productos?.length > 0 ? 'bg-emerald-400' : 'bg-gray-400'} mr-2`}></span>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Productos o Mensaje de No Pedidos */}
                  <div className="flex-1 overflow-y-auto">
                    {pedidoActivo?.productos && pedidoActivo.productos.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {pedidoActivo.productos.map((item, index) => (
                          renderProductoResumen(item, index)
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
                        <FontAwesomeIcon icon={faUtensils} className="h-12 w-12 mb-4" />
                        <p className="text-center px-4">
                          No hay productos en la mesa.
                          {mesaActiva?.estado === 'ocupada' && (
                            <span className="block mt-2 text-sm">
                              Puedes agregar productos usando el botón superior o cerrar la mesa si fue abierta por error.
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer con Total */}
                  {pedidoActivo?.productos?.length > 0 && (
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-900 font-medium">Total del Pedido</span>
                        <span className="text-lg font-semibold text-emerald-600">
                          ${formatCurrency(
                            pedidoActivo.productos.reduce(
                              (sum, item) => sum + (item.precio * item.cantidad),
                              0
                            ) || 0
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Transition.Child>
          </section>
        </div>

        {/* Modal para quitar productos */}
        <Modal
          isOpen={showQuitarModal}
          onClose={() => setShowQuitarModal(false)}
          title="Quitar productos del pedido"
        >
          <div className="p-4">
            <p className="text-gray-600 mb-4">
              ¿Cuántas unidades de "{productoAQuitar?.nombre}" deseas quitar?
            </p>
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setCantidadAQuitar(prev => Math.max(1, prev - 1))}
                className="p-2 text-gray-600 hover:text-gray-800 bg-gray-100 rounded-full"
              >
                -
              </button>
              <span className="text-xl font-medium w-12 text-center">
                {cantidadAQuitar}
              </span>
              <button
                onClick={() => setCantidadAQuitar(prev => Math.min(productoAQuitar?.cantidad || 1, prev + 1))}
                className="p-2 text-gray-600 hover:text-gray-800 bg-gray-100 rounded-full"
              >
                +
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowQuitarModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => quitarProductoDelPedido(productoAQuitar, cantidadAQuitar)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Quitar productos
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal de Cancelar Pedido */}
        <Modal
          isOpen={showCancelarPedidoModal}
          onClose={() => setShowCancelarPedidoModal(false)}
          title="Cancelar Mesa"
        >
          <div className="p-4">
            <p className="text-gray-600 mb-4">
              {pedidoActivo?.productos?.length > 0 
                ? "¿Estás seguro de que deseas cancelar el pedido?"
                : "¿Estás seguro de que deseas liberar esta mesa?"}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelarPedidoModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                No, mantener
              </button>
              <button
                onClick={cancelarPedido}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                {pedidoActivo?.productos?.length > 0 
                  ? "Sí, cancelar pedido"
                  : "Sí, liberar mesa"}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Transition.Root>
  );

  const handleModifierChange = (modifierId, value) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [modifierId]: value
    }));
  };

  // Función para renderizar la imagen del producto
  const renderProductImage = (product) => {
    if (!product.id) return null;

    const imageUrl = productImages[product.id];
    
    if (!imageUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <FontAwesomeIcon 
            icon={faUtensils} 
            className="h-6 w-6 text-gray-400" 
          />
        </div>
      );
    }

    return (
      <img
        src={imageUrl}
        alt={product.nombre}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = ''; // Limpiar src para evitar bucles
          e.target.parentElement.innerHTML = `
            <div class="w-full h-full flex items-center justify-center bg-gray-100">
              <svg class="h-6 w-6 text-gray-400" ... />
            </div>
          `;
        }}
      />
    );
  };

  // Función para agregar producto con modificadores
  const addProductWithModifiers = () => {
    if (!selectedProduct) return;

    // Crear una copia de los modificadores del producto con toda la información necesaria
    const modificadoresCompletos = selectedProduct.modificadores.reduce((acc, mod) => {
      const seleccion = selectedModifiers[mod.id];
      if (!seleccion) return acc;

      acc[mod.id] = {
        nombre: mod.nombre,
        tipo: mod.tipo,
        seleccion: mod.tipo === 'multiple' ? 
          (Array.isArray(seleccion) ? seleccion : []).map(opId => {
            const opcion = mod.opciones.find(op => op.id === opId);
            return {
              id: opId,
              nombre: opcion?.nombre || ''
            };
          }) :
          (() => {
            const opcion = mod.opciones.find(op => op.id === seleccion);
            return {
              id: seleccion,
              nombre: opcion?.nombre || ''
            };
          })()
      };
      return acc;
    }, {});

    const productWithModifiers = {
      ...selectedProduct,
      modificadores: modificadoresCompletos,
      cantidad: modifierQuantity,
      productKey: generateProductKey(selectedProduct.id, modificadoresCompletos)
    };

    setPedidoActual(prev => {
      const existingItemIndex = prev.findIndex(item => 
        item.productKey === productWithModifiers.productKey
      );

      if (existingItemIndex >= 0) {
        return prev.map((item, index) => 
          index === existingItemIndex
            ? { ...item, cantidad: (item.cantidad || 1) + modifierQuantity }
            : item
        );
      }

      return [...prev, productWithModifiers];
    });

    setShowModifiersModal(false);
    setSelectedProduct(null);
    setSelectedModifiers({});
    setModifierQuantity(1);
    toast.success(`${selectedProduct.nombre} agregado al pedido`);
  };

  if (loading && !areas.length && !mesas.length) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Agregar clase overflow-x-hidden al contenedor principal */}
      <div className="min-h-screen bg-gray-50 p-4 overflow-x-hidden">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Mesas</h1>
            <p className="text-gray-600 mt-1">Administra las mesas y su disponibilidad</p>
          </div>
        </div>

        {/* Pestañas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('mesas')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'mesas'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faUtensils} className="mr-2" />
                Vista de Mesas
              </button>
              <button
                onClick={() => setActiveTab('gestion')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'gestion'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faCog} className="mr-2" />
                Gestión de Mesas
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'mesas' ? renderMesasTab() : renderGestionTab()}

        {/* Drawer para pedidos */}
        <Transition.Root show={isDrawerOpen} as={Fragment}>
          <div className="fixed inset-0 overflow-hidden z-50">
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-500"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-500"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <div className="relative w-screen max-w-7xl">
                  <div className="h-full flex flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="px-6 py-5 bg-white border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col">
                            <h2 className="text-2xl font-semibold text-gray-900">
                              Mesa {mesaActiva?.numero}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                              {areas.find(a => a.id === mesaActiva?.area)?.nombre}
                            </p>
                          </div>
                          <div className="h-8 w-0.5 bg-gray-200"></div>
                          <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            Nuevos pedidos
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors"
                          onClick={cerrarDrawer}
                        >
                          <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Contenido del Drawer */}
                    <div className="flex-1 flex h-full">
                      {/* Panel izquierdo - Menú */}
                      <div className="flex-1 flex flex-col border-r border-gray-200">
                        {/* Barra de búsqueda */}
                        <div className="p-6 border-b border-gray-200 bg-white">
                          <div className="relative max-w-lg mx-auto">
                            <FontAwesomeIcon 
                              icon={faSearch} 
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                            />
                            <input
                              type="text"
                              value={searchMenu}
                              onChange={(e) => setSearchMenu(e.target.value)}
                              placeholder="Buscar productos..."
                              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 text-base"
                            />
                          </div>
                        </div>

                        {/* Menú */}
                        <div className="flex-1 overflow-y-auto bg-gray-50">
                          {loadingMenu ? (
                            <div className="flex justify-center items-center h-full">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                            </div>
                          ) : (
                            <div className="p-6">
                              {filteredSections.map((section) => (
                                <div key={section.id} className="mb-8">
                                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                                      <FontAwesomeIcon icon={faUtensils} className="text-emerald-600" />
                                    </span>
                                    {section.name}
                                  </h3>
                                  <div className="grid grid-cols-1 gap-4">
                                    {section.products.map((product) => (
                                      <div
                                        key={product.id}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group p-4 flex items-start gap-4"
                                      >
                                        {/* Imagen del producto */}
                                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                          {renderProductImage(product)}
                                        </div>

                                        {/* Información del producto */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <h4 className="text-lg font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                                                {product.nombre}
                                              </h4>
                                              {product.descripcion && (
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                  {product.descripcion}
                                                </p>
                                              )}
                                            </div>
                                            <div className="flex flex-col items-end ml-4">
                                              <span className="text-lg font-semibold text-gray-900">
                                                ${product.precio?.toLocaleString('es-CL')}
                                              </span>
                                              <button
                                                onClick={() => startAddToOrder(product)}
                                                className="mt-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center font-medium text-sm"
                                              >
                                                <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                                                Agregar
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Panel derecho - Carrito */}
                      <div className="w-[480px] flex flex-col bg-white">
                        <div className="p-6 border-b border-gray-200 bg-white">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-gray-900">Pedido actual</h3>
                            <span className="text-sm text-gray-500">{pedidoActual.length} items</span>
                          </div>
                        </div>
                        
                        {/* Lista de items en el carrito */}
                        <div className="flex-1 overflow-y-auto">
                          {pedidoActual.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-6">
                              <FontAwesomeIcon icon={faShoppingCart} className="h-12 w-12 mb-4" />
                              <p className="text-lg font-medium">Tu carrito está vacío</p>
                              <p className="text-sm mt-2 text-center">Agrega productos del menú para comenzar tu pedido</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {pedidoActual.map((item, index) => (
                                <div key={`${item.id}-${JSON.stringify(item.modificadores)}`} 
                                     className="p-4 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-medium">
                                      {index + 1}
                                    </div>
                                    <div className="ml-4 flex-1 min-w-0">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <h4 className="text-base font-medium text-gray-900">{item.nombre}</h4>
                                          <p className="text-sm text-gray-500 mt-1">Cantidad: {item.cantidad}</p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <span className="text-base font-semibold text-gray-900">
                                            {formatCurrency(item.precio * (item.cantidad || 1))}
                                          </span>
                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={() => deleteFromOrder(item.productKey)}
                                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                              title="Eliminar producto"
                                            >
                                              <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => removeFromOrder(item.productKey)}
                                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                              title="Reducir cantidad"
                                            >
                                              <FontAwesomeIcon icon={faMinus} className="h-4 w-4" />
                                            </button>
                                            <button
                                              onClick={() => addToOrder(item)}
                                              className="p-1 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
                                              title="Aumentar cantidad"
                                            >
                                              <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Modificadores */}
                                      {item.modificadores && Object.entries(item.modificadores).length > 0 && (
                                        <div className="mt-3 pl-4 border-l-2 border-gray-100">
                                          {Object.entries(item.modificadores).map(([modId, modificador]) => (
                                            <div key={modId} className="mb-2">
                                              <div className="flex items-center text-sm">
                                                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3 text-emerald-400 mr-2" />
                                                <span className="font-medium text-gray-700">{modificador.nombre}</span>
                                              </div>
                                              {modificador.tipo === 'multiple' ? (
                                                Array.isArray(modificador.seleccion) && modificador.seleccion.map(opcion => (
                                                  <div key={opcion.id} className="ml-5 flex items-center text-sm">
                                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>
                                                    <span className="text-gray-600">{opcion.nombre}</span>
                                                  </div>
                                                ))
                                              ) : (
                                                <div className="ml-5 flex items-center text-sm">
                                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>
                                                  <span className="text-gray-600">{modificador.seleccion.nombre}</span>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Footer con totales */}
                        <div className="border-t border-gray-200 p-6 bg-white">
                          <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Anterior</span>
                              <span className="text-gray-900 font-medium">{formatCurrency(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Agregado</span>
                              <span className="text-gray-900 font-medium">
                                {formatCurrency(
                                  pedidoActual.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0)
                                )}
                              </span>
                            </div>
                            <div className="pt-4 border-t border-gray-200">
                              <div className="flex justify-between text-lg font-semibold">
                                <span className="text-gray-900">Total</span>
                                <span className="text-emerald-600">
                                  {formatCurrency(
                                    pedidoActual.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0)
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            className="mt-6 w-full bg-emerald-600 text-white px-6 py-4 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                              confirmarPedido();
                              cerrarDrawer();
                            }}
                            disabled={pedidoActual.length === 0}
                          >
                            <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                            Confirmar Pedido
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Transition.Root>

        {/* Drawer de Modificadores */}
        <Transition.Root show={showModifiersModal} as={Fragment}>
          <div className="fixed inset-0 overflow-hidden z-50">
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-500"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in-out duration-500"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <div className="relative w-screen max-w-md">
                  <div className="h-full flex flex-col bg-white shadow-xl">
                    {/* Header */}
                    <div className="px-6 py-5 bg-white border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h2 className="text-2xl font-semibold text-gray-900">
                            {selectedProduct?.nombre}
                          </h2>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                              Selecciona las opciones para este producto
                            </p>
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => setModifierQuantity(prev => Math.max(1, prev - 1))}
                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                disabled={modifierQuantity <= 1}
                              >
                                <FontAwesomeIcon icon={faMinus} className="h-4 w-4" />
                              </button>
                              <span className="text-lg font-medium text-gray-900 w-8 text-center">
                                {modifierQuantity}
                              </span>
                              <button
                                onClick={() => setModifierQuantity(prev => prev + 1)}
                                className="p-1 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
                              >
                                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors"
                          onClick={() => {
                            setShowModifiersModal(false);
                            setSelectedProduct(null);
                            setSelectedModifiers({});
                            setModifierQuantity(1);
                          }}
                        >
                          <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                        </button>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-6 space-y-6">
                        {selectedProduct?.modificadores?.map((modificador) => (
                          <div key={modificador.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                              <h3 className="text-lg font-medium text-gray-900">{modificador.nombre}</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                {modificador.tipo === 'multiple' ? 'Puedes seleccionar varias opciones' : 'Selecciona una opción'}
                              </p>
                            </div>
                            <div className="divide-y divide-gray-200">
                              {modificador.opciones.map((opcion) => (
                                <label
                                  key={opcion.id}
                                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                  <input
                                    type={modificador.tipo === 'multiple' ? 'checkbox' : 'radio'}
                                    name={`modificador-${modificador.id}`}
                                    value={opcion.id}
                                    checked={
                                      modificador.tipo === 'multiple'
                                        ? selectedModifiers[modificador.id]?.includes(opcion.id)
                                        : selectedModifiers[modificador.id] === opcion.id
                                    }
                                    onChange={() => {
                                      if (modificador.tipo === 'multiple') {
                                        const currentSelections = selectedModifiers[modificador.id] || [];
                                        const newSelections = currentSelections.includes(opcion.id)
                                          ? currentSelections.filter(id => id !== opcion.id)
                                          : [...currentSelections, opcion.id];
                                        handleModifierChange(modificador.id, newSelections);
                                      } else {
                                        handleModifierChange(modificador.id, opcion.id);
                                      }
                                    }}
                                    className={`h-4 w-4 ${
                                      modificador.tipo === 'multiple'
                                        ? 'rounded text-emerald-600 focus:ring-emerald-500'
                                        : 'rounded-full text-emerald-600 focus:ring-emerald-500'
                                    } border-gray-300`}
                                  />
                                  <div className="ml-3 flex flex-1 justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">{opcion.nombre}</span>
                                    {opcion.precio > 0 && (
                                      <span className="text-sm font-medium text-gray-500">
                                        + ${opcion.precio?.toLocaleString('es-CL')}
                                      </span>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 p-6">
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Precio unitario:</span>
                          <span className="font-medium text-gray-900">
                            ${selectedProduct?.precio?.toLocaleString('es-CL')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                          <span>Cantidad:</span>
                          <span className="font-medium text-gray-900">{modifierQuantity}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-base font-semibold">
                          <span>Total:</span>
                          <span className="text-emerald-600">
                            ${((selectedProduct?.precio || 0) * modifierQuantity).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addProductWithModifiers}
                        className="w-full bg-emerald-600 text-white px-6 py-4 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center font-semibold text-lg"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Agregar {modifierQuantity} al Pedido
                      </button>
                    </div>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </Transition.Root>

        {/* Modal de confirmación para cancelar pedido */}
        <Modal
          isOpen={showCancelarPedidoModal}
          onClose={() => setShowCancelarPedidoModal(false)}
          title="Confirmar Cancelación"
        >
          <div className="p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl" />
              <p className="text-sm text-gray-500">
                ¿Estás seguro de que deseas cancelar el pedido de la mesa {mesaActiva?.numero}? 
                Esta acción eliminará todos los productos agregados.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCancelarPedidoModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={cancelarPedido}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Sí, Cancelar Pedido
              </button>
            </div>
          </div>
        </Modal>

        {/* Agregar ResumenDrawer aquí */}
        <ResumenDrawer />
      </div>
    </Layout>
  );
};

export default Mesas;

