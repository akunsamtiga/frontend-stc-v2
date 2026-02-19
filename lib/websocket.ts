// lib/websocket.ts
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

// ============================================================
// INTERFACES
// ============================================================

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

/** Shape dari satu OHLC bar yang dikirim backend */
export interface OHLCBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isCompleted?: boolean;
  datetime?: string;
}

/**
 * Payload `ohlc:update` yang di-broadcast backend tiap ~1 detik
 * ke room `asset:{assetId}`.
 */
export interface OHLCUpdate {
  assetId: string;
  /** Bar aktif untuk setiap timeframe (selalu ada) */
  currentBars: Record<string, OHLCBar>;
  /**
   * Bar yang baru saja DITUTUP (completed) pada tick ini.
   * null / tidak ada key = tidak ada bar baru yang tutup.
   */
  completedBars: Record<string, OHLCBar | null>;
}

type PriceCallback = (data: PriceUpdate) => void;
type OrderCallback = (data: OrderUpdate) => void;
type OHLCCallback = (data: OHLCUpdate) => void;

// ============================================================
// SERVICE
// ============================================================

class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private priceCallbacks: Map<string, Set<PriceCallback>> = new Map();
  private orderCallbacks: Set<OrderCallback> = new Set();
  private ohlcCallbacks: Map<string, Set<OHLCCallback>> = new Map();

  private currentUserId: string | null = null;

  private isConnecting = false;
  private isConnected = false;

  /**
   * Threshold kedaluwarsa data price.
   * 5 000ms = toleransi latency Indonesia ~1 300ms + buffer
   */
  private readonly MAX_ACCEPTABLE_AGE = 5000;

  private highPriorityQueue: OrderUpdate[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeFromStorage();
    }
  }

  private initializeFromStorage() {
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) this.token = storedToken;
    } catch (error) {
      console.error('Failed to get token from storage:', error);
    }
  }

  // ──────────────────────────────────────────────────────────
  // CONNECTION
  // ──────────────────────────────────────────────────────────

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
      const BACKEND_WS_URL =
        process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'https://api.stcautotrade.id';
      console.log('⚡ Connecting to WebSocket:', BACKEND_WS_URL);

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

  // ──────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ──────────────────────────────────────────────────────────

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('⚡ WebSocket connected:', this.socket?.id);
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

    // ── Price ──────────────────────────────────────────────
    this.socket.on('price:update', (data: PriceUpdate) => {
      this.handlePriceUpdate(data);
    });

    // ── OHLC ───────────────────────────────────────────────
    // Backend broadcast tiap ~1s ke room asset:{assetId}
    this.socket.on('ohlc:update', (data: OHLCUpdate) => {
      this.handleOHLCUpdate(data);
    });

    // ── Orders ─────────────────────────────────────────────
    this.socket.on('order:update', (data: OrderUpdate) => {
      if (data.priority === 'high') {
        this.handleHighPriorityOrderUpdate(data);
      } else {
        this.handleOrderUpdate(data);
      }
    });

    this.socket.on('order:created', (data: OrderUpdate) => {
      console.log('🆕 Order created via WebSocket:', data.id);
      this.handleHighPriorityOrderUpdate({
        ...data,
        event: 'order:created',
        priority: 'high',
      });
    });

    this.socket.on('order:settled', (data: OrderUpdate) => {
      this.handleHighPriorityOrderUpdate({
        ...data,
        event: 'order:settled',
        priority: 'high',
      });
    });

    this.socket.on('user:subscribed', (data) => {
      console.log('✅ User subscribed:', data);
    });

    this.socket.on('price:subscribed', (data) => {
      console.log('✅ Price subscribed:', data);
    });

    this.socket.on('asset:joined', (data) => {
      console.log('✅ Asset room joined:', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  // ──────────────────────────────────────────────────────────
  // PRICE HANDLING
  // ──────────────────────────────────────────────────────────

  private handlePriceUpdate(data: PriceUpdate) {
    // Auto-detect unit: backend bisa kirim detik atau ms
    const tsInMs =
      data.timestamp < 1e12 ? data.timestamp * 1000 : data.timestamp;
    const dataAge = Date.now() - tsInMs;

    if (dataAge > this.MAX_ACCEPTABLE_AGE) {
      if (dataAge > 30000) {
        console.warn(
          `⚠️ Very stale price data (${Math.round(dataAge / 1000)}s) for ${data.assetId}`
        );
      }
      return;
    }

    const callbacks = this.priceCallbacks.get(data.assetId);
    if (callbacks && callbacks.size > 0) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error('Price callback error:', err);
        }
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // OHLC HANDLING
  // ──────────────────────────────────────────────────────────

  private handleOHLCUpdate(data: OHLCUpdate) {
    if (!data || !data.assetId) return;

    const callbacks = this.ohlcCallbacks.get(data.assetId);
    if (callbacks && callbacks.size > 0) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error('OHLC callback error:', err);
        }
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // ORDER HANDLING
  // ──────────────────────────────────────────────────────────

  private handleHighPriorityOrderUpdate(data: OrderUpdate) {
    console.log('🚀 High-priority order update:', data.event, data.id);
    requestAnimationFrame(() => {
      this.orderCallbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error('Order callback error:', err);
        }
      });
    });
  }

  private handleOrderUpdate(data: OrderUpdate) {
    this.orderCallbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Order callback error:', err);
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  // PUBLIC SUBSCRIBE API
  // ──────────────────────────────────────────────────────────

  /**
   * Subscribe ke price:update untuk satu asset.
   * @returns unsubscribe function
   */
  subscribeToPrice(assetId: string, callback: PriceCallback) {
    console.log('Subscribing to price stream for:', assetId);

    if (!this.priceCallbacks.has(assetId)) {
      this.priceCallbacks.set(assetId, new Set());
    }
    this.priceCallbacks.get(assetId)!.add(callback);

    if (this.isConnected && this.socket?.connected) {
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

  /**
   * Subscribe ke ohlc:update untuk satu asset.
   * Backend broadcast ke room `asset:{assetId}` — pastikan
   * `price:subscribe` sudah dipanggil terlebih dahulu (yang
   * membuat socket join ke room asset) ATAU panggil
   * `asset:join` secara eksplisit.
   *
   * @returns unsubscribe function
   */
  subscribeToOHLC(assetId: string, callback: OHLCCallback): () => void {
    console.log('📊 Subscribing to OHLC for:', assetId);

    if (!this.ohlcCallbacks.has(assetId)) {
      this.ohlcCallbacks.set(assetId, new Set());
    }
    this.ohlcCallbacks.get(assetId)!.add(callback);

    // Join asset room jika socket sudah connect
    if (this.isConnected && this.socket?.connected) {
      this.socket.emit('asset:join', { assetId });
    }

    return () => {
      console.log('📊 Unsubscribing from OHLC for asset:', assetId);
      const callbacks = this.ohlcCallbacks.get(assetId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.ohlcCallbacks.delete(assetId);
          // Tinggalkan room hanya kalau price juga sudah unsub
          if (
            !this.priceCallbacks.has(assetId) &&
            this.isConnected &&
            this.socket?.connected
          ) {
            this.socket.emit('asset:leave', { assetId });
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

  // ──────────────────────────────────────────────────────────
  // RESUBSCRIBE (setelah reconnect)
  // ──────────────────────────────────────────────────────────

  private resubscribeAll() {
    if (!this.isConnected || !this.socket?.connected) return;

    console.log('⚡ Resubscribing to all subscriptions...');

    // Price subscriptions
    const assetIds = Array.from(this.priceCallbacks.keys());
    if (assetIds.length > 0) {
      this.socket.emit('price:subscribe', { assetIds, highFrequency: true });
      console.log('Resubscribed to prices:', assetIds);
    }

    // OHLC: join rooms
    const ohlcAssetIds = Array.from(this.ohlcCallbacks.keys());
    for (const assetId of ohlcAssetIds) {
      if (!assetIds.includes(assetId)) {
        // Asset belum di-join via price, join secara eksplisit
        this.socket.emit('asset:join', { assetId });
      }
    }
    if (ohlcAssetIds.length > 0) {
      console.log('Resubscribed to OHLC rooms:', ohlcAssetIds);
    }

    // Order subscriptions
    if (this.currentUserId && this.orderCallbacks.size > 0) {
      this.socket.emit('user:subscribe', {
        userId: this.currentUserId,
        instantUpdates: true,
        highPriority: true,
      });
      console.log('Resubscribed to user orders:', this.currentUserId);
    }
  }

  // ──────────────────────────────────────────────────────────
  // MISC
  // ──────────────────────────────────────────────────────────

  private handleConnectionError() {
    this.isConnected = false;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      toast.error('Unable to connect to real-time service', {
        duration: 5000,
        description: 'Please refresh the page to try again',
      });
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
    this.ohlcCallbacks.clear();
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
        ohlc: this.ohlcCallbacks.size,
      },
      highPriorityQueue: this.highPriorityQueue.length,
    };
  }

  forceReconnect() {
    console.log('Force reconnecting...');
    if (this.socket) this.socket.disconnect();
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