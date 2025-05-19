import { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { toast } from 'react-hot-toast';

const TransferirModal = ({ 
  isOpen, 
  setIsOpen, 
  producto,
  mesas = [] // Lista de mesas disponibles para transferir
}) => {
  return (
    <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="fixed inset-0 z-[80] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <Dialog.Backdrop className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        <DialogPanel className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <DialogTitle as="h3" className="text-lg leading-6 font-medium text-gray-900">
                Transferir producto a otra mesa
              </DialogTitle>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Selecciona la mesa a la que deseas transferir {producto?.nombre}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de mesas disponibles */}
          <div className="mt-4 max-h-60 overflow-y-auto">
            <div className="grid grid-cols-3 gap-2">
              {mesas.length > 0 ? (
                mesas.map(mesa => (
                  <button
                    key={mesa.id}
                    className="py-3 px-2 border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                  >
                    Mesa {mesa.numero}
                  </button>
                ))
              ) : (
                <div className="col-span-3 text-center py-4 text-gray-500">
                  No hay otras mesas disponibles
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:col-start-2 sm:text-sm"
              onClick={() => {
                // Implementación futura de transferencia
                toast.success(`Producto transferido exitosamente`, {
                  position: "bottom-left",
                  autoClose: 2000
                });
                setIsOpen(false);
              }}
            >
              Transferir
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default TransferirModal; 