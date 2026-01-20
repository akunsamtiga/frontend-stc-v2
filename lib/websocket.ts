// lib/websocket.ts - ✅ FIXED: Correct Backend URL
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
  
  private isConnecting = false;
  private isConnected = false;

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
    if (this.isConnecting || this.isConnected) {
      console.log('⚠️ WebSocket already connecting or connected');
      return;
    }

    this.isConnecting = true;
    this.token = token;

    try {
     
const BACKEND_WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'https://api.stcautotrade.id';

      console.log('🔌 Connecting to WebSocket:', BACKEND_WS_URL);

      this.socket = io(BACKEND_WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
        // ✅ IMPORTANT: Force new connection
        forceNew: true,
        // ✅ Allow cross-origin
        withCredentials: false,
      });

      this.setupEventHandlers();

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      this.isConnecting = false;
      this.handleConnectionError();
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      toast.success('Real-time updates enabled', {
        duration: 2000,
        position: 'top-right',
      });

      this.resubscribeAll();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 WebSocket disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false;

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        setTimeout(() => {
          if (this.token) {
            this.connect(this.token);
          }
        }, this.reconnectDelay);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.handleConnectionError();
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.reconnectAttempts = attempt;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed');
      this.isConnecting = false;
      toast.error('Failed to reconnect to real-time service', {
        duration: 3000,
      });
    });

    // Price updates
    this.socket.on('price:update', (data: PriceUpdate) => {
      this.handlePriceUpdate(data);
    });

    // Order updates
    this.socket.on('order:update', (data: OrderUpdate) => {
      this.handleOrderUpdate(data);
    });

    // Subscription confirmations
    this.socket.on('user:subscribed', (data) => {
      console.log('✅ User subscribed:', data);
    });

    this.socket.on('price:subscribed', (data) => {
      console.log('✅ Price subscribed:', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      toast.error(error.message || 'WebSocket error', {
        duration: 3000,
      });
    });
  }

  private handleConnectionError() {
    this.isConnected = false;
    this.isConnecting = false;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Unable to connect to real-time service', {
        duration: 5000,
        description: 'Please refresh the page to try again',
      });
    }
  }

  private handlePriceUpdate(data: PriceUpdate) {
    const callbacks = this.priceCallbacks.get(data.assetId);
    if (callbacks) {
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
    this.orderCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Order callback error:', error);
      }
    });
  }

  subscribeToPrice(assetId: string, callback: PriceCallback) {
    if (!this.priceCallbacks.has(assetId)) {
      this.priceCallbacks.set(assetId, new Set());
    }
    
    this.priceCallbacks.get(assetId)!.add(callback);

    // Subscribe via WebSocket if connected
    if (this.isConnected && this.socket) {
      this.socket.emit('price:subscribe', { assetIds: [assetId] });
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.priceCallbacks.get(assetId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.priceCallbacks.delete(assetId);
        }
      }
    };
  }

  subscribeToOrders(userId: string, callback: OrderCallback) {
    this.orderCallbacks.add(callback);

    // Subscribe to user room if connected
    if (this.isConnected && this.socket) {
      this.socket.emit('user:subscribe', { userId });
    }

    // Return unsubscribe function
    return () => {
      this.orderCallbacks.delete(callback);
    };
  }

  private resubscribeAll() {
    if (!this.isConnected || !this.socket) return;

    // Resubscribe to all prices
    const assetIds = Array.from(this.priceCallbacks.keys());
    if (assetIds.length > 0) {
      this.socket.emit('price:subscribe', { assetIds });
      console.log('🔄 Resubscribed to prices:', assetIds);
    }

    // Resubscribe to orders will happen when user room is joined
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.token = null;
    this.priceCallbacks.clear();
    this.orderCallbacks.clear();
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id,
    };
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// Expose for debugging
if (typeof window !== 'undefined') {
  (window as any).ws = websocketService;
}