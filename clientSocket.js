import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.serverUrl = 'https://driverappmobile.onrender.com';
    //this.serverUrl = 'http://192.168.80.15:3000';
    this.isConnected = false;
    this.currentDriverId = null;
    this.connectionState = {
      isAuthenticated: false,
      lastAuthTime: null,
      reconnectCount: 0
    };
    this.heartbeatInterval = null;
    this.authenticationPromise = null;
    
   
    this.storage = {
      setItem: async (key, value) => {
        try {
          await AsyncStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.error('[Storage] Erreur:', e);
        }
      },
      getItem: async (key) => {
        try {
          const item = await AsyncStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch (e) {
          console.error('[Storage] Erreur:', e);
          return null;
        }
      },
      removeItem: async (key) => {
        try {
          await AsyncStorage.removeItem(key);
        } catch (e) {
          console.error('[Storage] Erreur:', e);
        }
      }
    };

    // Liaison des méthodes
    this.handleSocketEvents = this.handleSocketEvents.bind(this);
    this.reconnect = this.reconnect.bind(this);
  }

  async initialize() {
    console.log('[SocketService] Initialisation...');
    
    try {
      // Restauration de l'état précédent
      const savedState = await this.storage.getItem('driverState');
      if (savedState && savedState.driverId) {
        this.currentDriverId = savedState.driverId;
        this.connectionState.lastAuthTime = savedState.lastAuthTime;
        
        // Tentative de reconnexion automatique
        await this.connect();
        if (this.currentDriverId) {
          await this.authenticateDriver(this.currentDriverId);
        }
      }
    } catch (error) {
      console.error('[SocketService] Erreur initialisation:', error);
      throw error;
    }
  }
  async cancelOrder(orderId, userId) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket non connecté'));
        return;
      }
  
      const timeout = setTimeout(() => {
        reject(new Error('Timeout annulation commande'));
      }, 10000);
  
      this.socket.emit('order:cancel', {
        orderId,
        userId,
        timestamp: Date.now()
      });
  
      this.socket.once('order:cancel:confirmation', (confirmation) => {
        clearTimeout(timeout);
        
        if (confirmation.status === 'success') {
          console.log('[SocketService] Commande annulée avec succès:', orderId);
          resolve(confirmation);
        } else {
          reject(new Error(confirmation.error || 'Échec annulation commande'));
        }
      });
    });
  }

  async connect() {
    console.log('[SocketService] Tentative de connexion...');
    
    if (this.socket && this.isConnected) {
      console.log('[SocketService] Déjà connecté');
      return true;
    }

    return new Promise((resolve, reject) => {
      try {
        // Configuration du socket
        this.socket = io(this.serverUrl, {
          transports: ['polling', 'websocket'],
          upgrade: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          forceNew: true,
          auth: {
            driverId: this.currentDriverId
          },
          query: {
            timestamp: Date.now(),
            version: '1.0.0',
            platform: 'mobile',
            driverId: this.currentDriverId
          }
        });

        // Configuration des événements socket
        this.handleSocketEvents(resolve, reject);

      } catch (error) {
        console.error('[SocketService] Erreur connexion:', error);
        reject(error);
      }
    });
  }
  async clearActiveRide() {
    try {
      await AsyncStorage.removeItem('activeRide');
      return true;
    } catch (error) {
      console.error('[SocketService] Erreur suppression course active:', error);
      return false;
    }
  }
  

  handleSocketEvents(resolve, reject) {
    // Événement de connexion réussie
    this.socket.on('connect', async () => {
      console.log('[SocketService] Connecté:', this.socket.id);
      this.isConnected = true;
      this.connectionState.reconnectCount = 0;
      
      if (this.currentDriverId && !this.connectionState.isAuthenticated) {
        try {
          await this.authenticateDriver(this.currentDriverId);
        } catch (error) {
          console.error('[SocketService] Erreur réauthentification:', error);
        }
      }
      
      resolve(true);
      this.startHeartbeat();
    });

    // Gestion des erreurs de connexion
    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Erreur connexion:', error);
      this.isConnected = false;
      this.connectionState.reconnectCount++;
      
      if (this.connectionState.reconnectCount >= 5) {
        reject(new Error('Nombre maximum de tentatives atteint'));
      }
    });

    // Gestion des déconnexions
    this.socket.on('disconnect', async (reason) => {
      console.log('[SocketService] Déconnexion:', reason);
      this.isConnected = false;
      this.stopHeartbeat();

      if (reason === 'io server disconnect' || reason === 'transport close') {
        await this.reconnect();
      }
    });

    // Gestion de l'expiration de session
    this.socket.on('driver:session:expired', async (data) => {
      console.log('[SocketService] Session expirée:', data);
      this.connectionState.isAuthenticated = false;
      
      if (data.reason === 'new_session') {
        // Une nouvelle session a été ouverte ailleurs
        await this.disconnect(true);
      } else if (data.reason === 'inactivity') {
        // Session expirée pour inactivité
        await this.reconnect();
      }
    });

    // Monitoring des événements
    this.socket.onAny((eventName, ...args) => {
      console.log(`[SocketService] Événement reçu: ${eventName}`, args);
    });
  }

  async authenticateDriver(driverId) {
    console.log('[SocketService] Authentification chauffeur:', driverId);
    
    // Vérification de l'état de connexion
    if (!this.socket || !this.isConnected) {
      await this.connect();
    }

    // Une seule tentative d'authentification à la fois
    if (this.authenticationPromise) {
      return this.authenticationPromise;
    }

    this.authenticationPromise = new Promise((resolve, reject) => {
      const authTimeout = setTimeout(() => {
        this.authenticationPromise = null;
        reject(new Error('Timeout authentification'));
      }, 10000);

      this.socket.emit('driver:connect', {
        driverId,
        timestamp: Date.now(),
        reconnect: this.connectionState.reconnectCount > 0
      });

      this.socket.once('driver:connect:confirmation', async (response) => {
        clearTimeout(authTimeout);
        this.authenticationPromise = null;
        
        if (response.status === 'success') {
          this.currentDriverId = driverId;
          this.connectionState.isAuthenticated = true;
          this.connectionState.lastAuthTime = Date.now();
          
          // Sauvegarde de l'état
          await this.storage.setItem('driverState', {
            driverId: this.currentDriverId,
            lastAuthTime: this.connectionState.lastAuthTime
          });

          console.log('[SocketService] Authentification réussie');
          resolve(response);
        } else {
          console.error('[SocketService] Échec authentification:', response.error);
          reject(new Error(response.error));
        }
      });
    });

    return this.authenticationPromise;
  }

  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.connectionState.isAuthenticated) {
        this.socket.emit('ping', {
          driverId: this.currentDriverId,
          timestamp: Date.now()
        });
      }
    }, 25000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async reconnect() {
    console.log('[SocketService] Tentative de reconnexion...');
    
    try {
      if (this.currentDriverId) {
        await this.connect();
        await this.authenticateDriver(this.currentDriverId);
      }
    } catch (error) {
      console.error('[SocketService] Échec reconnexion:', error);
      throw error;
    }
  }

  async disconnect(clearState = false) {
    console.log('[SocketService] Déconnexion...');
    
    try {
      this.stopHeartbeat();
      
      if (this.socket) {
        this.socket.disconnect();
      }
      
      this.isConnected = false;
      this.connectionState.isAuthenticated = false;
      
      if (clearState) {
        await this.storage.removeItem('driverState');
        this.currentDriverId = null;
      }
      
      return true;
    } catch (error) {
      console.error('[SocketService] Erreur déconnexion:', error);
      return false;
    }
  }
  onDisconnect(callback) {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }
  
    this.socket.off('disconnect');
    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Déconnexion:', reason);
      if (callback) callback(reason);
    });
  }

  // Gestion des commandes
  onNewOrder(callback) {
    if (!this.socket) {
      console.error('[SocketService] Socket non connecté');
      return;
    }
  
    // Écouter les nouvelles commandes
    this.socket.off('order:available');
    this.socket.on('order:available', (orderData) => {
      console.log('[SocketService] Nouvelle commande:', orderData);
      
      // Envoyer un accusé de réception automatique
      const orderId = orderData.id || orderData.orderId;
      if (orderId) {
        this.sendOrderReceipt(orderId);
      }
      
      // Appeler le callback avec les données de commande
      callback(orderData);
    });
    
    // Écouter les demandes d'accusé de réception
    this.socket.off('order:receipt:request');
    this.socket.on('order:receipt:request', (data) => {
      const orderId = data.orderId;
      if (orderId) {
        this.sendOrderReceipt(orderId);
      }
    });
    
    // Écouter les notifications de commande non disponible
    this.socket.off('order:unavailable');
    this.socket.on('order:unavailable', (data) => {
      console.log(`[SocketService] Commande ${data.orderId} n'est plus disponible:`, data.reason);
    });
  }

  async sendNewOrder(orderData) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket non connecté'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout envoi commande'));
      }, 10000);

      this.socket.emit('new:order', orderData);

      this.socket.once('order:sent:confirmation', (confirmation) => {
        clearTimeout(timeout);
        
        if (confirmation.status === 'success') {
          resolve(confirmation);
        } else {
          reject(new Error(confirmation.error || 'Échec envoi commande'));
        }
      });
    });
  };
  // Ajouter cette méthode après sendNewOrder
