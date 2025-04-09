import { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faSearch, faBell, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ toggleSidebar, sidebarOpen, isMobile, isExpanded }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationsRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const notifications = [
    {
      id: 1,
      title: 'Nuevo pedido #1023',
      message: 'Mesa 5 ha realizado un nuevo pedido',
      time: '5 min',
      read: false
    },
    {
      id: 2,
      title: 'Inventario bajo',
      message: 'El producto "Pollo a la parrilla" está por agotarse',
      time: '10 min',
      read: true
    },
    {
      id: 3,
      title: 'Reserva confirmada',
      message: 'Nueva reserva para 8 personas a las 20:00',
      time: '1 hora',
      read: true
    }
  ];

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

  const getDisplayName = () => {
    if (!currentUser) return 'Usuario';
    
    return currentUser.displayName || currentUser.email.split('@')[0];
  };

  return (
    <nav className={`
      fixed top-0 transition-all duration-300 bg-white/80 backdrop-blur-md shadow-lg border-b border-emerald-100 z-30
      ${isMobile ? 'left-0 right-0' : isExpanded ? 'left-64 right-0' : 'left-20 right-0'}
    `}>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Botón del menú móvil */}
            {isMobile && (
              <button 
                onClick={() => toggleSidebar(!sidebarOpen)} 
                aria-label="Toggle sidebar"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-emerald-500 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <FontAwesomeIcon icon={faBars} className="h-6 w-6" />
              </button>
            )}

            {/* Barra de búsqueda */}
            <div className="hidden md:block ml-4">
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="h-5 w-5 text-emerald-400" />
                  </div>
                  <input
                    className="pl-10 px-4 py-2 bg-gray-50 border border-emerald-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-64 text-gray-600 placeholder-gray-400"
                    type="text"
                    placeholder="Buscar..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resto de la navbar (notificaciones y perfil) */}
          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <div className="relative" ref={notificationsRef}>
              <button
                className="p-2 rounded-lg text-gray-600 hover:text-emerald-500 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 relative transition-all duration-300"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <FontAwesomeIcon icon={faBell} className="h-6 w-6" />
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>

              {/* Dropdown de notificaciones */}
              {isNotificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-emerald-100">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <div className="px-4 py-2 border-b border-emerald-100">
                      <h3 className="text-sm font-medium text-gray-700">Notificaciones</h3>
                    </div>
                    {notifications.map((notification) => (
                      <div key={notification.id} className="px-4 py-3 hover:bg-emerald-50 border-b border-emerald-100 transition-colors duration-200">
                        <p className="text-sm font-medium text-gray-700">{notification.title}</p>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-emerald-500 mt-1">{notification.time}</p>
                      </div>
                    ))}
                    <div className="px-4 py-2 text-center">
                      <button className="text-sm font-medium text-emerald-500 hover:text-emerald-600 transition-colors duration-200">
                        Ver todas
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Perfil */}
            <div className="relative ml-3" ref={profileRef}>
              <div>
                <button
                  className="flex items-center text-sm rounded-lg p-1 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg">
                    {getUserInitials()}
                  </div>
                </button>
              </div>

              {/* Dropdown de perfil simplificado */}
              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-emerald-100">
                  <div className="py-1">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-emerald-100">
                      <p className="text-sm font-medium text-gray-700">{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Usuario'}</p>
                      {currentUser?.email && <p className="text-xs text-emerald-500 truncate">{currentUser.email}</p>}
                    </div>
                    
                    {/* Solo opción de cerrar sesión */}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-emerald-50 flex items-center transition-colors duration-200"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="h-4 w-4 mr-2 text-emerald-500" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
