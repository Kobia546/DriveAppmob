const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
// Ajouter cette classe après vos imports
class OrderManager {
  constructor() {
    this.activeOrders = new Map();
    this.orderDistribution = new Map();
    this.orderTimeouts = new Map();
    
    // Configuration
    this.config = {
      orderTimeout: 60 * 1000, // 60 secondes pour accepter une commande
      maxRetries: 3,           // Nombre maximum de tentatives
      distributionLog: true,   // Activer les logs détaillés
    };
  }
  // Ajouter cette méthode dans votre classe OrderManager
recordReceipt(orderId, driverId) {
  const orderTracking = this.activeOrders.get(orderId);
  if (!orderTracking) return false;

  orderTracking.distribution.confirmedReceipts++;
  
  if (!this.orderDistribution.has(orderId)) {
    this.orderDistribution.set(orderId, new Set());
  }
  
  this.orderDistribution.get(orderId).add(driverId);
  
  console.log(`[OrderManager] Chauffeur ${driverId} a reçu la commande ${orderId}`);
  return true;
}

  // Reste des méthodes comme dans l'artifact...
  // (copiez toutes les méthodes de la classe OrderManager depuis l'artifact "Améliorations du serveur Socket.io")
}

class EnhancedDriversManager {
  constructor() {
    this.drivers = new Map();
    this.sessions = new Map();
    this.driverStatus = new Map();
    this.pendingAuthentications = new Map();
    
    // Configuration
    this.config = {
      inactivityTimeout: 30 * 60 * 1000, // 30 minutes
      cleanupInterval: 3 * 60 * 1000,    // 3 minutes
      maxReconnectAttempts: 5,
      authenticationTimeout: 10000       // 10 secondes
    };
    
    // Nettoyage périodique
    setInterval(() => {
      this.cleanInactiveSessions();
      this.logDetailedStatus();
    }, this.config.cleanupInterval);
  }

  initializeDriver(driverId, socketId, socketInstance, driverType = 'standard') {
    console.log(`[DriverManager] Initialisation chauffeur ${driverId} de type ${driverType}`);
    
    const driverData = {
      id: driverId,
      currentSocketId: socketId,
      status: 'active',
      type: driverType,
      lastActivity: Date.now(),
      reconnectCount: 0,
      connectionHistory: [{
        socketId,
        connectedAt: Date.now(),
        status: 'active'
      }]
    };

    this.drivers.set(driverId, driverData);
    this.sessions.set(socketId, driverId);
    this.driverStatus.set(driverId, {
      isAuthenticated: true,
      lastPing: Date.now(),
      socket: socketInstance,
      pendingTimeouts: new Set()
    });

    return driverData;
  }

  handleDriverConnect(driverId, socketId, socketInstance, driverInfo = {}) {
    console.log(`[DriverManager] Connexion chauffeur ${driverId}`, driverInfo);
    
    let driverData = this.drivers.get(driverId);
    
    if (driverData) {
      // Gestion session existante
      const oldSocketId = driverData.currentSocketId;
      if (oldSocketId && oldSocketId !== socketId) {
        this.handleExistingSession(driverId, oldSocketId);
      }

      // Mise à jour données
      driverData.currentSocketId = socketId;
      driverData.lastActivity = Date.now();
      driverData.reconnectCount++;
      if (driverInfo.type) {
        driverData.type = driverInfo.type;
      }
      driverData.connectionHistory.push({
        socketId,
        connectedAt: Date.now(),
        status: 'active'
      });
    } else {
      // Nouveau chauffeur
      driverData = this.initializeDriver(driverId, socketId, socketInstance, driverInfo.type);
    }

    // Mise à jour mappings
    this.sessions.set(socketId, driverId);
    this.driverStatus.set(driverId, {
      isAuthenticated: true,
      lastPing: Date.now(),
      socket: socketInstance,
      pendingTimeouts: new Set(),
      info: driverInfo
    });

    return driverData;
  }

  handleExistingSession(driverId, oldSocketId) {
    const oldStatus = this.driverStatus.get(driverId);
    if (oldStatus && oldStatus.socket) {
      oldStatus.socket.emit('driver:session:expired', {
        reason: 'new_session',
        timestamp: new Date().toISOString()
      });

      // Nettoyage ancienne session
      this.sessions.delete(oldSocketId);
      oldStatus.pendingTimeouts.forEach(clearTimeout);
      oldStatus.pendingTimeouts.clear();
    }
  }

