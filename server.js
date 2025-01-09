const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Stockage des connexions de chauffeurs
const connectedDrivers = new Map();

io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);

  // Gestion de la connexion d'un chauffeur
  socket.on('driver:connect', (driverId) => {
    connectedDrivers.set(driverId, socket.id);
    console.log(`Chauffeur ${driverId} connecté`);
  });

  // Réception d'une nouvelle commande
  socket.on('new:order', (orderData) => {
    // Envoyer la commande à tous les chauffeurs connectés
    connectedDrivers.forEach((socketId) => {
      io.to(socketId).emit('order:available', orderData);
    });
  });

  // Gestion de l'acceptation d'une commande
  socket.on('order:accept', ({ orderId, driverId, clientId }) => {
    // Notifier le client que sa commande a été acceptée
    io.emit(`order:accepted:${clientId}`, {
      orderId,
      driverId
    });
  });

  // Déconnexion
  socket.on('disconnect', () => {
    // Retirer le chauffeur de la liste des connectés
    for (const [driverId, socketId] of connectedDrivers.entries()) {
      if (socketId === socket.id) {
        connectedDrivers.delete(driverId);
        console.log(`Chauffeur ${driverId} déconnecté`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur WebSocket démarré sur le port ${PORT}`);
});