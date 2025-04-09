import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faChartLine, 
  faMobileScreen, 
  faCloudArrowUp,
  faShieldHalved,
  faRobot,
  faChartPie
} from '@fortawesome/free-solid-svg-icons';

const Features = () => {
  const features = [
    {
      icon: faChartLine,
      title: "Análisis en Tiempo Real",
      description: "Monitorea el rendimiento de tu restaurante con métricas detalladas y reportes en tiempo real."
    },
    {
      icon: faMobileScreen,
      title: "Interfaz Intuitiva",
      description: "Diseño responsive y fácil de usar que funciona en cualquier dispositivo."
    },
    {
      icon: faCloudArrowUp,
      title: "Respaldo en la Nube",
      description: "Tus datos siempre seguros y accesibles con nuestro sistema de respaldo automático."
    },
    {
      icon: faShieldHalved,
      title: "Seguridad Avanzada",
      description: "Protección de datos de última generación para tu tranquilidad."
    },
    {
      icon: faRobot,
      title: "Automatización Inteligente",
      description: "Optimiza tus operaciones con nuestras herramientas de automatización."
    },
    {
      icon: faChartPie,
      title: "Gestión de Inventario",
      description: "Control preciso de tu inventario con alertas y reportes detallados."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Botón de regreso */}
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-600 hover:text-emerald-500 transition-all duration-300 group mb-8"
        >
          <FontAwesomeIcon 
            icon={faArrowLeft} 
            className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" 
          />
          Volver al inicio
        </Link>

        {/* Encabezado */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent mb-4">
            Características de SaborHub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre todas las herramientas que tenemos para impulsar tu negocio
          </p>
        </div>

        {/* Grid de características */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white/70 backdrop-blur-lg rounded-2xl p-6 border border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mb-4 transform rotate-6 hover:rotate-0 transition-transform duration-300">
                <FontAwesomeIcon icon={feature.icon} className="text-white text-xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              ¿Listo para revolucionar tu restaurante?
            </h2>
            <p className="text-emerald-50 mb-6">
              Únete a los cientos de restaurantes que ya confían en SaborHub
            </p>
            <button className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors duration-300">
              Comenzar ahora
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} SaborHub. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default Features;
