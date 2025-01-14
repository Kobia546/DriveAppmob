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
  pingInterval: 25000,
  transports: ['websocket'],
  allowEIO3: true,
  cookie: {
    name: "socket-io",
    httpOnly: true,
    secure: true
  }
});

class DriversManager {
  constructor() {
    this.connectedDrivers = new Map();
    this.lastPing = new Map();
    
    setInterval(() => {
      this.cleanInactiveDrivers();
    }, 30000);
  }

  addDriver(driverId, socketId) {
    this.connectedDrivers.set(driverId, socketId);
    this.lastPing.set(driverId, Date.now());
    return true;
  }

  removeDriver(socketId) {
    for (const [driverId, storedSocketId] of this.connectedDrivers.entries()) {
      if (storedSocketId === socketId) {
        this.connectedDrivers.delete(driverId);
        this.lastPing.delete(driverId);
        return driverId;
      }
    }
    return null;
  }

  getDriverSocket(driverId) {
    return this.connectedDrivers.get(driverId);
  }

  getAllDriverSockets() {
    return Array.from(this.connectedDrivers.values());
  }

  updateDriverPing(driverId) {
    if (this.connectedDrivers.has(driverId)) {
      this.lastPing.set(driverId, Date.now());
    }
  }

  cleanInactiveDrivers() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [driverId, lastPing] of this.lastPing.entries()) {
      if (now - lastPing > timeout) {
        const socketId = this.connectedDrivers.get(driverId);
        this.connectedDrivers.delete(driverId);
        this.lastPing.delete(driverId);
        console.log(`Chauffeur ${driverId} retiré pour inactivité`);
        
        // Informer le chauffeur de la déconnexion
        io.to(socketId).emit('driver:disconnect', {
          reason: 'inactivity'
        });
      }
    }
  }

  isDriverConnected(driverId) {
    return this.connectedDrivers.has(driverId);
  }
}

const driversManager = new DriversManager();

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

io.on('connection', (socket) => {
  console.log('Nouvelle connexion:', socket.id);

  // Gestion de la connexion d'un chauffeur
  socket.on('driver:connect', (driverId) => {
    try {
      driversManager.addDriver(driverId, socket.id);
      console.log(`Chauffeur ${driverId} connecté`);
      
      // Envoyer la confirmation de connexion
      socket.emit('driver:connect:confirmation', {
        status: 'success',
        driverId: driverId,
        socketId: socket.id
      });

      // Configurer le ping périodique
      const pingInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
          driversManager.updateDriverPing(driverId);
        } else {
          clearInterval(pingInterval);
        }
      }, 25000);

    } catch (error) {
      console.error('Erreur lors de la connexion du chauffeur:', error);
      socket.emit('driver:connect:confirmation', {
        status: 'error',
        error: error.message
      });
    }
  });

  // Réception d'une nouvelle commande
  socket.on('new:order', (orderData) => {
    try {
      console.log('Nouvelle commande reçue:', orderData);
      
      const connectedSocketIds = driversManager.getAllDriverSockets();
      connectedSocketIds.forEach((socketId) => {
        console.log('Envoi de la commande à chauffeur:', socketId);
        io.to(socketId).emit('order:available', orderData);
      });

      // Envoyer la confirmation d'envoi de la commande
      socket.emit('order:sent:confirmation', {
        status: 'success',
        orderId: orderData.orderId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la commande:', error);
      socket.emit('order:sent:confirmation', {
        status: 'error',
        error: error.message
      });
    }
  });

  // Gestion de l'acceptation d'une commande
  socket.on('order:accept', ({ orderId, driverId, clientId, driverInfo }) => {
    try {
      console.log(`Commande ${orderId} acceptée par le chauffeur ${driverId}`);
      
      // Notifier le client
      io.emit(`order:accepted:${clientId}`, {
        orderId,
        driverId,
        driverInfo
      });

      // Envoyer la confirmation au chauffeur
      socket.emit('order:accept:confirmation', {
        status: 'success',
        orderId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la commande:', error);
      socket.emit('order:accept:confirmation', {
        status: 'error',
        error: error.message
      });
    }
  });

  // Gestion du pong
  socket.on('pong', () => {
    for (const [driverId, socketId] of driversManager.connectedDrivers.entries()) {
      if (socketId === socket.id) {
        driversManager.updateDriverPing(driverId);
        break;
      }
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    try {
      const removedDriverId = driversManager.removeDriver(socket.id);
      if (removedDriverId) {
        console.log(`Chauffeur ${removedDriverId} déconnecté`);
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur WebSocket démarré sur le port ${PORT}`);
});

// Gestion propre de la fermeture
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu. Arrêt du serveur...');
  httpServer.close(() => {
    process.exit(0);
  });
});