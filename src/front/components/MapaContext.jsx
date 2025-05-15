import React, { createContext, useContext, useState } from 'react';

const MapaContext = createContext();

export function MapaProvider({ children }) {
    const [municipioSeleccionado, setMunicipioSeleccionado] = useState('');
    const [centroMunicipio, setCentroMunicipio] = useState(null); // [lat, lng]
    const [municipiosDisponibles, setMunicipiosDisponibles] = useState([]); // array de strings
    const [camarasFiltradas, setCamarasFiltradas] = useState([]); // cámaras visibles
    const [camaraSeleccionada, setCamaraSeleccionada] = useState(null); // cámara seleccionada para centrar

    return (
        <MapaContext.Provider
            value={{
                municipioSeleccionado,
                setMunicipioSeleccionado,
                centroMunicipio,
                setCentroMunicipio,
                municipiosDisponibles,
                setMunicipiosDisponibles,
                camarasFiltradas,
                setCamarasFiltradas,
                camaraSeleccionada,
                setCamaraSeleccionada
            }}
        >
            {children}
        </MapaContext.Provider>
    );
}

export function useMapaContext() {
    return useContext(MapaContext);
}
