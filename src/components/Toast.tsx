
import React from 'react';
import { useUI } from '../contexts/UIContext';
import { CheckCircle, Info, XCircle, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useUI();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-slideInRight min-w-[300px] ${
            toast.type === 'success' ? 'bg-white border-action-500 text-navy-900' :
            toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-navy-800 border-navy-700 text-white'
          }`}
        >
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-action-600" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          
          <span className="text-sm font-medium flex-grow">{toast.message}</span>
          
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
