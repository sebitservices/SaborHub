import { Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faSearch, 
  faUtensils, 
  faPlus,
  faMinus,
  faTrash,
  faShoppingCart,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../../utils/formatters';

const ProductosDrawer = ({
  isDrawerOpen,
  cerrarDrawer,
  mesaActiva,
  areas,
  searchMenu,
  setSearchMenu,
  loadingMenu,
  filteredSections,
  renderProductImage,
  startAddToOrder,
  pedidoActual,
  formatCurrency,
  addToOrder,
  removeFromOrder,
  deleteFromOrder,
  confirmarPedido
}) => {
  return (
    <Transition.Root show={isDrawerOpen} as={Fragment}>
      <div className="fixed inset-0 overflow-hidden z-[60]">
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
            onClick={cerrarDrawer} // Cerrar al hacer clic fuera
          />
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
              {/* Contenedor principal del drawer */}
              <div className="h-full flex flex-col bg-white shadow-xl">
                {/* Header Fijo */}
                <div className="px-6 py-5 bg-white border-b border-gray-200 sticky top-0 z-20">
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

                {/* Contenido principal del Drawer (Menú y Carrito) */}
                <div className="flex-1 flex min-h-0">
                  {/* Panel izquierdo - Menú con su propio scroll */}
                  <div className="flex-1 flex flex-col border-r border-gray-200">
                    {/* Barra de búsqueda Fija debajo del header */}
                    <div className="p-6 border-b border-gray-200 bg-white sticky top-[89px] z-10">
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

                    {/* Lista de Productos del Menú (Scrollable) */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                      {loadingMenu ? (
                        <div className="flex justify-center items-center h-full">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                        </div>
                      ) : (
                        <div> {/* Contenedor para las secciones del menú */}
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
                                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                      {renderProductImage(product)}
                                    </div>
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

                  {/* Panel derecho - Carrito con su propio scroll y footer fijo */}
                  <div className="w-[480px] flex flex-col bg-white">
                    {/* Encabezado del Carrito Fijo */}
                    <div className="p-6 border-b border-gray-200 bg-white sticky top-[89px] z-10">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">Pedido actual</h3>
                        <span className="text-sm text-gray-500">{pedidoActual.length} items</span>
                      </div>
                    </div>
                    
                    {/* Lista de items en el carrito (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-0">
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

                    {/* Footer Fijo del Carrito */}
                    <div className="border-t border-gray-200 p-6 bg-white sticky bottom-0 z-10">
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
  );
};

export default ProductosDrawer; 