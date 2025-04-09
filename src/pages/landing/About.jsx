import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUsers } from '@fortawesome/free-solid-svg-icons';

const About = () => {
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

        {/* Contenedor principal */}
        <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-emerald-100 p-8 md:p-12">
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mx-auto flex items-center justify-center mb-6 transform rotate-12 hover:rotate-0 transition-all duration-500">
              <FontAwesomeIcon icon={faUsers} className="text-white text-3xl" />
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent mb-4">
              Acerca de SaborHub
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transformando la gestión de restaurantes con tecnología innovadora
            </p>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-8 mb-8">
              <p className="text-lg text-gray-600 leading-relaxed">
                ¡Bienvenido a nuestra página! Estamos trabajando arduamente para traerte más información sobre quiénes somos y nuestra misión de revolucionar la industria restaurantera.
              </p>
            </div>

            <div className="inline-flex items-center space-x-2 text-emerald-600">
              <span className="animate-pulse">•</span>
              <span>Más información próximamente</span>
              <span className="animate-pulse">•</span>
            </div>
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

export default About;