async sendOrderReceipt(orderId) {
  if (!this.socket || !this.isConnected) {
    console.error("[SocketService] Impossible d'accusé de réception: socket non connecté");
    return false;
  }
  
  try {
    this.socket.emit('order:receipt:confirmation', {
      orderId,
      timestamp: Date.now()
    });
    return true;
  } catch (error) {
    console.error('[SocketService] Erreur envoi accusé réception:', error);
    return false;
  }
}

// Ajouter cette méthode
async updateRideStatus(orderId, status, additionalInfo = {}) {
  return new Promise((resolve, reject) => {
    if (!this.socket || !this.isConnected) {
      reject(new Error('Socket non connecté'));
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('Timeout mise à jour statut course'));
    }, 10000);

    this.socket.emit('ride:status:update', {
      orderId,
      status,
      ...additionalInfo,
      timestamp: Date.now()
    });

    this.socket.once('ride:status:update:confirmation', (confirmation) => {
      clearTimeout(timeout);
      
      if (confirmation.status === 'success') {
        resolve(confirmation);
      } else {
        reject(new Error(confirmation.error || 'Échec mise à jour statut'));
      }
    });
  });
}

// Ajouter cette méthode
async updateDriverLocation(orderId, location, estimatedArrival = null) {
  return new Promise((resolve, reject) => {
    if (!this.socket || !this.isConnected) {
      reject(new Error('Socket non connecté'));
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('Timeout mise à jour position'));
    }, 5000);

    const updateData = {
      orderId,
      location,
      timestamp: Date.now()
    };
    
    if (estimatedArrival) {
      updateData.estimatedArrival = estimatedArrival;
    }

    this.socket.emit('driver:location:update', updateData);

    this.socket.once('driver:location:update:confirmation', (confirmation) => {
      clearTimeout(timeout);
      
      if (confirmation.status === 'success') {
        resolve(confirmation);
      } else {
        reject(new Error(confirmation.error || 'Échec mise à jour position'));
      }
    });
  });
};
// Ajouter à la fin de la classe
onDriverLocationUpdate(callback) {
  if (!this.socket) {
    console.error('[SocketService] Socket non connecté');
    return;
  }

  this.socket.off('driver:location:update');
  this.socket.on('driver:location:update', (data) => {
    console.log('[SocketService] Mise à jour position chauffeur:', data);
    if (callback) callback(data);
  });
}

