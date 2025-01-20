const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "HEAD"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  connectTimeout: 45000,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],
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
    
    setInterval(() => {
      this.logStatus();
      this.cleanInactiveDrivers();
    }, 5 * 60 * 1000);
  }

  addDriver(driverId, socketId) {
    console.log(`[DriversManager] Ajout du chauffeur ${driverId} avec socket ${socketId}`);
    
    if (!driverId || !socketId) {
      console.error('[DriversManager] ID chauffeur ou socket manquant');
      return false;
    }

    // Si le chauffeur existe déjà, on met juste à jour son socketId
    this.connectedDrivers.set(driverId, socketId);
    this.lastPing.set(driverId, Date.now());
    
    const added = this.connectedDrivers.has(driverId);
    console.log(`[DriversManager] Chauffeur ${added ? 'ajouté/mis à jour' : 'non ajouté'}`);
    
    return added;
  }

  removeDriver(socketId) {
    console.log(`[DriversManager] Tentative de suppression du socket ${socketId}`);
    let removedDriverId = null;
    
    for (const [driverId, storedSocketId] of this.connectedDrivers.entries()) {
      if (storedSocketId === socketId) {
        // On vérifie si le dernier ping date de plus d'une heure
        const lastPingTime = this.lastPing.get(driverId);
        const timeSinceLastPing = Date.now() - lastPingTime;
        
        if (timeSinceLastPing > 60 * 60 * 1000) { // 1 heure
          this.connectedDrivers.delete(driverId);
          this.lastPing.delete(driverId);
          removedDriverId = driverId;
          console.log(`[DriversManager] Chauffeur ${driverId} supprimé après 1h d'inactivité`);
        } else {
          console.log(`[DriversManager] Chauffeur ${driverId} conservé car actif récemment`);
        }
        break;
      }
    }
    
    return removedDriverId;
  }
cleanInactiveDrivers() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    console.log('[DriversManager] Nettoyage des chauffeurs inactifs...');

    for (const [driverId, lastPing] of this.lastPing.entries()) {
      if (now - lastPing > timeout) {
        const socketId = this.connectedDrivers.get(driverId);
        this.connectedDrivers.delete(driverId);
        this.lastPing.delete(driverId);

        console.log(`[DriversManager] Chauffeur ${driverId} retiré après 1h d'inactivité`);

        
        if (socketId) {
          io.to(socketId).emit('driver:disconnect', {
            reason: 'inactivity',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  getDriverSocket(driverId) {
    const socketId = this.connectedDrivers.get(driverId);
    console.log(`[DriversManager] Socket pour ${driverId}: ${socketId || 'non trouvé'}`);
    return socketId;
  }

  getAllDriverSockets() {
    const sockets = Array.from(this.connectedDrivers.values());
    console.log(`[DriversManager] ${sockets.length} sockets récupérés`);
    return sockets;
  }

  updateDriverPing(driverId) {
    if (this.connectedDrivers.has(driverId)) {
      this.lastPing.set(driverId, Date.now());
      console.log(`[DriversManager] Ping mis à jour pour ${driverId}`);
      return true;
    }
    console.log(`[DriversManager] Ping non mis à jour - chauffeur ${driverId} non trouvé`);
    return false;
  }

 

  logStatus() {
    console.log('=== ÉTAT DÉTAILLÉ DES CONNEXIONS ===');
    console.log('Nombre total de chauffeurs:', this.connectedDrivers.size);
    console.log('Liste des chauffeurs:');
    this.connectedDrivers.forEach((socketId, driverId) => {
      const lastPingTime = this.lastPing.get(driverId);
      const lastPingAgo = lastPingTime ? (Date.now() - lastPingTime) / 1000 : 'N/A';
      console.log(`- Chauffeur ${driverId}: Socket ${socketId} (Dernier ping: ${lastPingAgo}s)`);
    });
    console.log('================================');
  }

  isDriverConnected(driverId) {
    const isConnected = this.connectedDrivers.has(driverId);
    console.log(`[DriversManager] Statut connexion ${driverId}: ${isConnected}`);
    return isConnected;
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
  console.log('=== NOUVELLE CONNEXION SOCKET ===');
  console.log('Socket ID:', socket.id);
  console.log('Transport:', socket.conn.transport.name);
  console.log('IP:', socket.handshake.address);
  console.log('Query:', socket.handshake.query);

  socket.on('driver:connect', async (driverId) => {
    console.log(`=== TENTATIVE CONNEXION CHAUFFEUR (Socket: ${socket.id}) ===`);
    console.log('Driver ID reçu:', driverId);
    
    try {
      if (!driverId) {
        throw new Error('Driver ID manquant');
      }

      const existingSocket = driversManager.getDriverSocket(driverId);
      if (existingSocket) {
        console.log(`Chauffeur ${driverId} déjà connecté, déconnexion de l'ancienne session`);
        driversManager.removeDriver(existingSocket);
      }

      const success = driversManager.addDriver(driverId, socket.id);
      console.log(`Tentative d'ajout du chauffeur: ${success ? 'Réussie' : 'Échouée'}`);

      const isConnected = driversManager.isDriverConnected(driverId);
      console.log(`Vérification post-connexion: ${isConnected ? 'Connecté' : 'Non connecté'}`);

      socket.emit('driver:connect:confirmation', {
        status: success ? 'success' : 'error',
        driverId: driverId,
        socketId: socket.id,
        timestamp: new Date().toISOString()
      });

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
    console.log('=== NOUVELLE COMMANDE REÇUE ===');
    console.log('Données:', orderData);
    
    try {
      const connectedSocketIds = driversManager.getAllDriverSockets();
      console.log(`Envoi à ${connectedSocketIds.length} chauffeurs`);
      
      for (const socketId of connectedSocketIds) {
        console.log(`Envoi à ${socketId}`);
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
        error: error.message
      });
    }
  });

  socket.on('order:accept', async ({ orderId, driverId, clientId, driverInfo }) => {
    console.log('=== ACCEPTATION COMMANDE ===');
    console.log('Détails:', { orderId, driverId, clientId, driverInfo });
    
    try {
        // Émettre l'événement à tous les clients
        io.emit('order:accepted', {
            orderId,
            clientId,
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
            error: error.message
        });
    }
});
  socket.on('ping', () => {
    console.log(`Ping reçu de ${socket.id}`);
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