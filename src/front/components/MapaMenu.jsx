import React from "react";
import Select from "react-select";
import { useMapaContext } from "../components/MapaContext";

function MapaMenu() {
    const {
        municipiosDisponibles,
        setMunicipioSeleccionado,
        camarasFiltradas,
        setCamaraSeleccionada
    } = useMapaContext();

    const opcionesMunicipios = municipiosDisponibles.map(m => ({ label: m, value: m }));

    const opcionesCamaras = camarasFiltradas.map(c => ({
        label: c.name,
        value: c.id,
        ...c // 🔁 Incluir toda la cámara para usar su ubicación al seleccionar
    }));

    const customStyles = {
        control: (base) => ({
            ...base,
            borderColor: '#ccc',
            boxShadow: 'none',
            minHeight: '36px',
            fontSize: '14px'
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? '#e0e0e0' : 'white',
            color: 'black',
            fontSize: '14px'
        })
    };

    return (
        <div className="mapa-menu" style={{ padding: '1rem' }}>
            <label style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Buscar municipio</label>
            <Select
                options={opcionesMunicipios}
                onChange={opcion => setMunicipioSeleccionado(opcion?.value || '')}
                isClearable
                placeholder="Buscar municipio..."
                styles={customStyles}
            />

            <label style={{ fontWeight: 'bold', margin: '1rem 0 0.5rem' }}>Buscar cámara</label>
            <Select
                options={opcionesCamaras}
                onChange={cam => setCamaraSeleccionada(cam)} // ✅ Abre el popup desde el contexto
                isClearable
                placeholder="Buscar cámara..."
                noOptionsMessage={() => "Sin resultados"}
                styles={customStyles}
            />
        </div>
    );
}

export default MapaMenu;
