import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.serverUrl = 'https://driverappmobile.onrender.com';  // Remplacez par votre URL Heroku
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    try {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        upgrade: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server with ID:', this.socket.id);
        this.isConnected = true;
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        this.isConnected = false;
      });
      
      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.error('Error initializing socket:', error);
    }
  }

  sendNewOrder(orderData) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot send order: Socket not connected');
      return;
    }

    try {
      console.log('Sending new order:', orderData);
      this.socket.emit('new:order', orderData);

      

      this.socket.once('order:sent:confirmation', (confirmation) => {
        console.log('Order sent confirmation:', confirmation);
      });
    } catch (error) {
      console.error('Error sending new order:', error);
    }
  }

  connectAsDriver(driverId) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot connect as driver: Socket not connected');
      return;
    }

    try {
      console.log('Connecting as driver:', driverId);
      this.socket.emit('driver:connect', driverId);

      this.socket.once('driver:connect:confirmation', (confirmation) => {
        console.log('Driver connected confirmation:', confirmation);
      });
    } catch (error) {
      console.error('Error connecting as driver:', error);
    }
  }

  onNewOrder(callback) {
    if (!this.socket) {
      console.error('Cannot listen for new orders: Socket not connected');
      return;
    }

    try {
      this.socket.on('order:available', (orderData) => {
        console.log('New order received:', orderData);
        callback(orderData);
      });
    } catch (error) {
      console.error('Error setting up order listener:', error);
    }
  }

  acceptOrder(orderId, driverId, clientId, driverInfo) {
    if (!this.socket || !this.isConnected) {
      console.error('Cannot accept order: Socket not connected');
      return;
    }

    try {
      console.log('Accepting order:', { orderId, driverId, clientId, driverInfo });
      this.socket.emit('order:accept', { orderId, driverId, clientId, driverInfo });

      this.socket.once('order:accept:confirmation', (confirmation) => {
        console.log('Order accept confirmation:', confirmation);
      });
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      try {
        this.socket.disconnect();
        this.isConnected = false;
        console.log('Disconnected from WebSocket server');
      } catch (error) {
        console.error('Error disconnecting socket:', error);
      }
    }
  }
}

export const socketService = new SocketService();