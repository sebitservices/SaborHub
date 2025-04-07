const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-sm text-gray-600">
            &copy; {year} SaborHub. Todos los derechos reservados.
          </p>
        </div>
        <div className="flex space-x-4">
          <button className="text-sm text-gray-600 hover:text-amber-600">Términos y condiciones</button>
          <button className="text-sm text-gray-600 hover:text-amber-600">Política de privacidad</button>
          <button className="text-sm text-gray-600 hover:text-amber-600">Soporte</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
