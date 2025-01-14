const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  cookie: {
    name: "socket-io",
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
});

class DriversManager {
  constructor() {
    this.connectedDrivers = new Map();
    this.lastPing = new Map();
    
    // Log périodique de l'état
    setInterval(() => {
      this.logStatus();
      this.cleanInactiveDrivers();
    }, 30000);
  }

  logStatus() {
    console.log('=== État des connexions ===');
    console.log(`Nombre de chauffeurs connectés: ${this.connectedDrivers.size}`);
    console.log('Chauffeurs actifs:', Array.from(this.connectedDrivers.keys()));
    console.log('Dernière activité:', Object.fromEntries(this.lastPing));
    console.log('========================');
  }

  addDriver(driverId, socketId) {
    if (!driverId || !socketId) {
      console.error('Tentative d\'ajout de chauffeur avec des données invalides:', { driverId, socketId });
      return false;
    }

    this.connectedDrivers.set(driverId, socketId);
    this.lastPing.set(driverId, Date.now());
    console.log(`Chauffeur ajouté: ${driverId} (Socket: ${socketId})`);
    return true;
  }

  removeDriver(socketId) {
    let removedDriverId = null;
    for (const [driverId, storedSocketId] of this.connectedDrivers.entries()) {
      if (storedSocketId === socketId) {
        this.connectedDrivers.delete(driverId);
        this.lastPing.delete(driverId);
        removedDriverId = driverId;
        console.log(`Chauffeur retiré: ${driverId} (Socket: ${socketId})`);
        break;
      }
    }
    return removedDriverId;
  }

  getDriverSocket(driverId) {
    const socketId = this.connectedDrivers.get(driverId);
    if (!socketId) {
      console.log(`Socket non trouvé pour le chauffeur: ${driverId}`);
    }
    return socketId;
  }

  getAllDriverSockets() {
    const sockets = Array.from(this.connectedDrivers.values());
    console.log(`Récupération de tous les sockets (${sockets.length} chauffeurs connectés)`);
    return sockets;
  }

  updateDriverPing(driverId) {
    if (this.connectedDrivers.has(driverId)) {
      this.lastPing.set(driverId, Date.now());
      console.log(`Ping mis à jour pour le chauffeur: ${driverId}`);
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
        
        if (socketId) {
          io.to(socketId).emit('driver:disconnect', {
            reason: 'inactivity',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  isDriverConnected(driverId) {
    return this.connectedDrivers.has(driverId);
  }
}

const driversManager = new DriversManager();

app.get('/health', (req, res) => {
  const status = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    connectedDrivers: driversManager.connectedDrivers.size,
    environment: process.env.NODE_ENV
  };
  res.status(200).json(status);
});

io.on('connection', (socket) => {
  const clientInfo = {
    id: socket.id,
    transport: socket.conn.transport.name,
    address: socket.handshake.address,
    timestamp: new Date().toISOString(),
    query: socket.handshake.query
  };
  
  console.log('Nouvelle connexion:', clientInfo);

  socket.on('driver:connect', async (driverId) => {
    try {
      console.log(`Tentative de connexion du chauffeur ${driverId} (Socket: ${socket.id})`);
      
      if (!driverId) {
        throw new Error('ID du chauffeur requis');
      }

      const success = driversManager.addDriver(driverId, socket.id);
      if (!success) {
        throw new Error('Échec de l\'ajout du chauffeur');
      }

      const confirmation = {
        status: 'success',
        driverId: driverId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      };

      socket.emit('driver:connect:confirmation', confirmation);
      console.log('Confirmation envoyée:', confirmation);

      // Configuration du ping périodique
      const pingInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping');
          driversManager.updateDriverPing(driverId);
        } else {
          clearInterval(pingInterval);
        }
      }, 25000);

    } catch (error) {
      console.error('Erreur connexion chauffeur:', error);
      socket.emit('driver:connect:confirmation', {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('new:order', async (orderData) => {
    try {
      console.log('Nouvelle commande reçue:', orderData);
      
      const connectedSocketIds = driversManager.getAllDriverSockets();
      for (const socketId of connectedSocketIds) {
        console.log(`Envoi de la commande au chauffeur: ${socketId}`);
        io.to(socketId).emit('order:available', orderData);
      }

      socket.emit('order:sent:confirmation', {
        status: 'success',
        orderId: orderData.orderId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erreur envoi commande:', error);
      socket.emit('order:sent:confirmation', {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('order:accept', async ({ orderId, driverId, clientId, driverInfo }) => {
    try {
      console.log(`Commande ${orderId} acceptée par le chauffeur ${driverId}`);
      
      io.emit(`order:accepted:${clientId}`, {
        orderId,
        driverId,
        driverInfo,
        timestamp: new Date().toISOString()
      });

      socket.emit('order:accept:confirmation', {
        status: 'success',
        orderId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erreur acceptation commande:', error);
      socket.emit('order:accept:confirmation', {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('pong', () => {
    for (const [driverId, socketId] of driversManager.connectedDrivers.entries()) {
      if (socketId === socket.id) {
        driversManager.updateDriverPing(driverId);
        break;
      }
    }
  });

  socket.on('disconnect', () => {
    try {
      const removedDriverId = driversManager.removeDriver(socket.id);
      if (removedDriverId) {
        console.log(`Chauffeur ${removedDriverId} déconnecté (Socket: ${socket.id})`);
      }
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  });

  // Log tous les événements pour le debugging
  socket.onAny((eventName, ...args) => {
    console.log(`Événement reçu (${socket.id}): ${eventName}`, args);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Serveur WebSocket démarré sur le port ${PORT} (Env: ${process.env.NODE_ENV})`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM reçu. Arrêt du serveur...');
  httpServer.close(() => {
    console.log('Serveur arrêté avec succès');
    process.exit(0);
  });
});
