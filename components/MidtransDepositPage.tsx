import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Wallet, AlertCircle, CheckCircle, Clock, XCircle, Loader2, Shield, Zap, TestTube } from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface DepositResponse {
  success: boolean;
  data: {
    message: string;
    deposit: {
      id: string;
      order_id: string;
      amount: number;
      status: 'pending' | 'success' | 'failed' | 'expired';
      snap_token: string;
      snap_redirect_url: string;
    };
  };
}

interface DepositHistory {
  id: string;
  order_id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'expired';
  payment_type?: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
}

// ============================================
// API HELPER
// ============================================

class DepositAPI {
  private static baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  
  private static getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  static async createDeposit(amount: number, description?: string): Promise<DepositResponse> {
    const response = await fetch(`${this.baseURL}/payment/deposit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount, description })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create deposit');
    }

    return response.json();
  }

  static async getDepositHistory(): Promise<DepositHistory[]> {
    const response = await fetch(`${this.baseURL}/payment/deposits`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch deposit history');
    }

    const data = await response.json();
    return data.data?.deposits || data.deposits || [];
  }

  static async checkDepositStatus(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/payment/deposit/${orderId}/status`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to check deposit status');
    }

    return response.json();
  }
}

// ============================================
// MIDTRANS SNAP INTEGRATION
// ============================================

class MidtransSnap {
  private static isLoaded = false;

  static loadScript(): Promise<void> {
    if (this.isLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      
      // ✅ SANDBOX/PRODUCTION MODE
      const isSandbox = process.env.NEXT_PUBLIC_MIDTRANS_MODE === 'sandbox';
      script.src = isSandbox 
        ? 'https://app.sandbox.midtrans.com/snap/snap.js'  // Sandbox
        : 'https://app.midtrans.com/snap/snap.js';         // Production
      
      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
      
      script.onload = () => {
        this.isLoaded = true;
        console.log(`✅ Midtrans Snap loaded (${isSandbox ? 'SANDBOX' : 'PRODUCTION'} mode)`);
        resolve();
      };
      
      script.onerror = () => reject(new Error('Failed to load Midtrans Snap'));
      
      document.head.appendChild(script);
    });
  }

  static async pay(snapToken: string): Promise<any> {
    await this.loadScript();

    return new Promise((resolve, reject) => {
      if (!window.snap) {
        reject(new Error('Midtrans Snap not loaded'));
        return;
      }

      window.snap.pay(snapToken, {
        onSuccess: (result: any) => {
          console.log('✅ Payment Success:', result);
          resolve({ status: 'success', result });
        },
        onPending: (result: any) => {
          console.log('⏳ Payment Pending:', result);
          resolve({ status: 'pending', result });
        },
        onError: (result: any) => {
          console.error('❌ Payment Error:', result);
          reject(new Error('Payment failed'));
        },
        onClose: () => {
          console.log('🚪 Payment popup closed');
          resolve({ status: 'closed' });
        }
      });
    });
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: any) => void;
    };
  }
}

// ============================================
// DEPOSIT STATUS BADGE
// ============================================

const DepositStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string; bg: string; icon: React.ReactNode }> = {
    pending: {
      label: 'Pending',
      bg: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <Clock className="w-3 h-3" />
    },
    success: {
      label: 'Success',
      bg: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircle className="w-3 h-3" />
    },
    failed: {
      label: 'Failed',
      bg: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircle className="w-3 h-3" />
    },
    expired: {
      label: 'Expired',
      bg: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <AlertCircle className="w-3 h-3" />
    }
  };

  const config = configs[status] || configs.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ============================================
// SANDBOX TEST CARDS INFO
// ============================================

