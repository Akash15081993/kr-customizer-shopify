'use client';
// app/contexts/ShopContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ShopContextType {
  shop: string | null;
  setShop: (shop: string) => void;
  isLoading: boolean;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// Validate shop domain format
const isValidShopDomain = (shop: string | null): boolean => {
  if (!shop) return false;
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
};

// Safe localStorage utility
const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage access failed:', error);
      return null;
    }
  },
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage set failed:', error);
    }
  }
};

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeShop = () => {
      try {
        // Get shop from URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const shopParam = urlParams.get('shop');
        
        if (shopParam && isValidShopDomain(shopParam)) {
          setShop(shopParam);
          storage.set('shop', shopParam);
          setIsLoading(false);
          return;
        }
        
        // Fallback to localStorage with validation
        const storedShop = storage.get('shop');
        if (storedShop && isValidShopDomain(storedShop)) {
          setShop(storedShop);
          setIsLoading(false);
          return;
        }
        
        // No valid shop found
        setIsLoading(false);
        console.warn('No valid shop domain found');
        
      } catch (error) {
        console.error('Error initializing shop:', error);
        setIsLoading(false);
      }
    };

    initializeShop();
  }, []);

  const handleSetShop = (newShop: string) => {
    if (!isValidShopDomain(newShop)) {
      console.error('Invalid shop domain format:', newShop);
      return;
    }
    
    setShop(newShop);
    storage.set('shop', newShop);
  };

  const value: ShopContextType = {
    shop,
    setShop: handleSetShop,
    isLoading
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};