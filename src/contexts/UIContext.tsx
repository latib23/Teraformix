

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface UIContextType {
  isQuoteModalOpen: boolean;
  quoteModalData: string;
  openQuoteModal: (prefillData?: string) => void;
  closeQuoteModal: () => void;

  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: number) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteModalData, setQuoteModalData] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const openQuoteModal = (prefillData = '') => {
    setQuoteModalData(prefillData);
    setIsQuoteModalOpen(true);
  };

  const closeQuoteModal = () => {
    setIsQuoteModalOpen(false);
    setQuoteModalData('');
  };

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Listen for global toast events (allows decoupled triggering from CartContext)
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        showToast(customEvent.detail.message, customEvent.detail.type);
      }
    };

    window.addEventListener('tfx-toast', handleToastEvent);
    return () => window.removeEventListener('tfx-toast', handleToastEvent);
  }, [showToast]);

  return (
    <UIContext.Provider value={{
      isQuoteModalOpen,
      quoteModalData,
      openQuoteModal,
      closeQuoteModal,
      toasts,
      showToast,
      removeToast
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};