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
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Thread-safe map pour les chauffeurs
const connectedDrivers = new Map();

io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);

  socket.on('driver:connect', (driverId) => {
    if (!driverId) return;
    connectedDrivers.set(driverId, socket.id);
    socket.emit('driver:connected', { status: 'success' });
    console.log(`Chauffeur ${driverId} connecté`);
  });

  socket.on('new:order', (orderData) => {
    if (!orderData || !orderData.orderId) return;
    
    try {
      connectedDrivers.forEach((socketId) => {
        io.to(socketId).emit('order:available', orderData);
      });
    } catch (error) {
      console.error('Erreur envoi commande:', error);
    }
  });

  socket.on('order:accept', ({ orderId, driverId, clientId }) => {
    if (!orderId || !driverId || !clientId) return;
    
    try {
      io.emit(`order:accepted:${clientId}`, {
        orderId,
        driverId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Erreur acceptation commande:', error);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Déconnexion (${reason}):`, socket.id);
    for (const [driverId, socketId] of connectedDrivers.entries()) {
      if (socketId === socket.id) {
        connectedDrivers.delete(driverId);
        console.log(`Chauffeur ${driverId} déconnecté`);
        break;
      }
    }
  });

  socket.on('error', (error) => {
    console.error('Erreur socket:', error);
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', connections: connectedDrivers.size });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur WebSocket démarré sur le port ${PORT}`);
}).on('error', (error) => {
  console.error('Erreur serveur:', error);
});