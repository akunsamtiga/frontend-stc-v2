// components/MidtransDepositPage.tsx
// ✅ UPDATED: Balance monitoring integration - no backend changes needed
'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Wallet, AlertCircle, CheckCircle, Clock, XCircle, Loader2, Shield, Tag, TrendingUp, History, Info } from 'lucide-react';
import Image from 'next/image';
import VoucherInput from '@/components/VoucherInput';
import AvailableVouchers from '@/components/AvailableVouchers';
import { useRouter } from 'next/navigation';
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
      voucherBonus?: {
        code: string;
        amount: number;
        totalAmount: number;
      } | null;
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
      className: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: <XCircle className="w-3.5 h-3.5" />
    }
  };

  const config = configs[status] || configs.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const MidtransPaymentPage: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<'amount' | 'payment' | 'history'>('amount');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherBonus, setVoucherBonus] = useState(0);
  const [voucherType, setVoucherType] = useState<'percentage' | 'fixed' | null>(null);
  const [voucherValue, setVoucherValue] = useState(0);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);

  const quickAmounts = [10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000];
  
  const paymentMethods = [
    { name: 'BCA', icon: '/bca.webp' },
    { name: 'Mandiri', icon: '/mandiri.webp' },
    { name: 'BNI', icon: '/bni.png' },
    { name: 'BRI', icon: '/bri.webp' },
    { name: 'Permata', icon: '/permata.png' },
    { name: 'CIMB', icon: '/cimb.png' },
    { name: 'Gopay', icon: '/gopay.png' },
    { name: 'OVO', icon: '/ovo.png' },
    { name: 'Dana', icon: '/dana.png' },
    { name: 'ShopeePay', icon: '/shopeepay.png' },
    { name: 'LinkAja', icon: '/linkaja.png' },
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

  const handleVoucherApplied = (voucher: {
    code: string
    bonusAmount: number
    type: 'percentage' | 'fixed'
    value: number
  } | null) => {
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

  const handleVoucherSelect = (code: string) => {
    setVoucherCode(code);
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
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================================
  // ✅ UPDATED HANDLE PAYMENT WITH BALANCE MONITORING
  // ============================================================
  const handlePayment = async () => {
    const numAmount = parseInt(amount);

    if (!numAmount || numAmount < 10000) {
      setError('Minimum deposit amount is Rp 10,000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // ✅ STEP 1: Get current real balance BEFORE payment
      console.log('📊 Getting current balance before payment...');
      let initialBalance = 0;
      try {
        const balanceResponse = await api.getAccountBalance('real');
        initialBalance = balanceResponse?.data?.balance || 0;
        console.log('💰 Initial balance:', initialBalance);
      } catch (balanceError) {
        console.warn('⚠️ Could not get initial balance, continuing anyway');
      }

      // ✅ STEP 2: Create transaction
      console.log('🔄 Creating deposit transaction...');
      const response = await PaymentAPI.createTransaction(
        numAmount,
        'Top Up',
        voucherCode || undefined
      );

      if (response.success && response.data?.deposit) {
        const deposit = response.data.deposit;
        setCurrentTransaction(deposit);
        setStep('payment');

        // ✅ STEP 3: Calculate expected amounts
        const depositAmount = deposit.amount;
        const bonusAmount = deposit.voucherBonus?.amount || 0;
        const expectedBalance = initialBalance + depositAmount + bonusAmount;

        console.log('💵 Payment Info:', {
          depositAmount,
          bonusAmount,
          initialBalance,
          expectedBalance
        });

        // ✅ STEP 4: Save payment info to localStorage
        const paymentInfo = {
          orderId: deposit.order_id,
          depositAmount: depositAmount,
          voucherBonus: bonusAmount,
          voucherCode: deposit.voucherBonus?.code || voucherCode,
          initialBalance: initialBalance,
          expectedBalance: expectedBalance,
          timestamp: Date.now()
        };

        localStorage.setItem(`payment_${deposit.order_id}`, JSON.stringify(paymentInfo));
        console.log('💾 Payment info saved to localStorage');

        // ✅ STEP 5: Open Midtrans Snap
        try {
          console.log('🚀 Opening Midtrans Snap...');
          const result = await MidtransSnap.pay(deposit.snap_token);
          
          if (result.status === 'success' || result.status === 'pending') {
            // ✅ SUCCESS/PENDING: Redirect to success page for monitoring
            console.log('✅ Payment callback received:', result.status);
            console.log('🔄 Redirecting to verification page...');
            
            // Hard redirect to ensure page refresh
            window.location.href = `/payment-success?orderId=${deposit.order_id}`;
            
            // Keep loading state true because we're redirecting
            // User will see loading until new page loads
            
          } else if (result.status === 'closed') {
            // ⚠️ CANCELLED: User closed popup
            console.log('⚠️ Payment cancelled by user');
            
            // Clear payment info because it was cancelled
            localStorage.removeItem(`payment_${deposit.order_id}`);
            
            // Reset state
            setLoading(false);
            setStep('amount');
            setCurrentTransaction(null);
            setError('Payment was cancelled. You can try again.');
          }
          
        } catch (snapError) {
          // ❌ ERROR: Midtrans Snap failed
          console.error('❌ Midtrans Snap error:', snapError);
          
          // Clear payment info
          localStorage.removeItem(`payment_${deposit.order_id}`);
          
          // Reset state
          setLoading(false);
          setStep('amount');
          setCurrentTransaction(null);
          setError('Payment failed. Please try again.');
        }
      }
      
    } catch (err: any) {
      console.error('❌ Transaction creation error:', err);
      setError(err.message || 'Failed to create transaction');
      setStep('amount');
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
          {/* Header */}
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
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setAmount(value);
                          if (voucherCode) {
                            handleVoucherApplied(null);
                          }
                        }}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Minimum deposit: Rp 10,000</p>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Quick Select
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {quickAmounts.map((quickAmount) => (
                        <button
                          key={quickAmount}
                          onClick={() => {
                            setAmount(quickAmount.toString());
                            if (voucherCode) {
                              handleVoucherApplied(null);
                            }
                          }}
                          className={`px-3 py-2.5 text-sm font-semibold rounded-lg border-2 transition-all ${
                            parseInt(amount) === quickAmount
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {formatCurrency(quickAmount).replace('Rp', '').trim()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Voucher Section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Voucher Code (Optional)
                    </label>
                    <VoucherInput
                      depositAmount={numAmount}
                      onVoucherApplied={handleVoucherApplied}
                      externalCode={voucherCode}
                    />
                  </div>

                  {/* Available Vouchers */}
                  {availableVouchers.length > 0 && (
                    <AvailableVouchers
                      vouchers={availableVouchers}
                      depositAmount={numAmount}
                      onVoucherSelect={handleVoucherSelect}
                      selectedVoucherCode={voucherCode}
                    />
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-900 mb-1">Payment Error</p>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Pay Button */}
                  <button
                    onClick={handlePayment}
                    disabled={loading || !numAmount || numAmount < 10000}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        <span>Pay Now - {formatCurrency(totalWithBonus)}</span>
                      </>
                    )}
                  </button>

                  {/* Transaction History Link */}
                  <button
                    onClick={() => setStep('history')}
                    className="w-full text-blue-600 hover:text-blue-700 font-semibold py-3 flex items-center justify-center gap-2 transition-colors"
                  >
                    <History className="w-5 h-5" />
                    <span>View Transaction History</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Summary & Info */}
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  Payment Summary
                </h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Deposit Amount</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatCurrency(numAmount)}
                    </span>
                  </div>
                  
                  {voucherBonus > 0 && (
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-semibold">Voucher Bonus</span>
                      </div>
                      <span className="text-base font-bold text-green-600">
                        +{formatCurrency(voucherBonus)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(totalWithBonus)}
                    </span>
                  </div>
                </div>

                {voucherBonus > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Tag className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          Voucher Applied!
                        </p>
                        <p className="text-xs text-green-700">
                          {voucherType === 'percentage' 
                            ? `Get ${voucherValue}% bonus` 
                            : `Get ${formatCurrency(voucherValue)} bonus`}
                        </p>
                        {voucherCode && (
                          <p className="text-xs text-green-600 font-mono mt-1 font-bold">
                            {voucherCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2">Secure Payment</h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Your payment is protected with industry-standard encryption and secured by Midtrans.
                    </p>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-3">Accepted Payment Methods</p>
                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.slice(0, 12).map((method, index) => (
                      <div key={index} className="bg-white border border-blue-200 rounded p-2 flex items-center justify-center hover:border-blue-400 transition-colors">
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
                  <p className="text-xs text-blue-600 mt-3 text-center">+ More payment options available</p>
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
                      <div className="pt-3 border-t border-gray-200 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-gray-700">Voucher Applied</span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Code: <span className="font-mono font-semibold">{voucherCode}</span></div>
                          <div>Bonus: <span className="font-semibold text-green-600">+{formatCurrency(voucherBonus)}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setStep('amount');
                  setCurrentTransaction(null);
                }}
                className="mt-6 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Cancel Payment
              </button>
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