/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, AlertCircle, Download, CheckCircle, Filter } from 'lucide-react';
import { ValidationError } from '../utils/reconciliation';

interface ValidationErrorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ValidationError[];
  onDownloadReport: () => void;
}

export const ValidationErrorsModal: React.FC<ValidationErrorsModalProps> = ({
  isOpen,
  onClose,
  errors,
  onDownloadReport
}) => {
  const [filterFile, setFilterFile] = useState<'all' | 'billing' | 'collection'>('all');

  if (!isOpen) return null;

  const filteredErrors = errors.filter(e => {
    if (filterFile === 'all') return true;
    return e.file === filterFile;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Data Validation & Integrity Report
              </h3>
              <p className="text-xs text-slate-500">
                {errors.length} total validation issues flagged across uploaded files
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadReport}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Error Report (.xlsx)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Filter by File:</span>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              <button
                onClick={() => setFilterFile('all')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  filterFile === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({errors.length})
              </button>
              <button
                onClick={() => setFilterFile('billing')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  filterFile === 'billing' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Billing ({errors.filter(e => e.file === 'billing').length})
              </button>
              <button
                onClick={() => setFilterFile('collection')}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  filterFile === 'collection' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Collection ({errors.filter(e => e.file === 'collection').length})
              </button>
            </div>
          </div>

          <div className="text-slate-500">
            Showing {filteredErrors.length} of {errors.length} issues
          </div>
        </div>

        {/* Errors Table */}
        <div className="overflow-y-auto flex-1 p-6">
          {filteredErrors.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">No Validation Errors</p>
              <p className="text-xs text-slate-500">All records meet business and formatting validation rules.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">File</th>
                    <th className="py-2.5 px-3">Row #</th>
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Erroneous Value</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Validation Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredErrors.map((err, i) => {
                    const isBlank = err.value === '' || err.value === null || err.value === undefined;
                    return (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-700">
                          {err.file === 'billing' ? 'Customer Billing' : 'Collection File'}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                          Row {err.row}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {err.field}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {isBlank ? (
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-300 font-semibold text-2xs">
                              [BLANK MANDATORY FIELD]
                            </span>
                          ) : (
                            <span className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              {String(err.value)}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-2xs font-semibold ${
                            err.severity === 'error'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {err.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {err.message}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>
            Invalid rows are segregated and omitted from dashboard calculations until corrected.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
