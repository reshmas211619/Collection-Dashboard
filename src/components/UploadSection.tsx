/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Download, Sparkles, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { ValidationError } from '../utils/reconciliation';

interface UploadSectionProps {
  billingFileName: string;
  billingRecordsCount: number;
  collectionFileName: string;
  collectionRecordsCount: number;
  validationErrors: ValidationError[];
  onUploadBilling: (file: File) => void;
  onUploadCollection: (file: File) => void;
  onLoadSampleData: () => void;
  onOpenColumnMapper: (type: 'billing' | 'collection') => void;
  onOpenValidationErrors: () => void;
  onDownloadSampleBilling: () => void;
  onDownloadSampleCollection: () => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  billingFileName,
  billingRecordsCount,
  collectionFileName,
  collectionRecordsCount,
  validationErrors,
  onUploadBilling,
  onUploadCollection,
  onLoadSampleData,
  onOpenColumnMapper,
  onOpenValidationErrors,
  onDownloadSampleBilling,
  onDownloadSampleCollection
}) => {
  const billingInputRef = useRef<HTMLInputElement>(null);
  const collectionInputRef = useRef<HTMLInputElement>(null);

  const billingErrors = validationErrors.filter(e => e.file === 'billing');
  const collectionErrors = validationErrors.filter(e => e.file === 'collection');

  const handleBillingFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadBilling(e.target.files[0]);
    }
  };

  const handleCollectionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadCollection(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Data Ingestion & File Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload Customer Billing and Collection files (.xlsx, .xls, .csv) to automatically reconcile invoices.
          </p>
        </div>

        {/* Quick Sample Data Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadSampleData}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Load Sample PAN India Data</span>
          </button>
        </div>
      </div>

      {/* Two Upload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        
        {/* Upload Card A: Billing Data */}
        <div className={`p-4 rounded-lg border transition-all ${
          billingErrors.length > 0 
            ? 'border-red-300 bg-red-50/20' 
            : billingRecordsCount > 0 
              ? 'border-emerald-200 bg-emerald-50/10' 
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                billingRecordsCount > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  A. Customer Billing Data
                </h3>
                <p className="text-xs text-slate-500">Invoice-level billing master</p>
              </div>
            </div>

            <button
              onClick={onDownloadSampleBilling}
              className="text-xs text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
              title="Download Sample Billing Excel Template"
            >
              <Download className="w-3 h-3 text-slate-400" />
              <span>Sample Template</span>
            </button>
          </div>

          <div className="mt-3.5 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="font-medium text-slate-700 block truncate">
                {billingFileName || 'No file selected yet'}
              </span>
              <span className="text-slate-500 font-mono">
                {billingRecordsCount > 0 ? `${billingRecordsCount} valid invoice records` : 'Awaiting upload (.xlsx, .csv)'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {billingRecordsCount > 0 && (
                <button
                  onClick={() => onOpenColumnMapper('billing')}
                  className="px-2 py-1 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center gap-1 shadow-2xs"
                  title="Configure Column Mapping"
                >
                  <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                  <span>Map</span>
                </button>
              )}
              <input
                ref={billingInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleBillingFile}
              />
              <button
                onClick={() => billingInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{billingRecordsCount > 0 ? 'Replace' : 'Upload'}</span>
              </button>
            </div>
          </div>

          {billingErrors.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-red-200 flex items-center justify-between text-xs text-red-700">
              <span className="flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                {billingErrors.length} validation errors flagged in billing data
              </span>
              <button
                onClick={onOpenValidationErrors}
                className="text-red-800 underline font-semibold hover:text-red-900"
              >
                View Details
              </button>
            </div>
          )}
        </div>

        {/* Upload Card B: Collection File */}
        <div className={`p-4 rounded-lg border transition-all ${
          collectionErrors.length > 0 
            ? 'border-red-300 bg-red-50/20' 
            : collectionRecordsCount > 0 
              ? 'border-emerald-200 bg-emerald-50/10' 
              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                collectionRecordsCount > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  B. Collection File
                </h3>
                <p className="text-xs text-slate-500">Bank payments & receipts data</p>
              </div>
            </div>

            <button
              onClick={onDownloadSampleCollection}
              className="text-xs text-slate-600 hover:text-slate-900 hover:underline flex items-center gap-1"
              title="Download Sample Collection Excel Template"
            >
              <Download className="w-3 h-3 text-slate-400" />
              <span>Sample Template</span>
            </button>
          </div>

          <div className="mt-3.5 flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="font-medium text-slate-700 block truncate">
                {collectionFileName || 'No file selected yet'}
              </span>
              <span className="text-slate-500 font-mono">
                {collectionRecordsCount > 0 ? `${collectionRecordsCount} valid collection transactions` : 'Awaiting upload (.xlsx, .csv)'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {collectionRecordsCount > 0 && (
                <button
                  onClick={() => onOpenColumnMapper('collection')}
                  className="px-2 py-1 text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded flex items-center gap-1 shadow-2xs"
                  title="Configure Column Mapping"
                >
                  <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                  <span>Map</span>
                </button>
              )}
              <input
                ref={collectionInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleCollectionFile}
              />
              <button
                onClick={() => collectionInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{collectionRecordsCount > 0 ? 'Replace' : 'Upload'}</span>
              </button>
            </div>
          </div>

          {collectionErrors.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-red-200 flex items-center justify-between text-xs text-red-700">
              <span className="flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                {collectionErrors.length} validation errors flagged in collection file
              </span>
              <button
                onClick={onOpenValidationErrors}
                className="text-red-800 underline font-semibold hover:text-red-900"
              >
                View Details
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Global Validation Warning Banner if errors exist */}
      {validationErrors.length > 0 && (
        <div className="mt-3.5 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>Data Validation Notice:</strong> {validationErrors.length} erroneous or duplicate records were flagged and prevented from silently corrupting reconciliation figures.
            </span>
          </div>
          <button
            onClick={onOpenValidationErrors}
            className="px-2.5 py-1 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded transition-colors self-start sm:self-auto shrink-0"
          >
            Review & Export Error Report
          </button>
        </div>
      )}
    </div>
  );
};