  handleDriverDisconnect(socketId) {
    console.log(`[DriverManager] Déconnexion socket ${socketId}`);
    
    const driverId = this.sessions.get(socketId);
    if (!driverId) return null;

    const driverData = this.drivers.get(driverId);
    if (driverData && driverData.currentSocketId === socketId) {
      // Mise à jour statut
      driverData.status = 'disconnected';
      const lastConnection = driverData.connectionHistory[driverData.connectionHistory.length - 1];
      if (lastConnection) {
        lastConnection.status = 'disconnected';
        lastConnection.disconnectedAt = Date.now();
      }

      // Nettoyage session
      this.sessions.delete(socketId);
      const status = this.driverStatus.get(driverId);
      if (status) {
        status.pendingTimeouts.forEach(clearTimeout);
        status.pendingTimeouts.clear();
      }
      this.driverStatus.delete(driverId);

      console.log(`[DriverManager] Chauffeur ${driverId} déconnecté`);
      return driverId;
    }

    return null;
  }

  updateDriverActivity(driverId, activityData = {}) {
    const driverData = this.drivers.get(driverId);
    const status = this.driverStatus.get(driverId);
    
    if (driverData && status) {
      driverData.lastActivity = Date.now();
      status.lastPing = Date.now();
      
      // Mise à jour des informations supplémentaires si fournies
      if (Object.keys(activityData).length > 0) {
        status.lastActivityData = activityData;
      }
      
      return true;
    }
    return false;
  }

  cleanInactiveSessions() {
    const now = Date.now();
    console.log('[DriverManager] Nettoyage sessions inactives...');
    
    for (const [driverId, status] of this.driverStatus.entries()) {
      const timeSinceLastActivity = now - status.lastPing;
      
      if (timeSinceLastActivity > this.config.inactivityTimeout) {
        console.log(`[DriverManager] Session inactive: ${driverId}`);
        
        const driverData = this.drivers.get(driverId);
        if (driverData) {
          // Notification et nettoyage
          status.socket.emit('driver:session:expired', {
            reason: 'inactivity',
            timestamp: new Date().toISOString(),
            lastActivity: new Date(status.lastPing).toISOString()
          });
          
          this.sessions.delete(driverData.currentSocketId);
          status.pendingTimeouts.forEach(clearTimeout);
          status.pendingTimeouts.clear();
          this.driverStatus.delete(driverId);
          
          driverData.status = 'expired';
        }
      }
    }
  }

  isDriverActive(driverId) {
    const status = this.driverStatus.get(driverId);
    if (!status) return false;
    
    const timeSinceLastPing = Date.now() - status.lastPing;
    return timeSinceLastPing <= this.config.inactivityTimeout;
  }

  isDriverAuthenticated(driverId) {
    const status = this.driverStatus.get(driverId);
    return status ? status.isAuthenticated && this.isDriverActive(driverId) : false;
  }

  getDriverSocket(driverId) {
    const status = this.driverStatus.get(driverId);
    return status && this.isDriverActive(driverId) ? status.socket : null;
  }

  getAllAuthenticatedSockets(filters = {}) {
    return Array.from(this.driverStatus.entries())
      .filter(([driverId, status]) => {
        const driverData = this.drivers.get(driverId);
        return status.isAuthenticated && 
               this.isDriverActive(driverId) && 
               driverData.status !== 'busy' && // Ajout de la vérification du statut busy
               (!filters.type || driverData.type === filters.type);
      })
      .map(([, status]) => status.socket);
  }

  getDriverInfo(driverId) {
    const driverData = this.drivers.get(driverId);
    const status = this.driverStatus.get(driverId);
    
    if (!driverData) return null;
    
    return {
      id: driverId,
      type: driverData.type,
      status: driverData.status,
      isAuthenticated: status ? status.isAuthenticated : false,
      isActive: this.isDriverActive(driverId),
      lastActivity: driverData.lastActivity,
      reconnectCount: driverData.reconnectCount,
      currentSession: status ? {
        socketId: driverData.currentSocketId,
        lastPing: status.lastPing,
        info: status.info || {}
      } : null
    };
  }

