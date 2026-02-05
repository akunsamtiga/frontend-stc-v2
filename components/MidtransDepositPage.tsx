// components/MidtransDepositPage.tsx
// ✅ COMPLETE VERSION with Real-Time Balance Monitoring

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Wallet, AlertCircle, CheckCircle, Clock, XCircle, Loader2, Shield, Tag, TrendingUp, History, Info, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import VoucherInput from '@/components/VoucherInput';
import AvailableVouchers from '@/components/AvailableVouchers';

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
  
  // ✅ NEW: Real-time monitoring states
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

  // ✅ Load initial balance on mount
  const loadInitialBalance = async () => {
    try {
      const balance = await PaymentAPI.getRealBalance();
      setInitialBalance(balance);
      setCurrentBalance(balance);
      console.log('💰 Initial balance loaded:', balance);
    } catch (error) {
      console.error('Failed to load initial balance:', error);
    }
  };

  // ✅ ENHANCED: Real-time Balance Monitoring - Always active when needed
  useEffect(() => {
    // Monitor when: (1) in success screen verifying OR (2) monitoring flag enabled
    const shouldMonitor = (step === 'success' && paymentStatus === 'verifying') || isMonitoringBalance;
    
    if (!shouldMonitor || !currentTransaction) return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;
    let checkCount = 0;

    const checkBalance = async () => {
      try {
        checkCount++;
        const balance = await PaymentAPI.getRealBalance();
        setCurrentBalance(balance);
        setLastBalanceCheck(Date.now());

        const depositAmount = currentTransaction?.amount || 0;
        const balanceIncrease = balance - initialBalance;

        console.log(`🔍 Balance Check #${checkCount}:`, {
          depositAmount,
          voucherBonus,
          expectedTotal: depositAmount + voucherBonus,
          initialBalance,
          currentBalance: balance,
          balanceIncrease,
          status: balanceIncrease >= depositAmount ? '✅ PAID' : '⏳ PENDING'
        });

        // ✅ Payment confirmed when balance increased by at least deposit amount
        if (balanceIncrease >= depositAmount) {
          console.log('✅ Payment verified - Balance increased!');
          console.log(`   Expected: ${depositAmount}, Actual: ${balanceIncrease}`);
          setPaymentStatus('success');
          setIsMonitoringBalance(false);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          
          // Reload transaction history
          await loadTransactionHistory();
        }
      } catch (error) {
        console.error('❌ Failed to check balance:', error);
      }
    };

    // Check immediately
    checkBalance();

    // Poll every 2 seconds for responsiveness
    intervalId = setInterval(checkBalance, 2000);

    // Timeout after 10 minutes (allow delayed payment)
    timeoutId = setTimeout(() => {
      console.log('⏰ Verification timeout - 10 minutes elapsed');
      console.log(`   Final balance increase: ${currentBalance - initialBalance}`);
      setPaymentStatus('expired');
      setIsMonitoringBalance(false);
      clearInterval(intervalId);
    }, 10 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [step, paymentStatus, initialBalance, currentTransaction, voucherBonus, isMonitoringBalance]);

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

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    setError('');
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const handleVoucherApplied = (voucher: {
    code: string;
    bonusAmount: number;
    type: 'percentage' | 'fixed';
    value: number;
  } | null) => {
    if (voucher) {
      setVoucherBonus(voucher.bonusAmount);
      setVoucherCode(voucher.code);
      setVoucherType(voucher.type);
      setVoucherValue(voucher.value);
      console.log('✅ Voucher applied:', voucher);
    } else {
      setVoucherBonus(0);
      setVoucherCode('');
      setVoucherType(null);
      setVoucherValue(0);
    }
    setExternalVoucherCode('');
  };

  // ✅ NEW: Manual balance refresh
  const handleRefreshBalance = async () => {
    setLoading(true);
    try {
      const balance = await PaymentAPI.getRealBalance();
      setCurrentBalance(balance);
      setLastBalanceCheck(Date.now());
      await loadTransactionHistory();
      
      // Check if payment completed
      const balanceIncrease = balance - initialBalance;
      const depositAmount = currentTransaction?.amount || 0;
      
      console.log('🔄 Manual refresh:', {
        balance,
        initialBalance,
        increase: balanceIncrease,
        expected: depositAmount
      });
      
      if (balanceIncrease >= depositAmount) {
        console.log('✅ Payment detected on manual refresh!');
        setPaymentStatus('success');
        setIsMonitoringBalance(false);
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    const numAmount = parseInt(amount);

    if (!numAmount || numAmount < 10000) {
      setError('Minimum deposit is Rp 10,000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ Capture initial balance BEFORE payment
      const balanceBeforePayment = await PaymentAPI.getRealBalance();
      console.log('💰 Balance before payment:', balanceBeforePayment);
      console.log('💳 Deposit amount:', numAmount);
      console.log('🎁 Voucher bonus:', voucherBonus);
      console.log('📊 Expected after:', balanceBeforePayment + numAmount + voucherBonus);
      setInitialBalance(balanceBeforePayment);
      setCurrentBalance(balanceBeforePayment);

      const response = await PaymentAPI.createTransaction(
        numAmount,
        'Top Up',
        voucherCode || undefined
      );

      if (response.success && response.data?.deposit) {
        const deposit = response.data.deposit;
        setCurrentTransaction(deposit);
        setStep('payment');

        try {
          const result = await MidtransSnap.pay(deposit.snap_token);
          
          // ✅ FIXED: Handle all payment results including closed popup
          if (result.status === 'success' || result.status === 'pending') {
            console.log('✅ Payment completed:', result.status);
            
            await loadTransactionHistory();
            
            setPaymentStatus('verifying');
            setVerificationStartTime(Date.now());
            setIsMonitoringBalance(true);
            setStep('success');
            
          } else if (result.status === 'closed') {
            // ✅ FIX: User closed payment window - DON'T cancel, keep monitoring!
            console.log('⚠️ Payment window closed - User might pay later');
            console.log('   Transaction:', deposit.order_id);
            console.log('   Monitoring will continue for 10 minutes');
            
            await loadTransactionHistory();
            
            // Keep the transaction and start monitoring
            setPaymentStatus('verifying');
            setVerificationStartTime(Date.now());
            setIsMonitoringBalance(true);
            setStep('success');
          }
        } catch (snapError) {
          console.error('❌ Midtrans Snap error:', snapError);
          setError('Payment failed. Please try again.');
          setStep('amount');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
      setStep('amount');
    } finally {
      setLoading(false);
    }
  };

  // Main amount input screen
  if (step === 'amount') {
    const numAmount = parseInt(amount) || 0;
    const totalWithBonus = numAmount + voucherBonus;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Payment</h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              Add funds to your account balance safely and securely
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Topup Details
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Deposit Amount <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">
                        IDR
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={amount ? parseInt(amount).toLocaleString('id-ID') : ''}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0"
                        className="w-full pl-16 pr-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {quickAmounts.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => handleQuickAmount(preset.value)}
                          className={`py-2.5 px-3 rounded-lg text-sm font-semibold transition-all border-2 ${
                            parseInt(amount) === preset.value
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700">
                        Promo Code (Optional)
                      </label>
                      {voucherCode && (
                        <span className="text-xs text-green-600 font-semibold">✓ Applied</span>
                      )}
                    </div>

                    <VoucherInput
                      depositAmount={numAmount}
                      onVoucherApplied={handleVoucherApplied}
                      externalCode={externalVoucherCode}
                    />

                    <AvailableVouchers
                      vouchers={availableVouchers}
                      depositAmount={numAmount}
                      onVoucherSelect={(code) => setExternalVoucherCode(code)}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-800 font-medium">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-bold text-gray-900">Payment Summary</h3>
                </div>
                
                <div className="p-6">
                  {numAmount >= 10000 ? (
                    <>
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center text-base">
                          <span className="text-gray-600">Deposit Amount</span>
                          <span className="font-bold text-gray-900">{formatCurrency(numAmount)}</span>
                        </div>

                        {voucherBonus > 0 && (
                          <>
                            <div className="flex justify-between items-center text-base">
                              <span className="text-green-600 flex items-center gap-1.5">
                                <Tag className="w-4 h-4" />
                                Voucher Bonus
                              </span>
                              <span className="font-bold text-green-600">+{formatCurrency(voucherBonus)}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-200">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-900 font-semibold">Total Balance Added</span>
                                <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalWithBonus)}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-base shadow-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-5 h-5" />
                            <span>Proceed to Payment</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setStep('history')}
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-3"
                      >
                        <History className="w-5 h-5" />
                        <span>View History</span>
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Enter amount to see summary</p>
                      <p className="text-xs text-gray-400 mt-1">Minimum: Rp 10.000</p>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start gap-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Secure Payment</h4>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Protected by bank-level security. Your payment information is encrypted and secure.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-3">Accepted Payment Methods</p>
                    <div className="grid grid-cols-3 gap-2">
                      {paymentMethods.slice(0, 12).map((method, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded p-2 flex items-center justify-center hover:border-blue-300 transition-colors">
                          <Image 
                            src={method.icon} 
                            alt={method.name} 
                            width={60} 
                            height={24} 
                            className="object-contain"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">+ More payment options available</p>
                  </div>
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

  // Success screen with real-time verification
  if (step === 'success') {
    const expectedAmount = currentTransaction?.amount || 0;
    const totalWithBonus = expectedAmount + voucherBonus;
    const balanceIncrease = currentBalance - initialBalance;
    const verificationElapsed = verificationStartTime ? (Date.now() - verificationStartTime) / 1000 : 0;
    const remainingTime = Math.max(0, 600 - verificationElapsed);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full border border-gray-200">
          <div className="p-8 sm:p-10">
            <div className="text-center">
              
              {/* VERIFYING STATE */}
              {paymentStatus === 'verifying' && (
                <>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 text-amber-600 animate-spin" />
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Waiting for Payment
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Complete your payment and we'll automatically detect it
                  </p>

                  {/* ✅ Real-time Balance Display */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
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
                    
                    <div className="text-3xl font-bold text-blue-700 mb-4">
                      {formatCurrency(currentBalance)}
                    </div>
                    
                    {balanceIncrease > 0 && (
                      <div className="bg-white/60 rounded-lg p-3 mb-3">
                        <div className="text-sm text-blue-800 flex items-center justify-between">
                          <span>Detected increase:</span>
                          <strong className="text-green-700">+{formatCurrency(balanceIncrease)}</strong>
                        </div>
                        {balanceIncrease < expectedAmount && (
                          <div className="text-xs text-amber-700 mt-2">
                            ⏳ Partial payment • Waiting for full amount...
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-blue-900">
                      <div className="flex justify-between">
                        <span>Expecting:</span>
                        <strong>{formatCurrency(expectedAmount)}</strong>
                      </div>
                      {voucherBonus > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span className="flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5" />
                            Bonus:
                          </span>
                          <strong>+{formatCurrency(voucherBonus)}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ✅ Payment Instructions */}
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-5 mb-6">
                    <div className="flex items-start gap-3 text-left">
                      <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900">
                        <p className="font-semibold mb-2">Haven't paid yet?</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Complete payment via your banking app</li>
                          <li>• We're monitoring your balance in real-time</li>
                          <li>• Status will update automatically when payment received</li>
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

              {/* SUCCESS STATE */}
              {paymentStatus === 'success' && (
                <>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Payment Successful!
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Your balance has been updated successfully
                  </p>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 mb-6">
                    <div className="text-sm text-green-900 mb-2">New Balance</div>
                    <div className="text-4xl font-bold text-green-700 mb-4">
                      {formatCurrency(currentBalance)}
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <div className="flex justify-between text-sm text-green-800 mb-1">
                        <span>Amount added:</span>
                        <strong>+{formatCurrency(balanceIncrease)}</strong>
                      </div>
                    </div>
                  </div>

                  {voucherCode && voucherBonus > 0 && (
                    <div className="bg-white border-2 border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-green-700" />
                        <span className="text-sm font-semibold text-green-900">
                          Voucher Applied: {voucherCode}
                        </span>
                      </div>
                      <div className="text-xs text-green-700">
                        Bonus: +{formatCurrency(voucherBonus)}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* EXPIRED STATE */}
              {paymentStatus === 'expired' && (
                <>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-12 h-12 sm:w-14 sm:h-14 text-amber-600" />
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Still Waiting...
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Payment not detected yet. Please check your balance manually or contact support.
                  </p>

                  {balanceIncrease > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                      <div className="text-sm text-blue-800">
                        <div className="flex items-center justify-between">
                          <span>Partial increase detected:</span>
                          <strong>+{formatCurrency(balanceIncrease)}</strong>
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                          Expected: {formatCurrency(expectedAmount)}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Transaction ID */}
              {currentTransaction && (
                <div className="text-xs text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200 mb-6">
                  ID: {currentTransaction.order_id}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {paymentStatus === 'success' && (
                  <button
                    onClick={() => window.location.href = '/balance'}
                    className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-base shadow-md hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>View My Balance</span>
                  </button>
                )}
                
                {paymentStatus === 'verifying' && (
                  <button
                    onClick={handleRefreshBalance}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-base shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    <span>{loading ? 'Checking...' : 'Check Now'}</span>
                  </button>
                )}
                
                {paymentStatus === 'expired' && (
                  <button
                    onClick={() => window.location.href = '/balance'}
                    className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-base shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Check My Balance</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setStep('amount');
                    setAmount('');
                    setCurrentTransaction(null);
                    setVoucherCode('');
                    setVoucherBonus(0);
                    setVoucherType(null);
                    setVoucherValue(0);
                    setExternalVoucherCode('');
                    setPaymentStatus('verifying');
                    setInitialBalance(0);
                    setCurrentBalance(0);
                    setVerificationStartTime(0);
                    setIsMonitoringBalance(false);
                    setLastBalanceCheck(0);
                    loadInitialBalance();
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Make Another Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Transaction history screen
  if (step === 'history') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto py-6 sm:py-8">
          <div className="mb-6">
            <button
              onClick={() => setStep('amount')}
              className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 px-4 py-2 rounded-lg hover:bg-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Payment</span>
            </button>
            
            <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <History className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction History</h1>
                  <p className="text-sm text-gray-600 mt-1">View all your payment transactions</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {transactionHistory.length === 0 ? (
              <div className="p-12 sm:p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h3>
                <p className="text-sm text-gray-600 mb-8">Your transaction history will appear here</p>
                <button
                  onClick={() => setStep('amount')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Make Your First Deposit</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {transactionHistory.map((transaction) => (
                  <div key={transaction.id} className="p-5 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start sm:items-center justify-between gap-4 mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
                          <CreditCard className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-lg">
                            {formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(transaction.createdAt)}
                          </div>
                        </div>
                      </div>
                      <TransactionStatusBadge status={transaction.status} />
                    </div>
                    
                    {transaction.voucherCode && transaction.voucherBonusAmount && (
                      <div className="ml-16 mt-3 inline-flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <Tag className="w-4 h-4" />
                        <span>
                          <strong>{transaction.voucherCode}</strong> • Bonus: <strong>+{formatCurrency(transaction.voucherBonusAmount)}</strong>
                        </span>
                      </div>
                    )}
                    
                    {transaction.payment_type && (
                      <div className="text-sm text-gray-500 ml-16 mt-2 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Payment via <span className="font-medium text-gray-700">{transaction.payment_type}</span></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {transactionHistory.length > 0 && (
            <div className="mt-6 bg-white rounded-lg p-4 sm:p-5 border border-gray-200">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">
                    Showing recent transactions. Completed payments are automatically added to your wallet balance.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default MidtransPaymentPage;