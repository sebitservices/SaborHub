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
  faUser,
  faFireFlameCurved,
  faChevronDown,
  faChair
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import logoHorizontal from '../../assets/images/saborhub-horizontal.webp';
import logoSquare from '../../assets/images/saborhub.webp';

const Sidebar = ({ isExpanded, toggleExpanded }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { currentUser } = useAuth();
  const [userPermisos, setUserPermisos] = useState(null);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
  
  // Obtener permisos del usuario al cargar el componente
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
    if (!isExpanded) {
      setActiveDropdown(null);
    }
  }, [isExpanded]);

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
    if (!isExpanded) {
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

  // Función para manejar la navegación
  const handleNavigation = (e, href) => {
    e.preventDefault();
    navigate(href);
  };

  // Función para verificar si el usuario tiene acceso a cierta sección
  const hasPermission = (section) => {
    if (!userPermisos) return false;
    
    // Normalizar el nombre de la sección
    const normalizedSection = section.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
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
    : navigation;

  // Renderizado del contenido del sidebar
  const renderSidebarContent = () => {
    // Si estamos cargando permisos, mostrar un loader
    if (loadingPermisos) {
      return (
        <div className="flex-1 py-4 flex items-center justify-center">
          <div className="text-amber-500 animate-pulse">
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
              {item.submenu ? (
                <div>
                  <button
                    className={`
                      w-full flex items-center
                      ${isExpanded ? 'justify-between px-3' : 'justify-center'} 
                      p-2.5 rounded-lg text-base font-medium 
                      transition-all duration-300 ease-in-out
                      hover:bg-teal-50 
                      ${activeDropdown === index ? 'bg-teal-50 text-teal-600' : 'text-gray-600'}
                    `}
                    onClick={() => toggleDropdown(index)}
                  >
                    <div className={`
                      flex items-center
                      ${isExpanded ? 'w-full' : 'w-10 h-10'}
                      transition-all duration-300 ease-in-out
                    `}>
                      <div className={`
                        flex items-center justify-center
                        ${isExpanded ? 'mr-3 w-5' : 'w-10'}
                        transition-all duration-300 ease-in-out
                      `}>
                        <FontAwesomeIcon 
                          icon={item.icon} 
                          className={`
                            h-5 w-5 transition-colors duration-300
                            ${activeDropdown === index ? 'text-teal-600' : 'text-teal-500'}
                            group-hover:text-teal-600
                          `}
                          fixedWidth
                        />
                      </div>
                      {isExpanded && (
                        <span className="transition-all duration-300 ease-in-out whitespace-nowrap">
                          {item.name}
                        </span>
                      )}
                    </div>
                    
                    {isExpanded && (
                      <FontAwesomeIcon
                        icon={activeDropdown === index ? faChevronDown : faChevronRight}
                        className={`
                          ml-2 h-3 w-3 text-teal-500 
                          transform transition-all duration-300 ease-in-out
                          ${activeDropdown === index ? 'rotate-180' : ''}
                        `}
                        fixedWidth
                      />
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {isExpanded && activeDropdown === index && (
                    <ul className="mt-1 mb-2 space-y-1 pl-10 overflow-hidden transition-all duration-300 ease-in-out">
                      {item.submenuItems.map((subItem) => (
                        <li key={subItem.name}>
                          <a
                            href={subItem.href}
                            onClick={(e) => handleNavigation(e, subItem.href)}
                            className={`
                              block p-2 text-sm font-medium rounded-md 
                              transition-all duration-300 ease-in-out
                              ${isActive(subItem.href) 
                                ? 'bg-teal-500 text-white' 
                                : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'
                              }
                            `}
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
                  className={`
                    flex items-center
                    ${isExpanded ? 'px-3' : 'justify-center'} 
                    p-2.5 rounded-lg text-base font-medium 
                    transition-all duration-300 ease-in-out relative group
                    ${isActive(item.href) 
                      ? 'bg-teal-500 text-white' 
                      : 'text-gray-600 hover:bg-teal-50 hover:text-teal-600'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center
                    ${isExpanded ? 'mr-3 w-5' : 'w-10'}
                    transition-all duration-300 ease-in-out
                  `}>
                    <FontAwesomeIcon 
                      icon={item.icon} 
                      className={`
                        h-5 w-5 transition-colors duration-300
                        ${isActive(item.href) ? 'text-white' : 'text-teal-500 group-hover:text-teal-600'}
                      `}
                      fixedWidth
                    />
                  </div>
                  {isExpanded && (
                    <span className="transition-all duration-300 ease-in-out whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                  
                  {/* Tooltip para modo colapsado */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-6 -translate-y-1/2 top-1/2 w-auto p-2 min-w-max rounded-md shadow-lg text-white bg-gray-800 text-xs font-bold transition-all duration-300 ease-in-out origin-left opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 z-50">
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
    <div 
      className={`
        fixed inset-y-0 left-0 transition-all duration-300 ease-in-out z-20
        ${isExpanded ? 'w-64' : 'w-20'}
        bg-white text-gray-700 h-full flex flex-col shadow-xl
        hidden md:flex
      `}
    >
      {/* Sidebar header */}
      <div className={`
        flex items-center justify-between h-20 
        ${isExpanded ? 'px-4' : 'px-2'} 
        bg-gradient-to-r from-teal-500 to-teal-600
        border-b border-teal-400/20
      `}>
        <Link to="/dashboard" className="flex-1 flex items-center justify-center">
          <div className="relative w-full h-16 flex items-center justify-center">
            <img 
              src={logoHorizontal} 
              alt="SaborHub" 
              className={`
                absolute transition-all duration-300 ease-in-out transform
                ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
                h-16 w-auto object-contain max-w-[200px]
              `}
            />
            <div className={`
              absolute transition-all duration-300 ease-in-out transform
              ${isExpanded ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
            `}>
              <img 
                src={logoSquare} 
                alt="SaborHub" 
                className="h-16 w-16 object-contain p-1"
              />
            </div>
          </div>
        </Link>
        
        {/* Botón para colapsar/expandir */}
        <button 
          onClick={() => toggleExpanded(!isExpanded)} 
          className="absolute -right-3 top-1/2 -translate-y-1/2 bg-teal-500 hover:bg-teal-600 text-white p-1.5 rounded-r-lg shadow-lg transition-all duration-300"
        >
          <FontAwesomeIcon 
            icon={isExpanded ? faChevronLeft : faChevronRight} 
            className="h-4 w-4 transition-transform duration-300"
          />
        </button>
      </div>

      {/* Sidebar content */}
      {renderSidebarContent()}

      {/* User profile section */}
      <div className={`p-4 border-t border-gray-200 ${isExpanded ? '' : 'flex justify-center'}`}>
        <div className={`
          flex items-center ${isExpanded ? '' : 'justify-center'} 
          p-2 rounded-lg text-base font-medium 
          text-gray-600 hover:bg-teal-50 
          transition-all duration-300 ease-in-out
        `}>
          <div className={`
            min-w-[32px] h-8 rounded-lg 
            bg-gradient-to-br from-teal-500 to-teal-600 
            flex items-center justify-center 
            ${isExpanded ? 'mr-3' : ''}
            transition-all duration-300 ease-in-out
          `}>
            <span className="text-white text-sm font-semibold">{getUserInitials()}</span>
          </div>
          {isExpanded && (
            <div className="transition-all duration-300 ease-in-out whitespace-nowrap">
              <p className="text-sm font-medium text-gray-700">{getDisplayName()}</p>
              <p className="text-xs text-gray-500">{currentUser?.email || 'Invitado'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;