  logDetailedStatus() {
    console.log('\n=== ÉTAT DÉTAILLÉ DU SYSTÈME ===');
    console.log(`Chauffeurs actifs: ${this.driverStatus.size}`);
    console.log(`Sessions totales: ${this.sessions.size}`);
    
    this.drivers.forEach((data, driverId) => {
      const info = this.getDriverInfo(driverId);
      console.log(`\nChauffeur ${driverId}:`);
      console.log(JSON.stringify(info, null, 2));
    });
    
    console.log('==============================\n');
  }
}

// Configuration du serveur
const app = express();
app.use(cors());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "HEAD"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

const driversManager = new EnhancedDriversManager();
const orderManager = new OrderManager();
const activeOrderTimeouts = new Map();

// Routes de l'API
app.get('/health', (req, res) => {
  const status = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    activeDrivers: driversManager.driverStatus.size,
    totalSessions: driversManager.sessions.size,
    environment: process.env.NODE_ENV || 'development'
  };
  res.json(status);
});

app.get('/drivers/status', (req, res) => {
  const activeDrivers = Array.from(driversManager.drivers.keys())
    .map(driverId => driversManager.getDriverInfo(driverId))
    .filter(info => info.isActive);
  
  res.json({
    timestamp: new Date().toISOString(),
    total: activeDrivers.length,
    drivers: activeDrivers
  });
});

