import { Fragment, useState } from 'react';
import { Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faPlus,
  faMinus,
  faComment
} from '@fortawesome/free-solid-svg-icons';

const ModificadoresDrawer = ({
  showModifiersModal,
  selectedProduct,
  modifierQuantity,
  setModifierQuantity,
  setShowModifiersModal,
  setSelectedProduct,
  setSelectedModifiers,
  selectedModifiers,
  handleModifierChange,
  addProductWithModifiers
}) => {
  const [comentario, setComentario] = useState('');

  const handleAddWithComment = () => {
    // Llamar a la función de agregar producto, pasando el comentario
    addProductWithModifiers(comentario);
    // Limpiar el comentario para futuras adiciones
    setComentario('');
  };

  return (
    <Transition.Root show={showModifiersModal} as={Fragment}>
      <div className="fixed inset-0 overflow-hidden z-[70]">
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
            onClick={() => {
              setShowModifiersModal(false);
              setSelectedProduct(null);
              setSelectedModifiers({});
              setModifierQuantity(1);
              setComentario(''); // Limpiar comentario al cerrar
            }}
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
            <div className="relative w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="px-6 py-5 bg-white border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-gray-900">
                        {selectedProduct?.nombre}
                      </h2>
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Selecciona las opciones para este producto
                        </p>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setModifierQuantity(prev => Math.max(1, prev - 1))}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            disabled={modifierQuantity <= 1}
                          >
                            <FontAwesomeIcon icon={faMinus} className="h-4 w-4" />
                          </button>
                          <span className="text-lg font-medium text-gray-900 w-8 text-center">
                            {modifierQuantity}
                          </span>
                          <button
                            onClick={() => setModifierQuantity(prev => prev + 1)}
                            className="p-1 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors"
                          >
                            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors"
                      onClick={() => {
                        setShowModifiersModal(false);
                        setSelectedProduct(null);
                        setSelectedModifiers({});
                        setModifierQuantity(1);
                        setComentario(''); // Limpiar comentario al cerrar
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {selectedProduct?.modificadores?.map((modificador) => (
                      <div key={modificador.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">{modificador.nombre}</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {modificador.tipo === 'multiple' ? 'Puedes seleccionar varias opciones' : 'Selecciona una opción'}
                          </p>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {modificador.opciones.map((opcion) => (
                            <label
                              key={opcion.id}
                              className="flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <input
                                type={modificador.tipo === 'multiple' ? 'checkbox' : 'radio'}
                                name={`modificador-${modificador.id}`}
                                value={opcion.id}
                                checked={
                                  modificador.tipo === 'multiple'
                                    ? selectedModifiers[modificador.id]?.includes(opcion.id)
                                    : selectedModifiers[modificador.id] === opcion.id
                                }
                                onChange={() => {
                                  if (modificador.tipo === 'multiple') {
                                    const currentSelections = selectedModifiers[modificador.id] || [];
                                    const newSelections = currentSelections.includes(opcion.id)
                                      ? currentSelections.filter(id => id !== opcion.id)
                                      : [...currentSelections, opcion.id];
                                    handleModifierChange(modificador.id, newSelections);
                                  } else {
                                    handleModifierChange(modificador.id, opcion.id);
                                  }
                                }}
                                className={`h-4 w-4 ${
                                  modificador.tipo === 'multiple'
                                    ? 'rounded text-emerald-600 focus:ring-emerald-500'
                                    : 'rounded-full text-emerald-600 focus:ring-emerald-500'
                                } border-gray-300`}
                              />
                              <div className="ml-3 flex flex-1 justify-between items-center">
                                <span className="text-sm font-medium text-gray-900">{opcion.nombre}</span>
                                {opcion.precio > 0 && (
                                  <span className="text-sm font-medium text-gray-500">
                                    + ${opcion.precio?.toLocaleString('es-CL')}
                                  </span>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Campo de comentario */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center">
                          <FontAwesomeIcon icon={faComment} className="text-emerald-500 mr-2" />
                          Comentarios para cocina
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Añade instrucciones especiales para la preparación
                        </p>
                      </div>
                      <div className="p-4">
                        <textarea
                          value={comentario}
                          onChange={(e) => setComentario(e.target.value)}
                          placeholder="Ej: Sin cebolla, poco picante, etc."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                          rows={3}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6">
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Precio unitario:</span>
                      <span className="font-medium text-gray-900">
                        ${selectedProduct?.precio?.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                      <span>Cantidad:</span>
                      <span className="font-medium text-gray-900">{modifierQuantity}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-base font-semibold">
                      <span>Total:</span>
                      <span className="text-emerald-600">
                        ${((selectedProduct?.precio || 0) * modifierQuantity).toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddWithComment}
                    className="w-full bg-emerald-600 text-white px-6 py-4 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center font-semibold text-lg"
                  >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Agregar {modifierQuantity} al Pedido
                  </button>
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </div>
    </Transition.Root>
  );
};

export default ModificadoresDrawer; 