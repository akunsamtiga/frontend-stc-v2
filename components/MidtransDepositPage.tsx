// components/MidtransDepositPage.tsx
// ✅ FIXED VERSION - Balance includes voucher bonus correctly
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Wallet, AlertCircle, CheckCircle, Clock, XCircle, Loader2, Shield, Tag, TrendingUp, History, Info, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import VoucherInput from '@/components/VoucherInput';
import AvailableVouchers from '@/components/AvailableVouchers';
import { api } from '@/lib/api';

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
      voucherCode?: string;
      voucherBonusAmount?: number;
    };
  };
}

interface TransactionHistory {
  id: string;
  order_id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'expired';
  payment_type?: string;
  description?: string;
  voucherCode?: string;
  voucherBonusAmount?: number;
  createdAt: string;
  completedAt?: string;
}

interface Voucher {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minDeposit: number;
  maxBonusAmount?: number;
  eligibleStatuses: string[];
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
  description: string;
}

class PaymentAPI {
  private static baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

  private static getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  static async createTransaction(amount: number, description?: string, voucherCode?: string): Promise<DepositResponse> {
    const response = await fetch(`${this.baseURL}/payment/deposit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ amount, description, voucherCode })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create transaction');
    }

    return response.json();
  }

  static async getTransactionHistory(): Promise<TransactionHistory[]> {
    const response = await fetch(`${this.baseURL}/payment/deposits`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transaction history');
    }

    const data = await response.json();
    return data.data?.deposits || data.deposits || [];
  }

  static async checkTransactionStatus(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseURL}/payment/deposit/${orderId}/status`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to check transaction status');
    }

    return response.json();
  }

  static async getAvailableVouchers(): Promise<Voucher[]> {
    const response = await fetch(`${this.baseURL}/vouchers?isActive=true&page=1&limit=50`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vouchers');
    }

    const data = await response.json();
    let vouchers: Voucher[] = [];

    if (data?.data?.data?.vouchers) {
      vouchers = data.data.data.vouchers;
    } else if (data?.data?.vouchers) {
      vouchers = data.data.vouchers;
    } else if (data?.vouchers) {
      vouchers = data.vouchers;
    }

    return vouchers;
  }

  static async getRealBalance(): Promise<number> {
    const response = await fetch(`${this.baseURL}/balance/real`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch balance');
    }

    const data = await response.json();
    return data.balance || 0;
  }
}

class MidtransSnap {
  private static isLoaded = false;

  static loadScript(): Promise<void> {
    if (this.isLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const isSandbox = process.env.NEXT_PUBLIC_MIDTRANS_MODE === 'sandbox';

      script.src = isSandbox
        ? 'https://app.sandbox.midtrans.com/snap/snap.js'
        : 'https://app.midtrans.com/snap/snap.js';

      script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');

      script.onload = () => {
        this.isLoaded = true;
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
          resolve({ status: 'success', result });
        },
        onPending: (result: any) => {
          resolve({ status: 'pending', result });
        },
        onError: (result: any) => {
          reject(new Error('Payment failed'));
        },
        onClose: () => {
          resolve({ status: 'closed' });
        }
      });
    });
  }
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: any) => void;
    };
  }
}

const TransactionStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig = {
    success: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Success' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'Pending' },
    failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Failed' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-700', icon: AlertCircle, label: 'Expired' }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
};

