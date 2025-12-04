'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'TWD' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (amount: string, fromCurrency: string) => { amount: string; currency: Currency };
  exchangeRate: number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// TWD to USD 匯率 (可以之後改為動態獲取)
const TWD_TO_USD_RATE = 0.031; // 1 TWD ≈ 0.031 USD
const USD_TO_TWD_RATE = 32.26; // 1 USD ≈ 32.26 TWD

async function detectUserLocation(): Promise<Currency> {
  try {
    // 使用免費的 IP geolocation API
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    // 如果是台灣，返回 TWD，否則返回 USD
    return data.country_code === 'TW' ? 'TWD' : 'USD';
  } catch (error) {
    console.error('Failed to detect location:', error);
    // 默認返回 USD
    return 'USD';
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 從 localStorage 讀取用戶偏好
    const savedCurrency = localStorage.getItem('preferredCurrency') as Currency;

    if (savedCurrency) {
      setCurrency(savedCurrency);
      setIsInitialized(true);
    } else {
      // 如果沒有保存的偏好，根據 IP 檢測
      detectUserLocation().then((detectedCurrency) => {
        setCurrency(detectedCurrency);
        setIsInitialized(true);
      });
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      // 保存用戶偏好到 localStorage
      localStorage.setItem('preferredCurrency', currency);
    }
  }, [currency, isInitialized]);

  const convertPrice = (amount: string, fromCurrency: string): { amount: string; currency: Currency } => {
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount)) {
      return { amount: '0', currency };
    }

    // 如果來源貨幣和目標貨幣相同，直接返回
    if (fromCurrency === currency) {
      return { amount, currency };
    }

    let convertedAmount: number;

    // TWD 轉換為 USD
    if (fromCurrency === 'TWD' && currency === 'USD') {
      convertedAmount = numericAmount * TWD_TO_USD_RATE;
    }
    // USD 轉換為 TWD
    else if (fromCurrency === 'USD' && currency === 'TWD') {
      convertedAmount = numericAmount * USD_TO_TWD_RATE;
    }
    // 其他情況直接返回
    else {
      convertedAmount = numericAmount;
    }

    return {
      amount: convertedAmount.toFixed(2),
      currency
    };
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    convertPrice,
    exchangeRate: currency === 'TWD' ? USD_TO_TWD_RATE : TWD_TO_USD_RATE
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