const SandboxTestCards: React.FC = () => {
  const [showCards, setShowCards] = useState(false);

  const testCards = [
    { 
      type: 'Success', 
      number: '4811 1111 1111 1114', 
      color: 'bg-green-50 border-green-200 text-green-800',
      icon: '✅'
    },
    { 
      type: 'Failed', 
      number: '4911 1111 1111 1113', 
      color: 'bg-red-50 border-red-200 text-red-800',
      icon: '❌'
    },
    { 
      type: 'Pending', 
      number: '4611 1111 1111 1112', 
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: '⏳'
    },
  ];

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
      <button
        onClick={() => setShowCards(!showCards)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-orange-600" />
          <span className="font-bold text-orange-900">Test Cards for Sandbox</span>
        </div>
        <span className="text-orange-600 text-sm">
          {showCards ? '▼' : '▶'}
        </span>
      </button>

      {showCards && (
        <div className="mt-3 space-y-2">
          {testCards.map((card) => (
            <div key={card.number} className={`p-3 rounded-lg border ${card.color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{card.icon}</span>
                <span className="text-xs font-bold">{card.type} Payment</span>
              </div>
              <div className="text-xs font-mono font-semibold">{card.number}</div>
              <div className="text-xs mt-1 opacity-70">CVV: 123 | Exp: 01/25</div>
            </div>
          ))}
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">🏦</span>
              <span className="text-xs font-bold">BCA Virtual Account</span>
            </div>
            <div className="text-xs">VA Number will be auto-generated</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN DEPOSIT COMPONENT
// ============================================

const MidtransDepositPage: React.FC = () => {
  const [step, setStep] = useState<'amount' | 'processing' | 'success' | 'history'>('amount');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [depositHistory, setDepositHistory] = useState<DepositHistory[]>([]);
  const [currentDeposit, setCurrentDeposit] = useState<any>(null);

  const quickAmounts = [50000, 100000, 250000, 500000, 1000000, 2000000];
  const MIN_DEPOSIT = 10000;
  
  // ✅ CHECK IF SANDBOX MODE
  const isSandbox = process.env.NEXT_PUBLIC_MIDTRANS_MODE === 'sandbox';

  useEffect(() => {
    loadDepositHistory();
  }, []);

  const loadDepositHistory = async () => {
    try {
      const history = await DepositAPI.getDepositHistory();
      setDepositHistory(history);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (isNaN(depositAmount) || depositAmount < MIN_DEPOSIT) {
      setError(`Minimum deposit is Rp ${MIN_DEPOSIT.toLocaleString()}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Create deposit transaction
      console.log('🔐 Creating deposit transaction...');
      const response = await DepositAPI.createDeposit(depositAmount, 'Deposit via Midtrans');
      
      const deposit = response.data.deposit;
      setCurrentDeposit(deposit);

      console.log('✅ Deposit created:', deposit.order_id);

      // Step 2: Open Midtrans Snap
      setStep('processing');
      
      console.log('💳 Opening Midtrans payment...');
      const paymentResult = await MidtransSnap.pay(deposit.snap_token);

      // Step 3: Handle payment result
      if (paymentResult.status === 'success' || paymentResult.status === 'pending') {
        setStep('success');
        await loadDepositHistory();
      } else if (paymentResult.status === 'closed') {
        setError('Payment cancelled by user');
        setStep('amount');
      }

    } catch (err: any) {
      console.error('❌ Deposit failed:', err);
      setError(err.message || 'Deposit failed. Please try again.');
      setStep('amount');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================
  // RENDER: AMOUNT INPUT STEP
  // ============================================

  if (step === 'amount') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Deposit Funds</h1>
                  <p className="text-sm text-gray-600">Add money to your Real Account</p>
                </div>
              </div>
              
              {/* ✅ SANDBOX MODE INDICATOR */}
              {isSandbox && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TestTube className="w-4 h-4 text-yellow-700" />
                    <span className="text-xs font-bold text-yellow-800">🧪 SANDBOX MODE</span>
                    <span className="text-xs text-yellow-700">Testing environment - No real money</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sandbox Test Cards Info */}
          {isSandbox && (
            <div className="mb-4">
              <SandboxTestCards />
            </div>
          )}

          {/* Amount Input */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Enter Amount (IDR)
            </label>
            
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0"
                className="w-full text-3xl font-bold text-center py-4 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none"
              />
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500 text-center">
              Minimum deposit: {formatCurrency(MIN_DEPOSIT)}
            </div>
          </div>

          {/* Quick Amounts */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100 mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Quick Select
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setAmount(preset.toString());
                    setError('');
                  }}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    amount === preset.toString()
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}K`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg mb-4 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6" />
              <h3 className="font-bold text-lg">
                {isSandbox ? 'Test Payment (Sandbox)' : 'Secure Payment'}
              </h3>
            </div>
            
            <p className="text-sm text-blue-100 mb-4">
              {isSandbox 
                ? 'Use test cards above to simulate payments'
                : 'We accept various payment methods via Midtrans:'
              }
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur">
                <CreditCard className="w-4 h-4 mb-1" />
                <div className="font-semibold">Credit/Debit Card</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur">
                <Wallet className="w-4 h-4 mb-1" />
                <div className="font-semibold">Bank Transfer</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur">
                <Zap className="w-4 h-4 mb-1" />
                <div className="font-semibold">E-Wallet</div>
              </div>
              <div className="bg-white/10 rounded-lg p-2 backdrop-blur">
                <CreditCard className="w-4 h-4 mb-1" />
                <div className="font-semibold">QRIS</div>
              </div>
            </div>
          </div>

          {/* Deposit Button */}
          <button
            onClick={handleDeposit}
            disabled={loading || !amount || parseFloat(amount) < MIN_DEPOSIT}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                {isSandbox ? 'Test Payment' : 'Continue to Payment'}
              </>
            )}
          </button>

          {/* History Link */}
          <button
            onClick={() => setStep('history')}
            className="w-full mt-3 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all"
          >
            View Deposit History
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: PROCESSING STEP
  // ============================================

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-gray-600 mb-6">
            {isSandbox 
              ? 'Complete test payment in the Midtrans sandbox window'
              : 'Please complete your payment in the Midtrans window'
            }
          </p>

          {currentDeposit && (
            <div className="bg-gray-50 rounded-xl p-4 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Order ID</span>
                <span className="text-sm font-mono font-semibold">{currentDeposit.order_id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(currentDeposit.amount)}
                </span>
              </div>
            </div>
          )}

          {isSandbox && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 justify-center">
                <TestTube className="w-4 h-4 text-yellow-700" />
                <span className="text-xs font-semibold text-yellow-800">Sandbox Mode</span>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-6">
            Do not close this page until payment is complete
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: SUCCESS STEP
  // ============================================

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isSandbox ? 'Test Payment Complete!' : 'Deposit Submitted!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isSandbox 
              ? 'Your test deposit was successful'
              : 'Your deposit is being processed. Balance will be updated once payment is confirmed.'
            }
          </p>

          {currentDeposit && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-600 mb-1">Amount</div>
              <div className="text-2xl font-bold text-green-600 mb-3">
                {formatCurrency(currentDeposit.amount)}
              </div>
              <div className="text-xs text-gray-500">
                Order ID: {currentDeposit.order_id}
              </div>
            </div>
          )}

          {isSandbox && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 justify-center">
                <TestTube className="w-4 h-4 text-yellow-700" />
                <span className="text-xs font-semibold text-yellow-800">
                  This was a test transaction in Sandbox mode
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={() => window.location.href = '/balance'}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-all"
            >
              Go to Wallet
            </button>
            
            <button
              onClick={() => {
                setStep('amount');
                setAmount('');
                setCurrentDeposit(null);
              }}
              className="w-full text-green-600 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all"
            >
              {isSandbox ? 'Test Another Payment' : 'Make Another Deposit'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: HISTORY STEP
  // ============================================

  if (step === 'history') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => setStep('amount')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
              <h1 className="text-2xl font-bold text-gray-900">Deposit History</h1>
              <p className="text-sm text-gray-600">
                Your recent deposit transactions
                {isSandbox && ' (including test transactions)'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
            {depositHistory.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No deposits yet</h3>
                <p className="text-sm text-gray-600">Your deposit history will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {depositHistory.map((deposit) => (
                  <div key={deposit.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(deposit.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(deposit.createdAt)}
                          </div>
                        </div>
                      </div>
                      <DepositStatusBadge status={deposit.status} />
                    </div>
                    
                    {deposit.payment_type && (
                      <div className="text-xs text-gray-500 ml-13">
                        via {deposit.payment_type}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MidtransDepositPage;