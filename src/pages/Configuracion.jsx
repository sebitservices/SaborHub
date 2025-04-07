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
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
          ) : user.role?.toLowerCase() === 'admin' ? (
            <FontAwesomeIcon icon={faUserShield} />
          ) : (
            <FontAwesomeIcon icon={faUser} />
          )}
        </div>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">
            {user.name || 'Usuario Sin Nombre'}
          </div>
          <div className="text-sm text-gray-500">{user.email || 'Sin correo'}</div>
        </div>
      </div>
    );
  };

  const renderUsersTab = () => {
    return (
      <div className="animate-fadeIn w-full">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Gestión de Usuarios</h2>
          <p className="text-gray-600">
            Administra los usuarios del sistema, asigna roles y permisos, configura el acceso a diferentes áreas 
            y gestiona la seguridad de la aplicación.
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Usuarios del Sistema</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <input 
                  type="text" 
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
                  placeholder="Buscar usuario..." 
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button 
                onClick={openUserModal} 
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Nuevo Usuario
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <FontAwesomeIcon icon={faSpinner} spin className="text-amber-500 text-3xl" />
              <span className="ml-2 text-gray-600">Cargando usuarios...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-center">
              <p className="text-red-700">{error}</p>
              <button 
                className="mt-2 px-4 py-1 bg-amber-100 text-amber-800 rounded-md text-sm hover:bg-amber-200"
                onClick={fetchUsers}
              >
                Intentar nuevamente
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.length > 0 ? (
                    users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderUserInfo(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center">
                            <span className={`h-2.5 w-2.5 rounded-full mr-2 ${
                              user.role?.toLowerCase() === 'admin' ? 'bg-amber-500' :
                              user.role?.toLowerCase() === 'cajero' ? 'bg-green-500' :
                              user.role?.toLowerCase() === 'mesero' ? 'bg-blue-500' : 'bg-gray-500'
                            }`}></span>
                            <span className="text-sm text-gray-900">
                              {user.role?.toLowerCase() === 'admin' ? 'Administrador' : 
                               user.role?.toLowerCase() === 'cajero' ? 'Cajero' : 
                               user.role?.toLowerCase() === 'mesero' ? 'Mesero' : 
                               user.role || 'Usuario'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-amber-600 hover:text-amber-900 mx-2" 
                            title="Editar usuario"
                            onClick={() => openEditModal(user)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900 mx-2" 
                            title="Eliminar usuario"
                            onClick={() => openDeleteModal(user)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                        No se encontraron usuarios registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Configuración General del Sistema</h2>
              <p className="text-gray-600">
                Configura los parámetros generales de tu restaurante, información del negocio, impuestos, moneda, 
                horarios de operación y ajustes globales del sistema.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <FontAwesomeIcon icon={faCog} />
                  </span>
                  Información del Restaurante
                </h3>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                  <p className="text-amber-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <FontAwesomeIcon icon={faCog} />
                  </span>
                  Configuración Fiscal
                </h3>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                  <p className="text-amber-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <FontAwesomeIcon icon={faCog} />
                  </span>
                  Horarios de Atención
                </h3>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                  <p className="text-amber-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <FontAwesomeIcon icon={faCog} />
                  </span>
                  Métodos de Pago
                </h3>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                  <p className="text-amber-700">
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
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Configuración del Menú</h2>
              <p className="text-gray-600">
                Configura las categorías del menú, personaliza la presentación de los productos, gestiona impuestos específicos 
                por producto y establece modificadores para los platos.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <FontAwesomeIcon icon={faUtensils} />
                  </span>
                  Categorías
                </h3>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                  <p className="text-amber-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <FontAwesomeIcon icon={faUtensils} />
                  </span>
                  Modificadores
                </h3>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                  <p className="text-amber-700">
                    Esta sección está en desarrollo.
                  </p>
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="inline-block w-8 h-8 mr-3 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <FontAwesomeIcon icon={faUtensils} />
                  </span>
                  Impuestos
                </h3>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-center">
                  <p className="text-amber-700">
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
      <div className="pb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Configuración del Sistema</h1>
        <p className="text-gray-600 mb-6">Gestiona todas las configuraciones de tu restaurante en un solo lugar</p>
        
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
