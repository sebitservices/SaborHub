import Layout from '../components/layout/Layout';

const Pedidos = () => {
  return (
    <Layout>
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Pedidos</h1>
        <p className="text-gray-600">
          Bienvenido a la sección de gestión de pedidos. Aquí podrás crear nuevos pedidos, 
          dar seguimiento a los existentes y gestionar el estado de las órdenes en curso.
        </p>
        <div className="mt-8 p-8 bg-amber-50 rounded-lg border border-amber-200 text-center">
          <p className="text-amber-700 text-lg font-medium">
            El módulo de administración de pedidos está en desarrollo.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Pedidos;
