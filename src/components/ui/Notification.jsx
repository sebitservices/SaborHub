import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faTimes, 
  faExclamationTriangle, 
  faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';
import { createPortal } from 'react-dom';

// Tipos de notificación: success, error, warning, info
const Notification = ({ 
  type = 'success', 
  message, 
  duration = 3000, 
  onClose, 
  isVisible 
}) => {
  const [show, setShow] = useState(isVisible);
  
  useEffect(() => {
    setShow(isVisible);
    
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => onClose?.(), 300); // Esperar a que termine la animación
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);
  
  const icons = {
    success: faCheck,
    error: faTimes,
    warning: faExclamationTriangle,
    info: faInfoCircle
  };
  
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500'
  };
  
  const bgColors = {
    success: 'bg-gradient-to-r from-green-500 to-green-600',
    error: 'bg-gradient-to-r from-red-500 to-red-600',
    warning: 'bg-gradient-to-r from-amber-500 to-amber-600',
    info: 'bg-gradient-to-r from-blue-500 to-blue-600'
  };
  
  if (!show) return null;
  
  return createPortal(
    <div 
      className={`fixed top-4 right-4 z-[10000] rounded-lg shadow-lg max-w-sm transition-all transform duration-300 ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <div className={`${bgColors[type]} text-white px-4 py-3 rounded-lg shadow-md flex items-center space-x-3`}>
        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${colors[type]} flex items-center justify-center bg-opacity-80`}>
          <FontAwesomeIcon icon={icons[type]} className="h-4 w-4" />
        </div>
        <div className="flex-1 ml-2 mr-1">{message}</div>
        <button 
          onClick={() => {
            setShow(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="focus:outline-none bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full h-6 w-6 inline-flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Notification;
