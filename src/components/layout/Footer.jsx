const Footer = ({ isMobile, isExpanded }) => {
  const year = new Date().getFullYear();

  return (
    <footer className={`
      fixed bottom-0 transition-all duration-300 bg-white/80 backdrop-blur-md border-t border-emerald-100 p-4 md:p-6 z-20
      ${isMobile ? 'left-0 right-0' : isExpanded ? 'left-64 right-0' : 'left-20 right-0'}
    `}>
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-sm text-gray-600">
            &copy; {year} SaborHub. Todos los derechos reservados.
          </p>
        </div>
        <div className="flex space-x-4">
          <button className="text-sm text-gray-600 hover:text-emerald-600 transition-colors duration-300">Términos y condiciones</button>
          <button className="text-sm text-gray-600 hover:text-emerald-600 transition-colors duration-300">Política de privacidad</button>
          <button className="text-sm text-gray-600 hover:text-emerald-600 transition-colors duration-300">Soporte</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
