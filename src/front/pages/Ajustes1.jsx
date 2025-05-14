// src/pages/Ajustes1.jsx
import React, { useEffect, useState } from "react";
import { getAuthHeader, getUser } from "../utils/auth";
import "../assets/Ajustes1.css";

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function Ajustes1() {
  const [cameras, setCameras] = useState([]);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [newCamera, setNewCamera] = useState({
    name: "",
    municipio: "",
    ip_address: "",
    username: "",
    password: "",
    connection_method: "rtsp",
    location_lat: "",
    location_lng: "",
    is_active: true,
  });

  const user = getUser();

  const handleAuthError = () => {
    alert("Sesión caducada. Te redirigimos al login.");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  useEffect(() => {
    fetch(`${API_URL}/api/cameras`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    })
      .then(async (res) => {
        if (res.status === 401) { handleAuthError(); return []; }
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setCameras(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Error al cargar cámaras:", err);
        setCameras([]);
      });
  }, []);

  const handleEditClick = (cam) => {
    setEditId(cam.id);
    setFormData({
      name: cam.name,
      municipio: cam.municipio || "",
      ip_address: cam.ip_address,
      username: cam.username || "",
      password: cam.password || "",
      connection_method: "rtsp",
      location_lat: cam.location?.lat || "",
      location_lng: cam.location?.lng || "",
      is_active: cam.is_active,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      ...(name === "is_active" ? { [name]: value === "true" } : { [name]: value }),
    }));
  };

  const handleSave = (id) => {
    fetch(`${API_URL}/api/cameras/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(formData),
    })
      .then(async (res) => {
        if (res.status === 401) { handleAuthError(); return; }
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((updated) => {
        const newCam = updated.camera;
        setCameras((prev) => prev.map((c) => (c.id === id ? newCam : c)));
        setEditId(null);
        alert("Cámara actualizada correctamente");
      })
      .catch((err) => {
        console.error("Error al actualizar cámara:", err);
        alert(`No se pudo actualizar la cámara:\n${err.message}`);
      });
  };

  const handleDelete = (id) => {
    if (!window.confirm("¿Eliminar esta cámara?")) return;
    fetch(`${API_URL}/api/cameras/${id}`, {
      method: "DELETE",
      headers: getAuthHeader(),
    })
      .then(async (res) => {
        if (res.status === 401) { handleAuthError(); return; }
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(() => {
        setCameras((prev) => prev.filter((c) => c.id !== id));
        alert("Cámara eliminada correctamente");
      })
      .catch((err) => {
        console.error("Error al eliminar cámara:", err);
        alert(`No se pudo eliminar la cámara:\n${err.message}`);
      });
  };

  const handleAddCamera = () => setShowModal(true);

  const handleNewCameraChange = (e) => {
    const { name, value } = e.target;
    setNewCamera((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateCamera = () => {
    const values = Object.values(newCamera);
    if (values.some(val => val === "")) {
      alert("Todos los campos son obligatorios");
      return;
    }

    fetch(`${API_URL}/api/cameras`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(newCamera),
    })
      .then(async (res) => {
        if (res.status === 401) { handleAuthError(); return; }
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((created) => {
        const cam = created.camera;
        setCameras((prev) => [...prev, cam]);
        setShowModal(false);
        alert("Cámara añadida correctamente");
      })
      .catch((err) => {
        console.error("Error al crear cámara:", err);
        alert(`No se pudo crear la cámara:\n${err.message}`);
      });
  };

  return (
    <div className="content-container">
      <div className="ajustes-container">
        <div className="ajustes-header">
          <h1>Cámaras</h1>
          {user?.role === "admin" && (
            <button className="button-add" onClick={handleAddCamera}>
              + Añadir cámara
            </button>
          )}
        </div>

        <div className="table-container">
          <table className="ajustes-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Municipio</th>
                <th>IP</th>
                <th>Usuario</th>
                <th>Contraseña</th>
                <th>Método</th>
                <th>Lat</th>
                <th>Lng</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cameras.map((cam) => (
                <tr key={cam.id}>
                  <td>{cam.id}</td>
                  {editId === cam.id ? (
                    <>
                      <td><input className="input-field" name="name" value={formData.name} onChange={handleInputChange} /></td>
                      <td><input className="input-field" name="municipio" value={formData.municipio} onChange={handleInputChange} /></td>
                      <td><input className="input-field" name="ip_address" value={formData.ip_address} onChange={handleInputChange} /></td>
                      <td><input className="input-field" name="username" value={formData.username} onChange={handleInputChange} /></td>
                      <td><input className="input-field" name="password" value={formData.password} onChange={handleInputChange} /></td>
                      <td>RTSP</td>
                      <td><input className="input-field" name="location_lat" value={formData.location_lat} onChange={handleInputChange} /></td>
                      <td><input className="input-field" name="location_lng" value={formData.location_lng} onChange={handleInputChange} /></td>
                      <td>
                        <select className="input-field" name="is_active" value={formData.is_active} onChange={handleInputChange}>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </td>
                      <td>
                        <button className="button-save" onClick={() => handleSave(cam.id)}>💾</button>
                        <button className="button-cancel" onClick={() => setEditId(null)}>✖</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{cam.name}</td>
                      <td>{cam.municipio}</td>
                      <td>{cam.ip_address}</td>
                      <td>{cam.username}</td>
                      <td>{cam.password}</td>
                      <td>{cam.connection_method}</td>
                      <td>{cam.location?.lat}</td>
                      <td>{cam.location?.lng}</td>
                      <td>{cam.is_active ? "Sí" : "No"}</td>
                      <td>
                        {user?.role === "admin" && (
                          <>
                            <button className="button-edit" onClick={() => handleEditClick(cam)}>✏</button>
                            <button className="button-delete" onClick={() => handleDelete(cam.id)}>🗑</button>
                          </>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Crear nueva cámara</h3>
              <form>
                <input className="input-field" name="name" placeholder="Nombre" onChange={handleNewCameraChange} />
                <input className="input-field" name="municipio" placeholder="Municipio" onChange={handleNewCameraChange} />
                <input className="input-field" name="ip_address" placeholder="IP" onChange={handleNewCameraChange} />
                <input className="input-field" name="username" placeholder="Usuario" onChange={handleNewCameraChange} />
                <input className="input-field" name="password" placeholder="Contraseña" onChange={handleNewCameraChange} />
                <input className="input-field" name="location_lat" placeholder="Latitud" onChange={handleNewCameraChange} />
                <input className="input-field" name="location_lng" placeholder="Longitud" onChange={handleNewCameraChange} />
              </form>
              <div className="modal-buttons">
                <button className="save-btn" onClick={handleCreateCamera}>Guardar</button>
                <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
