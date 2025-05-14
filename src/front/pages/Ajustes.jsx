import React, { useEffect, useState } from "react";
import { getAuthHeader, getUser } from "../utils/auth";
import "../assets/Ajustes.css";

const API_URL = import.meta.env.VITE_BACKEND_URL;

export default function Ajustes() {
    const [users, setUsers] = useState([]);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [newUserData, setNewUserData] = useState({
        username: "",
        email: "",
        role: "operator",
        password: ""
    });

    const user = getUser();

    const handleAuthError = () => {
        alert("Sesión caducada. Te redirigimos al login.");
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    useEffect(() => {
        fetch(`${API_URL}/api/users`, {
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            }
        })
            .then(async res => {
                if (res.status === 401) return handleAuthError();
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error("❌ Error al cargar usuarios:", err);
                alert("Error cargando usuarios. Revisa la consola.");
            });
    }, []);

    const handleEditClick = (u) => {
        setEditId(u.id);
        setFormData({ username: u.username, email: u.email, role: u.role });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (id) => {
        fetch(`${API_URL}/api/users/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            body: JSON.stringify(formData)
        })
            .then(async res => {
                if (res.status === 401) return handleAuthError();
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then(() => {
                setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...formData } : u)));
                setEditId(null);
                alert("Usuario actualizado correctamente");
            })
            .catch(err => {
                console.error("❌ Error al actualizar usuario:", err);
                alert("Error al actualizar usuario");
            });
    };

    const handleDelete = (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este usuario?")) return;
        fetch(`${API_URL}/api/users/${id}`, {
            method: "DELETE",
            headers: getAuthHeader()
        })
            .then(async res => {
                if (res.status === 401) return handleAuthError();
                if (!res.ok) throw new Error(await res.text());
                setUsers(prev => prev.filter(u => u.id !== id));
                alert("Usuario eliminado correctamente");
            })
            .catch(err => {
                console.error("❌ Error al eliminar usuario:", err);
                alert("Error al eliminar usuario");
            });
    };

    const handleNewUserChange = (e) => {
        const { name, value } = e.target;
        setNewUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewUserSubmit = () => {
        const { username, email, password } = newUserData;
        if (!username || !email || !password) return alert("Todos los campos son obligatorios.");

        fetch(`${API_URL}/api/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader()
            },
            body: JSON.stringify(newUserData)
        })
            .then(async res => {
                if (res.status === 401) return handleAuthError();
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            })
            .then(created => {
                setUsers(prev => [...prev, created]);
                setShowModal(false);
                setNewUserData({ username: "", email: "", role: "operator", password: "" });
                alert("Usuario creado correctamente");
            })
            .catch(err => {
                console.error("❌ Error al crear usuario:", err);
                alert("Error al crear usuario");
            });
    };

    return (
        <div className="content-container">
            <div className="ajustes-container">
                <div className="ajustes-header">
                    <h1>Cuentas de Usuario</h1>
                    {user?.role === "admin" && (
                        <button className="button-add" onClick={() => setShowModal(true)}>
                            + Añadir usuario
                        </button>
                    )}
                </div>

                <div className="table-container">
                    <table className="ajustes-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    {editId === u.id ? (
                                        <>
                                            <td><input className="input-field" name="username" value={formData.username} onChange={handleInputChange} /></td>
                                            <td><input className="input-field" name="email" value={formData.email} onChange={handleInputChange} /></td>
                                            <td><input className="input-field" name="role" value={formData.role} readOnly /></td>
                                            <td>
                                                <button className="button-save" onClick={() => handleSave(u.id)}>💾</button>
                                                <button className="button-cancel" onClick={() => setEditId(null)}>✖</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{u.username}</td>
                                            <td>{u.email}</td>
                                            <td>{u.role}</td>
                                            <td>
                                                {user?.role === "admin" && (
                                                    <>
                                                        <button className="button-edit" onClick={() => handleEditClick(u)}>✏</button>
                                                        <button className="button-delete" onClick={() => handleDelete(u.id)}>🗑</button>
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
            </div>

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        <div className="modal-body">
                            <div className="modal-details">
                                <h3>Nuevo Usuario</h3>
                                <div><strong>Nombre:</strong><input name="username" className="input-field" value={newUserData.username} onChange={handleNewUserChange} /></div>
                                <div><strong>Email:</strong><input name="email" className="input-field" value={newUserData.email} onChange={handleNewUserChange} /></div>
                                <div><strong>Contraseña:</strong><input name="password" className="input-field" type="password" value={newUserData.password} onChange={handleNewUserChange} /></div>
                                <div><strong>Rol:</strong><input name="role" className="input-field" value="operator" readOnly /></div>
                            </div>
                            <button className="button-save" onClick={handleNewUserSubmit}>Crear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
