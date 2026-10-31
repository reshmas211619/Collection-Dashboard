/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Check, SlidersHorizontal, ArrowRight } from 'lucide-react';

interface ColumnMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileType: 'billing' | 'collection';
  sourceColumns: string[];
  initialMapping: Record<string, string>;
  onApplyMapping: (mapping: Record<string, string>) => void;
}

export const ColumnMapperModal: React.FC<ColumnMapperModalProps> = ({
  isOpen,
  onClose,
  fileType,
  sourceColumns,
  initialMapping,
  onApplyMapping
}) => {
  const [mapping, setMapping] = useState<Record<string, string>>(initialMapping);

  if (!isOpen) return null;

  const billingFields = [
    { key: 'Invoice No', label: 'Invoice Number', required: true, desc: 'Unique invoice identifier' },
    { key: 'Customer', label: 'Customer Name', required: true, desc: 'Client / Account name' },
    { key: 'Invoice Date', label: 'Invoice Date', required: true, desc: 'Date of billing (YYYY-MM-DD)' },
    { key: 'Due Date', label: 'Payment Due Date', required: false, desc: 'Maturity date for credit' },
    { key: 'Invoice Amount', label: 'Invoice Amount', required: true, desc: 'Gross billed amount (₹)' },
    { key: 'Region', label: 'Region / Zone', required: false, desc: 'North, South, East, West, Central' },
    { key: 'State', label: 'State', required: false, desc: 'PAN India State name' },
    { key: 'Salesperson', label: 'Salesperson', required: false, desc: 'Account representative' }
  ];

  const collectionFields = [
    { key: 'Invoice No', label: 'Invoice Number', required: true, desc: 'Matched Invoice reference' },
    { key: 'Customer', label: 'Customer Name', required: false, desc: 'Remitting customer' },
    { key: 'Collection Date', label: 'Collection / Payment Date', required: true, desc: 'Date payment received' },
    { key: 'Collection Amount', label: 'Collection Amount', required: true, desc: 'Amount collected (₹)' },
    { key: 'Payment Reference', label: 'Payment Reference / UTR', required: false, desc: 'UTR / Cheque / Txn reference' },
    { key: 'Payment Mode', label: 'Payment Mode', required: false, desc: 'RTGS, NEFT, Cheque, UPI' },
    { key: 'Bank', label: 'Bank Name', required: false, desc: 'Receiving bank' },
    { key: 'Region', label: 'Region', required: false, desc: 'Geographic region' },
    { key: 'State', label: 'State', required: false, desc: 'PAN India state' }
  ];

  const targetFields = fileType === 'billing' ? billingFields : collectionFields;

  const handleChange = (targetKey: string, sourceCol: string) => {
    setMapping(prev => ({
      ...prev,
      [targetKey]: sourceCol
    }));
  };

  const handleSave = () => {
    onApplyMapping(mapping);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Column Mapping: {fileType === 'billing' ? 'Customer Billing Data' : 'Collection File'}
              </h3>
              <p className="text-xs text-slate-500">
                Map column headers from your uploaded file to the required system fields.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mapping Form */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-3">
          {targetFields.map(field => {
            const currentSource = mapping[field.key] || '';
            return (
              <div
                key={field.key}
                className="p-3 rounded-lg border border-slate-200/90 hover:border-slate-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 sm:w-1/2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">{field.label}</span>
                    {field.required && (
                      <span className="text-2xs font-semibold text-red-600 bg-red-50 border border-red-200 px-1.5 rounded">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-2xs text-slate-500 mt-0.5 truncate">{field.desc}</p>
                </div>

                <div className="flex items-center gap-2 sm:w-1/2">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
                  <select
                    value={currentSource}
                    onChange={e => handleChange(field.key, e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-md py-1.5 px-2.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Source Column --</option>
                    {sourceColumns.map(col => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Check className="w-4 h-4" />
            <span>Apply Mapping & Re-Reconcile</span>
          </button>
        </div>

      </div>
    </div>
  );
};
