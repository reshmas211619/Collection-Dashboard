/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ReconciledInvoice,
  ReconciledCollection,
  CustomerSummaryRecord,
  formatINR,
  formatPercent
} from '../utils/reconciliation';
import {
  FileSpreadsheet,
  Layers,
  Users,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Search,
  ExternalLink
} from 'lucide-react';

interface DataTablesProps {
  invoices: ReconciledInvoice[];
  collections: ReconciledCollection[];
  customerSummaries: CustomerSummaryRecord[];
}

export const DataTables: React.FC<DataTablesProps> = ({
  invoices,
  collections,
  customerSummaries
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'collections' | 'customers' | 'exceptions'>('invoices');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('invoiceDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter exceptions
  const unmatchedCollections = collections.filter(c => c.reconciliationStatus === 'Unmatched Invoice');
  const unpaidInvoices = invoices.filter(i => i.invoiceStatus === 'Unpaid');
  const overcollectedInvoices = invoices.filter(i => i.invoiceStatus === 'Overcollected');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNo.toLowerCase().includes(q) ||
      inv.customer.toLowerCase().includes(q) ||
      inv.salesperson.toLowerCase().includes(q) ||
      inv.state.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    let aVal: any = (a as any)[sortField];
    let bVal: any = (b as any)[sortField];
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? (aVal - bVal) : (bVal - aVal);
  });

  // Filter collections
  const filteredCollections = collections.filter(coll => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      coll.invoiceNo.toLowerCase().includes(q) ||
      coll.customer.toLowerCase().includes(q) ||
      coll.paymentReference.toLowerCase().includes(q) ||
      coll.bank.toLowerCase().includes(q)
    );
  });

  // Filter customer summaries
  const filteredCustomers = customerSummaries.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.customer.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden mb-12">
      
      {/* Table Navigation Header */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'invoices'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Sheet 1: Invoice Master ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('collections')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'collections'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sheet 2: Collection Details ({collections.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'customers'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sheet 3: Customer Summary ({customerSummaries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('exceptions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'exceptions'
                ? 'bg-white text-red-900 shadow-2xs border border-red-200'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span>Exceptions ({unmatchedCollections.length + overcollectedInvoices.length})</span>
          </button>
        </div>

        {/* Quick Filter Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search within this sheet..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-lg py-1.5 pl-8 pr-2.5 text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* TAB 1: INVOICE MASTER */}
      {activeTab === 'invoices' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('invoiceNo')}>
                  <div className="flex items-center gap-1">
                    <span>Invoice No</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('customer')}>
                  <div className="flex items-center gap-1">
                    <span>Customer</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Region / State</th>
                <th className="py-2.5 px-3">Salesperson</th>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('invoiceDate')}>
                  <div className="flex items-center gap-1">
                    <span>Invoice Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('dueDate')}>
                  <div className="flex items-center gap-1">
                    <span>Due Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('invoiceAmount')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Invoice Amt</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('collectionAmount')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Collection</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('outstandingAmount')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Outstanding</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Collection %</th>
                <th className="py-2.5 px-3 text-center">Overdue Days</th>
                <th className="py-2.5 px-3 text-center">Ageing Bucket</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(inv => {
                const isExpanded = expandedInvoice === inv.invoiceNo;
                return (
                  <React.Fragment key={inv.invoiceNo}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-2 text-center">
                        {inv.collections.length > 0 ? (
                          <button
                            onClick={() => setExpandedInvoice(isExpanded ? null : inv.invoiceNo)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            title="Expand matched collection transactions"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        ) : (
                          <span className="w-3.5 h-3.5 inline-block text-slate-300">·</span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {inv.customer}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {inv.region} · {inv.state}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {inv.salesperson}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">
                        {inv.dueDate}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-800">
                        {formatINR(inv.invoiceAmount)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700 font-medium">
                        {formatINR(inv.collectionAmount)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-red-700 font-semibold">
                        {formatINR(inv.outstandingAmount)}
                      </td>
                      <td className="py-2 px-3 text-center font-mono">
                        {inv.collectionPercentage.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-center font-mono">
                        {inv.overdueDays > 0 ? (
                          <span className="text-red-600 font-semibold">{inv.overdueDays}d</span>
                        ) : (
                          <span className="text-slate-400">0d</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-2xs font-semibold ${
                          inv.ageingBucket === 'Above 90 Days'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : inv.ageingBucket === '61–90 Days'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : inv.ageingBucket === '31–60 Days'
                                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                : inv.ageingBucket === '1–30 Days'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {inv.ageingBucket}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-2xs font-semibold ${
                          inv.invoiceStatus === 'Fully Paid'
                            ? 'bg-emerald-600 text-white'
                            : inv.invoiceStatus === 'Partially Paid'
                              ? 'bg-amber-500 text-white'
                              : inv.invoiceStatus === 'Overcollected'
                                ? 'bg-purple-600 text-white'
                                : 'bg-red-600 text-white'
                        }`}>
                          {inv.invoiceStatus}
                        </span>
                      </td>
                    </tr>

                    {/* Sub-row: Matched Collection Details */}
                    {isExpanded && inv.collections.length > 0 && (
                      <tr className="bg-slate-50/90 border-y border-slate-200">
                        <td colSpan={14} className="py-3 px-8">
                          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                            <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider block mb-2">
                              Matched Collection Transactions for {inv.invoiceNo} ({inv.collections.length} Tranches)
                            </span>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-2xs border-collapse">
                                <thead className="bg-slate-100 text-slate-600 font-semibold">
                                  <tr>
                                    <th className="py-1 px-2">UTR / Payment Ref</th>
                                    <th className="py-1 px-2">Collection Date</th>
                                    <th className="py-1 px-2 text-right">Amount (₹)</th>
                                    <th className="py-1 px-2">Mode</th>
                                    <th className="py-1 px-2">Bank</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {inv.collections.map((c, idx) => (
                                    <tr key={idx}>
                                      <td className="py-1.5 px-2 font-mono font-medium text-slate-800">{c.paymentReference}</td>
                                      <td className="py-1.5 px-2 font-mono text-slate-600">{c.collectionDate}</td>
                                      <td className="py-1.5 px-2 text-right font-mono font-semibold text-emerald-700">{formatINR(c.collectionAmount)}</td>
                                      <td className="py-1.5 px-2 text-slate-600">{c.paymentMode}</td>
                                      <td className="py-1.5 px-2 text-slate-600">{c.bank}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: COLLECTION DETAILS */}
      {activeTab === 'collections' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Collection Date</th>
                <th className="py-2.5 px-3 text-right">Collection Amount</th>
                <th className="py-2.5 px-3">Payment Reference (UTR)</th>
                <th className="py-2.5 px-3">Payment Mode</th>
                <th className="py-2.5 px-3">Bank</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3 text-center">Reconciliation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCollections.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-mono font-semibold text-slate-800">{c.invoiceNo}</td>
                  <td className="py-2 px-3 font-medium text-slate-900">{c.customer}</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{c.collectionDate}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700 font-bold">{formatINR(c.collectionAmount)}</td>
                  <td className="py-2 px-3 font-mono text-slate-700">{c.paymentReference}</td>
                  <td className="py-2 px-3 text-slate-600">{c.paymentMode}</td>
                  <td className="py-2 px-3 text-slate-600">{c.bank}</td>
                  <td className="py-2 px-3 text-slate-600">{c.region}</td>
                  <td className="py-2 px-3 text-slate-600">{c.state}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-2xs font-semibold ${
                      c.reconciliationStatus === 'Matched'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : c.reconciliationStatus === 'Partial Match'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : c.reconciliationStatus === 'Overcollected'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {c.reconciliationStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: CUSTOMER SUMMARY */}
      {activeTab === 'customers' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Region</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3 text-right">Total Billing</th>
                <th className="py-2.5 px-3 text-right">Total Collection</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3 text-center">Collection %</th>
                <th className="py-2.5 px-3 text-right">Overdue Amt</th>
                <th className="py-2.5 px-3 text-center">Avg Delay</th>
                <th className="py-2.5 px-3">Last Collection</th>
                <th className="py-2.5 px-3 text-center">Ageing</th>
                <th className="py-2.5 px-3 text-center">Risk Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(cust => (
                <tr key={cust.customer} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-semibold text-slate-900">{cust.customer}</td>
                  <td className="py-2 px-3 text-slate-600">{cust.region}</td>
                  <td className="py-2 px-3 text-slate-600">{cust.state}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">{formatINR(cust.totalBilling)}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700 font-medium">{formatINR(cust.totalCollection)}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-red-700 font-bold">{formatINR(cust.totalOutstanding)}</td>
                  <td className="py-2 px-3 text-center font-mono">{cust.collectionPercentage.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-red-600">{formatINR(cust.overdueOutstanding)}</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-600">{cust.averagePaymentDelay}d</td>
                  <td className="py-2 px-3 font-mono text-slate-600">{cust.lastCollectionDate}</td>
                  <td className="py-2 px-3 text-center">
                    <span className="text-2xs font-medium text-slate-700">{cust.ageingBucket}</span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-2xs font-semibold ${
                      cust.customerRiskCategory === 'High Risk'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : cust.customerRiskCategory === 'Medium Risk'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {cust.customerRiskCategory}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: RECONCILIATION EXCEPTIONS */}
      {activeTab === 'exceptions' && (
        <div className="p-6 space-y-6">
          
          {/* Unmatched Collections */}
          <div>
            <h4 className="text-sm font-bold text-red-700 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Unmatched Collections Received (Unknown Invoices: {unmatchedCollections.length})</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Payments received in bank that could not be reconciled against any invoice in the Billing Master.
            </p>

            {unmatchedCollections.length === 0 ? (
              <p className="text-xs text-emerald-600 font-medium">No unmatched collections. All payments reconciled.</p>
            ) : (
              <div className="border border-red-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-red-50 text-red-800 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Unmatched Invoice No</th>
                      <th className="py-2 px-3">Remitter / Customer</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                      <th className="py-2 px-3">Payment Ref</th>
                      <th className="py-2 px-3">Bank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100">
                    {unmatchedCollections.map(c => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-mono font-bold text-red-700">{c.invoiceNo}</td>
                        <td className="py-2 px-3 text-slate-800">{c.customer}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{c.collectionDate}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-red-700">{formatINR(c.collectionAmount)}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{c.paymentReference}</td>
                        <td className="py-2 px-3 text-slate-600">{c.bank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Over-collected Invoices */}
          <div>
            <h4 className="text-sm font-bold text-purple-800 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-purple-600" />
              <span>Overcollected Invoices ({overcollectedInvoices.length})</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Invoices where collection receipts exceed the billed amount (excess credit / advance payment).
            </p>

            {overcollectedInvoices.length === 0 ? (
              <p className="text-xs text-slate-500">No overcollected invoices.</p>
            ) : (
              <div className="border border-purple-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-purple-50 text-purple-900 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Invoice No</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3 text-right">Billed Amount</th>
                      <th className="py-2 px-3 text-right">Collected Amount</th>
                      <th className="py-2 px-3 text-right">Excess Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {overcollectedInvoices.map(inv => (
                      <tr key={inv.invoiceNo}>
                        <td className="py-2 px-3 font-mono font-bold text-purple-800">{inv.invoiceNo}</td>
                        <td className="py-2 px-3 text-slate-800">{inv.customer}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatINR(inv.invoiceAmount)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatINR(inv.collectionAmount)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-purple-700">
                          +{formatINR(inv.collectionAmount - inv.invoiceAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
