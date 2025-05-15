// src/main.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { StoreProvider } from './hooks/useGlobalReducer';
import { ColumnModalProvider } from './components/ColumnModalContext.jsx'; // ✅ importa el nuevo contexto
import { BackendURL } from './components/BackendURL';
import Header from './components/Header';
import LeftBar from './components/LeftBar';
import './leafletIcon.js';
import VideoWall from './pages/VideoWall';
import Mapa from './pages/Mapa';
import Registros from './pages/Registros';
import Ajustes from './pages/Ajustes';
import Ajustes1 from './pages/Ajustes1';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate
} from 'react-router-dom';

function LayoutWrapper({
  children,
  setVideoLayout,
  setSelectedCameras,
  activeBoxIndex,
  setActiveBoxIndex,
  filters,
  setFilters
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && !isLoginPage) {
      navigate('/login');
    }
  }, [location, navigate, isLoginPage]);

  return (
    <>
      {!isLoginPage && (
        <>
          <Header />
          <LeftBar
            setVideoLayout={setVideoLayout}
            setSelectedCameras={setSelectedCameras}
            activeBoxIndex={activeBoxIndex}
            setActiveBoxIndex={setActiveBoxIndex}
            filters={filters}
            setFilters={setFilters}
          />
        </>
      )}
      {children}
    </>
  );
}

function Main() {
  if (!import.meta.env.VITE_BACKEND_URL) {
    return (
      <React.StrictMode>
        <BackendURL />
      </React.StrictMode>
    );
  }

  const [videoLayout, setVideoLayout] = useState('1');
  const [selectedCameras, setSelectedCameras] = useState([]);
  const [activeBoxIndex, setActiveBoxIndex] = useState(null);
  const [filters, setFilters] = useState({});

  return (
    <React.StrictMode>
      <StoreProvider>
        <ColumnModalProvider> {/* ✅ envolver aquí toda la app */}
          <Router>
            <LayoutWrapper
              setVideoLayout={setVideoLayout}
              setSelectedCameras={setSelectedCameras}
              activeBoxIndex={activeBoxIndex}
              setActiveBoxIndex={setActiveBoxIndex}
              filters={filters}
              setFilters={setFilters}
            >
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/register"
                  element={
                    <PrivateRoute>
                      <Register />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <VideoWall
                        layout={videoLayout}
                        selectedCameras={selectedCameras}
                        setSelectedCameras={setSelectedCameras}
                        activeBoxIndex={activeBoxIndex}
                        setActiveBoxIndex={setActiveBoxIndex}
                      />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/mapa"
                  element={
                    <PrivateRoute>
                      <Mapa />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/registros"
                  element={
                    <PrivateRoute>
                      <Registros filters={filters} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/ajustes"
                  element={
                    <PrivateRoute>
                      <Ajustes />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/ajustes1"
                  element={
                    <PrivateRoute>
                      <Ajustes1 />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </LayoutWrapper>
          </Router>
        </ColumnModalProvider>
      </StoreProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />);
