import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si el dispositivo es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Comprobar al cargar
    checkMobile();
    
    // Comprobar al cambiar el tamaño de la ventana
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Función mejorada para alternar el sidebar
  const toggleSidebar = (forcedState) => {
    if (typeof forcedState === 'boolean') {
      setSidebarOpen(forcedState);
    } else {
      setSidebarOpen(prev => !prev);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar para escritorio - posición fija */}
      <div className="hidden md:block relative">
        <Sidebar 
          isMobile={false}
          isExpanded={sidebarExpanded} 
          toggleExpanded={setSidebarExpanded} 
          sidebarOpen={true} // En escritorio siempre está visible
        />
      </div>

      {/* Sidebar para móvil - modal */}
      <div className="md:hidden">
        <Sidebar 
          isMobile={true} 
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          isExpanded={true} // En móvil siempre está expandido
        />
      </div>

      {/* Main content */}
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${sidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
        <Navbar 
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
