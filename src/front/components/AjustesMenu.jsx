import React from "react";
import { Link } from 'react-router-dom';
import '../assets/AjustesMenu.css';

function AjustesMenu() {
    return (
        <div className="ajustes-menu">
            <h4 className="menu-title">Ajustes</h4>
            <nav className="ajustes-links">
                <Link to="/ajustes" className="ajustes-link">
                    Cuentas
                </Link>
                <Link to="/ajustes1" className="ajustes-link">
                    Cámaras
                </Link>
            </nav>
        </div>
    );
}

export default AjustesMenu;
