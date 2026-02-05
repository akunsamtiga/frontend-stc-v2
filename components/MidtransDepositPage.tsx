// components/MidtransDepositPage.tsx - ✅ PRODUCTION MODE
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
      className: 'bg-slate-50 text-slate-700 border-slate-200',
      icon: <AlertCircle className="w-3.5 h-3.5" />
    }
  };

  const config = configs[status] || configs.pending;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
};

const MidtransPaymentPage: React.FC = () => {
  const [step, setStep] = useState<'amount' | 'payment' | 'success' | 'history'>('amount');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherBonus, setVoucherBonus] = useState(0);
  const [voucherType, setVoucherType] = useState<'percentage' | 'fixed' | null>(null);
  const [voucherValue, setVoucherValue] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);

  // Quick amount presets with better formatting
  const quickAmounts = [
    { value: 50000, label: '50K' },
    { value: 100000, label: '100K' },
    { value: 250000, label: '250K' },
    { value: 500000, label: '500K' },
    { value: 1000000, label: '1M' }
  ];

  // Payment method icons (PNG)
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

  const loadTransactionHistory = async () => {
    try {
      const history = await PaymentAPI.getTransactionHistory();
      setTransactionHistory(history);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    }
  };

  const loadAvailableVouchers = async () => {
    setIsLoadingVouchers(true);
    try {
      const vouchers = await PaymentAPI.getAvailableVouchers();
      setAvailableVouchers(vouchers);
    } catch (err) {
      console.error('Failed to load vouchers:', err);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setAmount(numericValue);
    setError('');
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const handleVoucherApplied = (voucher: { code: string; bonusAmount: number; type: 'percentage' | 'fixed'; value: number; } | null) => {
    if (voucher) {
      setVoucherCode(voucher.code);
      setVoucherBonus(voucher.bonusAmount);
      setVoucherType(voucher.type);
      setVoucherValue(voucher.value);
    } else {
      setVoucherCode('');
      setVoucherBonus(0);
      setVoucherType(null);
      setVoucherValue(0);
    }
  };

  const handleDeposit = async () => {
    const numAmount = parseInt(amount);
    
    if (!numAmount || numAmount < 10000) {
      setError('Minimum deposit is Rp 10.000');
      return;
    }

    setLoading(true);
    setError('');

    try {
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
  const result = await MidtransSnap.pay(deposit.snap_token)
  
  if (result.status === 'success' || result.status === 'pending') {
    // Redirect ke success page dengan order_id untuk verifikasi
    // URL akan seperti: /payment-success?order_id=ORDER_ID&transaction_status=success
    window.location.href = `/payment-success?order_id=${deposit.order_id}&transaction_status=${result.status}`
  } else if (result.status === 'closed') {
    setStep('amount')
    setError('Payment was cancelled')
  }
} catch (snapError) {
  console.error('Midtrans Snap error:', snapError)
  setError('Payment failed. Please try again.')
  setStep('amount')
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
                    {!isLoadingVouchers && availableVouchers.length > 0 && (
                      <div className="mt-4">
                        <AvailableVouchers
                          vouchers={availableVouchers}
                          depositAmount={numAmount}
                          onVoucherSelect={(code) => {
                            const inputElement = document.querySelector('input[placeholder*="voucher"]') as HTMLInputElement;
                            if (inputElement) {
                              inputElement.value = code;
                              inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                            }
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
                        onClick={handleDeposit}
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

                  {/* Payment Methods - PNG Icons */}
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
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full border border-gray-200">
          <div className="p-8 sm:p-10">
            <div className="text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                Processing Payment
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-8">
                Please complete your payment in the Midtrans window
              </p>

              {currentTransaction && (
                <div className="bg-gray-50 rounded-lg p-5 sm:p-6 border border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-sm text-gray-600 font-medium">Order ID</span>
                      <span className="text-sm font-mono font-semibold text-gray-900">{currentTransaction.order_id}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Amount</span>
                      <span className="text-lg sm:text-xl font-bold text-blue-600">
                        {formatCurrency(currentTransaction.amount)}
                      </span>
                    </div>
                    
                    {voucherCode && voucherBonus > 0 && (
                      <>
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600 font-medium flex items-center gap-1.5">
                              <Tag className="w-4 h-4 text-green-600" />
                              Voucher
                            </span>
                            <span className="text-sm font-mono font-semibold text-green-600">{voucherCode}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Bonus</span>
                            <span className="text-sm font-bold text-green-600">+{formatCurrency(voucherBonus)}</span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">Total Balance</span>
                            <span className="text-xl font-bold text-green-600">
                              {formatCurrency(currentTransaction.amount + voucherBonus)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Secure payment processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full border border-gray-200">
          <div className="p-8 sm:p-10">
            <div className="text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 text-green-600" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Payment Successful!
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mb-8">
                Your transaction has been submitted and is being processed
              </p>

              {currentTransaction && (
                <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-200">
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 font-medium mb-2">Amount Deposited</div>
                    <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-1">
                      {formatCurrency(currentTransaction.amount)}
                    </div>
                  </div>
                  
                  {voucherCode && voucherBonus > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Tag className="w-5 h-5 text-green-700" />
                        <span className="text-sm font-bold text-green-900">Discount Code Applied</span>
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
                            {formatCurrency(currentTransaction.amount + voucherBonus)}
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

              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/balance'}
                  className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-base shadow-md hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  <span>Go to Wallet</span>
                </button>
                
                <button
                  onClick={() => {
                    setStep('amount');
                    setAmount('');
                    setCurrentTransaction(null);
                    setVoucherCode('');
                    setVoucherBonus(0);
                    setVoucherType(null);
                    setVoucherValue(0);
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