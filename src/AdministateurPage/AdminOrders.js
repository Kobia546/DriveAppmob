import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { getOrders } from '../firebase'; // Fonction pour récupérer les commandes depuis Firebase

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Charger les commandes depuis Firebase
    getOrders().then(data => setOrders(data));
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', padding: '20px', width: '100%', backgroundColor: '#f9f9f9' }}>
        <h1 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '20px' }}>Historique des Commandes</h1>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
          <thead>
            <tr>
              <th style={thStyle}>Client</th>
              <th style={thStyle}>Chauffeur</th>
              <th style={thStyle}>Distance</th>
              <th style={thStyle}>Montant</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ cursor: 'pointer' }}>
                <td style={tdStyle}>{order.userEmail}</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={order.driverLicenseImage} alt="Permis" style={imgStyle} />
                    <span style={{ marginLeft: '10px' }}>{order.driverName}</span>
                  </div>
                </td>
                <td style={tdStyle}>{order.distance.toFixed(2)} km</td>
                <td style={tdStyle}>{order.price.toFixed(2)} FCFA</td>
                <td style={tdStyle}>{order.status}</td>
                <td style={tdStyle}>{new Date(order.acceptedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
