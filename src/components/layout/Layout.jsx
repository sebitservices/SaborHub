import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MobileSidebar from './MobileSidebar';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setIsExpanded(false);
      }
      setIsSidebarOpen(false);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = (value) => {
    setIsSidebarOpen(typeof value === 'boolean' ? value : !isSidebarOpen);
  };

  const toggleExpanded = (value) => {
    setIsExpanded(typeof value === 'boolean' ? value : !isExpanded);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para desktop */}
      <Sidebar 
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
      />

      {/* Sidebar para móvil */}
      <MobileSidebar 
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      
      <div className={`
        flex-1 flex flex-col transition-all duration-300
        ${!isMobile && isExpanded ? 'ml-64' : ''}
        ${!isMobile && !isExpanded ? 'ml-20' : ''}
      `}>
        <Navbar 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={isSidebarOpen} 
          isMobile={isMobile}
          isExpanded={isExpanded}
        />
        
        <main className="flex-1 pt-16 pb-24">
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>

        <Footer 
          isMobile={isMobile}
          isExpanded={isExpanded}
        />
      </div>
    </div>
  );
};

export default Layout;
