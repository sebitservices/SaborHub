import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from './context/AuthContext';
import { auth } from './firebase/config';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Mesas from './pages/Mesas';
import Pedidos from './pages/Pedidos';
import Inventario from './pages/Inventario';
import Menu from './pages/Menu';
import Ventas from './pages/reportes/Ventas';
import Productos from './pages/reportes/Productos';
import Clientes from './pages/reportes/Clientes';
import Configuracion from './pages/Configuracion';
import NotFound from './pages/NotFound';
import Features from './pages/landing/Features';
import Pricing from './pages/landing/Pricing';
import About from './pages/landing/About';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { currentUser, loading } = useAuth();
  
  // Componente para rutas protegidas
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>;
    }

    if (!currentUser) {
      return <Navigate to="/" />;
    }

    return children;
  };

  return (
    <>
      <Routes>
        <Route path="/" element={!currentUser ? <Home /> : <Navigate to="/dashboard" />} />
        
        {/* Nuevas rutas para páginas de landing */}
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        
        {/* Rutas protegidas */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/mesas" element={<ProtectedRoute><Mesas /></ProtectedRoute>} />
        <Route path="/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
        <Route path="/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
        <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
        <Route path="/reportes/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
        <Route path="/reportes/productos" element={<ProtectedRoute><Productos /></ProtectedRoute>} />
        <Route path="/reportes/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
