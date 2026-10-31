/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  InvoiceRecord,
  CollectionRecord,
  ValidationError,
  FilterState,
  validateBillingData,
  validateCollectionData,
  reconcileData,
  getSamplePANIndiaData,
  getIndianFinancialYear,
  getWeekString
} from './utils/reconciliation';
import {
  exportReconciliationWorkbook,
  exportValidationErrorReport,
  downloadSampleBillingFile,
  downloadSampleCollectionFile
} from './utils/excelExport';

import { TopNav } from './components/TopNav';
import { UploadSection } from './components/UploadSection';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { ChartsSection } from './components/ChartsSection';
import { DataTables } from './components/DataTables';
import { ColumnMapperModal } from './components/ColumnMapperModal';
import { ValidationErrorsModal } from './components/ValidationErrorsModal';
import { MethodologyModal } from './components/MethodologyModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { GitHubModal } from './components/GitHubModal';

const STORAGE_KEY_INVOICES = 'pan_india_billing_master_v1';
const STORAGE_KEY_COLLECTIONS = 'pan_india_collection_txns_v1';
const STORAGE_KEY_LAST_UPDATE = 'pan_india_last_update_v1';
const STORAGE_KEY_FILE_NAMES = 'pan_india_file_names_v1';

export default function App() {
  // 1. Core Data State
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [billingFileName, setBillingFileName] = useState<string>('');
  const [collectionFileName, setCollectionFileName] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // 2. Modals State
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isValidationsModalOpen, setIsValidationsModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [columnMapperState, setColumnMapperState] = useState<{
    isOpen: boolean;
    fileType: 'billing' | 'collection';
    sourceColumns: string[];
    initialMapping: Record<string, string>;
  }>({
    isOpen: false,
    fileType: 'billing',
    sourceColumns: [],
    initialMapping: {}
  });

  // Raw uploaded objects saved for column remapping
  const [rawBillingRows, setRawBillingRows] = useState<any[]>([]);
  const [rawCollectionRows, setRawCollectionRows] = useState<any[]>([]);

  // 3. Multi-dimensional Filters State
  const [filters, setFilters] = useState<FilterState>({
    financialYear: 'All',
    month: 'All',
    week: 'All',
    region: 'All',
    state: 'All',
    customer: 'All',
    salesperson: 'All',
    status: 'All',
    ageingBucket: 'All',
    searchTerm: ''
  });

  // Load from localStorage or initialize with sample data on first launch
  useEffect(() => {
    try {
      const storedInvoices = localStorage.getItem(STORAGE_KEY_INVOICES);
      const storedCollections = localStorage.getItem(STORAGE_KEY_COLLECTIONS);
      const storedLastUpdate = localStorage.getItem(STORAGE_KEY_LAST_UPDATE);
      const storedFileNames = localStorage.getItem(STORAGE_KEY_FILE_NAMES);

      if (storedInvoices && storedCollections) {
        setInvoices(JSON.parse(storedInvoices));
        setCollections(JSON.parse(storedCollections));
        if (storedLastUpdate) setLastUpdated(storedLastUpdate);
        if (storedFileNames) {
          const names = JSON.parse(storedFileNames);
          setBillingFileName(names.billing || '');
          setCollectionFileName(names.collection || '');
        }
      } else {
        // First time load: populate comprehensive PAN India demo data
        loadComprehensiveSampleData();
      }
    } catch (e) {
      console.error('Error loading stored dashboard data:', e);
      loadComprehensiveSampleData();
    }
  }, []);

  // Save to localStorage whenever core data changes
  const persistData = (newInvoices: InvoiceRecord[], newCollections: CollectionRecord[], bName?: string, cName?: string) => {
    try {
      const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
      localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(newInvoices));
      localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(newCollections));
      localStorage.setItem(STORAGE_KEY_LAST_UPDATE, now);
      localStorage.setItem(STORAGE_KEY_FILE_NAMES, JSON.stringify({
        billing: bName ?? billingFileName,
        collection: cName ?? collectionFileName
      }));
      setLastUpdated(now);
    } catch (e) {
      console.warn('Storage quota exceeded or unavailable:', e);
    }
  };

  // Handler: Load Sample PAN India Data
  const loadComprehensiveSampleData = () => {
    const sample = getSamplePANIndiaData();
    setInvoices(sample.invoices);
    setCollections(sample.collections);
    setBillingFileName('PAN_India_Corporate_Invoices_Sample.xlsx');
    setCollectionFileName('PAN_India_Bank_Receipts_Sample.xlsx');
    setValidationErrors([]);
    persistData(sample.invoices, sample.collections, 'PAN_India_Corporate_Invoices_Sample.xlsx', 'PAN_India_Bank_Receipts_Sample.xlsx');
  };

  // Handler: Upload Billing Data
  const handleUploadBilling = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          alert('Uploaded Customer Billing file contains no records.');
          return;
        }

        setRawBillingRows(jsonData);
        const { valid, errors } = validateBillingData(jsonData);
        setInvoices(valid);
        setBillingFileName(file.name);
        
        // Combine with existing collection errors
        setValidationErrors(prev => [...prev.filter(x => x.file !== 'billing'), ...errors]);
        persistData(valid, collections, file.name, undefined);

        if (errors.length > 0) {
          setIsValidationsModalOpen(true);
        }
      } catch (err) {
        console.error('Error reading billing file:', err);
        alert('Failed to parse the billing file. Please ensure it is a valid .xlsx, .xls, or .csv spreadsheet.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handler: Upload Collection Data
  const handleUploadCollection = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          alert('Uploaded Collection file contains no records.');
          return;
        }

        setRawCollectionRows(jsonData);
        const { valid, errors } = validateCollectionData(jsonData);
        setCollections(valid);
        setCollectionFileName(file.name);

        setValidationErrors(prev => [...prev.filter(x => x.file !== 'collection'), ...errors]);
        persistData(invoices, valid, undefined, file.name);

        if (errors.length > 0) {
          setIsValidationsModalOpen(true);
        }
      } catch (err) {
        console.error('Error reading collection file:', err);
        alert('Failed to parse the collection file. Please ensure it is a valid .xlsx, .xls, or .csv spreadsheet.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Column Mapper trigger
  const handleOpenColumnMapper = (type: 'billing' | 'collection') => {
    const rows = type === 'billing' ? rawBillingRows : rawCollectionRows;
    const sourceCols = rows.length > 0 ? Object.keys(rows[0]) : [];
    setColumnMapperState({
      isOpen: true,
      fileType: type,
      sourceColumns: sourceCols,
      initialMapping: {}
    });
  };

  const handleApplyMapping = (mapping: Record<string, string>) => {
    if (columnMapperState.fileType === 'billing') {
      const mappedRows = rawBillingRows.map(row => {
        const mapped: any = {};
        Object.entries(mapping).forEach(([targetKey, srcCol]) => {
          if (srcCol) mapped[targetKey] = row[srcCol];
        });
        return mapped;
      });
      const { valid, errors } = validateBillingData(mappedRows);
      setInvoices(valid);
      setValidationErrors(prev => [...prev.filter(x => x.file !== 'billing'), ...errors]);
      persistData(valid, collections);
    } else {
      const mappedRows = rawCollectionRows.map(row => {
        const mapped: any = {};
        Object.entries(mapping).forEach(([targetKey, srcCol]) => {
          if (srcCol) mapped[targetKey] = row[srcCol];
        });
        return mapped;
      });
      const { valid, errors } = validateCollectionData(mappedRows);
      setCollections(valid);
      setValidationErrors(prev => [...prev.filter(x => x.file !== 'collection'), ...errors]);
      persistData(invoices, valid);
    }
  };

  // Reset all data
  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY_INVOICES);
    localStorage.removeItem(STORAGE_KEY_COLLECTIONS);
    localStorage.removeItem(STORAGE_KEY_LAST_UPDATE);
    localStorage.removeItem(STORAGE_KEY_FILE_NAMES);
    setInvoices([]);
    setCollections([]);
    setBillingFileName('');
    setCollectionFileName('');
    setValidationErrors([]);
    setLastUpdated('Cleared');
  };

  // 4. Derive Dynamic Filter Choices from active data
  const availableFYs = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(inv => set.add(getIndianFinancialYear(inv.invoiceDate)));
    return Array.from(set).sort();
  }, [invoices]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(inv => {
      if (inv.invoiceDate) set.add(inv.invoiceDate.slice(0, 7));
    });
    return Array.from(set).sort();
  }, [invoices]);

  const availableWeeks = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(inv => {
      const w = getWeekString(inv.invoiceDate);
      if (w) set.add(w);
    });
    return Array.from(set).sort();
  }, [invoices]);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(inv => {
      if (inv.region) set.add(inv.region);
    });
    return Array.from(set).sort();
  }, [invoices]);

  const availableStates = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(inv => {
      if (filters.region === 'All' || inv.region === filters.region) {
        if (inv.state) set.add(inv.state);
      }
    });
    return Array.from(set).sort();
  }, [invoices, filters.region]);

  const availableCustomers = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(inv => {
      if (inv.customer) set.add(inv.customer);
    });
    return Array.from(set).sort();
  }, [invoices]);

  const availableSalespersons = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach(inv => {
      if (inv.salesperson) set.add(inv.salesperson);
    });
    return Array.from(set).sort();
  }, [invoices]);

  // 5. Apply Multi-dimensional Filters
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (filters.financialYear !== 'All' && getIndianFinancialYear(inv.invoiceDate) !== filters.financialYear) return false;
      if (filters.month !== 'All' && !inv.invoiceDate.startsWith(filters.month)) return false;
      if (filters.week !== 'All' && getWeekString(inv.invoiceDate) !== filters.week) return false;
      if (filters.region !== 'All' && inv.region !== filters.region) return false;
      if (filters.state !== 'All' && inv.state !== filters.state) return false;
      if (filters.customer !== 'All' && inv.customer !== filters.customer) return false;
      if (filters.salesperson !== 'All' && inv.salesperson !== filters.salesperson) return false;
      if (filters.searchTerm) {
        const q = filters.searchTerm.toLowerCase();
        const matches = inv.invoiceNo.toLowerCase().includes(q) ||
          inv.customer.toLowerCase().includes(q) ||
          inv.state.toLowerCase().includes(q) ||
          inv.salesperson.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [invoices, filters]);

  // 6. Perform Reconciliation on the Filtered Dataset
  const reconciliation = useMemo(() => {
    const res = reconcileData(filteredInvoices, collections, '2026-10-31');

    // Post-filter by invoice status or ageing bucket if selected
    let postFilteredInvoices = res.reconciledInvoices;
    if (filters.status !== 'All') {
      postFilteredInvoices = postFilteredInvoices.filter(i => i.invoiceStatus === filters.status);
    }
    if (filters.ageingBucket !== 'All') {
      postFilteredInvoices = postFilteredInvoices.filter(i => i.ageingBucket === filters.ageingBucket);
    }

    return {
      ...res,
      reconciledInvoices: postFilteredInvoices
    };
  }, [filteredInvoices, collections, filters.status, filters.ageingBucket]);

  // Excel 3-sheet export
  const handleDownloadExcel = () => {
    exportReconciliationWorkbook(
      reconciliation.reconciledInvoices,
      reconciliation.reconciledCollections,
      reconciliation.customerSummaries,
      `PAN_India_Collection_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // Download Standalone Self-contained HTML file
  const handleDownloadHtml = () => {
    const link = document.createElement('a');
    link.href = '/PAN_India_Collection_Dashboard.html';
    link.download = 'PAN_India_Collection_Dashboard.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      
      {/* 1. Header Navigation */}
      <TopNav
        lastUpdated={lastUpdated}
        onDownloadExcel={handleDownloadExcel}
        onDownloadHtml={handleDownloadHtml}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
        onResetData={() => setIsResetModalOpen(true)}
        isBalanced={reconciliation.summary.reconciliationBalanceDiff < 1}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        
        {/* Component 1 & 2: Upload & Validation */}
        <UploadSection
          billingFileName={billingFileName}
          billingRecordsCount={invoices.length}
          collectionFileName={collectionFileName}
          collectionRecordsCount={collections.length}
          validationErrors={validationErrors}
          onUploadBilling={handleUploadBilling}
          onUploadCollection={handleUploadCollection}
          onLoadSampleData={loadComprehensiveSampleData}
          onOpenColumnMapper={handleOpenColumnMapper}
          onOpenValidationErrors={() => setIsValidationsModalOpen(true)}
          onDownloadSampleBilling={downloadSampleBillingFile}
          onDownloadSampleCollection={downloadSampleCollectionFile}
        />

        {/* Component 3: Filters & Scope */}
        <FilterBar
          filters={filters}
          onFilterChange={(key, val) => setFilters(prev => ({ ...prev, [key]: val }))}
          onResetFilters={() => setFilters({
            financialYear: 'All',
            month: 'All',
            week: 'All',
            region: 'All',
            state: 'All',
            customer: 'All',
            salesperson: 'All',
            status: 'All',
            ageingBucket: 'All',
            searchTerm: ''
          })}
          availableWeeks={availableWeeks}
          availableMonths={availableMonths}
          availableFYs={availableFYs}
          availableRegions={availableRegions}
          availableStates={availableStates}
          availableCustomers={availableCustomers}
          availableSalespersons={availableSalespersons}
          totalFilteredCount={reconciliation.reconciledInvoices.length}
          totalRecordsCount={invoices.length}
        />

        {/* Component 4: KPI Cards */}
        <KpiCards
          totalBilling={reconciliation.summary.totalBillingAmount}
          totalCollection={reconciliation.summary.totalCollectionAmount}
          totalOutstanding={reconciliation.summary.totalOutstandingAmount}
          totalOverdue={reconciliation.summary.totalOverdueAmount}
          collectionEfficiency={reconciliation.summary.collectionEfficiency}
          invoiceCount={reconciliation.reconciledInvoices.length}
          collectionCount={reconciliation.summary.totalCollectionsCount}
          overdueCount={reconciliation.reconciledInvoices.filter(i => i.overdueDays > 0).length}
        />

        {/* Component 4: Charts & Deep Dive Analytics */}
        <ChartsSection
          invoices={reconciliation.reconciledInvoices}
          collections={reconciliation.reconciledCollections}
          customerSummaries={reconciliation.customerSummaries}
        />

        {/* Component 5: Tabular Data (3 Sheets + Exceptions) */}
        <DataTables
          invoices={reconciliation.reconciledInvoices}
          collections={reconciliation.reconciledCollections}
          customerSummaries={reconciliation.customerSummaries}
        />

      </main>

      {/* Modals */}
      <ValidationErrorsModal
        isOpen={isValidationsModalOpen}
        onClose={() => setIsValidationsModalOpen(false)}
        errors={validationErrors}
        onDownloadReport={() => exportValidationErrorReport(validationErrors)}
      />

      <ColumnMapperModal
        isOpen={columnMapperState.isOpen}
        onClose={() => setColumnMapperState(prev => ({ ...prev, isOpen: false }))}
        fileType={columnMapperState.fileType}
        sourceColumns={columnMapperState.sourceColumns}
        initialMapping={columnMapperState.initialMapping}
        onApplyMapping={handleApplyMapping}
      />

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetData}
      />

      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 PAN India Collection Dashboard · Corporate Finance & Accounts Receivable. Confidential.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Client-side Processing (Zero Server Transmission)</span>
            <span>·</span>
            <span>SheetJS XLSX v0.18</span>
            <span>·</span>
            <span>Chart.js v4.4</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
