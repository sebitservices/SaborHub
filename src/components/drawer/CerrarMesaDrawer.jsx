import { Fragment, useState } from 'react';
import { Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faCalculator, 
  faPlus, 
  faPercentage, 
  faMoneyBill, 
  faPrint, 
  faCheck,
  faChevronDown,
  faCreditCard,
  faMoneyBillWave,
  faExchangeAlt
} from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../../utils/formatters';

const CerrarMesaDrawer = ({
  isOpen,
  onClose,
  mesaActiva,
  pedidoActivo
}) => {
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [menuMetodosPagoAbierto, setMenuMetodosPagoAbierto] = useState(false);

  // Métodos de pago disponibles
  const metodosPago = [
    { id: 'efectivo', nombre: 'Efectivo', icono: faMoneyBillWave },
    { id: 'debito', nombre: 'Tarjeta Débito', icono: faCreditCard },
    { id: 'credito', nombre: 'Tarjeta Crédito', icono: faCreditCard },
    { id: 'transferencia', nombre: 'Transferencia', icono: faExchangeAlt },
  ];

  // Función para seleccionar método de pago
  const seleccionarMetodoPago = (metodo) => {
    setMetodoPago(metodo);
    setMenuMetodosPagoAbierto(false);
  };

  // Obtener el método de pago actual
  const metodoActual = metodosPago.find(m => m.id === metodoPago);

  // Calcular el subtotal
  const calcularSubtotal = () => {
    if (!pedidoActivo || !pedidoActivo.productos || pedidoActivo.productos.length === 0) {
      return 0;
    }
    
    return pedidoActivo.productos.reduce((total, producto) => {
      return total + (producto.precio * producto.cantidad);
    }, 0);
  };

  const subtotal = calcularSubtotal();
  const total = subtotal; // Por ahora es igual, luego se pueden agregar descuentos

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <div className="fixed inset-0 overflow-hidden z-[80]">
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
              className="absolute inset-0 bg-gray-500 bg-opacity-25 transition-opacity" 
              onClick={onClose}
            />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <div className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                          Cerrar Mesa
                        </h2>
                        <button
                          type="button"
                          className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                          onClick={onClose}
                        >
                          <span className="sr-only">Cerrar</span>
                          <FontAwesomeIcon icon={faTimes} className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 px-4 py-6">
                        {/* Sección Pedido */}
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Pedido</h3>
                          <div className="bg-gray-50 rounded-lg">
                            {pedidoActivo?.productos && pedidoActivo.productos.length > 0 ? (
                              <div className="divide-y divide-gray-200">
                                {pedidoActivo.productos.map((producto, index) => (
                                  <div key={index} className="p-4">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-start">
                                        <span className="text-lg font-medium text-gray-900 mr-3">
                                          {producto.cantidad}
                                        </span>
                                        <div>
                                          <h4 className="text-base font-medium text-gray-900">
                                            {producto.nombre}
                                          </h4>
                                          <p className="text-sm text-gray-500 mt-1">
                                            {producto.hora || '12:36'}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="text-base font-medium text-gray-900">
                                        {formatCurrency(producto.precio * producto.cantidad)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center text-gray-500">
                                No hay productos en el pedido
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Línea divisoria */}
                        <div className="border-t border-gray-200 my-6"></div>

                        {/* Sección Total */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium text-gray-900">Total</h3>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                              >
                                <FontAwesomeIcon icon={faPercentage} className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                              >
                                <FontAwesomeIcon icon={faMoneyBill} className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg">
                            <div className="py-2">
                              <div className="flex justify-between items-center">
                                <span className="text-base text-gray-700">Subtotal</span>
                                <span className="text-base text-gray-900">
                                  {formatCurrency(subtotal)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-lg font-semibold text-gray-900">Total</span>
                                <span className="text-lg font-semibold text-gray-900">
                                  {formatCurrency(total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Línea divisoria */}
                        <div className="border-t border-gray-200 my-6"></div>

                        {/* Sección Método de Pago */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Método de Pago</h3>
                            <div className="flex space-x-2">
                              <button
                                type="button"
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                              >
                                <FontAwesomeIcon icon={faCalculator} className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                              >
                                <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg border border-gray-300">
                            <div className="relative">
                              <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-900"
                                onClick={() => setMenuMetodosPagoAbierto(!menuMetodosPagoAbierto)}
                              >
                                <div className="flex items-center">
                                  <FontAwesomeIcon icon={metodoActual.icono} className="h-5 w-5 mr-3 text-gray-600" />
                                  <span className="font-medium">{metodoActual.nombre}</span>
                                </div>
                                <FontAwesomeIcon 
                                  icon={faChevronDown} 
                                  className={`h-4 w-4 text-gray-500 transition-transform ${menuMetodosPagoAbierto ? 'transform rotate-180' : ''}`} 
                                />
                              </button>
                              
                              {/* Menú desplegable de métodos de pago */}
                              {menuMetodosPagoAbierto && (
                                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200">
                                  {metodosPago.map((metodo) => (
                                    <button
                                      key={metodo.id}
                                      type="button"
                                      className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 ${
                                        metodoPago === metodo.id ? 'bg-purple-50 text-purple-700' : 'text-gray-900'
                                      }`}
                                      onClick={() => seleccionarMetodoPago(metodo.id)}
                                    >
                                      <FontAwesomeIcon icon={metodo.icono} className="h-5 w-5 mr-3 text-gray-600" />
                                      <span className="font-medium">{metodo.nombre}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Campo adicional según el método de pago */}
                          {metodoPago === 'efectivo' && (
                            <div className="mt-3">
                              <input
                                type="text"
                                placeholder="Monto efectivo entregado (Opcional)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                value={montoEfectivo}
                                onChange={(e) => setMontoEfectivo(e.target.value)}
                              />
                              {montoEfectivo && !isNaN(montoEfectivo) && parseFloat(montoEfectivo) >= total && (
                                <div className="mt-2 text-right text-sm text-gray-600">
                                  Cambio: {formatCurrency(parseFloat(montoEfectivo) - total)}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {metodoPago === 'debito' && (
                            <div className="mt-3 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                              <p className="font-medium mb-1">Tarjeta de Débito</p>
                              <p>El pago con tarjeta de débito será procesado en el dispositivo externo.</p>
                            </div>
                          )}
                          
                          {metodoPago === 'credito' && (
                            <div className="mt-3 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                              <p className="font-medium mb-1">Tarjeta de Crédito</p>
                              <p>El pago con tarjeta de crédito será procesado en el dispositivo externo.</p>
                              <p className="mt-2 text-xs text-purple-600">Se aceptan pagos en cuotas y todas las tarjetas.</p>
                            </div>
                          )}
                          
                          {metodoPago === 'transferencia' && (
                            <div className="mt-3 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                              <p className="mb-2 font-medium">Datos para transferencia:</p>
                              <p>Banco: Banco Estado</p>
                              <p>Cuenta: 12345678</p>
                              <p>RUT: 12.345.678-9</p>
                              <p>Email: pagos@saborhub.cl</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer con botones */}
                      <div className="border-t border-gray-200 px-4 py-4 sm:px-6">
                        <div className="flex justify-between space-x-3">
                          <button
                            type="button"
                            className="flex items-center justify-center px-4 py-3 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 w-1/2"
                          >
                            <FontAwesomeIcon icon={faPrint} className="mr-2 h-5 w-5" />
                            Imprimir Pre Cuenta
                          </button>
                          <button
                            type="button"
                            className="flex items-center justify-center px-4 py-3 rounded-md border border-transparent shadow-sm text-white bg-purple-600 hover:bg-purple-700 w-1/2"
                          >
                            <FontAwesomeIcon icon={faCheck} className="mr-2 h-5 w-5" />
                            Cerrar Mesa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition.Child>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition.Root>
  );
};

export default CerrarMesaDrawer; 