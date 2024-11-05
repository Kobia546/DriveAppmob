import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const sidebarStyle = {
    width: '250px',
    height: '100vh',
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    position: 'fixed',
    top: '0',
    left: '0',
    padding: '20px',
    boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease'
  };

  const ulStyle = {
    listStyleType: 'none',
    padding: '0'
  };

  const liStyle = {
    marginBottom: '15px'
  };

  const linkStyle = {
    color: '#ecf0f1',
    textDecoration: 'none',
    fontSize: '18px',
    display: 'block',
    padding: '10px',
    borderRadius: '4px',
    transition: 'background-color 0.3s'
  };

  return (
    <div style={sidebarStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#f1c40f' }}>Admin Panel</h2>
      <ul style={ulStyle}>
        <li style={liStyle}><Link to="/admin/orders" style={linkStyle}>Historique des commandes</Link></li>
        <li style={liStyle}><Link to="/admin/validate-drivers" style={linkStyle}>Validation des chauffeurs</Link></li>
        <li style={liStyle}><Link to="/admin/users" style={linkStyle}>Gestion des clients</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