// Gestionnaire de connexion Socket.IO
io.on('connection', (socket) => {
  console.log(`[Socket] Nouvelle connexion: ${socket.id}`);
  console.log('Transport:', socket.conn.transport.name);
  console.log('Query params:', socket.handshake.query);
  
  // Authentification du chauffeur
  socket.on('driver:connect', async (data) => {
    try {
      const driverId = typeof data === 'string' ? data : data.driverId;
      const driverInfo = typeof data === 'object' ? data : {};
      
      if (!driverId) {
        throw new Error('ID chauffeur manquant');
      }

      const driverData = driversManager.handleDriverConnect(driverId, socket.id, socket, driverInfo);
      
      socket.emit('driver:connect:confirmation', {
        status: 'success',
        driverId: driverId,
        sessionData: {
          socketId: socket.id,
          connectedAt: new Date().toISOString(),
          reconnectCount: driverData.reconnectCount,
          type: driverData.type
        }
      });

    } catch (error) {
      console.error('[Socket] Erreur connexion chauffeur:', error);
      socket.emit('driver:connect:confirmation', {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Gestion des commandes
  socket.on('new:order', (orderData) => {
    try {
      console.log('[Socket] Nouvelle commande reçue:', orderData);
      
      const authenticatedSockets = driversManager.getAllAuthenticatedSockets({
        type: orderData.requiredDriverType
      });
      
      console.log(`[Socket] Diffusion commande à ${authenticatedSockets.length} chauffeurs`);
      
      authenticatedSockets.forEach(driverSocket => {
        driverSocket.emit('order:available', {
          ...orderData,
          timestamp: new Date().toISOString()
        });
      });

      socket.emit('order:sent:confirmation', {
        status: 'success',
        orderId: orderData.orderId,
        recipientCount: authenticatedSockets.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[Socket] Erreur diffusion commande:', error);
      socket.emit('order:sent:confirmation', {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  socket.on('order:receipt:confirmation', (data) => {
    const { orderId } = data;
    const driverId = driversManager.sessions.get(socket.id);
    
    if (driverId && orderId) {
      // Enregistrer la confirmation de réception
      orderManager.recordReceipt(orderId, driverId);
    }
  });
  socket.on('order:cancel', ({ orderId, userId }) => {
    console.log(`[Socket] Recherche pour la commande ${orderId} annulée par le client ${userId}`);
    
    // Check if the timeout exists before trying to clear it
    if (activeOrderTimeouts && activeOrderTimeouts.has(orderId)) {
      clearTimeout(activeOrderTimeouts.get(orderId));
      activeOrderTimeouts.delete(orderId);
    }
    
    // Inform drivers that this order is no longer available
    socket.broadcast.emit('order:cancelled', { 
      orderId,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Confirmation to the client
    socket.emit('order:cancel:confirmation', {
      status: 'success',
      orderId,
      timestamp: new Date().toISOString()
    });

  // const orderTimeout = setTimeout(() => {
  //   // Handle timeout logic
  //   io.emit('order:timeout', {
  //     orderId: orderData.orderId,
  //     reason: 'no_driver_found',
  //     timestamp: new Date().toISOString()
  //   });
    
  //   activeOrderTimeouts.delete(orderData.orderId);
  // }, 60000); // 60 seconds example
  
  // activeOrderTimeouts.set(orderData.orderId, orderTimeout);
});
 
  // Acceptation de commande
  socket.on('order:accept', ({ orderId, driverId, clientId, driverInfo }) => {
    try {
      if (!driversManager.isDriverAuthenticated(driverId)) {
        throw new Error('Chauffeur non authentifié');
      }

      const driverStatus = driversManager.getDriverInfo(driverId);
      if (!driverStatus.isActive) {
        throw new Error('Chauffeur inactif');
      }

      console.log(`[Socket] Commande ${orderId} acceptée par chauffeur ${driverId}`);

      // Émission à tous les clients
      io.emit('order:accepted', {
        orderId,
        driverId,
        clientId,
        driverInfo: {
          ...driverInfo,
          type: driverStatus.type
        },
        timestamp: new Date().toISOString()
      });

      socket.emit('order:accept:confirmation', {
        status: 'success',
        orderId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[Socket] Erreur acceptation commande:', error);
      socket.emit('order:accept:confirmation', {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Mise à jour statut chauffeur
  socket.on('driver:status:update', async (statusData) => {
    try {
      const driverId = driversManager.sessions.get(socket.id);
      if (!driverId) {
        throw new Error('Session non trouvée');
      }
  
      // Mise à jour du statut dans le gestionnaire de chauffeurs
      const driverData = driversManager.drivers.get(driverId);
      if (driverData) {
        driverData.status = statusData.status;
        driversManager.updateDriverActivity(driverId, statusData);
      }
  
      // Si le chauffeur devient disponible, on s'assure qu'il peut recevoir de nouvelles commandes
      if (statusData.status === 'available') {
        const driverStatus = driversManager.driverStatus.get(driverId);
        if (driverStatus) {
          driverStatus.isAuthenticated = true;
          driverStatus.socket = socket;
        }
      }
      
      socket.emit('driver:status:update:confirmation', {
        status: 'success',
        timestamp: new Date().toISOString()
      });
  
    } catch (error) {
      console.error('[Socket] Erreur mise à jour statut:', error);
      socket.emit('driver:status:update:confirmation', {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Gestion du ping
  socket.on('ping', (data) => {
    const driverId = driversManager.sessions.get(socket.id);
    if (driverId) {
      driversManager.updateDriverActivity(driverId, data);
      socket.emit('pong', {
        timestamp: new Date().toISOString()
      });
    }
  });

  // Déconnexion
  socket.on('disconnect', (reason) => {
    const removedDriverId = driversManager.handleDriverDisconnect(socket.id);
    if (removedDriverId) {
      console.log(`[Socket] Chauffeur ${removedDriverId} déconnecté (raison: ${reason})`);
      
      // Notification aux autres clients si nécessaire
      io.emit('driver:offline', {
        driverId: removedDriverId,
        reason: reason,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Monitoring général
  socket.onAny((eventName, ...args) => {
    if (eventName !== 'ping') { // On ignore les logs de ping pour éviter le spam
      console.log(`[Socket] Événement reçu (${socket.id}): ${eventName}`, args);
    }
  });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`[Server] Démarré sur le port ${PORT} (Env: ${process.env.NODE_ENV || 'development'})`);
  
  // Log initial du système
  driversManager.logDetailedStatus();
});

// Gestion de l'arrêt propre
process.on('SIGTERM', () => {
  console.log('[Server] Signal SIGTERM reçu, arrêt en cours...');
  
  // Notification à tous les clients
  io.emit('server:shutdown', {
    timestamp: new Date().toISOString()
  });

  // Fermeture propre du serveur HTTP
  httpServer.close(() => {
    console.log('[Server] Serveur arrêté avec succès');
    process.exit(0);
  });

  // Timeout de sécurité
  setTimeout(() => {
    console.error('[Server] Arrêt forcé après timeout');
    process.exit(1);
  }, 10000);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('[Server] Erreur non capturée:', error);
  
  // Log de l'état du système avant arrêt
  driversManager.logDetailedStatus();
  
  // Arrêt propre du serveur
  httpServer.close(() => {
    process.exit(1);
  });
});

module.exports = {
  app,
  httpServer,
  io,
  driversManager
};