const MidtransPaymentPage: React.FC = () => {
  const router = useRouter(); // ✅ For navigation to home page
  const [step, setStep] = useState<'amount' | 'payment' | 'success' | 'history'>('amount');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState<DepositResponse['data']['deposit'] | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);

  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherBonus, setVoucherBonus] = useState(0);
  const [voucherType, setVoucherType] = useState<'percentage' | 'fixed' | null>(null);
  const [voucherValue, setVoucherValue] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [externalVoucherCode, setExternalVoucherCode] = useState('');

  // Payment verification states
  const [paymentStatus, setPaymentStatus] = useState<'verifying' | 'success' | 'expired'>('verifying');
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [verificationStartTime, setVerificationStartTime] = useState<number>(0);

  // Real-time monitoring states
  const [isMonitoringBalance, setIsMonitoringBalance] = useState(false);
  const [lastBalanceCheck, setLastBalanceCheck] = useState<number>(0);

  // Quick amount presets
  const quickAmounts = [
    { value: 50000, label: '50K' },
    { value: 100000, label: '100K' },
    { value: 250000, label: '250K' },
    { value: 500000, label: '500K' },
    { value: 1000000, label: '1M' }
  ];

  // Payment method icons
  const paymentMethods = [
    { name: 'BCA', icon: '/bca.webp' },
    { name: 'BNI', icon: '/bni.webp' },
    { name: 'BRI', icon: '/bri.webp' },
    { name: 'Dana', icon: '/dana.webp' },
    { name: 'GoPay', icon: '/gopay.webp' },
    { name: 'Linkaja', icon: '/linkaja.webp' },
    { name: 'Mandiri', icon: '/mandiri.webp' },
    { name: 'MC', icon: '/mastercard.webp' },
    { name: 'OVO', icon: '/ovo.webp' },
    { name: 'QRIS', icon: '/qris.png' },
    { name: 'Visa', icon: '/visa.webp' },
  ];

  useEffect(() => {
    loadTransactionHistory();
    loadAvailableVouchers();
    loadInitialBalance();
  }, []);

  // Load initial balance on mount
  const loadInitialBalance = async () => {
    try {
      const balancesRes = await api.getBothBalances();
      const balances = balancesRes?.data || balancesRes;
      const balance = balances?.realBalance || 0;
      setInitialBalance(balance);
      setCurrentBalance(balance);
      console.log('💰 Initial balance loaded:', balance);
    } catch (error) {
      console.error('Failed to load initial balance:', error);
    }
  };

  // ✅ FIXED: Transaction monitoring with voucher bonus included in balance
  useEffect(() => {
    const shouldMonitor = (step === 'success' && paymentStatus === 'verifying') || isMonitoringBalance;
    if (!shouldMonitor || !currentTransaction) return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    let checkCount = 0;

    const checkPaymentStatus = async () => {
      try {
        checkCount++;

        // ✅ Get transaction history to check status
        const history = await PaymentAPI.getTransactionHistory();
        setTransactionHistory(history);

        // ✅ Find the specific transaction
        const transaction = history.find(t => t.order_id === currentTransaction.order_id);
        const depositAmount = currentTransaction?.amount || 0;

        console.log(`🔍 Check #${checkCount}:`, {
          order_id: currentTransaction.order_id,
          found: !!transaction,
          status: transaction?.status,
          depositAmount,
          voucherBonus,
          transactionVoucherBonus: transaction?.voucherBonusAmount
        });

        // ✅ If transaction is success, get REAL balance from backend (includes voucher bonus)
        if (transaction && transaction.status === 'success') {
          console.log('✅ Payment verified - Transaction status is SUCCESS!');

          // ✅ FIX: Get REAL balance from backend (this includes voucher bonus)
          const balancesRes = await api.getBothBalances();
          const balances = balancesRes?.data || balancesRes;
          const realBalance = balances?.realBalance || 0;
          
          setCurrentBalance(realBalance);
          setLastBalanceCheck(Date.now());

          // ✅ Update voucher bonus from transaction if different
          if (transaction.voucherBonusAmount && transaction.voucherBonusAmount > 0) {
            if (transaction.voucherBonusAmount !== voucherBonus) {
              setVoucherBonus(transaction.voucherBonusAmount);
              console.log(`   ✅ Voucher bonus updated from transaction: ${transaction.voucherBonusAmount}`);
            }
          }

          console.log(`   💰 Real balance (includes voucher): ${realBalance}`);
          console.log(`   💎 Voucher bonus: ${transaction.voucherBonusAmount || 0}`);

          setPaymentStatus('success');
          setIsMonitoringBalance(false);
          clearInterval(intervalId);
          clearTimeout(timeoutId);

          // ✅ Reload transaction history
          await loadTransactionHistory();
        } else if (transaction && transaction.status === 'failed') {
          console.log('❌ Payment FAILED - Transaction status is FAILED');
          setPaymentStatus('expired');
          setIsMonitoringBalance(false);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        } else {
          console.log(`⏳ Transaction ${transaction ? `status: ${transaction.status}` : 'not found yet'} - Continuing to monitor...`);
        }
      } catch (error) {
        console.error('❌ Failed to check payment status:', error);
      }
    };

    // Check immediately
    checkPaymentStatus();

    // Poll every 2 seconds
    intervalId = setInterval(checkPaymentStatus, 2000);

    // Timeout after 10 minutes
    timeoutId = setTimeout(() => {
      console.log('⏰ Verification timeout - 10 minutes elapsed');
      setPaymentStatus('expired');
      setIsMonitoringBalance(false);
      clearInterval(intervalId);
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [step, paymentStatus, currentTransaction, voucherBonus, isMonitoringBalance]);

  const loadTransactionHistory = async () => {
    try {
      const history = await PaymentAPI.getTransactionHistory();
      setTransactionHistory(history);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    }
  };

  const loadAvailableVouchers = async () => {
    try {
      const vouchers = await PaymentAPI.getAvailableVouchers();
      setAvailableVouchers(vouchers);
    } catch (err) {
      console.error('Failed to load vouchers:', err);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleVoucherApplied = (voucher: { code: string; bonusAmount: number; type: 'percentage' | 'fixed'; value: number } | null) => {
    if (voucher) {
      setVoucherCode(voucher.code);
      setVoucherBonus(voucher.bonusAmount);
      setVoucherType(voucher.type);
      setVoucherValue(voucher.value);
      console.log('✅ Voucher applied:', voucher);
    } else {
      setVoucherCode('');
      setVoucherBonus(0);
      setVoucherType(null);
      setVoucherValue(0);
      setExternalVoucherCode('');
      console.log('❌ Voucher cleared');
    }
  };

  const handleVoucherSelect = (code: string) => {
    setExternalVoucherCode(code);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(value);
    setError('');
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const handleRefreshBalance = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // ✅ Get REAL balance from backend (includes all bonuses)
      const balancesRes = await api.getBothBalances();
      const balances = balancesRes?.data || balancesRes;
      const realBalance = balances?.realBalance || 0;
      setCurrentBalance(realBalance);
      console.log('🔄 Balance refreshed (includes voucher bonus):', realBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const depositAmount = parseInt(amount);

    if (isNaN(depositAmount) || depositAmount < 10000) {
      setError('Minimum deposit is Rp 10.000');
      return;
    }

    if (depositAmount > 100000000) {
      setError('Maximum deposit is Rp 100.000.000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('💳 Creating transaction:', {
        amount: depositAmount,
        voucherCode: voucherCode || undefined,
        voucherBonus
      });

      // ✅ Capture initial balance before payment
      const balancesRes = await api.getBothBalances();
      const balances = balancesRes?.data || balancesRes;
      const freshBalance = balances?.realBalance || 0;
      setInitialBalance(freshBalance);
      setCurrentBalance(freshBalance);
      console.log('💰 Captured initial balance before payment:', freshBalance);

      const response = await PaymentAPI.createTransaction(
        depositAmount,
        'Deposit via Midtrans',
        voucherCode || undefined
      );

      console.log('✅ Transaction created:', response);

      if (!response.data?.deposit?.snap_token) {
        throw new Error('No snap token received');
      }

      // ✅ Store voucher bonus from backend response
      if (response.data.deposit.voucherBonusAmount && response.data.deposit.voucherBonusAmount > 0) {
        setVoucherBonus(response.data.deposit.voucherBonusAmount);
        console.log('💎 Voucher bonus confirmed from backend:', response.data.deposit.voucherBonusAmount);
      }

      setCurrentTransaction(response.data.deposit);
      setStep('payment');

      // Open Midtrans payment popup
      const paymentResult = await MidtransSnap.pay(response.data.deposit.snap_token);

      console.log('💳 Payment popup result:', paymentResult);

      if (paymentResult.status === 'success' || paymentResult.status === 'pending') {
        setStep('success');
        setPaymentStatus('verifying');
        setVerificationStartTime(Date.now());
        setIsMonitoringBalance(true);
      } else if (paymentResult.status === 'closed') {
        setError('Payment cancelled');
        setStep('amount');
      }
    } catch (err: any) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setStep('amount');
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: Redirect to home page
  const handleBackToHome = () => {
    router.push('/'); // ✅ Redirect to home page
  };

  const handleViewHistory = () => {
    setStep('history');
    loadTransactionHistory();
  };

  const numericAmount = parseInt(amount) || 0;
  const totalAmount = numericAmount + voucherBonus;

  // Transaction History View
  if (step === 'history') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setStep('amount')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <History className="w-7 h-7 text-blue-600" />
                      Transaction History
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      View all your deposit transactions
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadTransactionHistory}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {transactionHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-600 mb-6">Your deposit history will appear here</p>
                  <button
                    onClick={() => setStep('amount')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <Wallet className="w-5 h-5" />
                    Make a Deposit
                  </button>
                </div>
              ) : (
                transactionHistory.map((transaction) => (
                  <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {formatCurrency(transaction.amount)}
                          </h3>
                          <TransactionStatusBadge status={transaction.status} />
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-500">Order ID:</span>
                            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                              {transaction.order_id}
                            </code>
                          </div>
                          {transaction.payment_type && (
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              <span className="capitalize">{transaction.payment_type.replace('_', ' ')}</span>
                            </div>
                          )}
                          {transaction.voucherCode && (
                            <div className="flex items-center gap-2 text-green-700">
                              <Tag className="w-4 h-4" />
                              <span className="font-medium">
                                {transaction.voucherCode}
                              </span>
                              {transaction.voucherBonusAmount && (
                                <span className="text-xs bg-green-100 px-2 py-0.5 rounded">
                                  +{formatCurrency(transaction.voucherBonusAmount)} bonus
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm text-gray-500 mb-1">
                          {formatDate(transaction.createdAt)}
                        </div>
                        {transaction.completedAt && (
                          <div className="text-xs text-gray-400">
                            Completed: {formatDate(transaction.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main deposit form
  if (step === 'amount') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* LEFT COLUMN - Form */}
            <div className="space-y-5">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Deposit Saldo</h1>
                    <p className="text-sm text-gray-600 mt-0.5">Quick & secure payment with Midtrans</p>
                  </div>
                </div>
              </div>

              {/* Amount Input Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Deposit Amount
                </label>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={amount ? parseInt(amount).toLocaleString('id-ID') : ''}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-300"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                  {quickAmounts.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleQuickAmount(preset.value)}
                      className={`py-3 px-3 rounded-lg border-2 font-semibold transition-all text-sm sm:text-base ${
                        parseInt(amount) === preset.value
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Minimum: Rp 10.000 • Maximum: Rp 100.000.000
                </p>
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                )}
              </div>

              {/* Voucher Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
                <VoucherInput
                  depositAmount={numericAmount}
                  onVoucherApplied={handleVoucherApplied}
                  disabled={loading || numericAmount < 10000}
                  externalCode={externalVoucherCode}
                />
                <AvailableVouchers
                  vouchers={availableVouchers}
                  depositAmount={numericAmount}
                  onVoucherSelect={handleVoucherSelect}
                  selectedVoucherCode={voucherCode}
                />
              </div>

              {/* ✅ UPDATED: CTA Buttons - Mobile: One Row, Desktop: Stack */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading || !amount || parseInt(amount) < 10000}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Continue to Payment
                    </>
                  )}
                </button>
                {/* ✅ Mobile only: History button in same row */}
                <button
                  onClick={handleViewHistory}
                  className="sm:hidden flex-1 px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                >
                  <History className="w-5 h-5" />
                  History
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN - Summary */}
            <div className="lg:sticky lg:top-8 h-fit">
              {/* ✅ UPDATED: Modern, Minimal, Professional Payment Summary */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Payment Summary
                    </h3>
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {numericAmount >= 10000 ? (
                    <>
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">Deposit Amount</span>
                          <span className="font-bold text-gray-900 text-lg">{formatCurrency(numericAmount)}</span>
                        </div>
                        
                        {voucherBonus > 0 && (
                          <div className="flex justify-between items-center bg-green-50/50 rounded-xl p-3 -mx-1">
                            <span className="text-green-700 flex items-center gap-2 font-medium">
                              <Tag className="w-4 h-4" />
                              Voucher Bonus
                            </span>
                            <span className="font-bold text-green-700 text-lg">+{formatCurrency(voucherBonus)}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-100 mb-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-500">You'll Receive</span>
                            <span className="text-sm font-medium text-gray-500">Total</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-700">Balance Update</span>
                            <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                              {formatCurrency(totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5" />
                            Pay Securely
                          </>
                        )}
                      </button>

                      {/* Security Badge */}
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className="bg-blue-50/30 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Shield className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm mb-1">Bank-Level Security</h4>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                Your payment is encrypted and protected with SSL security. All transactions are monitored in real-time.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Methods */}
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-gray-700">Accepted Payment Methods</p>
                          <span className="text-xs text-blue-600 font-medium">+15 more</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {paymentMethods.slice(0, 8).map((method, index) => (
                            <div 
                              key={index} 
                              className="bg-gray-50/50 border border-gray-200 rounded-lg p-2 flex items-center justify-center hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200"
                            >
                              <Image
                                src={method.icon}
                                alt={method.name}
                                width={50}
                                height={20}
                                className="object-contain"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-gray-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Enter deposit amount</p>
                      <p className="text-xs text-gray-400 mt-1">Minimum: Rp 10.000</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment processing screen
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center border border-gray-200">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Processing Payment</h2>
          <p className="text-gray-600 mb-6">
            Please complete the payment in the popup window
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              If the popup doesn't appear, please check if it was blocked by your browser
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (step === 'success') {
    const expectedAmount = currentTransaction?.amount || 0;
    const totalWithBonus = expectedAmount + voucherBonus;
    const verificationElapsed = verificationStartTime ? (Date.now() - verificationStartTime) / 1000 : 0;
    const remainingTime = Math.max(0, 600 - verificationElapsed);

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
          <div className="p-8 sm:p-10">
            <div className="text-center">
              {/* VERIFYING STATE */}
              {paymentStatus === 'verifying' && (
                <>
                  <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Loader2 className="w-14 h-14 text-amber-600 animate-spin" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Waiting for Payment
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Complete your payment and we'll automatically detect it
                  </p>

                  {/* Real-time Balance Display - Includes Voucher Bonus */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-blue-900">Current Balance</span>
                      <button
                        onClick={handleRefreshBalance}
                        disabled={loading}
                        className="p-2 hover:bg-blue-100 rounded-lg transition-all disabled:opacity-50"
                        title="Refresh balance"
                      >
                        <RefreshCw className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="text-4xl font-bold text-blue-700 mb-4">
                      {formatCurrency(currentBalance)}
                    </div>
                    <div className="bg-white/70 rounded-xl p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-blue-800">
                          <span>Deposit amount:</span>
                          <strong>{formatCurrency(expectedAmount)}</strong>
                        </div>
                        {voucherBonus > 0 && (
                          <div className="flex justify-between text-sm text-green-700 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Tag className="w-4 h-4" />
                              Voucher bonus:
                            </span>
                            <strong>+{formatCurrency(voucherBonus)}</strong>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                          <span>Total to receive:</span>
                          <span className="text-green-700">{formatCurrency(totalWithBonus)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Instructions */}
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-5 mb-6">
                    <div className="flex items-start gap-3 text-left">
                      <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900">
                        <p className="font-semibold mb-2">Haven't paid yet?</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Complete payment via your banking app</li>
                          <li>• Balance will update automatically with voucher bonus</li>
                          <li>• Status updates when payment is received</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Timer & Last Check */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Auto-checking every 2 seconds</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Timeout in {Math.floor(remainingTime / 60)}:{String(Math.floor(remainingTime % 60)).padStart(2, '0')}
                    </div>
                    {lastBalanceCheck > 0 && (
                      <div className="text-xs text-gray-400">
                        Last checked: {new Date(lastBalanceCheck).toLocaleTimeString('id-ID')}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* SUCCESS STATE - Balance includes voucher bonus */}
              {paymentStatus === 'success' && (
                <>
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in">
                    <CheckCircle className="w-14 h-14 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Payment Successful!
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Your balance has been updated successfully with voucher bonus
                  </p>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
                    <div className="text-sm text-green-900 mb-2 font-medium">Current Balance</div>
                    <div className="text-4xl font-bold text-green-700 mb-4">
                      {formatCurrency(currentBalance)}
                    </div>
                    <div className="bg-white/70 rounded-xl p-4">
                      <div className="flex justify-between text-sm text-green-800 mb-2">
                        <span>Deposit amount:</span>
                        <strong>+{formatCurrency(expectedAmount)}</strong>
                      </div>
                      {voucherBonus > 0 && (
                        <div className="flex justify-between text-sm text-green-800">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Tag className="w-4 h-4" />
                            Voucher bonus:
                          </span>
                          <strong>+{formatCurrency(voucherBonus)}</strong>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-green-200 mt-2">
                        <span>Total received:</span>
                        <span className="text-green-700">{formatCurrency(totalWithBonus)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ✅ UPDATED: Redirect to home page */}
                  <button
                    onClick={handleBackToHome}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Done
                  </button>
                </>
              )}

              {/* EXPIRED STATE */}
              {paymentStatus === 'expired' && (
                <>
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-14 h-14 text-gray-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Verification Timeout
                  </h2>
                  <p className="text-gray-600 mb-8">
                    We couldn't detect your payment. Please check your transaction history or try again.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleViewHistory}
                      className="w-full bg-gray-200 text-gray-800 py-4 px-6 rounded-xl font-bold text-lg hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                      <History className="w-5 h-5" />
                      View History
                    </button>
                    <button
                      onClick={handleBackToHome}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                    >
                      Try Again
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MidtransPaymentPage;