// server.js
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mysql = require('mysql2');
const path = require('path')
const db = require('./db'); 

const app = express();
app.use(bodyParser.json()); 


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads'); 
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  const upload = multer({ storage });
  app.post('/api/drivers/register', upload.fields([{ name: 'licenseImage' }, { name: 'idCardImage' }]), (req, res) => {
    const { name, email, phoneNumber } = req.body;
    const licenseImage = req.files['licenseImage'][0].path; 
    const idCardImage = req.files['idCardImage'][0].path; 
  
    const sql = 'INSERT INTO drivers (name, email, phoneNumber, licenseImage, idCardImage) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [name, email, phoneNumber, licenseImage, idCardImage], (error, results) => {
      if (error) {
        return res.status(500).json({ message: 'Erreur lors de l\'inscription', error });
      }
      res.status(201).json({ message: 'Chauffeur inscrit avec succès' });
    });
  });
app.post('/register', (req, res) => {
  const { email, password, user, carPhoto } = req.body;


  const sql = 'INSERT INTO users (email, password, username, carPhoto) VALUES (?, ?, ?, ?)';
  db.query(sql, [email, password, user, carPhoto], (err, result) => {
    if (err) {
      console.error('Erreur d\'insertion : ', err);
      return res.status(500).json({ error: 'Erreur lors de l\'inscription' });
    }
    res.json({ message: 'Inscription réussie' });
  });
});

// Lancer le serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
