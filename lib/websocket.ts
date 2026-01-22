import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface PriceUpdate {
  assetId: string;
  price: number;
  timestamp: number;
  datetime: string;
  volume24h?: number;
  changePercent24h?: number;
  high24h?: number;
  low24h?: number;
}

interface OrderUpdate {
  event: 'order:created' | 'order:settled';
  id: string;
  status?: string;
  exit_price?: number;
  profit?: number;
  asset_symbol?: string;
  timestamp: number;
}

type PriceCallback = (data: PriceUpdate) => void;
type OrderCallback = (data: OrderUpdate) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  private priceCallbacks: Map<string, Set<PriceCallback>> = new Map();
  private orderCallbacks: Set<OrderCallback> = new Set();
  private currentUserId: string | null = null;
  
  private isConnecting = false;
  private isConnected = false;
  private lastValidTimestamp: Map<string, number> = new Map();
  private readonly MAX_ACCEPTABLE_AGE = 5000;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeFromStorage();
    }
  }

  private initializeFromStorage() {
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        this.token = storedToken;
      }
    } catch (error) {
      console.error('Failed to get token from storage:', error);
    }
  }

  async connect(token: string) {
    if (this.isConnecting) {
      console.log('WebSocket already connecting');
      return;
    }

    if (this.isConnected && this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.isConnecting = true;
    this.token = token;

    try {
      const BACKEND_WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'https://api.stcautotrade.id';

      console.log('Connecting to WebSocket:', BACKEND_WS_URL);

      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      this.socket = io(BACKEND_WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        forceNew: true,
        withCredentials: false,
        path: '/socket.io/',
      });

      this.setupEventHandlers();

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.handleConnectionError();
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.resubscribeAll();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false;

      if (reason === 'io server disconnect') {
        setTimeout(() => {
          if (this.token) {
            console.log('Attempting to reconnect...');
            this.connect(this.token);
          }
        }, this.reconnectDelay);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
      this.handleConnectionError();
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.reconnectAttempts = attempt;
    });

    this.socket.on('reconnect', (attempt) => {
      console.log(`Reconnected after ${attempt} attempts`);
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.isConnecting = false;
      toast.error('Failed to reconnect to real-time service', {
        duration: 3000,
      });
    });

    this.socket.on('price:update', (data: PriceUpdate) => {
      this.handlePriceUpdate(data);
    });

    this.socket.on('order:update', (data: OrderUpdate) => {
      this.handleOrderUpdate(data);
    });

    this.socket.on('user:subscribed', (data) => {
      console.log('User subscribed:', data);
    });

    this.socket.on('price:subscribed', (data) => {
      console.log('Price subscribed:', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      toast.error(error.message || 'WebSocket error', {
        duration: 3000,
      });
    });
  }

  private handleConnectionError() {
    this.isConnected = false;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Unable to connect to real-time service', {
        duration: 5000,
        description: 'Please refresh the page to try again',
      });
    }
  }

  private handlePriceUpdate(data: PriceUpdate) {
    const dataAge = Date.now() - data.timestamp;
    if (dataAge > this.MAX_ACCEPTABLE_AGE) {
      console.warn(`Stale price data (${dataAge}ms old) for ${data.assetId}`);
      return;
    }

    const callbacks = this.priceCallbacks.get(data.assetId);
    if (callbacks && callbacks.size > 0) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Price callback error:', error);
        }
      });
    }
  }

  private handleOrderUpdate(data: OrderUpdate) {
    if (this.orderCallbacks.size > 0) {
      this.orderCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Order callback error:', error);
        }
      });
    }
  }

  subscribeToPrice(assetId: string, callback: PriceCallback) {
    console.log('Subscribing to price stream for:', assetId);
    
    if (!this.priceCallbacks.has(assetId)) {
      this.priceCallbacks.set(assetId, new Set());
    }
    
    this.priceCallbacks.get(assetId)!.add(callback);

    if (this.isConnected && this.socket?.connected) {
      this.socket.emit('price:subscribe', { assetIds: [assetId] });
    }

    return () => {
      console.log('Unsubscribing from price for asset:', assetId);
      
      const callbacks = this.priceCallbacks.get(assetId);
      if (callbacks) {
        callbacks.delete(callback);
        
        if (callbacks.size === 0) {
          this.priceCallbacks.delete(assetId);
          
          if (this.isConnected && this.socket?.connected) {
            this.socket.emit('price:unsubscribe', { assetIds: [assetId] });
          }
        }
      }
    };
  }

  subscribeToOrders(userId: string, callback: OrderCallback) {
    console.log('Subscribing to orders for user:', userId);

    this.currentUserId = userId;
    this.orderCallbacks.add(callback);

    if (this.isConnected && this.socket?.connected) {
      this.socket.emit('user:subscribe', { userId });
    }

    return () => {
      console.log('Unsubscribing from orders for user:', userId);
      this.orderCallbacks.delete(callback);
      
      if (this.orderCallbacks.size === 0) {
        this.currentUserId = null;
        
        if (this.isConnected && this.socket?.connected) {
          this.socket.emit('user:unsubscribe', { userId });
        }
      }
    };
  }

  private resubscribeAll() {
    if (!this.isConnected || !this.socket?.connected) {
      console.log('Cannot resubscribe: not connected');
      return;
    }

    console.log('Resubscribing to all subscriptions...');

    const assetIds = Array.from(this.priceCallbacks.keys());
    if (assetIds.length > 0) {
      this.socket.emit('price:subscribe', { assetIds });
      console.log('Resubscribed to prices:', assetIds);
    }

    if (this.currentUserId && this.orderCallbacks.size > 0) {
      this.socket.emit('user:subscribe', { userId: this.currentUserId });
      console.log('Resubscribed to user orders:', this.currentUserId);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.token = null;
    this.currentUserId = null;
    this.priceCallbacks.clear();
    this.orderCallbacks.clear();
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
      connected: this.socket?.connected || false,
      activeSubscriptions: {
        prices: this.priceCallbacks.size,
        orders: this.orderCallbacks.size,
      },
    };
  }

  forceReconnect() {
    console.log('Force reconnecting...');
    
    if (this.socket) {
      this.socket.disconnect();
    }
    
    if (this.token) {
      setTimeout(() => {
        this.connect(this.token!);
      }, 500);
    }
  }
}

export const websocketService = new WebSocketService();

if (typeof window !== 'undefined') {
  (window as any).ws = websocketService;
  (window as any).wsDebug = {
    status: () => websocketService.getConnectionStatus(),
    reconnect: () => websocketService.forceReconnect(),
    disconnect: () => websocketService.disconnect(),
  };
}