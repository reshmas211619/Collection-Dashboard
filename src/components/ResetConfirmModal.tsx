/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        
        <div className="p-6">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-slate-900 text-center mb-1">
            Clear All Reconciled Financial Data?
          </h3>
          <p className="text-xs text-slate-600 text-center leading-relaxed">
            This will permanently erase all uploaded customer billing records, collection transactions, custom mappings, and cached browser storage. This action cannot be undone.
          </p>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="w-1/2 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-1/2 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirm & Reset</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
