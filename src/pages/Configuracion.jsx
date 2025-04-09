import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCog, 
  faUsers, 
  faUtensils, 
  faPlus, 
  faEdit, 
  faTrash, 
  faUserShield, 
  faUser,
  faSpinner 
} from '@fortawesome/free-solid-svg-icons';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import UserFormModal from '../components/modals/UserFormModal';
import EditUserModal from '../components/modals/EditUserModal';
import DeleteUserModal from '../components/modals/DeleteUserModal';
import Notification from '../components/ui/Notification';

const Configuracion = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    message: '',
  });
  
  // Cargar usuarios de Firebase cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === 'usuarios') {
      fetchUsers();
    }
  }, [activeTab]);

  // Función actualizada para obtener usuarios con la colección correcta
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar la colección correcta 'usuarios' en lugar de 'users'
      const usersCollection = collection(db, 'usuarios');
      const userSnapshot = await getDocs(query(usersCollection));
      
      // Preparamos el array para los usuarios
      let usersData = [];
      
      // Si hay datos en Firestore, los usamos con la estructura correcta
      if (!userSnapshot.empty) {
        usersData = userSnapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`Usuario encontrado: ${doc.id}`, data);
          
          // Usamos la estructura exacta que tienes en Firebase
          return {
            id: doc.id,
            uid: data.uid || doc.id,
            name: `${data.nombre || ''} ${data.apellido || ''}`.trim() || 'Usuario Sin Nombre',
            nombre: data.nombre || '',
            apellido: data.apellido || '',
            email: data.email || '',
            role: data.rol || 'Usuario',
            status: data.estado || 'Activo', 
            lastLogin: data.fechaCreacion || null,
            fechaCreacion: data.fechaCreacion
          };
        });
        
        console.log("Usuarios procesados:", usersData);
      } 
      // De lo contrario, usar el usuario actual como respaldo
      else if (currentUser) {
        console.log("Usando usuario actual:", currentUser.uid);
        
        // Buscar datos del usuario en la colección 'usuarios'
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', currentUser.uid));
          
          if (userDoc.exists()) {
            // El usuario existe en la colección 'usuarios'
            const userData = userDoc.data();
            console.log("Datos del usuario encontrados:", userData);
            
            usersData.push({
              id: currentUser.uid,
              uid: userData.uid || currentUser.uid,
              name: `${userData.nombre || ''} ${userData.apellido || ''}`.trim() || 'Usuario Sin Nombre',
              email: userData.email || currentUser.email || '',
              role: userData.rol || 'Usuario',
              status: userData.estado || 'Activo',
              lastLogin: userData.fechaCreacion || currentUser.metadata?.lastSignInTime || null
            });
          } else {
            // Si el usuario no está en Firestore, usar datos de autenticación
            console.log("Usuario no encontrado en Firestore, usando datos de autenticación");
            
            // Verificar si existen todas las propiedades necesarias
            const email = currentUser.email || '';
            const displayName = currentUser.displayName || email.split('@')[0] || 'Usuario';
            
            usersData.push({
              id: currentUser.uid,
              uid: currentUser.uid,
              name: displayName,
              email: email,
              role: 'Usuario', // Rol por defecto
              status: 'Activo',
              lastLogin: currentUser.metadata?.lastSignInTime || new Date().toISOString()
            });
            
            // Opcional: También podríamos guardar este usuario en Firestore para futuras consultas
            console.log("Se podría crear un registro para este usuario en Firestore");
          }
        } catch (error) {
          console.error("Error al obtener datos del usuario:", error);
          
          // Usar datos mínimos en caso de error
          usersData.push({
            id: currentUser.uid,
            uid: currentUser.uid,
            name: currentUser.email ? currentUser.email.split('@')[0] : 'Usuario',
            email: currentUser.email || '',
            role: 'Usuario',
            status: 'Activo',
            lastLogin: new Date().toISOString()
          });
        }
      }

      // Si no hay usuarios en absoluto, mostramos un mensaje
      if (usersData.length === 0) {
        setError('No se encontraron usuarios en la base de datos.');
      } else {
        setUsers(usersData);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar la lista de usuarios. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Función para abrir el modal de agregar usuario
  const openUserModal = () => {
    setIsUserModalOpen(true);
  };

  // Función para cerrar el modal de agregar usuario
  const closeUserModal = () => {
    setIsUserModalOpen(false);
  };

  // Función para actualizar la lista de usuarios después de agregar uno nuevo
  const handleUserAdded = (userData) => {
    if (activeTab === 'usuarios') {
      fetchUsers();
    }
    showNotification('success', 'Usuario creado exitosamente');
  };

  // Funciones para manejar el modal de edición
  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => {
      setSelectedUser(null);
    }, 300);
  };

  // Funciones para manejar el modal de eliminación - modificada para restricción de admin
  const openDeleteModal = (user) => {
    // Verificar si es el administrador intentando eliminarse a sí mismo
    const isSelfDelete = currentUser && currentUser.uid === user.id && user.role?.toLowerCase() === 'administrador';
    
    if (isSelfDelete) {
      showNotification(
        'warning', 
        'No puedes eliminar tu propia cuenta de administrador por seguridad', 
        6000
      );
      return;
    }
    
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTimeout(() => {
      setSelectedUser(null);
    }, 300);
  };

  // Función para manejar la actualización después de editar un usuario
  const handleUserUpdated = (updatedUser) => {
    // Actualizar el usuario en el estado local sin necesidad de recargar todos
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === updatedUser.id ? { ...user, ...updatedUser } : user
    ));
    
    showNotification('success', `Usuario ${updatedUser.name} actualizado correctamente`);
  };

  // Función para manejar la eliminación de un usuario
  const handleUserDeleted = (userId, result) => {
    // Remover usuario del estado local
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    
    // Mostrar notificación con nombre del usuario si está disponible
    if (result?.success) {
      showNotification('success', result.message);
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

  const tabs = [
    { id: 'general', label: 'Configuración General', icon: faCog },
    { id: 'usuarios', label: 'Usuarios', icon: faUsers },
    { id: 'menu', label: 'Menú', icon: faUtensils }
  ];

  const renderUserInfo = (user) => {
    return (
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="flex-shrink-0 h-7 w-7 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover rounded-full" />
          ) : user.role?.toLowerCase() === 'admin' ? (
            <FontAwesomeIcon icon={faUserShield} className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <FontAwesomeIcon icon={faUser} className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
            {user.name || 'Usuario Sin Nombre'}
          </div>
          <div className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">{user.email || 'Sin correo'}</div>
        </div>
      </div>
    );
  };

  const renderUsersTab = () => {
    return (
      <div className="animate-fadeIn w-full overflow-hidden">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-4">Gestión de Usuarios</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Administra los usuarios del sistema, asigna roles y permisos, configura el acceso a diferentes áreas 
            y gestiona la seguridad de la aplicación.
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-3 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Usuarios del Sistema</h3>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 order-2 sm:order-1">
                  <input 
                    type="text" 
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" 
                    placeholder="Buscar usuario..." 
                  />
                  <div className="absolute left-2.5 top-2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <button 
                  onClick={openUserModal} 
                  className="w-full sm:w-auto px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center order-1 sm:order-2 text-sm"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-1.5" />
                  <span>Nuevo Usuario</span>
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <FontAwesomeIcon icon={faSpinner} spin className="text-emerald-500 text-2xl sm:text-3xl" />
              <span className="ml-2 text-sm sm:text-base text-gray-600">Cargando usuarios...</span>
            </div>
          ) : error ? (
            <div className="m-4 sm:m-6 bg-red-50 p-4 rounded-lg border border-red-200 text-center">
              <p className="text-sm sm:text-base text-red-700">{error}</p>
              <button 
                className="mt-2 px-4 py-1 bg-emerald-100 text-emerald-800 rounded-md text-sm hover:bg-emerald-200 transition-colors"
                onClick={fetchUsers}
              >
                Intentar nuevamente
              </button>
            </div>
          ) : (
            <>
              {/* Vista de tabla para pantallas medianas y grandes */}
              <div className="hidden md:block overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <span className="sr-only">Acciones</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.length > 0 ? (
                          users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white">
                                    {user.photoURL ? (
                                      <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover rounded-full" />
                                    ) : user.role?.toLowerCase() === 'admin' ? (
                                      <FontAwesomeIcon icon={faUserShield} className="h-5 w-5" />
                                    ) : (
                                      <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {user.name || 'Usuario Sin Nombre'}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate">{user.email || 'Sin correo'}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span 
                                    className={`h-2.5 w-2.5 rounded-full mr-2 flex-shrink-0 ${
                                      user.role?.toLowerCase() === 'administrador' ? 'bg-emerald-500' :
                                      user.role?.toLowerCase() === 'cajero' ? 'bg-teal-500' :
                                      user.role?.toLowerCase() === 'garzon' ? 'bg-emerald-400' : 'bg-gray-500'
                                    }`}
                                  ></span>
                                  <span className="text-sm text-gray-900">
                                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Usuario'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span 
                                  className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${
                                    user.status?.toLowerCase() === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {user.status || 'Desconocido'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {user.lastLogin ? (
                                  typeof user.lastLogin === 'string' ? 
                                    new Date(user.lastLogin).toLocaleString('es-ES', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    }) : user.lastLogin
                                ) : 'Nunca'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <div className="flex justify-end items-center space-x-3">
                                  <button 
                                    className="p-2 text-emerald-600 hover:text-emerald-900 transition-colors rounded-lg hover:bg-emerald-50" 
                                    title="Editar usuario"
                                    onClick={() => openEditModal(user)}
                                  >
                                    <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
                                  </button>
                                  <button 
                                    className="p-2 text-red-600 hover:text-red-900 transition-colors rounded-lg hover:bg-red-50" 
                                    title="Eliminar usuario"
                                    onClick={() => openDeleteModal(user)}
                                  >
                                    <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                              No se encontraron usuarios registrados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Vista de tarjetas para móviles y pantallas pequeñas */}
              <div className="md:hidden">
                {users.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {users.map(user => (
                      <li key={user.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover rounded-full" />
                              ) : user.role?.toLowerCase() === 'administrador' ? (
                                <FontAwesomeIcon icon={faUserShield} className="h-5 w-5" />
                              ) : (
                                <FontAwesomeIcon icon={faUser} className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name || 'Usuario Sin Nombre'}</div>
                              <div className="text-xs text-gray-500">{user.email || 'Sin correo'}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <button 
                              className="p-2 text-emerald-600 hover:text-emerald-900" 
                              onClick={() => openEditModal(user)}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              className="p-2 text-red-600 hover:text-red-900" 
                              onClick={() => openDeleteModal(user)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded-md">
                            <span className="text-gray-500 block">Rol</span>
                            <div className="flex items-center mt-1">
                              <span 
                                className={`h-2 w-2 rounded-full mr-1.5 ${
                                  user.role?.toLowerCase() === 'administrador' ? 'bg-emerald-500' :
                                  user.role?.toLowerCase() === 'cajero' ? 'bg-teal-500' :
                                  user.role?.toLowerCase() === 'garzon' ? 'bg-emerald-400' : 'bg-gray-500'
                                }`}
                              ></span>
                              <span className="font-medium">{user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'Usuario'}</span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-2 rounded-md">
                            <span className="text-gray-500 block">Estado</span>
                            <span 
                              className={`mt-1 inline-block px-2 py-0.5 text-xs rounded-full ${
                                user.status?.toLowerCase() === 'activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {user.status || 'Desconocido'}
                            </span>
                          </div>
                          
                          <div className="bg-gray-50 p-2 rounded-md col-span-2">
                            <span className="text-gray-500 block">Último Acceso</span>
                            <span className="font-medium mt-1 block">
                              {user.lastLogin ? (
                                typeof user.lastLogin === 'string' ? 
                                  new Date(user.lastLogin).toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : user.lastLogin
                              ) : 'Nunca'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No se encontraron usuarios registrados.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Modales para gestionar usuarios */}
        <UserFormModal 
          isOpen={isUserModalOpen} 
          onClose={closeUserModal} 
          onUserAdded={handleUserAdded} 
        />
        <EditUserModal 
          isOpen={isEditModalOpen} 
          onClose={closeEditModal} 
          onUserUpdated={handleUserUpdated}
          user={selectedUser} 
        />
        <DeleteUserModal 
          isOpen={isDeleteModalOpen} 
          onClose={closeDeleteModal} 
          onUserDeleted={handleUserDeleted}
          user={selectedUser} 
        />
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="animate-fadeIn w-full">
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2 sm:mb-4">Configuración General del Sistema</h2>
              <p className="text-gray-600">
                Configura los parámetros generales de tu restaurante, información del negocio, impuestos, moneda, 
                horarios de operación y ajustes globales del sistema.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <FontAwesomeIcon icon={faCog} />
                  </span>
                  Información del Restaurante
                </h3>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-center">
                  <p className="text-emerald-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <FontAwesomeIcon icon={faCog} />
                  </span>
                  Configuración Fiscal
                </h3>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-center">
                  <p className="text-emerald-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <FontAwesomeIcon icon={faCog} />
                  </span>
                  Horarios de Atención
                </h3>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-center">
                  <p className="text-emerald-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <FontAwesomeIcon icon={faCog} />
                  </span>
                  Métodos de Pago
                </h3>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-center">
                  <p className="text-emerald-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'usuarios':
        return renderUsersTab();
        
      case 'menu':
        return (
          <div className="animate-fadeIn w-full">
            <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Configuración del Menú</h2>
              <p className="text-gray-600">
                Configura las categorías del menú, personaliza la presentación de los productos, gestiona impuestos específicos 
                por producto y establece modificadores para los platos.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <FontAwesomeIcon icon={faUtensils} />
                  </span>
                  Categorías
                </h3>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-center">
                  <p className="text-emerald-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <FontAwesomeIcon icon={faUtensils} />
                  </span>
                  Modificadores
                </h3>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-center">
                  <p className="text-emerald-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                    <FontAwesomeIcon icon={faUtensils} />
                  </span>
                  Impuestos
                </h3>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-center">
                  <p className="text-emerald-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="pb-4 max-w-full overflow-hidden">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 px-4 sm:px-0">Configuración del Sistema</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 px-4 sm:px-0">Gestiona todas las configuraciones de tu restaurante en un solo lugar</p>
        
        {/* Tabs Navigation */}
        <div className="bg-white shadow rounded-lg mb-6 max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {/* Tabs para móvil */}
            <div className="sm:hidden w-full p-3">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="block w-full px-3 py-1.5 border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 rounded-md text-sm"
              >
                {tabs.map(tab => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Tabs para tablet/desktop */}
            <div className="hidden sm:flex w-full px-4 border-b border-gray-200 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`py-4 px-6 font-medium flex items-center transition-colors duration-300 whitespace-nowrap
                    ${activeTab === tab.id 
                      ? 'text-emerald-600 border-b-2 border-emerald-500 -mb-px' 
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
        </div>
        
        {/* Tab Content con responsividad mejorada */}
        <div className="w-full px-4 sm:px-0 overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
      
      {/* Sistema de notificaciones */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.visible}
        duration={notification.duration}
        onClose={closeNotification}
      />
    </Layout>
  );
};

export default Configuracion;
