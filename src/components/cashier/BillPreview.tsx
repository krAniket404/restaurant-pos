"use client";
import React, { useRef } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Order } from "../../types";
import { Printer, Check } from "lucide-react";

interface BillPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[] | null;
  restaurantName: string;
  onMarkPaid?: (orderIds: string[]) => Promise<void>;
  isParcel?: boolean;
  kind?: "order" | "modification";
  changeSummary?: string[];
}

export const BillPreview: React.FC<BillPreviewProps> = ({
  isOpen,
  onClose,
  orders,
  restaurantName,
  onMarkPaid,
  isParcel,
  kind = "order",
  changeSummary = [],
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!orders || orders.length === 0 || !isOpen) return null;

  // Aggregate items from all orders
  const rawItems = orders.flatMap((o) => o.items);
  const allItems = Object.values(
    rawItems.reduce(
      (acc, item) => {
        const key = `${item.menuItemId}-${(item.instructions || []).join("|")}`;
        if (!acc[key]) {
          acc[key] = { ...item };
        } else {
          acc[key].quantity += item.quantity;
        }
        return acc;
      },
      {} as Record<string, (typeof rawItems)[0]>,
    ) || {},
  );

  const subtotal = orders.reduce((sum, o) => sum + o.total, 0);
  const grandTotal = subtotal;
  const tableNumber = orders[0].tableNumber;

  const handlePrint = () => {
    // In a real app, this would use window.print() and CSS @media print
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md bg-white"
      position="top"
    >
      <div className="flex flex-col h-full relative" ref={printRef}>
        {/* Printable Area - style for receipt look */}
        <div className="p-8 bg-[#fdfbf7] font-mono text-sm text-slate-800">
          <div className="text-center mb-6 border-b border-dashed border-slate-300 pb-6">
            <h2 className="text-xl font-bold uppercase tracking-wider">
              {restaurantName || "Restaurant Name"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">Tax Invoice</p>
          </div>

          <div className="flex justify-between mb-4 text-xs border-b border-dashed border-slate-300 pb-4">
            <div>
              {isParcel ? (
                <p className="font-bold text-base bg-slate-800 text-white inline-block px-2 py-1 rounded">
                  PARCEL
                </p>
              ) : (
                <p>
                  Table: <span className="font-bold">{tableNumber}</span>
                </p>
              )}
              <p>Orders: {orders.length}</p>
            </div>
            <div className="text-right">
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>
                Time:{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {kind === "modification" && (
            <div className="mb-4 rounded-lg border border-amber-400 bg-amber-100 p-3">
              <p className="text-center text-lg font-black uppercase tracking-[0.25em] text-amber-700">
                MODIFIED
              </p>
              {changeSummary.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-amber-800">
                  {changeSummary.map((entry, index) => (
                    <li key={`${entry}-${index}`} className="font-semibold">
                      • {entry}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mb-4 border-b border-dashed border-slate-300 pb-4">
            <div className="flex justify-between font-bold mb-2 uppercase text-xs">
              <span className="flex-1">Item</span>
              <span className="w-12 text-center">Qty</span>
              <span className="w-20 text-right">Amt</span>
            </div>
            {allItems.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="flex justify-between mb-1"
              >
                <span className="flex-1 truncate pr-2">{item.name}</span>
                <span className="w-12 text-center">{item.quantity}</span>
                <span className="w-20 text-right">
                  {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1 mb-6 border-b border-dashed border-slate-300 pb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed border-slate-300">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 mt-8">
            <p>Thank you for dining with us!</p>
            <p className="mt-1">Please visit again</p>
          </div>
        </div>

        {/* Action Buttons (Not printable) */}
        <div className="p-4 bg-white border-t flex items-center space-x-3 mt-4 print:hidden">
          <Button
            variant="secondary"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <Printer className="w-4 h-4 mr-2" /> Print Bill
          </Button>
          {onMarkPaid && (
            <Button
              className="flex-1 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                onMarkPaid(orders.map((o) => o.id));
                onClose();
              }}
            >
              <Check className="w-4 h-4 mr-2" /> Mark as Paid
            </Button>
          )}
        </div>

        {/* Global style to hide everything except receipt on print */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .max-w-md, .max-w-md * {
              visibility: visible;
            }
            .max-w-md {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              box-shadow: none;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `,
          }}
        />
      </div>
    </Modal>
  );
};
