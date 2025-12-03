import React from 'react';
import { X, Lock } from 'lucide-react';
import { PaymentButtons } from './PaymentButtons';
import { useAuth } from '../contexts/AuthContext';

interface PaymentModalProps {
  price: string;
  courseId: string;
  courseTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ price, courseId, courseTitle, onClose, onSuccess }) => {
  const { user } = useAuth();

  return (
    // Added p-4 to ensure modal doesn't touch screen edges on small screens
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] backdrop-blur-sm animate-in fade-in duration-200 p-4">
      
      {/* 
         FIXES APPLIED:
         1. Removed 'overflow-hidden' (which was cutting off the credit card form).
         2. Added 'max-h-[90vh]' (Limits height to 90% of screen).
         3. Added 'overflow-y-auto' (Adds a scrollbar INSIDE the modal when content grows).
      */}
      <div className="bg-[#1a1a1a] text-white rounded-2xl shadow-2xl w-full max-w-[450px] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 relative border border-white/10">
        
        {/* Header - Made Sticky so it stays visible while scrolling */}
        <div className="sticky top-0 bg-[#1a1a1a] z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 font-bold text-white">
            <Lock className="w-4 h-4 text-green-500" />
            <span>Secure Checkout</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
            <div className="mb-6 text-center">
                <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-white">${price}</p>
                <p className="text-xs text-gray-500 mt-2">{courseTitle}</p>
            </div>

            <div className="w-full max-w-[300px] mx-auto">
                {user ? (
                    <PaymentButtons 
                        courseId={courseId}
                        userId={user.id}
                        price={price}
                        onSuccess={onSuccess}
                    />
                ) : (
                    <div className="text-center text-red-400 text-sm">Error: User session missing. Please log in.</div>
                )}
            </div>
              
            <div className="mt-6 text-center">
                <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Secured by PayPal.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};