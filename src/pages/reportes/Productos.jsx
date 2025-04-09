import Layout from '../../components/layout/Layout';

const Productos = () => {
  return (
    <Layout>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Reportes de Productos</h1>
        <p className="text-gray-600">
          Bienvenido a la sección de reportes de productos. Aquí podrás visualizar estadísticas sobre
          los productos más vendidos, márgenes de ganancia, y rotación de inventario.
        </p>
        <div className="mt-8 p-8 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
          <p className="text-emerald-700 text-lg font-medium">
            El módulo de reportes de productos está en desarrollo.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Productos;
