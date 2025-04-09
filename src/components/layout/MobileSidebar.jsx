import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThLarge, 
  faClipboardList, 
  faBoxOpen, 
  faUtensils, 
  faChartBar, 
  faCog, 
  faTimes,
  faUser,
  faFireFlameCurved,
  faChevronDown,
  faChevronRight,
  faChair,
  faBars,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import logoHorizontal from '../../assets/images/saborhub-horizontal.webp';

const MobileSidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { currentUser } = useAuth();
  const [userPermisos, setUserPermisos] = useState(null);
  const [loadingPermisos, setLoadingPermisos] = useState(true);
  const sidebarRef = useRef(null);
  
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
            setUserPermisos({
              rolAdmin: false,
              ...userData.permisos || {},
              configuracion: userData.permisos?.configuracion || false,
              dashboard: userData.permisos?.dashboard || false
            });
          }
        } else {
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
  
  // Detectar clics fuera del sidebar para cerrarlo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        toggleSidebar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, toggleSidebar]);

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
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/') {
      return true;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Función para obtener iniciales del usuario
  const getUserInitials = () => {
    if (!currentUser) return 'U';
    
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

  // Función para manejar la navegación y cerrar el sidebar
  const handleNavigation = (e, href) => {
    e.preventDefault();
    navigate(href);
    toggleSidebar(false);
  };
  
  // Función para cerrar sesión
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      toggleSidebar(false);
      navigate('/');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Función para verificar si el usuario tiene acceso a cierta sección
  const hasPermission = (section) => {
    if (!userPermisos) return false;
    
    const normalizedSection = section.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    if (userPermisos.rolAdmin) return true;
    
    if (normalizedSection in userPermisos) {
      return userPermisos[normalizedSection];
    }
    
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
        
        if (userPermisos.rolAdmin) return true;
        
        if (item.submenu && sectionName === 'reportes') {
          return userPermisos.reportes;
        }
        
        if (sectionName === 'configuración') {
          return userPermisos.configuracion;
        }
        
        return hasPermission(sectionName);
      })
    : navigation;
  
  // Prevenir scroll del body cuando el sidebar está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cerrar el sidebar si cambia la ruta
  useEffect(() => {
    toggleSidebar(false);
  }, [location.pathname]);

  return (
    <>
      {/* Botón de hamburguesa - visible solo en móvil */}
      <button 
        onClick={() => toggleSidebar(!isOpen)} 
        className={`
          fixed top-3 left-3 z-40 p-2.5 rounded-full transition-all duration-300
          md:hidden
          bg-white text-emerald-600 shadow-lg hover:bg-emerald-50
          active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500
        `}
        aria-label="Menú"
      >
        <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
      </button>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => toggleSidebar(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] 
          bg-gradient-to-br from-emerald-500 to-teal-600
          transform transition-transform duration-300 ease-out
          md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col h-full
        `}
      >
        {/* Header con logo */}
        <div className="flex items-center justify-between px-6 h-24 bg-white/10 backdrop-blur-sm">
          <Link 
            to="/dashboard" 
            className="flex-1 flex items-center justify-center py-4"
            onClick={() => toggleSidebar(false)}
          >
            <img 
              src={logoHorizontal} 
              alt="SaborHub" 
              className="h-16 w-auto object-contain"
            />
          </Link>
          
          <button 
            onClick={() => toggleSidebar(false)} 
            className="absolute right-4 top-6 p-2.5 rounded-full text-white/90 hover:bg-white/20 active:bg-white/30 transition-colors"
            aria-label="Cerrar menú"
          >
            <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido del Sidebar */}
        <div className="flex-1 overflow-y-auto">
          {loadingPermisos ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
            <nav className="p-4">
              <ul className="space-y-1">
                {(userPermisos ? filteredNavigation : []).map((item, index) => (
                  <li key={item.name}>
                    {item.submenu ? (
                      <div className="mb-1">
                        <button
                          className={`
                            w-full flex items-center justify-between p-3 rounded-lg 
                            text-base font-medium transition-colors
                            ${activeDropdown === index 
                              ? 'bg-white/20 text-white' 
                              : 'text-white/90 hover:bg-white/10'
                            }
                          `}
                          onClick={() => toggleDropdown(index)}
                        >
                          <div className="flex items-center">
                            <span className="mr-3 text-white/90">
                              <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                            </span>
                            <span>{item.name}</span>
                          </div>
                          <FontAwesomeIcon
                            icon={faChevronDown}
                            className={`
                              h-4 w-4 text-white/70 transition-transform duration-200
                              ${activeDropdown === index ? 'rotate-180' : ''}
                            `}
                          />
                        </button>
                        
                        {activeDropdown === index && (
                          <ul className="mt-1 ml-7 mb-2 space-y-1 border-l-2 border-white/20 pl-3">
                            {item.submenuItems.map((subItem) => (
                              <li key={subItem.name}>
                                <a
                                  href={subItem.href}
                                  onClick={(e) => handleNavigation(e, subItem.href)}
                                  className={`
                                    block p-3 text-sm font-medium rounded-md transition-colors
                                    ${isActive(subItem.href) 
                                      ? 'bg-white text-emerald-600' 
                                      : 'text-white/80 hover:bg-white/10'
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
                          flex items-center p-3 rounded-lg text-base font-medium 
                          transition-colors
                          ${isActive(item.href) 
                            ? 'bg-white text-emerald-600' 
                            : 'text-white/90 hover:bg-white/10'
                          }
                        `}
                      >
                        <span className={`mr-3 ${isActive(item.href) ? 'text-emerald-500' : 'text-white/90'}`}>
                          <FontAwesomeIcon icon={item.icon} className="h-5 w-5" />
                        </span>
                        <span>{item.name}</span>
                      </a>
                    )}
                  </li>
                ))}

                {/* Botón de cerrar sesión */}
                <li className="mt-6 pt-6 border-t border-white/20">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center p-3 rounded-lg text-base font-medium text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <span className="mr-3 text-white/80">
                      <FontAwesomeIcon icon={faSignOutAlt} className="h-5 w-5" />
                    </span>
                    <span>Cerrar sesión</span>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>

        {/* Sección de perfil de usuario */}
        <div className="border-t border-white/20 bg-white/10 backdrop-blur-sm p-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center mr-3">
              <span className="text-white font-medium">{getUserInitials()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{getDisplayName()}</p>
              <p className="text-xs text-white/70 truncate">{currentUser?.email || 'Invitado'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;