onRideStatusUpdate(callback) {
  if (!this.socket) {
    console.error('[SocketService] Socket non connecté');
    return;
  }

  this.socket.off('ride:status:update');
  this.socket.on('ride:status:update', (data) => {
    console.log('[SocketService] Mise à jour statut course:', data);
    if (callback) callback(data);
  });
}
  async acceptOrder(orderId, driverId, clientId, driverInfo) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket non connecté'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Timeout acceptation commande'));
      }, 10000);

      // Désactiver l'écoute des nouvelles commandes
      this.socket.off('order:available');

      this.socket.emit('order:accept', {
        orderId,
        driverId,
        clientId,
        driverInfo
      });

      this.socket.once('order:accept:confirmation', (confirmation) => {
        clearTimeout(timeout);
        
        if (confirmation.status === 'success') {
          resolve(confirmation);
        } else {
          // Réactiver l'écoute des commandes en cas d'échec
          this.onNewOrder((orderData) => {
            console.log('[SocketService] Nouvelle commande:', orderData);
          });
          reject(new Error(confirmation.error || 'Échec acceptation commande'));
        }
      });
    });
  }

  // Ajouter une méthode pour réactiver l'écoute des commandes
  enableOrderListening(callback) {
    if (this.socket) {
      this.onNewOrder(callback);
    }
  }
}

export const socketService = new SocketService();
