/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Filter, Calendar, MapPin, Building2, User, Search, RotateCcw, ChevronDown } from 'lucide-react';
import { FilterState } from '../utils/reconciliation';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
  availableWeeks: string[];
  availableMonths: string[];
  availableFYs: string[];
  availableRegions: string[];
  availableStates: string[];
  availableCustomers: string[];
  availableSalespersons: string[];
  totalFilteredCount: number;
  totalRecordsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableWeeks,
  availableMonths,
  availableFYs,
  availableRegions,
  availableStates,
  availableCustomers,
  availableSalespersons,
  totalFilteredCount,
  totalRecordsCount
}) => {
  const isAnyFilterActive = 
    filters.financialYear !== 'All' ||
    filters.month !== 'All' ||
    filters.week !== 'All' ||
    filters.region !== 'All' ||
    filters.state !== 'All' ||
    filters.customer !== 'All' ||
    filters.salesperson !== 'All' ||
    filters.status !== 'All' ||
    filters.ageingBucket !== 'All' ||
    Boolean(filters.searchTerm);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs mb-6">
      
      {/* Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            PAN India Multi-Dimensional Filters
          </span>
          <span className="text-xs text-slate-400 font-normal">
            ({totalFilteredCount} of {totalRecordsCount} invoices in current view)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="text-slate-400 font-normal">Scope: </span>
            <span className="font-semibold text-slate-800">
              {filters.region === 'All' ? 'PAN India (Consolidated National)' : `${filters.region} Region`}
              {filters.state !== 'All' && ` · ${filters.state}`}
            </span>
          </div>

          {isAnyFilterActive && (
            <button
              onClick={onResetFilters}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Filter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        
        {/* Financial Year */}
        <div>
          <label className="block text-2xs font-semibold text-slate-500 mb-1">
            Financial Year (Apr-Mar)
          </label>
          <select
            value={filters.financialYear}
            onChange={e => onFilterChange('financialYear', e.target.value)}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Financial Years</option>
            {availableFYs.map(fy => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </select>
        </div>

        {/* Month */}
        <div>
          <label className="block text-2xs font-semibold text-slate-500 mb-1">
            Reporting Month
          </label>
          <select
            value={filters.month}
            onChange={e => onFilterChange('month', e.target.value)}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Weekly Reporting View */}
        <div>
          <label className="block text-2xs font-semibold text-slate-500 mb-1">
            Weekly Reporting View
          </label>
          <select
            value={filters.week}
            onChange={e => onFilterChange('week', e.target.value)}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Weeks (Consolidated)</option>
            {availableWeeks.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="block text-2xs font-semibold text-slate-500 mb-1">
            Geographic Region
          </label>
          <select
            value={filters.region}
            onChange={e => {
              onFilterChange('region', e.target.value);
              // reset state if region changed
              onFilterChange('state', 'All');
            }}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Regions (PAN India)</option>
            {availableRegions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-2xs font-semibold text-slate-500 mb-1">
            State
          </label>
          <select
            value={filters.state}
            onChange={e => onFilterChange('state', e.target.value)}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All States</option>
            {availableStates.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Customer */}
        <div>
          <label className="block text-2xs font-semibold text-slate-500 mb-1">
            Customer / Client
          </label>
          <select
            value={filters.customer}
            onChange={e => onFilterChange('customer', e.target.value)}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Customers</option>
            {availableCustomers.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Salesperson */}
        <div>
          <label className="block text-2xs font-semibold text-slate-500 mb-1">
            Salesperson / Rep
          </label>
          <select
            value={filters.salesperson}
            onChange={e => onFilterChange('salesperson', e.target.value)}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Salespeople</option>
            {availableSalespersons.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))}
          </select>
        </div>

        {/* Invoice Status */}
        <div>
          <label className="block text-2xs font-semibold text-slate-500 mb-1">
            Invoice Status
          </label>
          <select
            value={filters.status}
            onChange={e => onFilterChange('status', e.target.value)}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overcollected">Overcollected</option>
          </select>
        </div>

        {/* Ageing Bucket */}
        <div>
          <label className="block text-2xs font-semibold text-slate-500 mb-1">
            Ageing Bucket
          </label>
          <select
            value={filters.ageingBucket}
            onChange={e => onFilterChange('ageingBucket', e.target.value)}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-lg py-1.5 px-2 text-slate-800 focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Ageing Buckets</option>
            <option value="Not Due">Not Due</option>
            <option value="1–30 Days">1–30 Days</option>
            <option value="31–60 Days">31–60 Days</option>
            <option value="61–90 Days">61–90 Days</option>
            <option value="Above 90 Days">Above 90 Days</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-2xs font-semibold text-slate-500 mb-1">
            Search Invoices / UTR / Client
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={filters.searchTerm}
              onChange={e => onFilterChange('searchTerm', e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg py-1.5 pl-8 pr-2.5 text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
