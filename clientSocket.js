import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.serverUrl = 'https://driverappmobile.onrender.com';
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.connectionTimeout = null;
    this.pingInterval = null;
  }

  async connect() {
    if (this.socket && this.isConnected) {
      console.log('Socket déjà connecté');
      return true;
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['polling', 'websocket'],
          upgrade: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          timeout: 20000,
          forceNew: true,
          query: {
            timestamp: Date.now(),
            version: '1.0.0',
            platform: 'mobile'
          }
        });

        // Timeout de connexion
        this.connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            console.error('Timeout de connexion');
            this.socket.disconnect();
            reject(new Error('Connection timeout'));
          }
        }, 15000);

        this.socket.on('connect', () => {
          console.log('Connecté au serveur WebSocket:', this.socket.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          clearTimeout(this.connectionTimeout);
          resolve(true);

          // Démarrer le ping manuel
          this.startPing();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Erreur de connexion WebSocket:', error.message);
          this.isConnected = false;
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Max reconnection attempts reached'));
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Déconnecté du serveur WebSocket:', reason);
          this.isConnected = false;
          this.stopPing();

          if (reason === 'io server disconnect') {
            this.socket.connect();
          }
        });

        this.socket.on('error', (error) => {
          console.error('Erreur WebSocket:', error);
        });

        // Logging de tous les événements
        this.socket.onAny((eventName, ...args) => {
          console.log(`Événement reçu: ${eventName}`, args);
        });

      } catch (error) {
        console.error('Erreur initialisation socket:', error);
        reject(error);
      }
    });
  }

  startPing() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.socket.emit('ping');
      }
    }, 25000);
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  async connectAsDriver(driverId) {
    if (!this.socket || !this.isConnected) {
      try {
        await this.connect();
      } catch (error) {
        console.error('Impossible de se connecter au serveur:', error);
        return false;
      }
    }
  
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Driver connection confirmation timeout'));
      }, 10000);

      console.log(`Tentative de connexion en tant que chauffeur ${driverId}`);
      this.socket.emit('driver:connect', driverId);
  
      this.socket.once('driver:connect:confirmation', (confirmation) => {
        clearTimeout(timeout);
        console.log('Confirmation connexion chauffeur:', confirmation);
        
        if (confirmation.status === 'success') {
          resolve(true);
        } else {
          reject(new Error(confirmation.error || 'Driver connection failed'));
        }
      });
    });
  }

  sendNewOrder(orderData) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket non connecté'));
        return;
      }
    
      try {
        console.log('Envoi nouvelle commande:', orderData);
        this.socket.emit('new:order', orderData);
    
        const timeout = setTimeout(() => {
          reject(new Error('Order confirmation timeout'));
        }, 10000);
    
        this.socket.once('order:sent:confirmation', (confirmation) => {
          clearTimeout(timeout);
          console.log('Confirmation envoi commande:', confirmation);
          
          if (confirmation.status === 'success') {
            resolve(confirmation);
          } else {
            reject(new Error(confirmation.error || 'Failed to send order'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  onNewOrder(callback) {
    if (!this.socket) {
      console.error('Impossible d\'écouter les nouvelles commandes: Socket non connecté');
      return;
    }

    try {
      // Supprimer les anciens listeners pour éviter les doublons
      this.socket.off('order:available');
      
      this.socket.on('order:available', (orderData) => {
        console.log('Nouvelle commande reçue:', orderData);
        callback(orderData);
      });
    } catch (error) {
      console.error('Erreur configuration listener commandes:', error);
    }
  }

  acceptOrder(orderId, driverId, clientId, driverInfo) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket non connecté'));
        return;
      }

      try {
        console.log('Acceptation commande:', { orderId, driverId, clientId, driverInfo });
        this.socket.emit('order:accept', { orderId, driverId, clientId, driverInfo });

        const timeout = setTimeout(() => {
          reject(new Error('Order acceptance confirmation timeout'));
        }, 10000);

        this.socket.once('order:accept:confirmation', (confirmation) => {
          clearTimeout(timeout);
          console.log('Confirmation acceptation commande:', confirmation);
          
          if (confirmation.status === 'success') {
            resolve(confirmation);
          } else {
            reject(new Error(confirmation.error || 'Failed to accept order'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    return new Promise((resolve) => {
      if (this.socket) {
        try {
          this.stopPing();
          this.socket.disconnect();
          this.isConnected = false;
          this.socket = null;
          console.log('Déconnecté du serveur WebSocket');
          resolve(true);
        } catch (error) {
          console.error('Erreur déconnexion socket:', error);
          resolve(false);
        }
      } else {
        resolve(true);
      }
    });
  }
}

export const socketService = new SocketService();
