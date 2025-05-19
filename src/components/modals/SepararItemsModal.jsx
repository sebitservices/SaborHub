import { Fragment, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

const SepararItemsModal = ({ 
  isOpen, 
  setIsOpen, 
  producto,
  onSeparar
}) => {
  const [cantidad, setCantidad] = useState(1);
  
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
                Separar ítems
              </DialogTitle>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Selecciona cuántos ítems de {producto?.nombre} deseas separar
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center items-center">
            <button
              onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              disabled={cantidad <= 1}
            >
              <FontAwesomeIcon icon={faMinus} className="h-5 w-5" />
            </button>
            <span className="mx-6 text-xl font-medium text-gray-900">{cantidad}</span>
            <button
              onClick={() => setCantidad(prev => Math.min((producto?.cantidad - 1) || 1, prev + 1))}
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              disabled={cantidad >= ((producto?.cantidad - 1) || 1)}
            >
              <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:col-start-2 sm:text-sm"
              onClick={() => {
                if (typeof onSeparar === 'function') {
                  onSeparar(producto, cantidad);
                } else {
                  // Implementación predeterminada
                  toast.success(`Se han separado ${cantidad} unidades de ${producto?.nombre}`, {
                    position: "bottom-left",
                    autoClose: 2000
                  });
                }
                setIsOpen(false);
                setCantidad(1); // Reiniciar contador
              }}
            >
              Separar
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              onClick={() => {
                setIsOpen(false);
                setCantidad(1); // Reiniciar contador
              }}
            >
              Cancelar
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default SepararItemsModal; 