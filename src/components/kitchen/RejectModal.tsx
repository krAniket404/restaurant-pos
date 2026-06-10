'use client';
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onConfirm: (reason: string) => Promise<void>;
  items: { name: string; instructions?: string[] }[];
}

export const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, orderId, onConfirm, items }) => {
  const [reasonCategory, setReasonCategory] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [subSelection, setSubSelection] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    'Item not available',
    'Ingredient out of stock',
    'Preparation time too long',
    'Custom request not feasible',
    'Other (specify below)'
  ];

  const handleConfirm = () => {
    let finalReason = reasonCategory;
    if (reasonCategory === 'Item not available') {
      finalReason = `Item not available: ${subSelection}`;
    } else if (reasonCategory === 'Ingredient out of stock') {
      finalReason = `Ingredient out of stock: ${customReason}`;
    } else if (reasonCategory === 'Other (specify below)') {
      finalReason = `Other: ${customReason}`;
    } else if (reasonCategory === 'Custom request not feasible') {
      finalReason = `Custom request not feasible: ${subSelection}`;
    }

    onConfirm(finalReason);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Order">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Reason for rejection</label>
          <select 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
            value={reasonCategory}
            onChange={(e) => {
              setReasonCategory(e.target.value);
              setSubSelection('');
              setCustomReason('');
            }}
          >
            <option value="" disabled>Select a reason...</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {reasonCategory === 'Item not available' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-semibold text-slate-700">Which item is not available?</label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              value={subSelection}
              onChange={(e) => setSubSelection(e.target.value)}
            >
              <option value="" disabled>Select the item...</option>
              {Array.from(new Set(items.map(i => i.name))).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {reasonCategory === 'Ingredient out of stock' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-semibold text-slate-700">Which ingredient?</label>
            <input 
              type="text" 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Tomatoes"
            />
          </div>
        )}

        {reasonCategory === 'Other (specify below)' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-semibold text-slate-700">Specify reason</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
            />
          </div>
        )}

        {reasonCategory === 'Custom request not feasible' && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-semibold text-slate-700">Which custom request?</label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
              value={subSelection}
              onChange={(e) => setSubSelection(e.target.value)}
            >
              <option value="" disabled>Select the instruction...</option>
              {Array.from(new Set(items.flatMap(i => i.instructions || []).filter(Boolean))).map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center space-x-3 pt-4 border-t mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button 
            variant="danger" 
            onClick={handleConfirm} 
            className="flex-1"
            disabled={!reasonCategory || loading || (reasonCategory === 'Item not available' && !subSelection) || (reasonCategory === 'Ingredient out of stock' && !customReason) || (reasonCategory === 'Other (specify below)' && !customReason) || (reasonCategory === 'Custom request not feasible' && !subSelection)}
          >
            Confirm Hold
          </Button>
        </div>
      </div>
    </Modal>
  );
};
