import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThLarge, 
  faClipboardList, 
  faBoxOpen, 
  faUtensils, 
  faChartBar, 
  faCog, 
  faChevronLeft, 
  faChevronRight, 
  faTimes,
  faUser,
  faFireFlameCurved,
  faChevronDown,
  faChair
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const Sidebar = ({ isMobile, toggleSidebar, isExpanded, toggleExpanded, sidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { currentUser } = useAuth();
  const [userPermisos, setUserPermisos] = useState(null);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
  
  // Mejorado - Obtener permisos del usuario al cargar el componente
  useEffect(() => {
    const getUserPermisos = async () => {
      setLoadingPermisos(true);
      
      if (!currentUser) {
        setUserPermisos({
          rolAdmin: false,
          dashboard: false,
          mesas: false,
          pedidos: false,
          inventario: false,
          menu: false,
          reportes: false,
          configuracion: false
        });
        setLoadingPermisos(false);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'usuarios', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("Datos del usuario:", userData);
          
          // Si es administrador, tiene acceso a todo
          if (userData.rol?.toLowerCase() === 'administrador') {
            setUserPermisos({
              rolAdmin: true,
              dashboard: true,
              mesas: true,
              pedidos: true,
              inventario: true,
              menu: true,
              reportes: true,
              configuracion: true
            });
          } else {
            // Usar los permisos específicos asignados
            setUserPermisos({
              rolAdmin: false,
              ...userData.permisos || {},
              // Asegurar que estas propiedades existan
              configuracion: userData.permisos?.configuracion || false,
              dashboard: userData.permisos?.dashboard || false
            });
          }
        } else {
          // Usuario no encontrado en Firestore, asignar permisos mínimos
          setUserPermisos({
            rolAdmin: false,
            dashboard: true,
            mesas: false,
            pedidos: false,
            inventario: false,
            menu: false,
            reportes: false,
            configuracion: false
          });
        }
      } catch (error) {
        console.error("Error al obtener permisos:", error);
        // En caso de error, establecer permisos mínimos
        setUserPermisos({
          rolAdmin: false,
          dashboard: true,
          mesas: false,
          pedidos: false,
          inventario: false,
          menu: false,
          reportes: false,
          configuracion: false
        });
      } finally {
        setLoadingPermisos(false);
      }
    };

    getUserPermisos();
  }, [currentUser]);

  // Cerrar dropdowns cuando se colapsa el sidebar
  useEffect(() => {
    if (!isExpanded && !isMobile) {
      setActiveDropdown(null);
    }
  }, [isExpanded, isMobile]);

  const navigation = [
    { 
      name: 'Dashboard', 
      icon: faThLarge, 
      href: '/dashboard' 
    },
    { 
      name: 'Mesas', 
      icon: faChair, 
      href: '/mesas' 
    },
    { 
      name: 'Pedidos', 
      icon: faClipboardList, 
      href: '/pedidos' 
    },
    { 
      name: 'Inventario', 
      icon: faBoxOpen, 
      href: '/inventario' 
    },
    { 
      name: 'Menú', 
      icon: faUtensils, 
      href: '/menu'
    },
    {
      name: 'Reportes',
      icon: faChartBar,
      submenu: true,
      submenuItems: [
        { name: 'Ventas', href: '/reportes/ventas' },
        { name: 'Productos', href: '/reportes/productos' },
        { name: 'Clientes', href: '/reportes/clientes' }
      ]
    },
    { 
      name: 'Configuración', 
      icon: faCog, 
      href: '/configuracion' 
    },
  ];

  const toggleDropdown = (index) => {
    if (!isExpanded && !isMobile) {
      toggleExpanded(true);
      setActiveDropdown(index);
      return;
    }
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Función para obtener iniciales del usuario
  const getUserInitials = () => {
    if (!currentUser) return 'G';
    
    if (currentUser.displayName) {
      return currentUser.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    return currentUser.email ? currentUser.email[0].toUpperCase() : 'U';
  };

  // Función para obtener nombre a mostrar
  const getDisplayName = () => {
    if (!currentUser) return 'Usuario';
    
    return currentUser.displayName || currentUser.email.split('@')[0];
  };

  // Función para manejar la navegación con transición suave
  const handleNavigation = (e, href) => {
    e.preventDefault();
    
    if (isMobile) {
      toggleSidebar(false);
      setTimeout(() => {
        navigate(href);
      }, 300);
    } else {
      navigate(href);
    }
  };

  // Función para verificar si el usuario tiene acceso a cierta sección
  const hasPermission = (section) => {
    // Depuración para ver qué está pasando
    console.log("Verificando permiso para:", section);
    console.log("Permisos del usuario:", userPermisos);
    
    // Si no hay permisos, no mostrar nada
    if (!userPermisos) return false;
    
    // Normalizar el nombre de la sección (minúsculas y sin acento)
    const normalizedSection = section.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");  // Eliminar acentos
    
    // Si el usuario es administrador, siempre tiene acceso a todo
    if (userPermisos.rolAdmin) return true;
    
    // Acceso directo a una sección específica
    if (normalizedSection in userPermisos) {
      return userPermisos[normalizedSection];
    }
    
    // Casos especiales
    if (normalizedSection === "configuracion" && userPermisos.configuracion) {
      return true;
    }
    
    if (normalizedSection === "reportes" && userPermisos.reportes) {
      return true;
    }
    
    return false;
  };

  // Filtrar el menú de navegación según los permisos
  const filteredNavigation = userPermisos 
    ? navigation.filter(item => {
        const sectionName = item.name.toLowerCase();
        
        // Si es administrador, mostrar todo
        if (userPermisos.rolAdmin) return true;
        
        // Si es un submenu (como reportes)
        if (item.submenu && sectionName === 'reportes') {
          return userPermisos.reportes;
        }
        
        // Para configuración, verificación específica
        if (sectionName === 'configuración') {
          return userPermisos.configuracion;
        }
        
        // Para las demás secciones
        return hasPermission(sectionName);
      })
    : navigation; // Si no hay permisos cargados, mostrar menú completo (por seguridad)

  // Función mejorada para mostrar el contenido del sidebar
  const renderSidebarContent = () => {
    // Si estamos cargando permisos, mostrar un loader o nada
    if (loadingPermisos) {
      return (
        <div className="flex-1 py-4 flex items-center justify-center">
          <div className="text-amber-500 animate-pulse">
            {/* Puedes usar un spinner o simplemente texto */}
            <span className="sr-only">Cargando...</span>
          </div>
        </div>
      );
    }

    // Una vez cargados los permisos, mostrar el menú filtrado
    return (
      <div className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {(userPermisos ? filteredNavigation : []).map((item, index) => (
            <li key={item.name} className="group">
              {/* ...existing code... */}
              {item.submenu ? (
                <div>
                  <button
                    className={`w-full flex items-center justify-center ${isExpanded ? 'justify-between' : 'justify-center'} p-2.5 rounded-lg text-base font-medium transition-all duration-300 ease-in-out hover:bg-amber-600/20 ${
                      activeDropdown === index ? 'bg-amber-600/20 text-amber-300' : 'text-gray-300'
                    }`}
                    onClick={() => toggleDropdown(index)}
                  >
                    <div className="flex items-center">
                      <span className={`${isExpanded ? 'mr-3 w-5 text-center' : 'mx-auto'} text-amber-400 group-hover:text-amber-300`}>
                        <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                      </span>
                      {(isExpanded || isMobile) && (
                        <span className="transition-all duration-300 whitespace-nowrap">{item.name}</span>
                      )}
                    </div>
                    
                    {(isExpanded || isMobile) && (
                      <FontAwesomeIcon
                        icon={activeDropdown === index ? faChevronDown : faChevronRight}
                        className={`ml-auto h-3 w-3 text-amber-400 transform transition-transform duration-300 ${activeDropdown === index ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {(isExpanded || isMobile) && activeDropdown === index && (
                    <ul className="mt-1 mb-2 space-y-1 pl-10 overflow-hidden transition-all duration-300 ease-in-out">
                      {item.submenuItems.map((subItem) => (
                        <li key={subItem.name}>
                          <a
                            href={subItem.href}
                            onClick={(e) => handleNavigation(e, subItem.href)}
                            className={`block p-2 text-sm font-medium rounded-md transition-all duration-300 ease-in-out ${
                              isActive(subItem.href) 
                                ? 'bg-amber-600 text-white' 
                                : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {subItem.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <a
                  href={item.href}
                  onClick={(e) => handleNavigation(e, item.href)}
                  className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-2.5 rounded-lg text-base font-medium transition-all duration-300 ease-in-out relative group ${
                    isActive(item.href) 
                      ? 'bg-amber-600 text-white' 
                      : 'text-gray-300 hover:bg-amber-600/20 hover:text-white'
                  }`}
                >
                  <span className={`${isExpanded ? 'mr-3 w-5 text-center' : 'mx-auto'} ${isActive(item.href) ? 'text-white' : 'text-amber-400 group-hover:text-amber-300'}`}>
                    <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                  </span>
                  {(isExpanded || isMobile) && (
                    <span className="transition-all duration-300 whitespace-nowrap">{item.name}</span>
                  )}
                  
                  {/* Tooltip */}
                  {!isExpanded && !isMobile && (
                    <div className="absolute left-full ml-6 -translate-y-1/2 top-1/2 w-auto p-2 min-w-max rounded-md shadow-lg text-white bg-slate-800 text-xs font-bold transition-all duration-300 origin-left opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 z-50">
                      {item.name}
                    </div>
                  )}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <>
      {/* Overlay para pantalla móvil */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-500"
          onClick={() => toggleSidebar(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-all duration-500 ease-in-out' : 'fixed inset-y-0 left-0 transition-all duration-500 ease-in-out'} 
          ${isMobile && !sidebarOpen ? '-translate-x-full opacity-0' : isMobile && sidebarOpen ? 'translate-x-0 opacity-100' : ''}
          ${isExpanded ? 'w-64' : 'w-20'}
          bg-gradient-to-b from-slate-800 to-slate-900 text-white h-full flex flex-col shadow-xl`}
      >
        {/* Sidebar header */}
        <div className={`flex items-center justify-between h-16 ${isExpanded ? 'px-6' : 'px-2'} bg-gradient-to-r from-amber-600 to-amber-700 border-b border-amber-700/50`}>
          <Link to="/dashboard" className="flex items-center space-x-3">
            <div className="min-w-[32px] h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <FontAwesomeIcon icon={faFireFlameCurved} className="h-4 w-4 text-white" />
            </div>
            {(isExpanded || isMobile) && (
              <span className="text-lg font-bold text-white transition-all duration-500 ease-in-out">
                SaborHub
              </span>
            )}
          </Link>
          
          {/* Botón para colapsar/expandir en desktop */}
          {!isMobile && (
            <button 
              onClick={() => toggleExpanded(!isExpanded)} 
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <FontAwesomeIcon 
                icon={isExpanded ? faChevronLeft : faChevronRight} 
                className="h-4 w-4 transition-transform duration-500"
              />
            </button>
          )}
          
          {/* Botón para cerrar en móvil */}
          {isMobile && sidebarOpen && (
            <button 
              onClick={() => toggleSidebar(false)} 
              className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300"
            >
              <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sidebar content - reemplazar con el contenido renderizado */}
        {renderSidebarContent()}

        {/* User profile section */}
        <div className={`p-4 border-t border-slate-700 ${isExpanded ? '' : 'flex justify-center'}`}>
          <div className={`flex items-center ${isExpanded ? '' : 'justify-center'} p-2 rounded-lg text-base font-medium text-gray-300 hover:bg-amber-600/20 hover:text-white transition-all duration-300 ease-in-out`}>
            <div className={`min-w-[32px] h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center ${isExpanded ? 'mr-3' : ''}`}>
              <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
            </div>
            {(isExpanded || isMobile) && (
              <div className="transition-all duration-500 whitespace-nowrap">
                <p className="text-sm font-medium">{getDisplayName()}</p>
                <p className="text-xs text-gray-400">{currentUser?.email || 'Invitado'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
