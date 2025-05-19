import { Fragment, useState, useEffect, useRef } from 'react';
import { Transition, Menu, Dialog } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPrint, 
  faTimes, 
  faEllipsisVertical, 
  faPlus,
  faUtensils,
  faCheck,
  faCreditCard,
  faComment,
  faMinus
} from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../../utils/formatters';
import ProductoMenu from '../ui/ProductoMenu';
import { toast } from 'react-hot-toast';
import TransferirModal from '../modals/TransferirModal';
import SepararItemsModal from '../modals/SepararItemsModal';
import CerrarMesaDrawer from './CerrarMesaDrawer';

const ResumenDrawer = ({
  isResumenDrawerOpen,
  cerrarResumenDrawer, 
  mesaActiva,
  pedidoActivo,
  setIsResumenDrawerOpen,
  setIsDrawerOpen,
  setShowCancelarPedidoModal,
  handleProductClick,
  showProductMenu,
  productoAQuitar,
  menuPosition, 
  iniciarQuitarProducto,
  mesas = [] // Lista de mesas para transferir
}) => {
  // Estado local para gestionar el menú contextual
  const [menuLocalAbierto, setMenuLocalAbierto] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [posicionMenu, setPosicionMenu] = useState({ x: 0, y: 0 });
  const [showTransferirModal, setShowTransferirModal] = useState(false);
  const [showSepararModal, setShowSepararModal] = useState(false);
  const [cantidadASeparar, setCantidadASeparar] = useState(1);
  const [menuOpcionesAbierto, setMenuOpcionesAbierto] = useState(false);
  const menuRef = useRef(null);
  const menuOpcionesRef = useRef(null);
  const [showCerrarMesaDrawer, setShowCerrarMesaDrawer] = useState(false);
  
  // Efecto para cerrar el menú cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Cerrar menú contextual si se hace clic fuera
      if (menuLocalAbierto && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuLocalAbierto(false);
      }
      
      // Cerrar menú de opciones si se hace clic fuera
      if (menuOpcionesAbierto && menuOpcionesRef.current && !menuOpcionesRef.current.contains(event.target)) {
        setMenuOpcionesAbierto(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuLocalAbierto, menuOpcionesAbierto]);
  
  // Función para manejar clic en producto (implementación local)
  const handleProductoClick = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Cerrar menú de opciones si está abierto
    if (menuOpcionesAbierto) {
      setMenuOpcionesAbierto(false);
    }
    
    // Cerrar menú existente si está abierto
    if (menuLocalAbierto) {
      setMenuLocalAbierto(false);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    setPosicionMenu({
      x: rect.left + rect.width / 2,
      y: rect.top + scrollTop
    });
    setItemSeleccionado(item);
    setMenuLocalAbierto(true);
  };

  // Manejador para abrir el menú de opciones
  const handleToggleMenuOpciones = () => {
    // Si el menú contextual está abierto, cerrarlo
    if (menuLocalAbierto) {
      setMenuLocalAbierto(false);
    }
    
    // Togglear el menú de opciones
    setMenuOpcionesAbierto(!menuOpcionesAbierto);
  };

  // Función para marcar producto como entregado
  const handleMarcarEntregado = (producto) => {
    if (!producto) return;
    
    toast.success(`${producto.nombre} marcado como entregado`, {
      position: "bottom-left",
      autoClose: 2000
    });
    
    // Aquí se implementaría la lógica real para actualizar el estado del producto
    console.log('Producto marcado como entregado:', producto);
  };
  
  // Función para marcar producto como pagado
  const handleMarcarPagado = (producto) => {
    if (!producto) return;
    
    toast.success(`${producto.nombre} marcado como pagado`, {
      position: "bottom-left",
      autoClose: 2000
    });
    
    // Aquí se implementaría la lógica real para actualizar el estado del producto
    console.log('Producto marcado como pagado:', producto);
  };
  
  // Función para iniciar el proceso de transferir un producto a otra mesa
  const handleTransferirAMesa = (producto) => {
    if (!producto) return;
    
    setItemSeleccionado(producto);
    setShowTransferirModal(true);
  };
  
  // Función para iniciar el proceso de separar ítems
  const handleSepararItems = (producto) => {
    if (!producto || producto.cantidad <= 1) return;
    
    setItemSeleccionado(producto);
    setCantidadASeparar(1); // Reiniciamos a 1
    setShowSepararModal(true);
  };

  // Función para manejar la separación de ítems
  const handleSepararItemsConfirm = (producto, cantidad) => {
    // Implementación futura
    toast.success(`Se han separado ${cantidad} unidades de ${producto?.nombre}`, {
      position: "bottom-left",
      autoClose: 2000
    });
    console.log('Separar ítems:', { producto, cantidad });
  };

  // Función para renderizar cada producto
  const renderProductoResumen = (item, index) => (
    <div 
      key={`${item.id}-${index}`}
      className="flex items-start space-x-2 p-3 hover:bg-gray-50 rounded-lg transition-colors relative group cursor-pointer"
      onClick={(e) => handleProductoClick(e, item)}
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
            {/* Mostrar comentario si existe */}
            {item.comentario && (
              <div className="ml-8 mt-1 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
                <div className="flex items-center text-amber-700">
                  <FontAwesomeIcon icon={faComment} className="mr-2 h-3 w-3" />
                  <span className="text-xs font-medium">Nota para cocina:</span>
                </div>
                <p className="text-sm text-amber-800 mt-0.5">{item.comentario}</p>
              </div>
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
              {formatCurrency(item.precio * item.cantidad)}
            </span>
          </div>
        </div>
      </div>

      {/* Menú contextual usando el nuevo componente */}
      {menuLocalAbierto && itemSeleccionado?.id === item.id && (
        <div ref={menuRef}>
          <ProductoMenu 
            producto={item}
            position={posicionMenu}
            onClose={() => setMenuLocalAbierto(false)}
            onQuitarProducto={iniciarQuitarProducto}
            onMarcarEntregado={handleMarcarEntregado}
            onMarcarPagado={handleMarcarPagado}
            onTransferirAMesa={handleTransferirAMesa}
            onSepararItems={handleSepararItems}
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      <Transition.Root show={isResumenDrawerOpen} as={Fragment}>
        <div className="fixed inset-0 overflow-hidden z-[60]">
          <div className="absolute inset-0 overflow-hidden">
            {/* Overlay oscuro con onClick para cerrar al hacer clic fuera */}
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
                onClick={cerrarResumenDrawer} // Cerrar drawer al hacer clic en el overlay
              />
            </Transition.Child>

            {/* Contenido del drawer */}
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
                <div className="relative w-screen max-w-lg">
                  <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
                    {/* Header Principal con botón X para cerrar */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                      <div className="flex items-center justify-between px-4 py-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Mesa {mesaActiva?.numero}
                        </h2>
                        <div className="flex items-center gap-4">
                          {/* Botón de imprimir */}
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <FontAwesomeIcon icon={faPrint} className="h-5 w-5" />
                          </button>
                          
                          {/* Botón X para cerrar */}
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            onClick={cerrarResumenDrawer}
                          >
                            <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
                          </button>
                          
                          {/* Menú de opciones (3 puntos) */}
                          <div ref={menuOpcionesRef}>
                            <Menu as="div" className="relative inline-block text-left">
                              <Menu.Button 
                                className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100"
                                onClick={handleToggleMenuOpciones}
                              >
                                <FontAwesomeIcon icon={faEllipsisVertical} className="h-5 w-5" />
                              </Menu.Button>
                              <Transition
                                as={Fragment}
                                show={menuOpcionesAbierto}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpcionesAbierto(false);
                                            setShowCancelarPedidoModal(true);
                                          }}
                                          className={`w-full text-left px-4 py-2 text-red-600 hover:bg-red-50`}
                                        >
                                          Cancelar pedido
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </Menu>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenido del pedido */}
                    <div className="flex-1 overflow-y-auto p-4">
                      {/* Aquí va el contenido del pedido */}
                      {pedidoActivo?.productos && pedidoActivo.productos.length > 0 ? (
                        <div className="space-y-2">
                          {pedidoActivo.productos.map((item, index) => renderProductoResumen(item, index))}
                        </div>
                      ) : (
                        <div className="text-center py-10">
                          <p className="text-gray-500">No hay productos en el pedido</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer con totales y acciones */}
                    <div className="border-t border-gray-200 bg-gray-50">
                      {/* Sección de totales */}
                      <div className="px-4 py-3">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(pedidoActivo?.productos?.reduce((total, item) => total + (item.precio * item.cantidad), 0) || 0)}</span>
                        </div>
                        <div className="flex justify-between mt-3 font-semibold text-gray-900">
                          <span>Total:</span>
                          <span>{formatCurrency(pedidoActivo?.productos?.reduce((total, item) => total + (item.precio * item.cantidad), 0) || 0)}</span>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      <div className="px-4 py-3 flex flex-col gap-2">
                        <button
                          type="button"
                          className="w-full py-2 px-4 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center"
                          onClick={() => {
                            setIsResumenDrawerOpen(false);
                            setIsDrawerOpen(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
                          Agregar más productos
                        </button>
                        
                        <button
                          type="button"
                          className="w-full py-2 px-4 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center justify-center shadow-md"
                          onClick={() => {
                            setShowCerrarMesaDrawer(true);
                          }}
                        >
                          <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4" />
                          Cerrar mesa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Transition.Root>
      
      {/* Modal de Transferir */}
      <TransferirModal 
        isOpen={showTransferirModal}
        setIsOpen={setShowTransferirModal}
        producto={itemSeleccionado}
        mesas={mesas}
      />
      
      {/* Modal de Separar Ítems */}
      <SepararItemsModal 
        isOpen={showSepararModal}
        setIsOpen={setShowSepararModal}
        producto={itemSeleccionado}
        onSeparar={handleSepararItemsConfirm}
      />
      
      {/* Drawer de Cerrar Mesa */}
      <CerrarMesaDrawer 
        isOpen={showCerrarMesaDrawer}
        onClose={() => setShowCerrarMesaDrawer(false)}
        mesaActiva={mesaActiva}
        pedidoActivo={pedidoActivo}
      />
    </>
  );
};

export default ResumenDrawer;