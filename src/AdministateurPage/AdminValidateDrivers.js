import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { getDriversToValidate, validateDriver } from '../firebase'; // Simuler l'API Firebase

const AdminValidateDrivers = () => {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    // Charger les chauffeurs non validés depuis Firebase
    getDriversToValidate().then(data => setDrivers(data));
  }, []);

  const handleValidate = (driverId) => {
    validateDriver(driverId)
      .then(() => {
        setDrivers(drivers.filter(driver => driver.id !== driverId));
        alert('Le chauffeur a été validé avec succès');
      })
      .catch(error => {
        console.error("Erreur lors de la validation du chauffeur:", error);
      });
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '260px', padding: '20px', width: '100%', backgroundColor: '#f9f9f9' }}>
        <h1 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '20px' }}>Validation des Chauffeurs</h1>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
          <thead>
            <tr>
              <th style={thStyle}>Nom</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Téléphone</th>
              <th style={thStyle}>Permis</th>
              <th style={thStyle}>Carte d'identité</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => (
              <tr key={driver.id} style={{ cursor: 'pointer' }}>
                <td style={tdStyle}>{driver.name}</td>
                <td style={tdStyle}>{driver.email}</td>
                <td style={tdStyle}>{driver.phone}</td>
                <td style={tdStyle}><img src={driver.licenseImage} alt="Permis" style={imgStyle} /></td>
                <td style={tdStyle}><img src={driver.idCardImage} alt="Carte d'identité" style={imgStyle} /></td>
                <td style={tdStyle}>
                  <button style={buttonStyle} onClick={() => handleValidate(driver.id)}>
                    Valider Chauffeur
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '15px',
  backgroundColor: '#f1c40f',
  color: '#fff',
  fontWeight: '600',
  borderBottom: '1px solid #ddd'
};

const tdStyle = {
  padding: '15px',
  textAlign: 'left',
  borderBottom: '1px solid #ddd'
};

const imgStyle = {
  width: '100px',
  height: '100px',
  objectFit: 'cover'
};

const buttonStyle = {
  padding: '10px 15px',
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease'
};

export default AdminValidateDrivers;
