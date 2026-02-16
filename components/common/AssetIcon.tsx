// components/common/AssetIcon.tsx - NEW FILE

'use client'
import { useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface AssetIconProps {
  asset: {
    icon?: string
    name: string
    symbol: string
    category?: 'normal' | 'crypto'
    cryptoConfig?: {
      baseCurrency: string
    }
  }
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16'
}

const ICON_SIZE_CLASSES = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10'
}

// Default crypto icons (CryptoCompare or CryptoLogos)
const getCryptoIconUrl = (baseCurrency: string): string => {
  const currency = baseCurrency.toUpperCase()
  
  // Using CryptoLogos (free CDN)
  const iconMap: Record<string, string> = {
    'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    'XRP': 'https://cryptologos.cc/logos/xrp-xrp-logo.png',
    'ADA': 'https://cryptologos.cc/logos/cardano-ada-logo.png',
    'SOL': 'https://cryptologos.cc/logos/solana-sol-logo.png',
    'DOT': 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
    'DOGE': 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
    'MATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
    'LTC': 'https://cryptologos.cc/logos/litecoin-ltc-logo.png',
    'AVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
    'LINK': 'https://cryptologos.cc/logos/chainlink-link-logo.png',
    'UNI': 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    'ATOM': 'https://cryptologos.cc/logos/cosmos-atom-logo.png',
    'XLM': 'https://cryptologos.cc/logos/stellar-xlm-logo.png',
  }
  
  return iconMap[currency] || `https://via.placeholder.com/64?text=${currency}`
}

export default function AssetIcon({ 
  asset, 
  size = 'md', 
  className = '',
  showFallback = true 
}: AssetIconProps) {
  const [imageError, setImageError] = useState(false)
  
  // Determine icon URL
  let iconUrl = asset.icon
  
  // Auto-fallback for crypto assets
  if (!iconUrl && asset.category === 'crypto' && asset.cryptoConfig?.baseCurrency) {
    iconUrl = getCryptoIconUrl(asset.cryptoConfig.baseCurrency)
  }

  // If we have a valid icon URL
  if (iconUrl && !imageError) {
    return (
      <div className={`${SIZE_CLASSES[size]} rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${className}`}>
        <img 
          src={iconUrl}
          alt={`${asset.name} icon`}
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
      </div>
    )
  }

  // Fallback to emoji/icon
  if (showFallback) {
    return (
      <div className={`${SIZE_CLASSES[size]} rounded-lg bg-gradient-to-br ${
        asset.category === 'crypto' 
          ? 'from-orange-400 to-yellow-500' 
          : 'from-blue-400 to-purple-500'
      } flex items-center justify-center text-white flex-shrink-0 ${className}`}>
        {asset.category === 'crypto' ? (
          <span className={`${ICON_SIZE_CLASSES[size]} text-2xl`}>Blank</span>
        ) : (
          <TrendingUp className={ICON_SIZE_CLASSES[size]} />
        )}
      </div>
    )
  }

  return null
}