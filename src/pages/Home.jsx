import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

const Home = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-b from-black/70 via-black/60 to-black/80">
        {/* Navbar */}
        <nav className="bg-black/40 backdrop-blur-md shadow-xl sticky top-0 z-50 border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <span className="text-3xl font-extrabold bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  SaborHub
                </span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-gray-200 hover:text-amber-300 font-medium transition-colors duration-300">
                  Características
                </a>
                <a href="#" className="text-gray-200 hover:text-amber-300 font-medium transition-colors duration-300">
                  Precios
                </a>
                <a href="#" className="text-gray-200 hover:text-amber-300 font-medium transition-colors duration-300">
                  Acerca de
                </a>
                <button className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300">
                  Contacto
                </button>
              </div>
              <div className="flex md:hidden items-center">
                <button className="text-white hover:text-amber-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative bg-transparent overflow-hidden py-12 lg:py-20">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-amber-500/10 to-transparent"></div>
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/30 to-transparent"></div>
          
          <div className="max-w-7xl mx-auto relative">
            <div className="pb-16 sm:pb-24">
              <div className="mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                  {/* Hero Content */}
                  <div className="lg:w-1/2 sm:text-center lg:text-left">
                    <div className="inline-block mb-6 px-3 py-1 bg-amber-900/30 rounded-full backdrop-blur-sm border border-amber-500/30">
                      <p className="text-xs font-medium text-amber-300">
                        Sistema de gestión premium para restaurantes
                      </p>
                    </div>
                    <h1 className="text-5xl tracking-tight font-extrabold text-white sm:text-6xl md:text-7xl">
                      <span className="block mb-2">Eleva tu</span>
                      <span className="block bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                        experiencia culinaria
                      </span>
                    </h1>
                    <p className="mt-6 text-lg text-gray-300 sm:text-xl max-w-3xl">
                      Optimiza tus operaciones, incrementa tus ventas y mejora la experiencia de tus clientes con nuestra plataforma integral diseñada para restaurantes.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center lg:justify-start justify-center">
                      <button className="px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300">
                        Solicitar Demo
                      </button>
                      <button className="flex items-center justify-center px-8 py-3.5 rounded-lg border border-gray-300/30 bg-white/5 backdrop-blur-sm text-gray-200 hover:bg-white/10 transition-all duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Ver video
                      </button>
                    </div>
                  </div>

                  {/* Login Form */}
                  <div className="lg:w-1/2 w-full max-w-md mx-auto">
                    <div className="bg-black/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-amber-500/20">
                      <h2 className="text-2xl font-bold text-white mb-8 text-center">
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
                          <label className="block text-sm font-medium text-gray-200 mb-1">Correo electrónico</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                              </svg>
                            </div>
                            <input
                              type="email"
                              className="pl-10 block w-full px-3 py-3 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-black/30 text-gray-100"
                              placeholder="ejemplo@correo.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <label className="block text-sm font-medium text-gray-200 mb-1">Contraseña</label>
                            <a href="#" className="text-xs text-amber-400 hover:text-amber-300">¿Olvidaste tu contraseña?</a>
                          </div>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <input
                              type="password"
                              className="pl-10 block w-full px-3 py-3 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-black/30 text-gray-100"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-700 rounded bg-black/30" />
                          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">Recordarme</label>
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full flex items-center justify-center py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-md font-medium hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-70"
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
                        <p className="text-sm text-gray-400">
                          ¿Nuevo en SaborHub? <a href="#" className="text-amber-400 hover:text-amber-300 font-medium">Solicita acceso</a>
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
              <h2 className="text-4xl font-extrabold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent sm:text-5xl mb-4">
                Características Premium
              </h2>
              <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
                Todo lo que necesitas para gestionar tu restaurante de manera eficiente y aumentar tus ingresos
              </p>
            </div>

            <div className="mt-16 grid gap-8 grid-cols-1 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative bg-gradient-to-b from-gray-900/90 to-black/90 rounded-2xl shadow-2xl overflow-hidden hover:shadow-amber-500/20 transition-all duration-500 hover:scale-105 border border-amber-500/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-500"></div>
                <div className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Gestión de Pedidos</h3>
                  <p className="text-gray-300 mb-6">Control total de pedidos en tiempo real con interfaz intuitiva para mesa, delivery y para llevar.</p>
                  <a href="#" className="inline-flex items-center text-amber-400 hover:text-amber-300 text-sm font-medium">
                    Más información
                    <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative bg-gradient-to-b from-gray-900/90 to-black/90 rounded-2xl shadow-2xl overflow-hidden hover:shadow-amber-500/20 transition-all duration-500 hover:scale-105 border border-amber-500/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-500"></div>
                <div className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Analítica Avanzada</h3>
                  <p className="text-gray-300 mb-6">Reportes detallados sobre ventas, productos más populares y tendencias para tomar mejores decisiones.</p>
                  <a href="#" className="inline-flex items-center text-amber-400 hover:text-amber-300 text-sm font-medium">
                    Más información
                    <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative bg-gradient-to-b from-gray-900/90 to-black/90 rounded-2xl shadow-2xl overflow-hidden hover:shadow-amber-500/20 transition-all duration-500 hover:scale-105 border border-amber-500/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-500"></div>
                <div className="p-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Gestión de Inventario</h3>
                  <p className="text-gray-300 mb-6">Control de stock y alertas automáticas para una gestión eficiente de tus insumos y productos.</p>
                  <a href="#" className="inline-flex items-center text-amber-400 hover:text-amber-300 text-sm font-medium">
                    Más información
                    <svg className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <button className="px-8 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg font-medium border border-amber-500/30 hover:border-amber-500/60 transition-all duration-300">
                Ver todas las características
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="bg-black/70 backdrop-blur-md border-t border-amber-500/20">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                    SaborHub
                  </span>
                </div>
                <p className="mt-4 text-gray-400 max-w-md">
                  La plataforma integral para restaurantes que optimiza operaciones, incrementa ventas y mejora la experiencia de los clientes.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Plataforma</h3>
                <ul className="mt-4 space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-amber-300">Características</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-amber-300">Precios</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-amber-300">Integraciones</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-amber-300">Actualizaciones</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-300 tracking-wider uppercase">Soporte</h3>
                <ul className="mt-4 space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-amber-300">Centro de ayuda</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-amber-300">Contacto</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-amber-300">Documentación</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-amber-300">FAQ</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-800">
              <p className="text-gray-400 text-sm text-center">
                © {new Date().getFullYear()} SaborHub. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
