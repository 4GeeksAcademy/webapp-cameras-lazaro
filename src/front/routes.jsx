import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import AjustesMenu from "./components/AjustesMenu.jsx";
import CameraModal from "./components/CameraModal.jsx";
import Header from "./components/Header.jsx";
import LeftBar from "./components/LeftBar.jsx";
import MapaMenu from "./components/MapaMenu.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import RegistrosMenu from "./components/RegistrosMenu.jsx";
import VideoWallMenu from "./components/VideoWallMenu.jsx";
import Ajustes from "./pages/Ajustes.jsx";
import Ajustes1 from "./pages/Ajustes1.jsx";
import Login from "./pages/Login.jsx";
import Mapa from "./pages/Mapa.jsx";
import Register from "./pages/Register.jsx";
import Registros from "./pages/Registros.jsx";
import VideoWall from "./pages/VideoWall.jsx";
import leafletIconFix from "./leafletIconFix.jsx";



export const router = createBrowserRouter(
    createRoutesFromElements(

      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

        <Route path= "/" element={<Home />} />
        <Route path="/single/:theId" element={ <Single />} />  
        <Route path="/demo" element={<Demo />} />
      </Route>
    )
);