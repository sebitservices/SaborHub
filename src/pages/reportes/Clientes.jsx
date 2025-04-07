import Layout from '../../components/layout/Layout';

const Clientes = () => {
  return (
    <Layout>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Reportes de Clientes</h1>
        <p className="text-gray-600">
          Bienvenido a la sección de reportes de clientes. Aquí podrás visualizar información sobre
          clientes frecuentes, patrones de consumo y preferencias de tus comensales.
        </p>
        <div className="mt-8 p-8 bg-amber-50 rounded-lg border border-amber-200 text-center">
          <p className="text-amber-700 text-lg font-medium">
            El módulo de reportes de clientes está en desarrollo.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Clientes;
