/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IndianRupee, TrendingUp, AlertOctagon, Target, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatINR, formatPercent } from '../utils/reconciliation';

interface KpiCardsProps {
  totalBilling: number;
  totalCollection: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionEfficiency: number;
  invoiceCount: number;
  collectionCount: number;
  overdueCount: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalBilling,
  totalCollection,
  totalOutstanding,
  totalOverdue,
  collectionEfficiency,
  invoiceCount,
  collectionCount,
  overdueCount
}) => {
  // Collection Target (default 85%, editable by finance team)
  const [targetEfficiency, setTargetEfficiency] = useState<number>(85);
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);

  const targetDiff = collectionEfficiency - targetEfficiency;
  const isTargetMet = targetDiff >= 0;

  // Audit Reconciliation Check: Billing - Collection == Outstanding
  const calculatedOutstanding = totalBilling - totalCollection;
  const auditDiff = Math.abs(calculatedOutstanding - totalOutstanding);
  const isAuditBalanced = auditDiff < 1;

  return (
    <div className="space-y-4 mb-6">
      
      {/* 5 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Total Billing */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-600">
              Total Billing (Invoiced)
            </span>
            <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-extrabold text-slate-900 font-mono tabular-nums tracking-tight">
            {formatINR(totalBilling, { short: true })}
          </div>
          <div className="flex items-center justify-between text-2xs text-slate-500 mt-2 pt-2 border-t border-slate-100 font-mono">
            <span>Exact: {formatINR(totalBilling)}</span>
            <span>{invoiceCount} Invoices</span>
          </div>
        </div>

        {/* KPI 2: Total Collection */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-emerald-700">
              Total Collection (Realized)
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-extrabold text-emerald-700 font-mono tabular-nums tracking-tight">
            {formatINR(totalCollection, { short: true })}
          </div>
          <div className="flex items-center justify-between text-2xs text-slate-500 mt-2 pt-2 border-t border-slate-100 font-mono">
            <span>Exact: {formatINR(totalCollection)}</span>
            <span>{collectionCount} Receipts</span>
          </div>
        </div>

        {/* KPI 3: Total Outstanding */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-amber-700">
              Total Outstanding
            </span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-extrabold text-amber-700 font-mono tabular-nums tracking-tight">
            {formatINR(totalOutstanding, { short: true })}
          </div>
          <div className="flex items-center justify-between text-2xs text-slate-500 mt-2 pt-2 border-t border-slate-100 font-mono">
            <span className="truncate pr-1">Exact: {formatINR(totalOutstanding)}</span>
            <span className="shrink-0">{totalBilling > 0 ? `${((totalOutstanding / totalBilling) * 100).toFixed(1)}%` : '0%'}</span>
          </div>
        </div>

        {/* KPI 4: Collection Efficiency % vs Target */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <div className="flex items-center gap-1">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-700">
                Collection Efficiency
              </span>
              <button
                onClick={() => setIsEditingTarget(!isEditingTarget)}
                className="text-3xs text-blue-600 hover:underline"
                title="Adjust monthly target"
              >
                (Edit Target)
              </button>
            </div>
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl lg:text-2xl font-extrabold text-slate-900 font-mono tabular-nums tracking-tight">
              {formatPercent(collectionEfficiency)}
            </span>
            <span className={`text-2xs font-semibold ${isTargetMet ? 'text-emerald-600' : 'text-red-600'}`}>
              {isTargetMet ? `+${targetDiff.toFixed(1)}%` : `${targetDiff.toFixed(1)}%`} vs target
            </span>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100">
            {isEditingTarget ? (
              <div className="flex items-center gap-2 text-2xs">
                <span className="text-slate-500">Target:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={targetEfficiency}
                  onChange={e => setTargetEfficiency(Number(e.target.value))}
                  className="w-14 px-1 py-0.5 border border-slate-300 rounded font-mono text-center"
                />
                <button
                  onClick={() => setIsEditingTarget(false)}
                  className="text-blue-600 font-semibold"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isTargetMet ? 'bg-emerald-600' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, collectionEfficiency))}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* KPI 5: Overdue Outstanding */}
        <div className={`bg-white rounded-xl border p-4 shadow-xs ${
          totalOverdue > 0 ? 'border-red-200 bg-red-50/10' : 'border-slate-200/90'
        }`}>
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-2xs font-bold uppercase tracking-wider text-red-700">
              Overdue Outstanding
            </span>
            <div className="w-6 h-6 rounded-md bg-red-50 text-red-600 flex items-center justify-center">
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-extrabold text-red-700 font-mono tabular-nums tracking-tight">
            {formatINR(totalOverdue, { short: true })}
          </div>
          <div className="flex items-center justify-between text-2xs text-slate-500 mt-2 pt-2 border-t border-slate-100 font-mono">
            <span>Exact: {formatINR(totalOverdue)}</span>
            <span className="text-red-700 font-semibold">{overdueCount} Overdue Invoices</span>
          </div>
        </div>

      </div>

      {/* Corporate Reconciliation Balance Audit Strip */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            isAuditBalanced ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">Reconciliation Audit Balance: </span>
            <span className="text-slate-300 font-mono">
              [Billing: {formatINR(totalBilling)}] − [Collections: {formatINR(totalCollection)}] = [Outstanding: {formatINR(totalOutstanding)}]
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto text-2xs font-mono">
          <span className="text-slate-400">Audit Discrepancy:</span>
          <span className={`px-2 py-0.5 rounded font-bold ${
            isAuditBalanced ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-red-950 text-red-300 border border-red-700'
          }`}>
            ₹{auditDiff.toFixed(2)} {isAuditBalanced ? '(Balanced 0.00)' : '(Mismatch Flagged)'}
          </span>
        </div>
      </div>

    </div>
  );
};
