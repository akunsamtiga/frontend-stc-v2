// lib/websocket.ts - ✅ FIXED: Proper WebSocket Implementation
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
      console.log('⚠️ WebSocket already connecting');
      return;
    }

    if (this.isConnected && this.socket?.connected) {
      console.log('✅ WebSocket already connected');
      return;
    }

    this.isConnecting = true;
    this.token = token;

    try {
      // ✅ FIXED: Get backend URL from env
      const BACKEND_WS_URL = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'https://api.stcautotrade.id';

      console.log('🔌 Connecting to WebSocket:', BACKEND_WS_URL);

      // ✅ Disconnect old socket if exists
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      // ✅ Create new socket connection
      this.socket = io(BACKEND_WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'], // Try websocket first
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        forceNew: true,
        withCredentials: false,
        // ✅ IMPORTANT: Socket.IO path (default is /socket.io/)
        path: '/socket.io/',
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

    // ============================================
    // CONNECTION EVENTS
    // ============================================

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      toast.success('Real-time updates enabled', {
        duration: 2000,
        position: 'top-right',
      });

      // ✅ Resubscribe to all active subscriptions
      this.resubscribeAll();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 WebSocket disconnected:', reason);
      this.isConnected = false;
      this.isConnecting = false;

      // ✅ Auto-reconnect if server disconnected us
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          if (this.token) {
            console.log('🔄 Attempting to reconnect...');
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

    this.socket.on('reconnect', (attempt) => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed');
      this.isConnecting = false;
      toast.error('Failed to reconnect to real-time service', {
        duration: 3000,
      });
    });

    // ============================================
    // DATA EVENTS
    // ============================================

    // ✅ Price updates (matches backend event name)
    this.socket.on('price:update', (data: PriceUpdate) => {
      this.handlePriceUpdate(data);
    });

    // ✅ Order updates (matches backend event name)
    this.socket.on('order:update', (data: OrderUpdate) => {
      this.handleOrderUpdate(data);
    });

    // ============================================
    // SUBSCRIPTION CONFIRMATIONS
    // ============================================

    this.socket.on('user:subscribed', (data) => {
      console.log('✅ User subscribed:', data);
    });

    this.socket.on('price:subscribed', (data) => {
      console.log('✅ Price subscribed:', data);
    });

    // ============================================
    // ERROR HANDLING
    // ============================================

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

  // ============================================
  // SUBSCRIPTION METHODS
  // ============================================

  subscribeToPrice(assetId: string, callback: PriceCallback) {
    console.log('📡 Subscribing to price for asset:', assetId);

    // Add callback to map
    if (!this.priceCallbacks.has(assetId)) {
      this.priceCallbacks.set(assetId, new Set());
    }
    
    this.priceCallbacks.get(assetId)!.add(callback);

    // ✅ Subscribe via WebSocket if connected
    if (this.isConnected && this.socket?.connected) {
      this.socket.emit('price:subscribe', { assetIds: [assetId] });
      console.log('✅ Sent price:subscribe event for:', assetId);
    }

    // Return unsubscribe function
    return () => {
      console.log('🔕 Unsubscribing from price for asset:', assetId);
      
      const callbacks = this.priceCallbacks.get(assetId);
      if (callbacks) {
        callbacks.delete(callback);
        
        // ✅ If no more callbacks, unsubscribe from backend
        if (callbacks.size === 0) {
          this.priceCallbacks.delete(assetId);
          
          if (this.isConnected && this.socket?.connected) {
            this.socket.emit('price:unsubscribe', { assetIds: [assetId] });
            console.log('✅ Sent price:unsubscribe event for:', assetId);
          }
        }
      }
    };
  }

  subscribeToOrders(userId: string, callback: OrderCallback) {
    console.log('📡 Subscribing to orders for user:', userId);

    this.currentUserId = userId;
    this.orderCallbacks.add(callback);

    // ✅ Subscribe to user room if connected
    if (this.isConnected && this.socket?.connected) {
      this.socket.emit('user:subscribe', { userId });
      console.log('✅ Sent user:subscribe event for:', userId);
    }

    // Return unsubscribe function
    return () => {
      console.log('🔕 Unsubscribing from orders for user:', userId);
      this.orderCallbacks.delete(callback);
      
      // ✅ If no more order callbacks, unsubscribe from backend
      if (this.orderCallbacks.size === 0) {
        this.currentUserId = null;
        
        if (this.isConnected && this.socket?.connected) {
          this.socket.emit('user:unsubscribe', { userId });
          console.log('✅ Sent user:unsubscribe event for:', userId);
        }
      }
    };
  }

  // ============================================
  // RESUBSCRIPTION LOGIC
  // ============================================

  private resubscribeAll() {
    if (!this.isConnected || !this.socket?.connected) {
      console.log('⚠️ Cannot resubscribe: not connected');
      return;
    }

    console.log('🔄 Resubscribing to all subscriptions...');

    // ✅ Resubscribe to all prices
    const assetIds = Array.from(this.priceCallbacks.keys());
    if (assetIds.length > 0) {
      this.socket.emit('price:subscribe', { assetIds });
      console.log('✅ Resubscribed to prices:', assetIds);
    }

    // ✅ Resubscribe to user orders
    if (this.currentUserId && this.orderCallbacks.size > 0) {
      this.socket.emit('user:subscribe', { userId: this.currentUserId });
      console.log('✅ Resubscribed to user orders:', this.currentUserId);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket');
      
      // ✅ Clean disconnect
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

  // ✅ Force reconnect (useful for debugging)
  forceReconnect() {
    console.log('🔄 Force reconnecting...');
    
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

// ✅ Singleton instance
export const websocketService = new WebSocketService();

// ✅ Expose for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).ws = websocketService;
  
  // Debug helper functions
  (window as any).wsDebug = {
    status: () => websocketService.getConnectionStatus(),
    reconnect: () => websocketService.forceReconnect(),
    disconnect: () => websocketService.disconnect(),
  };
}