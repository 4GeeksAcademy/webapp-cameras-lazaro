// src/pages/Login.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveUser } from '../utils/auth';
import '../assets/Login.css';

import logo from '../assets/img/Logo.png';
import checkpoint from '../assets/img/checkpoint.png';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
    script.onload = () => {
      if (window.particlesJS) {
        window.particlesJS.load('particles-js', '/particles.json', function () {
          console.log('Particles.js loaded');
        });
      }
    };
    document.body.appendChild(script);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const API_URL = import.meta.env.VITE_BACKEND_URL;
    if (!API_URL) {
      console.error('VITE_BACKEND_URL no está definido');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        saveUser(data.user);
        navigate('/ajustes');
      } else {
        const err = await res.json().catch(() => null);
        console.warn('Login fallido:', err);
        alert('Credenciales inválidas');
      }
    } catch (err) {
      console.error('Error al iniciar sesión', err);
      alert('No se pudo conectar con el servidor');
    }
  };

  return (
    <div className="login-page-wrapper">
      <div id="particles-js" className="login-background" />
      <div className="login-container">
        <div className="login-logo">
          <img src={logo} alt="Logo" className="logo-img" />
          <img src={checkpoint} alt="Checkpoint" className="checkpoint-img" />
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );

}

export default Login;
