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

  const quickAmounts = [100000, 250000, 500000, 1000000];

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

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
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
            
            // Set to success screen
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

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Payment Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Amount Input Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                  <h2 className="text-xl font-bold text-white mb-2">Enter Amount</h2>
                  <p className="text-blue-100 text-sm">Choose or enter the amount you want to deposit</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Quick Amount Buttons */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Quick Select</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {quickAmounts.map((quickAmount) => (
                        <button
                          key={quickAmount}
                          onClick={() => handleQuickAmount(quickAmount)}
                          className={`
                            p-4 rounded-lg border-2 font-semibold text-sm transition-all
                            ${amount === quickAmount.toString()
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                            }
                          `}
                        >
                          {formatCurrency(quickAmount)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Or Enter Custom Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">Rp</span>
                      <input
                        type="text"
                        value={amount ? parseInt(amount).toLocaleString('id-ID') : ''}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0"
                        className="w-full pl-14 pr-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">Minimum deposit: {formatCurrency(10000)}</p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Voucher Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6">
                  <div className="flex items-center gap-3">
                    <Tag className="w-6 h-6 text-white" />
                    <div>
                      <h2 className="text-xl font-bold text-white">Discount Code</h2>
                      <p className="text-green-100 text-sm mt-1">Apply a discount code to get bonus balance</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <VoucherInput
                    depositAmount={numAmount}
                    onVoucherApplied={handleVoucherApplied}
                    externalCode={externalVoucherCode}
                  />
                </div>
              </div>

              {/* Available Vouchers */}
              <AvailableVouchers 
                vouchers={availableVouchers}
                depositAmount={numAmount}
                selectedVoucherCode={voucherCode}
                onVoucherSelect={(code) => {
                  setExternalVoucherCode(code);
                }}
              />
            </div>

            {/* Summary Card - Right Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 p-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Payment Summary</h3>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Amount Details */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Deposit Amount</span>
                        <span className="text-lg font-bold text-gray-900">
                          {numAmount > 0 ? formatCurrency(numAmount) : 'Rp 0'}
                        </span>
                      </div>

                      {voucherBonus > 0 && (
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Tag className="w-5 h-5 text-green-700" />
                            <span className="text-sm font-bold text-green-900">Discount Applied!</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-green-800">
                              <span>Code:</span>
                              <span className="font-mono font-bold">{voucherCode}</span>
                            </div>
                            <div className="flex justify-between text-green-800">
                              <span>Type:</span>
                              <span className="font-semibold">
                                {voucherType === 'percentage' ? `${voucherValue}%` : 'Fixed'}
                              </span>
                            </div>
                            <div className="flex justify-between text-green-700 font-bold text-base pt-2 border-t border-green-300">
                              <span>Bonus:</span>
                              <span>+{formatCurrency(voucherBonus)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Total */}
                      <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-blue-800 font-semibold">Total Balance Added</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-700">
                          {totalWithBonus > 0 ? formatCurrency(totalWithBonus) : 'Rp 0'}
                        </div>
                        {voucherBonus > 0 && (
                          <div className="mt-2 text-xs text-blue-600">
                            Including {formatCurrency(voucherBonus)} bonus
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Button */}
                    <button
                      onClick={handlePayment}
                      disabled={!numAmount || numAmount < 10000 || loading}
                      className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>Continue to Payment</span>
                        </>
                      )}
                    </button>

                    {/* Security Badge */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="text-xs text-gray-600">
                        <p className="font-semibold text-gray-900 mb-1">Secure Payment</p>
                        <p>Powered by Midtrans - Your payment is encrypted and secure</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transaction History Link */}
                <button
                  onClick={() => setStep('history')}
                  className="w-full mt-4 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                >
                  <History className="w-5 h-5" />
                  <span>View Transaction History</span>
                </button>
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
                    setExternalVoucherCode('');
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