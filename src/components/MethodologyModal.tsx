/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BookOpen, Calculator, Calendar, ShieldCheck } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Finance Methodology & KPI Definitions
              </h3>
              <p className="text-xs text-slate-500">
                Standard corporate Treasury and Accounts Receivable accounting principles
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700 leading-relaxed">
          
          {/* Formula 1 */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>1. Fundamental Reconciliation Balance Check</span>
            </div>
            <p className="text-slate-600 mb-2">
              Every invoice is matched with bank receipts using unique Invoice Numbers. The accounting identity enforced at both individual invoice and national consolidated levels is:
            </p>
            <div className="bg-white p-2.5 rounded border border-slate-200 font-mono text-blue-800 font-semibold text-2xs">
              Outstanding Amount = Max(0, Invoice Amount − Total Valid Collections)
              <br />
              Audit Discrepancy = |(Total Billing − Total Collection) − Total Outstanding| == ₹0.00
            </div>
          </div>

          {/* Formula 2 */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>2. Collection Efficiency %</span>
            </div>
            <p className="text-slate-600 mb-1">
              Measures the cash realization rate against billed debt:
            </p>
            <div className="bg-white p-2.5 rounded border border-slate-200 font-mono text-emerald-800 font-semibold text-2xs">
              Collection Efficiency (%) = (Total Collection Amount / Total Invoiced Billing) × 100
            </div>
          </div>

          {/* Formula 3 */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>3. Overdue Days & Ageing Buckets</span>
            </div>
            <p className="text-slate-600 mb-2">
              Overdue days are computed strictly for unpaid or partially paid balances:
            </p>
            <div className="bg-white p-2.5 rounded border border-slate-200 font-mono text-amber-900 font-semibold text-2xs mb-2">
              Overdue Days = Max(0, Reporting Date − Invoice Due Date) [Only if Outstanding &gt; 0]
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Not Due:</strong> Invoice is fully paid or current date &le; Due Date.</li>
              <li><strong>1–30 Days:</strong> 1 to 30 days overdue past credit terms.</li>
              <li><strong>31–60 Days:</strong> 31 to 60 days overdue.</li>
              <li><strong>61–90 Days:</strong> 61 to 90 days overdue.</li>
              <li><strong>Above 90 Days:</strong> Severe delinquency &gt; 90 days past due.</li>
            </ul>
          </div>

          {/* Formula 4 */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>4. Indian Financial Year & Numbering Format</span>
            </div>
            <p className="text-slate-600">
              In accordance with Indian accounting standards:
              <br />
              • <strong>Financial Year:</strong> Starts April 1 and concludes March 31 of the succeeding year (e.g., April 2026 to March 2027 is <code>FY 2026-27</code>).
              <br />
              • <strong>Indian Number Format:</strong> Formatted with Lakhs (1,00,000) and Crores (1,00,00,000) grouping delimiters with the Rupee symbol (₹).
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
};
