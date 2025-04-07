import Layout from '../../components/layout/Layout';

const Ventas = () => {
  return (
    <Layout>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Reportes de Ventas</h1>
        <p className="text-gray-600">
          Bienvenido a la sección de reportes de ventas. Aquí podrás visualizar información detallada sobre
          ventas diarias, semanales, mensuales y personalizadas por periodo.
        </p>
        <div className="mt-8 p-8 bg-amber-50 rounded-lg border border-amber-200 text-center">
          <p className="text-amber-700 text-lg font-medium">
            El módulo de reportes de ventas está en desarrollo.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Ventas;
