import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Login from './auth/Login';
import Layout from './components/Layout';
import Usuarios from './pages/Usuarios';
import RegistrosKm from './pages/RegistrosKm';
import PainelAbastecimento from './pages/PainelAbastecimento';
import ListaAbastecimentos from './components/ListaAbastecimentos'; // import já está ok
import MapaTempoReal from './pages/MapaTempoReal';

const isAuthenticated = () => !!localStorage.getItem('token');

function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" />;
}

function App() {
  const [autenticado, setAutenticado] = useState(isAuthenticated());

  useEffect(() => {
    const verificar = () => setAutenticado(isAuthenticated());
    window.addEventListener('storage', verificar);
    return () => window.removeEventListener('storage', verificar);
  }, []);

  if (!autenticado) {
    return <Login onLogin={() => setAutenticado(true)} />;
  }

  return (
    <Layout>
      <Routes>
        <Route
          path="/usuarios"
          element={
            <PrivateRoute>
              <Usuarios />
            </PrivateRoute>
          }
        />
        <Route
          path="/registros-km"
          element={
            <PrivateRoute>
              <RegistrosKm />
            </PrivateRoute>
          }
        />
        <Route
          path="/painel-abastecimento"
          element={
            <PrivateRoute>
              <PainelAbastecimento />
            </PrivateRoute>
          }
        />
        <Route
          path="/lista-abastecimentos"
          element={
            <PrivateRoute>
              <ListaAbastecimentos />
            </PrivateRoute>
          }
        />
        <Route
          path="/mapa-tempo-real"
          element={
            <PrivateRoute>
              <MapaTempoReal />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/usuarios" />} />
      </Routes>
    </Layout>
  );
}

export default App;
