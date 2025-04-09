import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faCheck, 
  faStar,
  faRocket,
  faCrown
} from '@fortawesome/free-solid-svg-icons';

const Pricing = () => {
  const plans = [
    {
      name: "Básico",
      icon: faStar,
      price: "29",
      description: "Perfecto para restaurantes pequeños",
      features: [
        "Gestión de pedidos básica",
        "Panel de administración",
        "Reportes mensuales",
        "1 usuario",
        "Soporte por email"
      ]
    },
    {
      name: "Profesional",
      icon: faRocket,
      price: "79",
      description: "Ideal para restaurantes en crecimiento",
      popular: true,
      features: [
        "Todo lo del plan Básico",
        "Análisis en tiempo real",
        "Gestión de inventario",
        "5 usuarios",
        "Soporte prioritario 24/7"
      ]
    },
    {
      name: "Enterprise",
      icon: faCrown,
      price: "199",
      description: "Para cadenas de restaurantes",
      features: [
        "Todo lo del plan Profesional",
        "API personalizada",
        "Integración con POS",
        "Usuarios ilimitados",
        "Gerente de cuenta dedicado"
      ]
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
            Planes y Precios
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Elige el plan perfecto para tu negocio
          </p>
        </div>

        {/* Grid de precios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-white/70 backdrop-blur-lg rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${
                plan.popular 
                  ? 'border-emerald-200 shadow-xl scale-105 hover:shadow-emerald-200/50' 
                  : 'border-emerald-100 shadow-lg hover:shadow-xl'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Más Popular
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${
                  plan.popular ? 'from-emerald-400 to-teal-500' : 'from-gray-100 to-gray-200'
                } rounded-2xl flex items-center justify-center mb-4`}>
                  <FontAwesomeIcon 
                    icon={plan.icon} 
                    className={`text-2xl ${plan.popular ? 'text-white' : 'text-gray-600'}`} 
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-800">$</span>
                  <span className="text-6xl font-bold text-gray-800">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/mes</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-600">
                    <FontAwesomeIcon 
                      icon={faCheck} 
                      className={`mr-3 ${
                        plan.popular ? 'text-emerald-500' : 'text-gray-400'
                      }`} 
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-200/50'
                    : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                }`}
              >
                Comenzar ahora
              </button>
            </div>
          ))}
        </div>

        {/* Sección de garantía */}
        <div className="mt-16 text-center bg-white/70 backdrop-blur-lg rounded-2xl p-8 border border-emerald-100 shadow-lg max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Garantía de satisfacción 100%
          </h2>
          <p className="text-gray-600">
            Prueba SaborHub sin riesgo. Si no estás completamente satisfecho, te devolvemos tu dinero en los primeros 30 días.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} SaborHub. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default Pricing;
