// db.js
const mysql = require('mysql2');

// Connexion à MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'myappdb'
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion : ', err);
    return;
  }
  console.log('Connexion à la base de données réussie');
});

module.exports = db;
