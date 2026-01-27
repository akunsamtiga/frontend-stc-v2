// components/AvailableVouchers.tsx
// ✅ IMPROVED: Always show vouchers, grey out ineligible ones
import React, { useState } from 'react';
import { Gift, Tag, TrendingUp, Percent, Calendar, Users, CheckCircle, AlertCircle, Lock } from 'lucide-react';

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

interface AvailableVouchersProps {
  vouchers: Voucher[];
  depositAmount: number;
  onVoucherSelect: (code: string) => void;
  selectedVoucherCode?: string;
}

const AvailableVouchers: React.FC<AvailableVouchersProps> = ({ 
  vouchers, 
  depositAmount, 
  onVoucherSelect, 
  selectedVoucherCode 
}) => {
  const [showAll, setShowAll] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // ✅ NEW: Separate check for different eligibility criteria
  const getVoucherStatus = (voucher: Voucher) => {
    const now = new Date();
    const validFrom = new Date(voucher.validFrom);
    const validUntil = new Date(voucher.validUntil);
    
    // Check if active
    if (!voucher.isActive) {
      return { eligible: false, reason: 'Voucher inactive' };
    }
    
    // Check date range
    if (now < validFrom) {
      return { eligible: false, reason: 'Not started yet' };
    }
    if (now > validUntil) {
      return { eligible: false, reason: 'Expired' };
    }
    
    // Check usage limit
    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
      return { eligible: false, reason: 'Limit reached' };
    }
    
    // Check minimum deposit
    if (depositAmount > 0 && depositAmount < voucher.minDeposit) {
      return { eligible: false, reason: `Min ${formatCurrency(voucher.minDeposit)}` };
    }
    
    // ✅ CHANGED: If depositAmount is 0, still show as potentially eligible
    if (depositAmount === 0) {
      return { eligible: true, reason: 'Enter amount to activate', needsAmount: true };
    }
    
    return { eligible: true, reason: 'Available' };
  };

  const calculateBonus = (voucher: Voucher) => {
    if (depositAmount < voucher.minDeposit) return 0;
    
    let bonus = 0;
    if (voucher.type === 'percentage') {
      bonus = Math.floor(depositAmount * (voucher.value / 100));
      if (voucher.maxBonusAmount && bonus > voucher.maxBonusAmount) {
        bonus = voucher.maxBonusAmount;
      }
    } else {
      bonus = voucher.value;
    }
    
    return bonus;
  };

  // ✅ CHANGED: Show all vouchers, not just eligible ones
  const displayedVouchers = showAll ? vouchers : vouchers.slice(0, 3);

  if (vouchers.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-lg text-gray-900">Available Vouchers</h3>
        <span className="ml-auto bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
          {vouchers.length} Voucher{vouchers.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* ✅ NEW: Info message if no deposit amount */}
      {depositAmount === 0 && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Enter deposit amount to see which vouchers you can use</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {displayedVouchers.map((voucher) => {
          const status = getVoucherStatus(voucher);
          const bonus = calculateBonus(voucher);
          const isSelected = selectedVoucherCode === voucher.code;
          const isClickable = status.eligible && !status.needsAmount;
          
          return (
            <button
              key={voucher.id}
              onClick={() => isClickable && onVoucherSelect(voucher.code)}
              disabled={!isClickable}
              className={`w-full text-left transition-all ${
                isClickable 
                  ? isSelected
                    ? 'ring-2 ring-purple-500 bg-purple-50'
                    : 'hover:shadow-md hover:border-purple-200 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <div className={`relative overflow-hidden rounded-xl border-2 ${
                isSelected ? 'border-purple-500' : 
                isClickable ? 'border-purple-200' : 
                'border-gray-200'
              }`}>
                {/* ✅ NEW: Lock overlay for ineligible vouchers */}
                {!isClickable && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="bg-gray-500 text-white rounded-full p-1.5">
                      <Lock className="w-3 h-3" />
                    </div>
                  </div>
                )}
                
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500 rounded-full blur-3xl" />
                </div>
                
                <div className="relative p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xl font-black font-mono ${
                          isClickable ? 'text-purple-900' : 'text-gray-500'
                        }`}>
                          {voucher.code}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      {voucher.description && (
                        <p className={`text-xs ${isClickable ? 'text-gray-600' : 'text-gray-400'}`}>
                          {voucher.description}
                        </p>
                      )}
                    </div>
                    
                    <div className={`${
                      isClickable 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                        : 'bg-gray-400'
                    } text-white rounded-lg px-3 py-2 text-center ml-3`}>
                      {voucher.type === 'percentage' ? (
                        <>
                          <div className="text-2xl font-black">{voucher.value}%</div>
                          <div className="text-[10px] font-semibold opacity-90">BONUS</div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-semibold">BONUS</div>
                          <div className="text-sm font-black">{voucher.value / 1000}K</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className={`flex items-center gap-1.5 ${
                      isClickable ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      <TrendingUp className={`w-3.5 h-3.5 ${
                        isClickable ? 'text-purple-500' : 'text-gray-400'
                      }`} />
                      <span>Min: {formatCurrency(voucher.minDeposit)}</span>
                    </div>
                    
                    {voucher.type === 'percentage' && voucher.maxBonusAmount && (
                      <div className={`flex items-center gap-1.5 ${
                        isClickable ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        <Percent className={`w-3.5 h-3.5 ${
                          isClickable ? 'text-purple-500' : 'text-gray-400'
                        }`} />
                        <span>Max: {formatCurrency(voucher.maxBonusAmount)}</span>
                      </div>
                    )}
                    
                    <div className={`flex items-center gap-1.5 ${
                      isClickable ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      <Calendar className={`w-3.5 h-3.5 ${
                        isClickable ? 'text-purple-500' : 'text-gray-400'
                      }`} />
                      <span>Until {new Date(voucher.validUntil).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                    </div>
                    
                    {voucher.maxUses && (
                      <div className={`flex items-center gap-1.5 ${
                        isClickable ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        <Users className={`w-3.5 h-3.5 ${
                          isClickable ? 'text-purple-500' : 'text-gray-400'
                        }`} />
                        <span>{voucher.maxUses - voucher.usedCount} left</span>
                      </div>
                    )}
                  </div>
                  
                  {/* ✅ NEW: Status indicator */}
                  {!status.eligible && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-amber-600 font-semibold">{status.reason}</span>
                      </div>
                    </div>
                  )}
                  
                  {status.needsAmount && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center gap-2 text-xs">
                        <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-blue-600 font-semibold">{status.reason}</span>
                      </div>
                    </div>
                  )}
                  
                  {bonus > 0 && depositAmount >= voucher.minDeposit && (
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">You'll get bonus:</span>
                        <span className="text-lg font-black text-purple-600">
                          +{formatCurrency(bonus)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {vouchers.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 text-purple-600 text-sm font-semibold py-2 rounded-lg hover:bg-purple-50 transition-all"
        >
          {showAll ? 'Show Less' : `Show All (${vouchers.length - 3} more)`}
        </button>
      )}
    </div>
  );
};

export default AvailableVouchers;