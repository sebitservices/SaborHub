import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUtensils, 
  faClock,
  faExclamationTriangle,
  faPlus,
  faEdit,
  faTrash,
  faList,
  faPencil,
  faSpinner,
  faArrowDown,
  faArrowUp,
  faSave,
  faCheck,
  faToggleOn,
  faToggleOff,
  faTimes,
  faLock,
  faUnlock,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs, query, orderBy, doc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import SectionFormModal from '../components/modals/SectionFormModal';
import ProductFormModal from '../components/modals/MenuProductFormModal';
import DeleteSectionModal from '../components/modals/DeleteSectionModal';
import MenuDeleteProductModal from '../components/modals/MenuDeleteProductModal';
import Notification from '../components/ui/Notification';

// eslint-disable-next-line no-unused-vars
import { resetServerContext } from 'react-beautiful-dnd';

const Menu = () => {
  const [activeTab, setActiveTab] = useState('menu');
  const [menuSections, setMenuSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reordering, setReordering] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Estados para modales
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteSectionModalOpen, setIsDeleteSectionModalOpen] = useState(false);
  const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState(false);
  
  // Estados para elementos seleccionados
  const [editingSection, setEditingSection] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Estado para notificaciones
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    message: '',
    duration: 4000
  });

  // Estados para horarios - MOVIDOS FUERA DE renderHorarioTab
  const [sectionSchedules, setSectionSchedules] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [savingSchedules, setSavingSchedules] = useState(false);
  const [tempSchedules, setTempSchedules] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  const tabs = [
    { id: 'menu', label: 'Menú', icon: faUtensils },
    { id: 'horario', label: 'Horario', icon: faClock }
  ];

  // Cargar secciones del menú al iniciar
  useEffect(() => {
    if (activeTab === 'menu') {
      fetchMenuSections();
    }
  }, [activeTab]);

  // MOVER AQUÍ el useEffect que estaba dentro de renderHorarioTab
  // Inicializar horarios cuando la pestaña horario está activa y hay secciones
  useEffect(() => {
    if (activeTab === 'horario' && menuSections.length > 0 && !isInitialized) {
      // Inicializar el estado de horarios con los datos de las secciones
      const initialSchedules = {};
      
      menuSections.forEach(section => {
        // Si la sección ya tiene horarios configurados, usarlos, sino crear estructura inicial
        initialSchedules[section.id] = section.horarios || {
          disponible: true, // Disponible por defecto
          siempreDisponible: true, // Siempre disponible por defecto
          horarios: [
            // Formato para cada día: día, hora inicio, hora fin
            { dia: 'lunes', inicio: '08:00', fin: '22:00', activo: true },
            { dia: 'martes', inicio: '08:00', fin: '22:00', activo: true },
            { dia: 'miércoles', inicio: '08:00', fin: '22:00', activo: true },
            { dia: 'jueves', inicio: '08:00', fin: '22:00', activo: true },
            { dia: 'viernes', inicio: '08:00', fin: '22:00', activo: true },
            { dia: 'sábado', inicio: '08:00', fin: '22:00', activo: true },
            { dia: 'domingo', inicio: '08:00', fin: '22:00', activo: true }
          ]
        };
      });
      
      setSectionSchedules(initialSchedules);
      setTempSchedules(initialSchedules);
      setIsInitialized(true);
    }
  }, [menuSections, isInitialized, activeTab]);

  // Agregar este efecto para eliminar advertencias de desarrollo relacionadas con react-beautiful-dnd
  useEffect(() => {
    // Esto solo afecta en desarrollo, en producción no habrá estas advertencias
    if (process.env.NODE_ENV === 'development') {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        if (
          typeof args[0] === 'string' &&
          (args[0].includes('defaultProps will be removed') || 
           args[0].includes('react-beautiful-dnd'))
        ) {
          return;
        }
        originalConsoleError(...args);
      };

      return () => {
        console.error = originalConsoleError;
      };
    }
  }, []);

  // Actualiza la hora actual cada minuto para revisar si cambia el estado de bloqueo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000); // Actualizar cada minuto
    
    return () => clearInterval(timer);
  }, []);

  // Función para cargar secciones del menú desde Firebase
  const fetchMenuSections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const sectionsCollection = collection(db, 'menuSecciones');
      const sectionsSnapshot = await getDocs(query(sectionsCollection, orderBy('orden', 'asc')));
      
      const sectionsData = [];
      
      // Procesar cada sección
      for (const docSnapshot of sectionsSnapshot.docs) {
        const sectionData = {
          id: docSnapshot.id,
          ...docSnapshot.data(),
          products: []
        };
        
        // Cargar productos de esta sección
        try {
          const productsCollection = collection(db, 'menuSecciones', docSnapshot.id, 'productos');
          const productsSnapshot = await getDocs(query(productsCollection, orderBy('orden', 'asc')));
          
          if (!productsSnapshot.empty) {
            sectionData.products = productsSnapshot.docs.map(productDoc => ({
              id: productDoc.id,
              ...productDoc.data()
            }));
          }
        } catch (error) {
          console.error(`Error al cargar productos de la sección ${docSnapshot.id}:`, error);
        }
        
        sectionsData.push(sectionData);
      }
      
      setMenuSections(sectionsData);
    } catch (error) {
      console.error('Error al cargar secciones del menú:', error);
      setError('Error al cargar las secciones del menú. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
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

  // Manejadores para modal de sección
  const openSectionModal = () => {
    setEditingSection(null);
    setIsSectionModalOpen(true);
  };

  const openEditSectionModal = (section) => {
    setEditingSection(section);
    setIsSectionModalOpen(true);
  };

  const closeSectionModal = () => {
    setIsSectionModalOpen(false);
    setTimeout(() => setEditingSection(null), 300);
  };

  // Manejadores para modal de producto
  const openProductModal = (section) => {
    setCurrentSection(section);
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (section, product) => {
    setCurrentSection(section);
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setTimeout(() => {
      setCurrentSection(null);
      setEditingProduct(null);
    }, 300);
  };

  // Manejadores para modales de eliminación
  const openDeleteSectionModal = (section) => {
    setSectionToDelete(section);
    setIsDeleteSectionModalOpen(true);
  };

  const closeDeleteSectionModal = () => {
    setIsDeleteSectionModalOpen(false);
    setTimeout(() => setSectionToDelete(null), 300);
  };

  const openDeleteProductModal = (section, product) => {
    setCurrentSection(section);
    setProductToDelete(product);
    setIsDeleteProductModalOpen(true);
  };

  const closeDeleteProductModal = () => {
    setIsDeleteProductModalOpen(false);
    setTimeout(() => {
      setCurrentSection(null);
      setProductToDelete(null);
    }, 300);
  };

  // Función para eliminar una sección
  const handleDeleteSection = async (sectionId) => {
    try {
      await deleteDoc(doc(db, 'menuSecciones', sectionId));
      
      // Actualizar estado local
      setMenuSections(prevSections => prevSections.filter(section => section.id !== sectionId));
      
      showNotification('success', 'Sección eliminada correctamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar sección:', error);
      showNotification('error', `Error al eliminar sección: ${error.message}`);
      return false;
    }
  };

  // Función para eliminar un producto
  const handleDeleteProduct = async (sectionId, productId) => {
    try {
      await deleteDoc(doc(db, 'menuSecciones', sectionId, 'productos', productId));
      
      // Actualizar estado local
      setMenuSections(prevSections => prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            products: section.products.filter(product => product.id !== productId)
          };
        }
        return section;
      }));
      
      showNotification('success', 'Producto eliminado correctamente');
      return true;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      showNotification('error', `Error al eliminar producto: ${error.message}`);
      return false;
    }
  };

  // Función para guardar el nuevo orden en Firestore
  const saveNewOrder = async (sections) => {
    setReordering(true);
    try {
      const batch = writeBatch(db);
      
      // Actualizar el orden de cada sección
      sections.forEach((section, index) => {
        const sectionRef = doc(db, 'menuSecciones', section.id);
        batch.update(sectionRef, { orden: index });
      });
      
      await batch.commit();
      showNotification('success', 'Orden de secciones actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el orden de las secciones:', error);
      showNotification('error', 'Error al actualizar el orden de las secciones');
    } finally {
      setReordering(false);
    }
  };

  // Manejar el final del arrastre
  const handleDragEnd = (result) => {
    // Si no hay un destino válido, no hacer nada
    if (!result.destination) return;

    // Guardar el orden anterior para poder restaurarlo en caso de error
    const originalSections = [...menuSections];
    
    // Crear una copia del array
    const newSections = [...menuSections];
    
    // Eliminar el elemento arrastrado del array
    const [movedSection] = newSections.splice(result.source.index, 1);
    
    // Insertar el elemento en la nueva posición
    newSections.splice(result.destination.index, 0, movedSection);
    
    // Actualizar el estado local inmediatamente para dar feedback visual
    setMenuSections(newSections);
    
    // Guardar el nuevo orden en Firestore
    saveNewOrder(newSections).catch(() => {
      // Si hay un error, restaurar el orden original
      setMenuSections(originalSections);
    });
  };

  // Manejador para cuando se guarda una sección
  const handleSectionSaved = (section, isNew) => {
    fetchMenuSections();
    showNotification('success', isNew ? 'Sección creada correctamente' : 'Sección actualizada correctamente');
  };

  // Manejador para cuando se guarda un producto
  const handleProductSaved = (product, isNew) => {
    fetchMenuSections();
    showNotification('success', isNew ? 'Producto agregado correctamente' : 'Producto actualizado correctamente');
  };

  // Función para formatear precio
  const formatPrice = (price) => {
    if (!price) return '$0';
    
    // Convertir a número y formatear con separador de miles
    const numPrice = parseFloat(price.toString().replace(/\D/g, ''));
    return `$${numPrice.toLocaleString('es-CL')}`;
  };

  // Función para mover una sección hacia arriba manualmente
  const moveSectionUp = (index) => {
    if (index <= 0) return; // Ya está en la parte superior
    
    // Guardar el orden anterior para poder restaurarlo en caso de error
    const originalSections = [...menuSections];
    
    // Crear una copia del array
    const newSections = [...menuSections];
    
    // Intercambiar la sección con la de arriba
    [newSections[index-1], newSections[index]] = [newSections[index], newSections[index-1]];
    
    // Actualizar el estado local inmediatamente
    setMenuSections(newSections);
    
    // Guardar el nuevo orden en Firestore
    saveNewOrder(newSections).catch(() => {
      // Si hay error, restaurar el orden original
      setMenuSections(originalSections);
    });
  };
  
  // Función para mover una sección hacia abajo manualmente
  const moveSectionDown = (index) => {
    if (index >= menuSections.length - 1) return; // Ya está en la parte inferior
    
    // Guardar el orden anterior para poder restaurarlo en caso de error
    const originalSections = [...menuSections];
    
    // Crear una copia del array
    const newSections = [...menuSections];
    
    // Intercambiar la sección con la de abajo
    [newSections[index], newSections[index+1]] = [newSections[index+1], newSections[index]];
    
    // Actualizar el estado local inmediatamente
    setMenuSections(newSections);
    
    // Guardar el nuevo orden en Firestore
    saveNewOrder(newSections).catch(() => {
      // Si hay error, restaurar el orden original
      setMenuSections(originalSections);
    });
  };

  // Función para verificar si una sección está bloqueada según el horario
  const isSectionBlocked = (section) => {
    if (!section.horarios) return false;
    
    // Si la sección está configurada como "siempre disponible", nunca se bloquea
    if (section.horarios.siempreDisponible) return false;
    
    const now = currentDateTime;
    const currentDay = now.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;
    
    // Buscar la configuración del día actual
    const dayConfig = section.horarios.horarios?.find(h => h.dia === currentDay);
    
    // Si no hay configuración para hoy o el día está inactivo, la sección está bloqueada
    if (!dayConfig || !dayConfig.activo) return true;
    
    // Convertir horarios de inicio y fin a minutos
    const [startHour, startMinute] = dayConfig.inicio.split(':').map(Number);
    const [endHour, endMinute] = dayConfig.fin.split(':').map(Number);
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    // Verificar si la hora actual está dentro del rango de disponibilidad
    return currentTimeInMinutes < startTimeInMinutes || currentTimeInMinutes > endTimeInMinutes;
  };

  // Función para formatear el nombre del día - Movida fuera de renderHorarioTab para uso global
  const formatDayName = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  // Función para mostrar información sobre los horarios de bloqueo
  const getBlockingInfo = (section) => {
    if (!section.horarios) return "No hay configuración de horarios";
    if (section.horarios.siempreDisponible) return "Siempre disponible";
    
    // Buscar los días que tienen horarios configurados
    const daysInfo = section.horarios.horarios?.map(dayConfig => {
      if (!dayConfig.activo) return `${formatDayName(dayConfig.dia)}: Inactivo`;
      return `${formatDayName(dayConfig.dia)}: ${dayConfig.inicio} a ${dayConfig.fin}`;
    }).join(", ");
    
    return `Disponible: ${daysInfo}`;
  };

  // Renderizado optimizado con React.memo para la lista de secciones
  const SectionList = React.memo(({ sections }) => {
    return (
      <>
        {sections.map((section, index) => {
          const isBlocked = isSectionBlocked(section);
          
          return (
            <div 
              key={section.id} 
              className={`bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 w-full ${
                isBlocked ? 'opacity-75' : ''
              }`}
            >
              <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center">
                <div className="flex items-center mr-3">
                  <div className="flex flex-col">
                    <button 
                      onClick={() => moveSectionUp(index)}
                      disabled={index === 0}
                      className={`p-1 text-xs ${index === 0 ? 'text-gray-300 cursor-default' : 'text-amber-600 hover:bg-amber-100 rounded'}`}
                      title="Mover arriba"
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <button 
                      onClick={() => moveSectionDown(index)}
                      disabled={index === sections.length - 1}
                      className={`p-1 text-xs ${index === sections.length - 1 ? 'text-gray-300 cursor-default' : 'text-amber-600 hover:bg-amber-100 rounded'}`}
                      title="Mover abajo"
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="font-semibold text-lg text-gray-800">{section.name}</h4>
                    {isBlocked && (
                      <div className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full flex items-center">
                        <FontAwesomeIcon icon={faLock} className="mr-1" />
                        <span>Bloqueada</span>
                      </div>
                    )}
                    {!isBlocked && section.horarios && !section.horarios.siempreDisponible && (
                      <div className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                        <FontAwesomeIcon icon={faUnlock} className="mr-1" />
                        <span>Disponible</span>
                      </div>
                    )}
                  </div>
                  {section.description && (
                    <p className="text-sm text-gray-600">{section.description}</p>
                  )}
                  {section.horarios && (
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <FontAwesomeIcon icon={faClock} className="mr-1" />
                      <div className="tooltip">
                        <span>Horarios configurados</span>
                        <div className="tooltip-text">
                          {getBlockingInfo(section)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex">
                  <button 
                    onClick={() => openEditSectionModal(section)}
                    className="p-2 text-amber-600 hover:text-amber-800"
                    title="Editar sección"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button 
                    onClick={() => openDeleteSectionModal(section)}
                    className="p-2 text-red-600 hover:text-red-800"
                    title="Eliminar sección"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-sm font-medium text-gray-500">
                    {section.products?.length || 0} productos
                  </h5>
                  <button 
                    onClick={() => openProductModal(section)}
                    className={`px-3 py-1.5 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200 transition-colors inline-flex items-center ${
                      isBlocked ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={isBlocked}
                    title={isBlocked ? "Esta sección está bloqueada actualmente" : "Añadir producto"}
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-1.5 text-xs" />
                    Añadir Producto
                  </button>
                </div>
                
                {/* Lista de productos */}
                <ul className="space-y-3">
                  {!section.products || section.products.length === 0 ? (
                    <li className="text-center p-3 bg-gray-50 rounded-md text-gray-500 text-sm">
                      Sin productos en esta sección
                    </li>
                  ) : (
                    section.products.map(product => (
                      <li 
                        key={product.id} 
                        className={`p-3 bg-gray-50 rounded-md flex justify-between items-start hover:bg-gray-100 transition-colors ${
                          isBlocked ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h6 className="font-medium text-gray-800">{product.nombre || product.name}</h6>
                            <span className="font-semibold text-amber-700">
                              {formatPrice(product.precio || product.price)}
                            </span>
                          </div>
                          {(product.descripcion || product.description) && (
                            <p className="text-sm text-gray-600 mt-1">{product.descripcion || product.description}</p>
                          )}
                          {isBlocked && (
                            <div className="mt-1 text-xs text-red-600">
                              <FontAwesomeIcon icon={faLock} className="mr-1" />
                              No disponible
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4 flex">
                          <button 
                            onClick={() => openEditProductModal(section, product)}
                            className="p-1.5 text-amber-600 hover:text-amber-800"
                            title="Editar producto"
                          >
                            <FontAwesomeIcon icon={faPencil} className="text-xs" />
                          </button>
                          <button 
                            onClick={() => openDeleteProductModal(section, product)}
                            className="p-1.5 text-red-600 hover:text-red-800"
                            title="Eliminar producto"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
                
                {isBlocked && (
                  <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <FontAwesomeIcon icon={faQuestionCircle} className="text-red-500 mr-2" />
                      <p className="text-sm text-red-700">
                        Esta sección está actualmente bloqueada según el horario configurado.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  });

  // Función para renderizar la pestaña de Menú
  const renderMenuTab = () => {
    return (
      <div className="animate-fadeIn w-full">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faUtensils} className="mr-3 text-amber-600" />
            Gestión del Menú
          </h2>
          <p className="text-gray-600">
            Administra las secciones y productos de tu menú. Organiza tus platos, bebidas y otros productos
            en categorías para facilitar su gestión y visualización.
          </p>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Secciones del Menú</h3>
          <button 
            onClick={openSectionModal}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Nueva Sección
          </button>
        </div>
        
        {/* Estado de carga */}
        {loading && (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            <span className="ml-2 text-gray-600">Cargando datos...</span>
          </div>
        )}
        
        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center mb-6">
            <p className="text-red-600">{error}</p>
            <button 
              className="mt-2 px-4 py-1 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200"
              onClick={fetchMenuSections}
            >
              Intentar nuevamente
            </button>
          </div>
        )}
        
        {/* Grid de secciones */}
        {!loading && !error && menuSections.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <FontAwesomeIcon icon={faList} className="text-gray-400 text-4xl mb-3" />
            <p className="text-gray-500 mb-4">No has creado ninguna sección en tu menú</p>
            <button 
              onClick={openSectionModal}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Crear Primera Sección
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mb-6 relative">
            {reordering && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-amber-600 mr-3 text-xl" />
                  <p className="text-gray-700">Guardando nuevo orden...</p>
                </div>
              </div>
            )}
            
            {/* Reemplazar DragDropContext con el componente optimizado */}
            {!loading && menuSections.length > 0 && (
              <div className="flex flex-col gap-6">
                <SectionList sections={menuSections} />
              </div>
            )}
          </div>
        )}
        
        {/* Modales */}
        <SectionFormModal 
          isOpen={isSectionModalOpen} 
          onClose={closeSectionModal} 
          onSaveSections={handleSectionSaved} 
          editingSection={editingSection}
        />
        
        <ProductFormModal 
          isOpen={isProductModalOpen} 
          onClose={closeProductModal} 
          onSaveProduct={handleProductSaved} 
          editingProduct={editingProduct}
          section={currentSection}
        />
        
        <DeleteSectionModal 
          isOpen={isDeleteSectionModalOpen} 
          onClose={closeDeleteSectionModal} 
          onConfirm={handleDeleteSection}
          section={sectionToDelete}
        />
        
        <MenuDeleteProductModal 
          isOpen={isDeleteProductModalOpen} 
          onClose={closeDeleteProductModal} 
          onConfirm={handleDeleteProduct}
          section={currentSection}
          product={productToDelete}
        />
      </div>
    );
  };

  // Función para renderizar la pestaña de Horario
  const renderHorarioTab = () => {
    // Ya no declaramos los estados aquí, sino que usamos los que ya definimos arriba
    // Y ELIMINAMOS el useEffect que estaba aquí, ya lo movimos arriba
  
    // Función para guardar los horarios en Firestore
    const saveSchedules = async () => {
      setSavingSchedules(true);
      
      try {
        const batch = writeBatch(db);
        
        // Iterar por cada sección y guardar sus horarios
        for (const [sectionId, schedule] of Object.entries(tempSchedules)) {
          const sectionRef = doc(db, 'menuSecciones', sectionId);
          batch.update(sectionRef, { horarios: schedule });
        }
        
        await batch.commit();
        setSectionSchedules(tempSchedules);
        setIsEditing(false);
        showNotification('success', 'Horarios guardados correctamente');
      } catch (error) {
        console.error('Error al guardar horarios:', error);
        showNotification('error', 'Error al guardar los horarios: ' + error.message);
      } finally {
        setSavingSchedules(false);
      }
    };
  
    // ...rest of the function remains unchanged...
    // Función para actualizar un horario específico
    const updateSchedule = (sectionId, dayIndex, field, value) => {
      setTempSchedules(prev => {
        const newSchedules = {...prev};
        if (newSchedules[sectionId]) {
          const newHorarios = [...newSchedules[sectionId].horarios];
          newHorarios[dayIndex] = {
            ...newHorarios[dayIndex],
            [field]: value
          };
          
          newSchedules[sectionId] = {
            ...newSchedules[sectionId],
            horarios: newHorarios
          };
        }
        return newSchedules;
      });
    };
  
    // Función para actualizar el estado "siempreDisponible"
    const toggleAlwaysAvailable = (sectionId, value) => {
      setTempSchedules(prev => {
        const newSchedules = {...prev};
        if (newSchedules[sectionId]) {
          newSchedules[sectionId] = {
            ...newSchedules[sectionId],
            siempreDisponible: value
          };
        }
        return newSchedules;
      });
    };
  
    // Función para activar/desactivar un día
    const toggleDayActive = (sectionId, dayIndex, value) => {
      updateSchedule(sectionId, dayIndex, 'activo', value);
    };
  
    // Iniciar edición
    const startEditing = () => {
      setTempSchedules(sectionSchedules);
      setIsEditing(true);
    };
  
    // Cancelar edición
    const cancelEditing = () => {
      setTempSchedules(sectionSchedules);
      setIsEditing(false);
    };
  
    // Traducir los días de semana para mostrar en orden adecuado
    const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  
    return (
      <div className="animate-fadeIn w-full">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faClock} className="mr-3 text-amber-600" />
            Horarios de Disponibilidad
          </h2>
          <p className="text-gray-600">
            Configura los horarios en que cada sección del menú estará disponible para ordenar. 
            Las secciones fuera de su horario se marcarán como no disponibles junto con todos sus productos.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            <span className="ml-2 text-gray-600">Cargando datos...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center mb-6">
            <p className="text-red-600">{error}</p>
            <button 
              className="mt-2 px-4 py-1 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200"
              onClick={fetchMenuSections}
            >
              Intentar nuevamente
            </button>
          </div>
        ) : menuSections.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <FontAwesomeIcon icon={faList} className="text-gray-400 text-4xl mb-3" />
            <p className="text-gray-500 mb-4">No hay secciones en tu menú para configurar horarios</p>
            <button 
              onClick={() => setActiveTab('menu')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors inline-flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              Ir a crear secciones
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Configuración de Horarios por Sección</h3>
              
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors inline-flex items-center"
                      disabled={savingSchedules}
                    >
                      <FontAwesomeIcon icon={faTimes} className="mr-1.5 text-xs" />
                      Cancelar
                    </button>
                    <button
                      onClick={saveSchedules}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors inline-flex items-center"
                      disabled={savingSchedules}
                    >
                      {savingSchedules ? (
                        <FontAwesomeIcon icon={faSpinner} className="mr-1.5 text-xs animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faSave} className="mr-1.5 text-xs" />
                      )}
                      {savingSchedules ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditing}
                    className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition-colors inline-flex items-center"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-1.5 text-xs" />
                    Editar horarios
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              {menuSections.map((section) => {
                const schedule = isEditing 
                  ? tempSchedules[section.id] 
                  : sectionSchedules[section.id];
                  
                if (!schedule) return null;
                
                return (
                  <div key={section.id} className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
                    <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg text-gray-800">{section.name}</h4>
                        {section.description && (
                          <p className="text-sm text-gray-600">{section.description}</p>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="flex items-center ml-4">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-700 mr-2">Siempre disponible:</span>
                            <button
                              type="button"
                              onClick={() => toggleAlwaysAvailable(section.id, !schedule.siempreDisponible)}
                              className={`text-2xl focus:outline-none ${schedule.siempreDisponible ? 'text-green-500' : 'text-gray-400'}`}
                              disabled={!isEditing}
                              title={schedule.siempreDisponible ? "Desactivar disponibilidad permanente" : "Activar disponibilidad permanente"}
                            >
                              <FontAwesomeIcon icon={schedule.siempreDisponible ? faToggleOn : faToggleOff} />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {!isEditing && (
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          schedule.siempreDisponible ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {schedule.siempreDisponible ? 'Siempre disponible' : 'Disponible según horario'}
                        </div>
                      )}
                    </div>
  
                    {(!schedule.siempreDisponible || isEditing) && (
                      <div className="p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Horarios de disponibilidad</h5>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Día
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Estado
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Hora inicio
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Hora fin
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {diasSemana.map((dia, index) => {
                                const daySchedule = schedule.horarios.find(h => h.dia === dia) || 
                                  { dia, inicio: '08:00', fin: '22:00', activo: true };
                                
                                return (
                                  <tr key={dia} className={!daySchedule.activo ? 'bg-gray-50' : ''}>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="font-medium text-gray-900">
                                        {formatDayName(dia)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {isEditing ? (
                                        <button
                                          onClick={() => toggleDayActive(section.id, index, !daySchedule.activo)}
                                          className={`text-2xl focus:outline-none ${daySchedule.activo ? 'text-green-500' : 'text-gray-400'}`}
                                          title={daySchedule.activo ? "Desactivar día" : "Activar día"}
                                        >
                                          <FontAwesomeIcon icon={daySchedule.activo ? faToggleOn : faToggleOff} />
                                        </button>
                                      ) : (
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                          daySchedule.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {daySchedule.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {isEditing ? (
                                        <input
                                          type="time"
                                          value={daySchedule.inicio}
                                          onChange={(e) => updateSchedule(section.id, index, 'inicio', e.target.value)}
                                          className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                          disabled={!daySchedule.activo || schedule.siempreDisponible}
                                        />
                                      ) : (
                                        <span className="text-sm text-gray-700">
                                          {daySchedule.inicio}
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      {isEditing ? (
                                        <input
                                          type="time"
                                          value={daySchedule.fin}
                                          onChange={(e) => updateSchedule(section.id, index, 'fin', e.target.value)}
                                          className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                                          disabled={!daySchedule.activo || schedule.siempreDisponible}
                                        />
                                      ) : (
                                        <span className="text-sm text-gray-700">
                                          {daySchedule.fin}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        
                        {isEditing && schedule.siempreDisponible && (
                          <div className="mt-3 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                            Esta sección está configurada como "siempre disponible". Para editar horarios específicos, desactiva esta opción primero.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Función simplificada para renderizar la pestaña de Horario
  const renderHorarioTabOld = () => {
    return (
      <div className="animate-fadeIn w-full">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FontAwesomeIcon icon={faClock} className="mr-3 text-amber-600" />
            Horario de Atención
          </h2>
          <p className="text-gray-600">
            Configura los horarios de apertura y cierre de tu restaurante para cada día de la semana.
            Estos horarios se mostrarán a tus clientes y se utilizarán para verificar la disponibilidad de reservas.
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-10 text-center">
          <div className="mb-6">
            <FontAwesomeIcon icon={faClock} className="text-amber-500 text-5xl mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">¡Próximamente!</h3>
            <p className="text-gray-600 max-w-lg mx-auto">
              Estamos trabajando para implementar la gestión de horarios de tu restaurante. 
              Pronto podrás configurar los horarios de apertura y cierre para cada día de la semana, 
              así como establecer horarios especiales para fechas importantes.
            </p>
          </div>
          
          <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200 inline-block">
            <div className="flex items-center justify-center text-amber-700">
              <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 mr-2" />
              <span className="font-medium">Esta sección está en desarrollo</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Función para renderizar el contenido según la pestaña activa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'menu':
        return renderMenuTab();
      case 'horario':
        return renderHorarioTab();
      default:
        return renderMenuTab();
    }
  };

  return (
    <Layout>
      <div className="pb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Gestión de Menú y Horarios</h1>
        <p className="text-gray-600 mb-6">
          Administra los productos de tu menú y configura los horarios de atención del restaurante
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
        
        {/* Notification component */}
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

export default Menu;
