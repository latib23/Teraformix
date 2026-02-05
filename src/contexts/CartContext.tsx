

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => { },
  removeFromCart: () => { },
  updateQuantity: () => { },
  clearCart: () => { },
  cartTotal: 0,
  cartCount: 0,
});

export const CartProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    let savedCart: string | null = null;
    try {
      if (typeof localStorage !== 'undefined') {
        savedCart = localStorage.getItem('tfx_cart');
      }
    } catch { }
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      } catch (e) {
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tfx_cart', JSON.stringify(cart));
      }
    } catch { }
  }, [cart]);

  const dispatchToast = (message: string, type: 'success' | 'info' | 'error') => {
    window.dispatchEvent(new CustomEvent('tfx-toast', { detail: { message, type } }));
  };

  const addToCart = (product: Product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });

    dispatchToast(`${product.name} added to cart`, 'success');
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    dispatchToast('Item removed from cart', 'info');
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, quantity: qty } : item
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
