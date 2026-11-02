import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, ShoppingBag, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, CreditCard } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}) => {
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [orderComplete, setOrderComplete] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((acc, item) => {
    return acc + item.material.priceLKR * item.quantity;
  }, 0);

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderComplete(true);
      onClearCart();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md h-full bg-white/95 backdrop-blur-2xl border-l border-white/80 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200/80 bg-white/60">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Study Materials Cart</h3>
              <p className="text-[11px] text-slate-500">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setOrderComplete(false);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {orderComplete ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Order Placed Successfully!</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Your purchase has been processed. Download links and physical parcel tracking numbers have been sent to your student portal.
              </p>
              <button
                onClick={() => {
                  setOrderComplete(false);
                  onClose();
                }}
                className="mt-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white apple-button-primary"
              >
                Return to Store
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-slate-600 font-medium">Your cart is empty</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Browse our selection of A/L Accounting lesson tutes, revision kits, and model paper sets.
              </p>
            </div>
          ) : (
            cartItems.map((item) => {
              const unitPrice = item.material.priceLKR;
              return (
                <div 
                  key={item.material.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {item.material.batchTag} · {item.material.format}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {item.material.title}
                      </h4>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.material.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                      <button
                        onClick={() => onUpdateQuantity(item.material.id, -1)}
                        className="text-slate-500 hover:text-slate-900 font-bold px-1"
                      >
                        -
                      </button>
                      <span className="font-sans tabular-nums font-semibold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.material.id, 1)}
                        className="text-slate-500 hover:text-slate-900 font-bold px-1"
                      >
                        +
                      </button>
                    </div>

                    <div className="font-sans font-bold text-slate-900 tabular-nums">
                      Rs. {(unitPrice * item.quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Checkout */}
        {!orderComplete && cartItems.length > 0 && (
          <div className="p-5 border-t border-slate-200/80 bg-white/80 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Delivery / Instant Download</span>
              <span className="text-emerald-600 font-semibold">Free Express</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold text-slate-900">
              <span>Total Investment</span>
              <span className="text-base text-blue-700 font-sans tabular-nums">
                Rs. {totalAmount.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold apple-button-primary shadow-md flex items-center justify-center gap-2 text-xs"
            >
              {isCheckingOut ? (
                <span>Securing Order...</span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to One-Click Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Apple Pay, Bank Deposit & Card payments secured</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
