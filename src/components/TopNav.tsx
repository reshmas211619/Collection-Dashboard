/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download, FileSpreadsheet, RefreshCw, HelpCircle, Trash2, CheckCircle2, Github } from 'lucide-react';

interface TopNavProps {
  lastUpdated: string;
  onDownloadExcel: () => void;
  onDownloadHtml: () => void;
  onOpenMethodology: () => void;
  onOpenGitHub: () => void;
  onResetData: () => void;
  isBalanced: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  lastUpdated,
  onDownloadExcel,
  onDownloadHtml,
  onOpenMethodology,
  onOpenGitHub,
  onResetData,
  isBalanced
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Zone */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-inner shrink-0">
              ₹
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-white whitespace-nowrap truncate">
                <span className="sm:hidden">PAN India Collections</span>
                <span className="hidden sm:inline">PAN India Collection Dashboard</span>
              </h1>
              <p className="text-xs text-slate-400 truncate hidden md:block">
                Finance Department · Corporate Accounts Receivable
              </p>
            </div>
          </div>

          {/* Status & Last Updated */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60">
              <CheckCircle2 className={`w-3.5 h-3.5 ${isBalanced ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{isBalanced ? 'Audit Reconciled' : 'Reconciliation Pending'}</span>
            </div>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Refreshed: <span className="font-mono text-slate-200">{lastUpdated || 'Just now'}</span></span>
          </div>

          {/* Action Zone */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={onOpenGitHub}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              title="Add / Sync to GitHub Repository"
            >
              <Github className="w-4 h-4 text-slate-300" />
              <span className="hidden md:inline">GitHub</span>
            </button>

            <button
              onClick={onOpenMethodology}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              title="Methodology & Definitions"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Methodology</span>
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-red-300 hover:text-red-200 hover:bg-red-950/40 rounded-lg transition-colors flex items-center gap-1.5"
              title="Reset & Clear Data"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">Reset</span>
            </button>

            <button
              onClick={onDownloadHtml}
              className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Download Self-Contained Standalone HTML file to run offline"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span className="hidden lg:inline">Standalone .HTML</span>
            </button>

            <button
              onClick={onDownloadExcel}
              className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Download Excel (3 Sheets)</span>
              <span className="sm:hidden">Excel (3 Sheets)</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
