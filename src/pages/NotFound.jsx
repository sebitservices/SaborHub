import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import logoImage from '../assets/images/saborhub-horizontal.webp';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Elementos decorativos animados */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Logo con animación */}
        <div className="mb-12 transform hover:scale-105 transition-transform duration-300">
          <img 
            src={logoImage} 
            alt="SaborHub Logo" 
            className="h-16 w-auto mx-auto object-contain"
          />
        </div>

        {/* Contenedor principal con efecto glassmorphism */}
        <div className="bg-white/40 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-white/50 relative overflow-hidden">
          {/* Número 404 con animación */}
          <div className="relative mb-8">
            <div className="text-[12rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 animate-pulse">
              404
            </div>
            
            {/* Líneas decorativas animadas */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent transform -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-teal-400/40 to-transparent transform -translate-y-1/2 animate-pulse"></div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 relative">
            ¡Página no encontrada!
            <span className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"></span>
          </h1>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            La página que estás buscando parece haberse perdido en el ciberespacio.
            <br className="hidden md:block" />
            ¿Qué tal si volvemos a un lugar conocido?
          </p>

          {/* Botones con nuevos efectos */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link 
              to="/" 
              className="group relative px-8 py-4 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-xl font-medium overflow-hidden shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center">
                <FontAwesomeIcon icon={faHome} className="mr-2 group-hover:animate-bounce" />
                Volver al Inicio
              </span>
            </Link>

            <button 
              onClick={() => window.history.back()} 
              className="group px-8 py-4 bg-white/80 text-gray-700 rounded-xl font-medium border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" />
                Volver Atrás
              </span>
            </button>
          </div>
        </div>

        {/* Enlace de ayuda con nuevo estilo */}
        <div className="mt-12 text-gray-600">
          <p className="flex items-center justify-center gap-2">
            ¿Necesitas ayuda?{' '}
            <Link 
              to="/contact" 
              className="relative inline-flex text-emerald-600 hover:text-emerald-500 group items-center"
            >
              Contacta a soporte
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
            </Link>
          </p>
        </div>
      </div>

      {/* Estilo para las animaciones */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
