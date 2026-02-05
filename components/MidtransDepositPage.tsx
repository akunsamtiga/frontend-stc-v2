// components/MidtransDepositPage.tsx - ✅ FIXED VERSION
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Wallet, AlertCircle, CheckCircle, Clock, XCircle, Loader2, Shield, Tag, TrendingUp, History, Info } from 'lucide-react';
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
  const configs: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending: {
      label: 'Pending',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: <Clock className="w-3.5 h-3.5" />
    },
    success: {
      label: 'Success',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle className="w-3.5 h-3.5" />
    },
    failed: {
      label: 'Failed',
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: <XCircle className="w-3.5 h-3.5" />
    },
    expired: {
      label: 'Expired',
      className: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: <XCircle className="w-3.5 h-3.5" />
    }
  };

  const config = configs[status] || configs.pending;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

const MidtransPaymentPage: React.FC = () => {
  const [step, setStep] = useState<'amount' | 'payment' | 'success' | 'history'>('amount');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
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

  // Quick amount presets with better formatting
  const quickAmounts = [
    { value: 50000, label: '50K' },
    { value: 100000, label: '100K' },
    { value: 250000, label: '250K' },
    { value: 500000, label: '500K' },
    { value: 1000000, label: '1M' }
  ];

  // Payment method icons (webp)
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
  }, []);

  // ✅ Real-time Balance Verification
  useEffect(() => {
    if (step !== 'success' || paymentStatus !== 'verifying') return;

    let intervalId: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const checkBalance = async () => {
      try {
        const balance = await PaymentAPI.getRealBalance();
        setCurrentBalance(balance);

        // Check if balance increased
        const expectedIncrease = currentTransaction?.amount || 0;
        const balanceIncrease = balance - initialBalance;

        console.log('🔍 Balance Check:', {
          initial: initialBalance,
          current: balance,
          expected: expectedIncrease,
          actual: balanceIncrease
        });

        // If balance increased by expected amount (or more)
        if (balanceIncrease >= expectedIncrease) {
          console.log('✅ Payment verified - Balance increased!');
          setPaymentStatus('success');
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('❌ Failed to check balance:', error);
      }
    };

    // Check immediately
    checkBalance();

    // Poll every 3 seconds
    intervalId = setInterval(checkBalance, 3000);

    // Timeout after 5 minutes
    timeoutId = setTimeout(() => {
      console.log('⏰ Verification timeout - 5 minutes elapsed');
      setPaymentStatus('expired');
      clearInterval(intervalId);
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [step, paymentStatus, initialBalance, currentTransaction]);

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
    } else {
      setVoucherBonus(0);
      setVoucherCode('');
      setVoucherType(null);
      setVoucherValue(0);
    }
    // Clear external code after applying
    setExternalVoucherCode('');
  };

  // ✅ FIXED: Tidak perlu redirect, gunakan internal state
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
      console.log('💰 Initial balance:', balanceBeforePayment);
      setInitialBalance(balanceBeforePayment);

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
          
          // ✅ FIX: Langsung set state 'success', tidak redirect
          if (result.status === 'success' || result.status === 'pending') {
            console.log('✅ Payment completed:', result);
            
            // Update transaction history
            await loadTransactionHistory();
            
            // ✅ Start balance verification
            setPaymentStatus('verifying');
            setVerificationStartTime(Date.now());
            
            // Set to success screen (will show verifying state)
            setStep('success');
            
          } else if (result.status === 'closed') {
            setStep('amount');
            setError('Payment was cancelled');
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
          {/* Header - Professional Payment Style */}
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
            {/* Left Column - Payment Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Payment Details Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Topup Details
                  </h2>
                </div>

                {/* Amount Input */}
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
                        value={amount ? parseInt(amount).toLocaleString('id-ID') : ''}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0"
                        className="w-full pl-16 pr-4 py-4 text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-300"
                      />
                    </div>

                    {error && (
                      <div className="mt-3 flex items-start gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Amount Selection */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Quick Select Amount</p>
                    <div className="grid grid-cols-5 gap-2">
                      {quickAmounts.map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => handleQuickAmount(preset.value)}
                          className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all border-2 ${
                            parseInt(amount) === preset.value
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voucher Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <div>
                      <VoucherInput
                        depositAmount={numAmount}
                        onVoucherApplied={handleVoucherApplied}
                        externalCode={externalVoucherCode}
                      />

                      {voucherCode && voucherBonus > 0 && (
                        <div className="mt-3 flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">
                              {voucherCode}
                            </span>
                          </div>
                          <span className="text-base font-bold text-emerald-700">
                            +{formatCurrency(voucherBonus)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Available Vouchers */}
                    {availableVouchers.length > 0 && (
                      <div className="mt-4">
                        <AvailableVouchers
                          vouchers={availableVouchers}
                          depositAmount={numAmount}
                          selectedVoucherCode={voucherCode}
                          onVoucherSelect={(code) => {
                            setExternalVoucherCode(code);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
                </div>

                <div className="p-6 space-y-4">
                  {numAmount >= 10000 ? (
                    <>
                      <div className="space-y-3 pb-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Deposit Amount</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(numAmount)}</span>
                        </div>
                        
                        {voucherBonus > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-600 flex items-center gap-1.5">
                              <Tag className="w-4 h-4" />
                              Bonus
                            </span>
                            <span className="font-semibold text-green-600">+{formatCurrency(voucherBonus)}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <span className="font-bold text-gray-900">Total Balance</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {formatCurrency(totalWithBonus)}
                        </span>
                      </div>

                      <button
                        onClick={handlePayment}
                        disabled={loading || !numAmount || numAmount < 10000}
                        className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-base shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-6"
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
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
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

                  {/* Security Info */}
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

                  {/* Payment Methods - webp Icons */}
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
    const remainingTime = Math.max(0, 300 - verificationElapsed); // 300 seconds = 5 minutes

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full border border-gray-200">
          <div className="p-8 sm:p-10">
            <div className="text-center">
              
              {/* VERIFYING STATE */}
              {paymentStatus === 'verifying' && (
                <>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader2 className="w-12 h-12 sm:w-14 sm:h-14 text-amber-600 animate-spin" />
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Verifying Payment...
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    We're confirming your payment with the bank
                  </p>
                  
                  {/* Progress Info */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">
                        Checking balance... ({Math.floor(remainingTime)}s remaining)
                      </span>
                    </div>
                    <div className="text-xs text-amber-600">
                      This usually takes 10-30 seconds
                    </div>
                  </div>
                </>
              )}

              {/* SUCCESS STATE */}
              {paymentStatus === 'success' && (
                <>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-green-600" />
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Payment Confirmed! ✨
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Your balance has been successfully updated
                  </p>
                  
                  {/* Verification Time */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">
                        Verified in {Math.floor(verificationElapsed)} seconds
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* EXPIRED STATE */}
              {paymentStatus === 'expired' && (
                <>
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-12 h-12 sm:w-14 sm:h-14 text-orange-600" />
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    Verification Timeout
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    We couldn't verify your payment automatically
                  </p>
                  
                  {/* Info Message */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <div className="text-sm text-orange-800 space-y-2">
                      <p className="font-semibold">Don't worry! Your payment is processing.</p>
                      <p className="text-xs">
                        • Check your balance page in a few minutes<br/>
                        • Contact support if balance doesn't update within 1 hour<br/>
                        • Keep your transaction ID for reference
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Transaction Details - Show for all states */}
              {currentTransaction && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 font-medium mb-2">Amount Deposited</div>
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                      {formatCurrency(expectedAmount)}
                    </div>
                  </div>
                  
                  {/* Balance Increase Indicator */}
                  {paymentStatus === 'verifying' && balanceIncrease > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="text-sm text-blue-800">
                        <div className="flex items-center justify-between">
                          <span>Balance increased:</span>
                          <strong className="text-blue-700">+{formatCurrency(balanceIncrease)}</strong>
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {balanceIncrease >= expectedAmount ? 'Almost there...' : 'Partial payment received'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {voucherCode && voucherBonus > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Tag className="w-5 h-5 text-green-700" />
                        <span className="text-sm font-bold text-green-900">Voucher Applied</span>
                      </div>
                      <div className="space-y-2 text-sm text-green-900">
                        <div className="flex justify-between">
                          <span>Code:</span>
                          <strong className="font-mono">{voucherCode}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Bonus Amount:</span>
                          <strong className="text-green-700">+{formatCurrency(voucherBonus)}</strong>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t-2 border-green-300">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-800 font-semibold">Total Balance Added</span>
                          <div className="text-2xl font-bold text-green-700">
                            {formatCurrency(totalWithBonus)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 font-mono bg-white px-3 py-2 rounded border border-gray-200">
                    Transaction ID: {currentTransaction.order_id}
                  </div>
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
                
                {(paymentStatus === 'expired' || paymentStatus === 'verifying') && (
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
          {/* Header */}
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
                  <p className="text-sm text-gray-600 mt-1">
                    View all your payment transactions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {transactionHistory.length === 0 ? (
              <div className="p-12 sm:p-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h3>
                <p className="text-sm text-gray-600 mb-8">Your transaction history will appear here after your first payment</p>
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

          {/* Info Footer */}
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