// components/AvailableVouchers.tsx
import React, { useState } from 'react';
import { Gift, TrendingUp, Percent, Calendar, Users, CheckCircle, AlertCircle, Lock, Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getVoucherStatus = (voucher: Voucher) => {
    const now = new Date();
    const validFrom = new Date(voucher.validFrom);
    const validUntil = new Date(voucher.validUntil);
    
    if (!voucher.isActive) {
      return { eligible: false, reason: 'Voucher tidak aktif' };
    }
    
    if (now < validFrom) {
      return { eligible: false, reason: 'Belum dimulai' };
    }
    if (now > validUntil) {
      return { eligible: false, reason: 'Kedaluwarsa' };
    }
    
    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
      return { eligible: false, reason: 'Batas tercapai' };
    }
    
    if (depositAmount > 0 && depositAmount < voucher.minDeposit) {
      return { eligible: false, reason: `Min ${formatCurrency(voucher.minDeposit)}` };
    }
    
    if (depositAmount === 0) {
      return { eligible: true, reason: 'Masukkan jumlah untuk mengaktifkan', needsAmount: true };
    }
    
    return { eligible: true, reason: 'Tersedia' };
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

  // Count eligible vouchers
  const eligibleCount = vouchers.filter(v => {
    const status = getVoucherStatus(v);
    return status.eligible && !status.needsAmount;
  }).length;

  const displayedVouchers = showAll ? vouchers : vouchers.slice(0, 3);

  if (vouchers.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-sky-300 hover:shadow-sm transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-base text-gray-900">Voucher Tersedia</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {eligibleCount > 0 
                  ? `${eligibleCount} voucher${eligibleCount > 1 ? '' : ''} tersedia untuk Anda` 
                  : 'Masukkan jumlah untuk melihat voucher yang tersedia'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 text-sky-700 text-xs font-bold px-3 py-1.5 rounded-full">
              {vouchers.length}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Info Banner */}
          {depositAmount === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Masukkan jumlah deposit untuk melihat voucher mana yang dapat Anda gunakan
                </p>
              </div>
            </div>
          )}

          {/* Voucher Cards */}
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
                      ? 'cursor-pointer hover:shadow-md'
                      : 'cursor-not-allowed opacity-70'
                  }`}
                >
                  <div className={`relative overflow-hidden rounded-lg border-2 ${
                    isSelected 
                      ? 'border-sky-500 shadow-lg' 
                      : isClickable 
                      ? 'border-gray-300 hover:border-sky-300' 
                      : 'border-gray-300'
                  } bg-white`}>
                    
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500 rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl" />
                    </div>
                    
                    {/* Lock Icon for Disabled Vouchers */}
                    {!isClickable && (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="bg-gray-500 text-white rounded-full p-1.5">
                          <Lock className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                    
                    <div className="relative p-4">
                      {/* Header Section */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-lg font-black ${
                              isClickable ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {voucher.code}
                            </span>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-sky-600" />
                            )}
                          </div>
                          {voucher.description && (
                            <p className={`text-xs leading-relaxed ${
                              isClickable ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                              {voucher.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Bonus Badge */}
                        <div className={`flex-shrink-0 ${
                          isClickable 
                            ? 'bg-gradient-to-br from-sky-500 to-indigo-600' 
                            : 'bg-gray-400'
                        } text-white rounded-lg px-3 py-2 text-center shadow-sm`}>
                          {voucher.type === 'percentage' ? (
                            <>
                              <div className="text-xl font-black leading-none">{voucher.value}%</div>
                              <div className="text-[9px] font-semibold opacity-90 mt-0.5">BONUS</div>
                            </>
                          ) : (
                            <>
                              <div className="text-[9px] font-semibold opacity-90">BONUS</div>
                              <div className="text-sm font-black leading-none mt-0.5">
                                {voucher.value >= 1000 ? `${voucher.value / 1000}K` : voucher.value}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className={`flex items-center gap-1.5 ${
                          isClickable ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          <TrendingUp className={`w-3.5 h-3.5 ${
                            isClickable ? 'text-sky-500' : 'text-gray-400'
                          }`} />
                          <span className="font-medium">Min: {formatCurrency(voucher.minDeposit)}</span>
                        </div>
                        
                        {voucher.type === 'percentage' && voucher.maxBonusAmount && (
                          <div className={`flex items-center gap-1.5 ${
                            isClickable ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            <Percent className={`w-3.5 h-3.5 ${
                              isClickable ? 'text-sky-500' : 'text-gray-400'
                            }`} />
                            <span className="font-medium">Maks: {formatCurrency(voucher.maxBonusAmount)}</span>
                          </div>
                        )}
                        
                        <div className={`flex items-center gap-1.5 ${
                          isClickable ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          <Calendar className={`w-3.5 h-3.5 ${
                            isClickable ? 'text-sky-500' : 'text-gray-400'
                          }`} />
                          <span className="font-medium">
                            Hingga {new Date(voucher.validUntil).toLocaleDateString('id-ID', { 
                              day: '2-digit', 
                              month: 'short' 
                            })}
                          </span>
                        </div>
                        
                        {voucher.maxUses && (
                          <div className={`flex items-center gap-1.5 ${
                            isClickable ? 'text-gray-600' : 'text-gray-400'
                          }`}>
                            <Users className={`w-3.5 h-3.5 ${
                              isClickable ? 'text-sky-500' : 'text-gray-400'
                            }`} />
                            <span className="font-medium">{voucher.maxUses - voucher.usedCount} tersisa</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Status Messages */}
                      {!status.eligible && !status.needsAmount && (
                        <div className="pt-3 border-t border-gray-300">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-semibold text-amber-600">{status.reason}</span>
                          </div>
                        </div>
                      )}
                      
                      {status.needsAmount && (
                        <div className="pt-3 border-t border-blue-200">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs font-semibold text-blue-600">{status.reason}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Bonus Preview */}
                      {bonus > 0 && depositAmount >= voucher.minDeposit && (
                        <div className="pt-3 border-t border-sky-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                              <span className="text-xs font-semibold text-gray-600">Bonus Anda:</span>
                            </div>
                            <span className="text-base font-black text-sky-600">
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

          {/* Show More/Less Button */}
          {vouchers.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-sky-600 text-sm font-semibold py-2.5 rounded-lg hover:bg-sky-50 transition-all border border-sky-200"
            >
              {showAll ? 'Tampilkan Lebih Sedikit' : `Tampilkan Semua (${vouchers.length - 3} lainnya)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AvailableVouchers;