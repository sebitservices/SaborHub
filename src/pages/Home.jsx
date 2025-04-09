import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Link } from 'react-router-dom';
// Importar el logo horizontal
import logoImage from '../assets/images/saborhub-horizontal.webp';

const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError('Credenciales incorrectas. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&q=80')] bg-cover bg-fixed bg-center bg-no-repeat">
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100">
        {/* Navbar con logo optimizado */}
        <nav className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-emerald-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center">
                <div className="flex items-center justify-center h-24 py-2">
                  <img 
                    src={logoImage} 
                    alt="SaborHub Logo" 
                    className="h-full w-auto object-contain scale-125"
                  />
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/features" className="text-gray-600 hover:text-emerald-500 relative group font-medium">
                  Características
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
                <Link to="/pricing" className="text-gray-600 hover:text-emerald-500 relative group font-medium">
                  Precios
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
                <Link to="/about" className="text-gray-600 hover:text-emerald-500 relative group font-medium">
                  Acerca de
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </Link>
                <Link to="/contact" className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-300">
                  Contacto
                </Link>
              </div>
              <div className="flex md:hidden items-center">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                  className="text-gray-600 hover:text-emerald-500 transition-colors duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Menú móvil */}
            <div 
              className={`
                md:hidden 
                absolute 
                top-full 
                left-0 
                w-full 
                transform 
                transition-all 
                duration-300 
                ease-in-out 
                backdrop-blur-lg
                ${isMenuOpen 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 -translate-y-4 pointer-events-none'
                }
              `}
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/90 shadow-lg border-b border-emerald-100">
                <Link
                  to="/features"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-600 hover:text-emerald-500 hover:bg-emerald-50 transition-all duration-300 transform hover:translate-x-2"
                >
                  Características
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-600 hover:text-emerald-500 hover:bg-emerald-50 transition-all duration-300 transform hover:translate-x-2"
                >
                  Precios
                </Link>
                <Link
                  to="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 rounded-md text-base font-medium text-gray-600 hover:text-emerald-500 hover:bg-emerald-50 transition-all duration-300 transform hover:translate-x-2"
                >
                  Acerca de
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-3 mt-4 rounded-md text-base font-medium bg-gradient-to-r from-emerald-400 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-600 transition-all duration-300 transform hover:translate-x-2 hover:shadow-lg"
                >
                  Contacto
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden py-12 lg:py-20">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
              alt="Restaurant Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/90"></div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="pb-16 sm:pb-24">
              <div className="mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                  {/* Hero Content */}
                  <div className="lg:w-1/2 sm:text-center lg:text-left">
                    <div className="inline-block mb-6 px-3 py-1 bg-emerald-50 rounded-full backdrop-blur-sm border border-emerald-200">
                      <p className="text-xs font-medium text-emerald-600">
                        Sistema de gestión premium para restaurantes
                      </p>
                    </div>
                    <h1 className="text-5xl tracking-tight font-extrabold text-gray-800 sm:text-6xl md:text-7xl">
                      <span className="block mb-2">Eleva tu</span>
                      <span className="block bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                        experiencia culinaria
                      </span>
                    </h1>
                    <p className="mt-6 text-lg text-gray-600 sm:text-xl max-w-3xl">
                      Optimiza tus operaciones, incrementa tus ventas y mejora la experiencia de tus clientes con nuestra plataforma integral diseñada para restaurantes.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center lg:justify-start justify-center">
                      <button className="px-8 py-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-emerald-200 hover:scale-105 transition-all duration-300">
                        Solicitar Demo
                      </button>
                      <button className="flex items-center justify-center px-8 py-3.5 rounded-lg border border-emerald-200 bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-emerald-50 transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Ver video
                      </button>
                    </div>
                  </div>

                  {/* Login Form */}
                  <div className="lg:w-1/2 w-full max-w-md mx-auto">
                    <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-emerald-100">
                      <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                        Accede a tu panel
                      </h2>
                      {error && (
                        <div className="bg-red-900/40 border-l-4 border-red-500 p-4 mb-6 rounded-r">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-red-400">{error}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Correo electrónico</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                            </div>
                            <input
                              type="email"
                              className="pl-10 block w-full px-3 py-3 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-700"
                              placeholder="ejemplo@correo.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Contraseña</label>
                            <a href="#" className="text-xs text-emerald-600 hover:text-emerald-500">¿Olvidaste tu contraseña?</a>
                          </div>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <input
                              type="password"
                              className="pl-10 block w-full px-3 py-3 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-700"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-gray-200 rounded bg-white" />
                          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">Recordarme</label>
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-emerald-400 to-teal-500 text-white rounded-md font-medium hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] transition-all duration-300 disabled:opacity-70"
                        >
                          {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : null}
                          {isLoading ? 'Accediendo...' : 'Iniciar Sesión'}
                        </button>
                      </form>
                      <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                          ¿Nuevo en SaborHub? <a href="#" className="text-emerald-600 hover:text-emerald-500 font-medium">Solicita acceso</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent sm:text-5xl mb-4">
                Características Premium
              </h2>
              <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                Todo lo que necesitas para gestionar tu restaurante de manera eficiente y aumentar tus ingresos
              </p>
            </div>

            <div className="mt-16 grid gap-8 grid-cols-1 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-emerald-200 transition-all duration-500 hover:scale-105 border border-emerald-100">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <div className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Gestión de Pedidos</h3>
                  <p className="text-gray-600 mb-6">Control total de pedidos en tiempo real con interfaz intuitiva para mesa, delivery y para llevar.</p>
                  <a href="#" className="inline-flex items-center text-emerald-600 hover:text-emerald-500 text-sm font-medium">
                    Más información
                    <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-emerald-200 transition-all duration-500 hover:scale-105 border border-emerald-100">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <div className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Analítica Avanzada</h3>
                  <p className="text-gray-600 mb-6">Reportes detallados sobre ventas, productos más populares y tendencias para tomar mejores decisiones.</p>
                  <a href="#" className="inline-flex items-center text-emerald-600 hover:text-emerald-500 text-sm font-medium">
                    Más información
                    <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-emerald-200 transition-all duration-500 hover:scale-105 border border-emerald-100">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <div className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">Gestión de Inventario</h3>
                  <p className="text-gray-600 mb-6">Control de stock y alertas automáticas para una gestión eficiente de tus insumos y productos.</p>
                  <a href="#" className="inline-flex items-center text-emerald-600 hover:text-emerald-500 text-sm font-medium">
                    Más información
                    <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <button className="px-8 py-3 bg-white backdrop-blur-sm hover:bg-emerald-50 text-gray-700 rounded-lg font-medium border border-emerald-200 hover:border-emerald-300 transition-all duration-300">
                Ver todas las características
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="bg-white border-t border-emerald-100 rounded-t-3xl mt-10">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3">
                  <img 
                    src={logoImage} 
                    alt="SaborHub Logo" 
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <p className="mt-4 text-gray-600 max-w-md">
                  La plataforma integral para restaurantes que optimiza operaciones, incrementa ventas y mejora la experiencia de los clientes.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-emerald-600 tracking-wider uppercase">Plataforma</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link to="/features" className="text-gray-600 hover:text-emerald-500 relative group">
                      Características
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/pricing" className="text-gray-600 hover:text-emerald-500 relative group">
                      Precios
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-gray-600 hover:text-emerald-500 relative group">
                      Integraciones
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-gray-600 hover:text-emerald-500 relative group">
                      Actualizaciones
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-emerald-600 tracking-wider uppercase">Soporte</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link to="#" className="text-gray-600 hover:text-emerald-500 relative group">
                      Centro de ayuda
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-600 hover:text-emerald-500 relative group">
                      Contacto
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="text-gray-600 hover:text-emerald-500 relative group">
                      Documentación
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/about" className="text-gray-600 hover:text-emerald-500 relative group">
                      Acerca de nosotros
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-emerald-100">
              <p className="text-gray-500 text-sm text-center">
                © {new Date().getFullYear()} SaborHub. Todos los derechos reservados. Sistema desarrollado por{' '}
                <a 
                  href="https://sebitservices.cl" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-600 hover:text-emerald-500 relative group"
                >
                  sebitservices.cl
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
