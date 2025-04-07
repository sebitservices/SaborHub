import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faHome, faArrowLeft, faUtensils } from '@fortawesome/free-solid-svg-icons';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-8 relative">
          <div className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">
            404
          </div>
          <div className="absolute -top-4 -right-4 md:top-2 md:right-12 animate-bounce">
            <div className="relative w-16 h-16 md:w-20 md:h-20">
              <FontAwesomeIcon 
                icon={faCompass} 
                className="w-full h-full text-amber-500 opacity-30" 
                style={{ transform: 'rotate(45deg)' }}
              />
              <FontAwesomeIcon 
                icon={faCompass} 
                className="w-full h-full text-amber-400 absolute top-0 left-0 animate-ping opacity-75" 
                style={{ animationDuration: '4s', transform: 'rotate(45deg)' }}
              />
            </div>
          </div>
          <div className="absolute top-1/2 left-4 md:left-16 animate-pulse">
            <div className="relative w-12 h-12">
              <FontAwesomeIcon 
                icon={faUtensils} 
                className="w-full h-full text-slate-700 opacity-30"
              />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-white mb-6">
          ¡Página no encontrada!
        </h1>

        <p className="text-xl text-gray-300 mb-8 max-w-lg mx-auto">
          La página que estás buscando no existe o ha sido movida a otra ubicación.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faHome} className="mr-2" />
            <span>Ir al Inicio</span>
          </Link>

          <button 
            onClick={() => window.history.back()} 
            className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg font-medium hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            <span>Volver Atrás</span>
          </button>
        </div>

        <div className="mt-16 text-gray-400">
          <p>
            ¿Necesitas ayuda? <a href="#" className="text-amber-400 hover:text-amber-300">Contacta a soporte</a>
          </p>
        </div>

        <div className="w-full max-w-lg mx-auto h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent rounded-full mt-10"></div>
      </div>
    </div>
  );
};

export default NotFound;
