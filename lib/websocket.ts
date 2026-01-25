// lib/websocket.ts - INSTANT VERSION with High-Priority Support
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface PriceUpdate {
  assetId: string;
  price: number;
  timestamp: number;
  datetime: string;
}

interface OrderUpdate {
  event: 'order:created' | 'order:settled' | 'order:updated';
  id: string;
  status?: string;
  exit_price?: number;
  profit?: number;
  asset_symbol?: string;
  timestamp: number;
  priority?: 'high' | 'normal';
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
  private readonly MAX_ACCEPTABLE_AGE = 1000;

  // ✅ High-priority message queue
  private highPriorityQueue: OrderUpdate[] = [];
  private processingHighPriority = false;

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

      console.log('⚡ Connecting to WebSocket with high-priority support:', BACKEND_WS_URL);

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
        // ✅ Optimize for low latency
        upgrade: true,
        rememberUpgrade: true,
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
      console.log('⚡ WebSocket connected (instant mode):', this.socket?.id);
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

    // ✅ INSTANT: Price updates (no batching)
    this.socket.on('price:update', (data: PriceUpdate) => {
      this.handlePriceUpdate(data);
    });

    // ✅ INSTANT: Order updates with priority handling
    this.socket.on('order:update', (data: OrderUpdate) => {
      if (data.priority === 'high') {
        this.handleHighPriorityOrderUpdate(data);
      } else {
        this.handleOrderUpdate(data);
      }
    });

    // ✅ Order settled events (highest priority)
    this.socket.on('order:settled', (data: OrderUpdate) => {
      this.handleHighPriorityOrderUpdate({
        ...data,
        event: 'order:settled',
        priority: 'high',
      });
    });

    this.socket.on('user:subscribed', (data) => {
      console.log('✅ User subscribed (instant updates enabled):', data);
    });

    this.socket.on('price:subscribed', (data) => {
      console.log('✅ Price subscribed (instant updates enabled):', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
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

  // ✅ High-priority order updates (instant, no queue)
  private handleHighPriorityOrderUpdate(data: OrderUpdate) {
    console.log('🚀 High-priority order update:', data.event, data.id);
    
    // Process immediately on next tick for instant feedback
    requestAnimationFrame(() => {
      if (this.orderCallbacks.size > 0) {
        this.orderCallbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Order callback error:', error);
          }
        });
      }
    });
  }

  // ✅ Normal priority order updates
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
      // ✅ Request high-frequency updates
      this.socket.emit('price:subscribe', { 
        assetIds: [assetId],
        highFrequency: true,
      });
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
    console.log('Subscribing to orders for user (instant mode):', userId);

    this.currentUserId = userId;
    this.orderCallbacks.add(callback);

    if (this.isConnected && this.socket?.connected) {
      // ✅ Request instant order updates
      this.socket.emit('user:subscribe', { 
        userId,
        instantUpdates: true,
        highPriority: true,
      });
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

    console.log('⚡ Resubscribing to all subscriptions (instant mode)...');

    const assetIds = Array.from(this.priceCallbacks.keys());
    if (assetIds.length > 0) {
      this.socket.emit('price:subscribe', { 
        assetIds,
        highFrequency: true,
      });
      console.log('Resubscribed to prices:', assetIds);
    }

    if (this.currentUserId && this.orderCallbacks.size > 0) {
      this.socket.emit('user:subscribe', { 
        userId: this.currentUserId,
        instantUpdates: true,
        highPriority: true,
      });
      console.log('Resubscribed to user orders (instant):', this.currentUserId);
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
    this.highPriorityQueue = [];
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
      highPriorityQueue: this.highPriorityQueue.length,
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