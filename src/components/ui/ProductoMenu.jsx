import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faCreditCard, 
  faArrowRightArrowLeft, 
  faSitemap, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-hot-toast';

const ProductoMenu = ({ 
  producto, 
  position, 
  onClose, 
  onQuitarProducto,
  onMarcarEntregado,
  onMarcarPagado,
  onTransferirAMesa,
  onSepararItems
}) => {
  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-56"
      style={{
        top: `calc(${position.y}px - 190px)`, // Posicionar encima del producto
        left: position.x,
        transform: 'translateX(-50%)', // Centrar horizontalmente
        maxHeight: '300px',
        overflow: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center"
        onClick={() => {
          if (typeof onMarcarEntregado === 'function') {
            onMarcarEntregado(producto);
          } else {
            toast.info('Función de marcar como entregado será implementada próximamente');
          }
          onClose();
        }}
      >
        <FontAwesomeIcon icon={faCheck} className="mr-2 w-4 h-4" />
        Marcar como entregado
      </button>
      <button
        className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center"
        onClick={() => {
          if (typeof onMarcarPagado === 'function') {
            onMarcarPagado(producto);
          } else {
            toast.info('Función de marcar como pagado será implementada próximamente');
          }
          onClose();
        }}
      >
        <FontAwesomeIcon icon={faCreditCard} className="mr-2 w-4 h-4" />
        Marcar como pagado
      </button>
      
      {/* Transferir a otra mesa */}
      <button
        className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center"
        onClick={() => {
          if (typeof onTransferirAMesa === 'function') {
            onTransferirAMesa(producto);
          } else {
            toast.info('Función de transferir a otra mesa será implementada próximamente');
          }
          onClose();
        }}
      >
        <FontAwesomeIcon icon={faArrowRightArrowLeft} className="mr-2 w-4 h-4" />
        Transferir a otra mesa
      </button>
      
      {/* Separar ítems (solo si hay más de 1) */}
      {producto.cantidad > 1 && (
        <button
          className="w-full px-4 py-2 text-left text-sm text-purple-600 hover:bg-purple-50 flex items-center"
          onClick={() => {
            if (typeof onSepararItems === 'function') {
              onSepararItems(producto);
            } else {
              toast.info('Función de separar ítems será implementada próximamente');
            }
            onClose();
          }}
        >
          <FontAwesomeIcon icon={faSitemap} className="mr-2 w-4 h-4" />
          Separar ítems
        </button>
      )}
      
      <div className="border-t border-gray-100 my-1"></div>
      <button
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
        onClick={() => {
          onQuitarProducto(producto);
          onClose();
        }}
      >
        <FontAwesomeIcon icon={faTimes} className="mr-2 w-4 h-4" />
        Quitar del pedido
      </button>
    </div>
  );
};

export default ProductoMenu; 