import React from "react";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../assets/Header.css';

function Header() {
    const navigate = useNavigate();
    const location = useLocation().pathname;

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const menuItems = [
        { label: 'VideoWall', path: '/' },
        { label: 'Mapa', path: '/mapa' },
        { label: 'Registros', path: '/registros' },
        { label: 'Ajustes', path: '/ajustes' }
    ];

    return (
        <header className="header-container">
            <nav className="header-nav">
                {menuItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`header-menu-item${location === item.path ? ' active' : ''}`}
                    >
                        {item.label}
                    </Link>
                ))}
                <button
                    onClick={handleLogout}
                    className="header-menu-item logout-btn"
                >
                    Cerrar sesión
                </button>
            </nav>
        </header>
    );
}

export default Header;