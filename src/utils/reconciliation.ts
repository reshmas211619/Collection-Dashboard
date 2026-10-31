/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RawRow {
  [key: string]: any;
}

export interface InvoiceRecord {
  invoiceNo: string;
  customer: string;
  region: string;
  state: string;
  salesperson: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  invoiceAmount: number;
}

export interface CollectionRecord {
  id: string;
  invoiceNo: string;
  customer: string;
  collectionDate: string; // YYYY-MM-DD
  collectionAmount: number;
  paymentReference: string;
  paymentMode: string;
  bank: string;
  region: string;
  state: string;
}

export type AgeingBucket = 'Not Due' | '1–30 Days' | '31–60 Days' | '61–90 Days' | 'Above 90 Days';
export type InvoiceStatus = 'Fully Paid' | 'Partially Paid' | 'Unpaid' | 'Overcollected';
export type CustomerRisk = 'Low Risk' | 'Medium Risk' | 'High Risk';

export interface ReconciledInvoice extends InvoiceRecord {
  collectionAmount: number;
  outstandingAmount: number;
  collectionPercentage: number;
  overdueDays: number;
  ageingBucket: AgeingBucket;
  invoiceStatus: InvoiceStatus;
  collections: CollectionRecord[];
}

export interface ReconciledCollection extends CollectionRecord {
  reconciliationStatus: 'Matched' | 'Partial Match' | 'Unmatched Invoice' | 'Overcollected';
}

export interface CustomerSummaryRecord {
  customer: string;
  region: string;
  state: string;
  totalBilling: number;
  totalCollection: number;
  totalOutstanding: number;
  collectionPercentage: number;
  overdueOutstanding: number;
  averagePaymentDelay: number;
  lastCollectionDate: string;
  ageingBucket: AgeingBucket;
  customerRiskCategory: CustomerRisk;
}

export interface ValidationError {
  file: 'billing' | 'collection';
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface FilterState {
  financialYear: string;
  month: string;
  week: string;
  region: string;
  state: string;
  customer: string;
  salesperson: string;
  status: string;
  ageingBucket: string;
  searchTerm: string;
}

export interface ReconciliationSummary {
  totalInvoicesCount: number;
  totalCollectionsCount: number;
  totalBillingAmount: number;
  totalCollectionAmount: number;
  totalOutstandingAmount: number;
  totalOverdueAmount: number;
  collectionEfficiency: number;
  matchedCount: number;
  partialCount: number;
  unpaidCount: number;
  overcollectedCount: number;
  unmatchedCollectionsCount: number;
  unmatchedCollectionsAmount: number;
  reconciliationBalanceDiff: number; // should be 0: (Total Billing - Total Collection) - Total Outstanding
}

// Format number in Indian numbering system (Lakhs, Crores)
export function formatINR(val: number | null | undefined, options?: { short?: boolean; precision?: number }): string {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  const num = Number(val);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  if (options?.short) {
    if (absNum >= 10000000) {
      return `${isNegative ? '-' : ''}₹${(absNum / 10000000).toFixed(options.precision ?? 2)} Cr`;
    }
    if (absNum >= 100000) {
      return `${isNegative ? '-' : ''}₹${(absNum / 100000).toFixed(options.precision ?? 2)} L`;
    }
    if (absNum >= 1000) {
      return `${isNegative ? '-' : ''}₹${(absNum / 1000).toFixed(options.precision ?? 1)} K`;
    }
  }

  // Standard Indian formatting
  const parts = absNum.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const result = (decimalPart && decimalPart !== '00') ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  return `${isNegative ? '-' : ''}₹${result}`;
}

// Format simple percentage
export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${Number(val).toFixed(1)}%`;
}

// Parse dates leniently from Excel serial numbers or standard strings
export function parseDate(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'number') {
    // Excel serial date (origin 1899-12-30)
    const utc_days = Math.floor(val - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    if (!isNaN(date_info.getTime())) {
      return date_info.toISOString().split('T')[0];
    }
  }

  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return val.toISOString().split('T')[0];
    }
  }

  const str = String(val).trim();
  // Match common Indian formats: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    const d = new Date(`${year}-${month}-${day}T00:00:00Z`);
    if (!isNaN(d.getTime())) {
      return `${year}-${month}-${day}`;
    }
  }

  const isoMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const timestamp = Date.parse(str);
  if (!isNaN(timestamp)) {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  return null;
}

// Calculate days difference between two YYYY-MM-DD strings (date1 - date2)
export function daysDiff(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T00:00:00Z').getTime();
  const d2 = new Date(dateStr2 + 'T00:00:00Z').getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
}

// Determine Indian Financial Year (April 1 - March 31)
export function getIndianFinancialYear(dateStr: string): string {
  if (!dateStr) return 'Unknown FY';
  const parts = dateStr.split('-');
  if (parts.length < 3) return 'Unknown FY';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month)) return 'Unknown FY';

  if (month >= 4) {
    const nextYear = (year + 1).toString().slice(-2);
    return `FY ${year}-${nextYear}`;
  } else {
    const currYearShort = year.toString().slice(-2);
    return `FY ${year - 1}-${currYearShort}`;
  }
}

// Determine ISO Week string e.g. "2026-W43"
export function getWeekString(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(d.getTime())) return '';
  // Copy date so don't modify original
  const target = new Date(d.valueOf());
  const dayNr = (d.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${d.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Determine Ageing Bucket given overdue days and outstanding amount
export function determineAgeingBucket(overdueDays: number, outstandingAmount: number): AgeingBucket {
  if (outstandingAmount <= 0.01 || overdueDays <= 0) {
    return 'Not Due';
  }
  if (overdueDays <= 30) return '1–30 Days';
  if (overdueDays <= 60) return '31–60 Days';
  if (overdueDays <= 90) return '61–90 Days';
  return 'Above 90 Days';
}

// Determine Invoice Status
export function determineInvoiceStatus(invoiceAmount: number, collectionAmount: number): InvoiceStatus {
  const diff = invoiceAmount - collectionAmount;
  if (collectionAmount <= 0.001) return 'Unpaid';
  if (Math.abs(diff) < 0.01) return 'Fully Paid';
  if (diff > 0.01) return 'Partially Paid';
  return 'Overcollected';
}

// Validate Customer Billing Data
export function validateBillingData(rows: RawRow[]): { valid: InvoiceRecord[]; errors: ValidationError[] } {
  const valid: InvoiceRecord[] = [];
  const errors: ValidationError[] = [];
  const seenInvoices = new Map<string, number>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // considering header is row 1
    const invoiceNo = String(row['Invoice No'] ?? row['Invoice Number'] ?? row['invoice_no'] ?? row['InvoiceNo'] ?? '').trim();
    const customer = String(row['Customer'] ?? row['Customer Name'] ?? row['customer'] ?? row['Client'] ?? '').trim();
    const region = String(row['Region'] ?? row['Zone'] ?? row['region'] ?? 'North').trim() || 'North';
    const state = String(row['State'] ?? row['state'] ?? 'Delhi').trim() || 'Delhi';
    const salesperson = String(row['Salesperson'] ?? row['Sales Person'] ?? row['salesperson'] ?? row['Rep'] ?? 'Unassigned').trim();
    const rawInvDate = row['Invoice Date'] ?? row['invoice_date'] ?? row['Date'];
    const rawDueDate = row['Due Date'] ?? row['due_date'] ?? row['Payment Due'];
    const rawAmount = row['Invoice Amount'] ?? row['invoice_amount'] ?? row['Amount'] ?? row['Gross Amount'];

    let hasFatalError = false;

    // Rule 1: Invoice Number must not be blank
    if (!invoiceNo) {
      errors.push({
        file: 'billing',
        row: rowNum,
        field: 'Invoice No',
        value: invoiceNo,
        message: 'Invoice Number is mandatory and cannot be blank.',
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Rule 2: Customer Name must not be blank
    if (!customer) {
      errors.push({
        file: 'billing',
        row: rowNum,
        field: 'Customer',
        value: customer,
        message: 'Customer Name is mandatory and cannot be blank.',
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Rule 3: Invoice Date must be valid date
    const invoiceDate = parseDate(rawInvDate);
    if (!invoiceDate) {
      errors.push({
        file: 'billing',
        row: rowNum,
        field: 'Invoice Date',
        value: rawInvDate,
        message: 'Invoice Date is invalid or missing.',
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Due Date fallback
    let dueDate = parseDate(rawDueDate);
    if (!dueDate && invoiceDate) {
      // default 30 days credit period
      const d = new Date(invoiceDate + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + 30);
      dueDate = d.toISOString().split('T')[0];
    } else if (!dueDate) {
      dueDate = invoiceDate || new Date().toISOString().split('T')[0];
    }

    // Rule 4: Invoice Amount must be numeric and > 0
    const cleanedAmountStr = String(rawAmount || '').replace(/₹|,|\s/g, '');
    const invoiceAmount = Number(cleanedAmountStr);
    if (isNaN(invoiceAmount) || invoiceAmount <= 0) {
      errors.push({
        file: 'billing',
        row: rowNum,
        field: 'Invoice Amount',
        value: rawAmount,
        message: 'Invoice Amount must be a valid numeric value greater than zero.',
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Rule 7: Duplicate invoice numbers must be flagged
    if (invoiceNo) {
      if (seenInvoices.has(invoiceNo)) {
        errors.push({
          file: 'billing',
          row: rowNum,
          field: 'Invoice No',
          value: invoiceNo,
          message: `Duplicate Invoice Number '${invoiceNo}' found (already present at row ${seenInvoices.get(invoiceNo)}).`,
          severity: 'error'
        });
        hasFatalError = true;
      } else {
        seenInvoices.set(invoiceNo, rowNum);
      }
    }

    if (!hasFatalError && invoiceDate && dueDate) {
      valid.push({
        invoiceNo,
        customer,
        region,
        state,
        salesperson,
        invoiceDate,
        dueDate,
        invoiceAmount
      });
    }
  });

  return { valid, errors };
}

// Validate Collection File
export function validateCollectionData(rows: RawRow[]): { valid: CollectionRecord[]; errors: ValidationError[] } {
  const valid: CollectionRecord[] = [];
  const errors: ValidationError[] = [];
  const seenPaymentRefs = new Set<string>();

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const invoiceNo = String(row['Invoice No'] ?? row['Invoice Number'] ?? row['invoice_no'] ?? row['InvoiceNo'] ?? '').trim();
    const customer = String(row['Customer'] ?? row['Customer Name'] ?? row['customer'] ?? '').trim();
    const rawCollDate = row['Collection Date'] ?? row['Payment Date'] ?? row['collection_date'] ?? row['Date'];
    const rawAmount = row['Collection Amount'] ?? row['Payment Amount'] ?? row['collection_amount'] ?? row['Amount'];
    const paymentRef = String(row['Payment Reference'] ?? row['UTR No'] ?? row['Ref No'] ?? row['Txn ID'] ?? `TXN-${idx + 1}`).trim();
    const paymentMode = String(row['Payment Mode'] ?? row['Mode'] ?? 'NEFT/RTGS').trim();
    const bank = String(row['Bank'] ?? row['Bank Name'] ?? 'HDFC Bank').trim();
    const region = String(row['Region'] ?? row['region'] ?? '').trim();
    const state = String(row['State'] ?? row['state'] ?? '').trim();

    let hasFatalError = false;

    // Rule 1: Invoice Number must not be blank
    if (!invoiceNo) {
      errors.push({
        file: 'collection',
        row: rowNum,
        field: 'Invoice No',
        value: invoiceNo,
        message: 'Invoice Number is mandatory in Collection file for reconciliation.',
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Rule 5: Collection Amount must be numeric and > 0
    const cleanedAmountStr = String(rawAmount || '').replace(/₹|,|\s/g, '');
    const collectionAmount = Number(cleanedAmountStr);
    if (isNaN(collectionAmount) || collectionAmount <= 0) {
      errors.push({
        file: 'collection',
        row: rowNum,
        field: 'Collection Amount',
        value: rawAmount,
        message: 'Collection Amount must be a valid numeric value greater than zero.',
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Rule 6: Collection Date must be a valid date
    const collectionDate = parseDate(rawCollDate);
    if (!collectionDate) {
      errors.push({
        file: 'collection',
        row: rowNum,
        field: 'Collection Date',
        value: rawCollDate,
        message: 'Collection Date is invalid or missing.',
        severity: 'error'
      });
      hasFatalError = true;
    }

    // Deduplication check for exact duplicate transactions
    const uniqueTxnKey = `${invoiceNo}_${paymentRef}_${collectionAmount}_${collectionDate}`;
    if (seenPaymentRefs.has(uniqueTxnKey)) {
      errors.push({
        file: 'collection',
        row: rowNum,
        field: 'Payment Reference',
        value: paymentRef,
        message: `Duplicate collection entry detected for Invoice ${invoiceNo} and Ref ${paymentRef}. Duplicate ignored to prevent double counting.`,
        severity: 'warning'
      });
      // Skip duplicate collection record to avoid double counting
      return;
    }
    seenPaymentRefs.add(uniqueTxnKey);

    if (!hasFatalError && collectionDate) {
      valid.push({
        id: `coll-${idx + 1}-${Date.now()}`,
        invoiceNo,
        customer,
        collectionDate,
        collectionAmount,
        paymentReference: paymentRef,
        paymentMode,
        bank,
        region,
        state
      });
    }
  });

  return { valid, errors };
}

// Perform full invoice reconciliation
export function reconcileData(
  invoices: InvoiceRecord[],
  collections: CollectionRecord[],
  asOfDate: string = '2026-10-31'
): {
  reconciledInvoices: ReconciledInvoice[];
  reconciledCollections: ReconciledCollection[];
  customerSummaries: CustomerSummaryRecord[];
  summary: ReconciliationSummary;
} {
  // Group collections by invoice number
  const collectionsByInvoice = new Map<string, CollectionRecord[]>();
  const invoiceMap = new Map<string, InvoiceRecord>();

  invoices.forEach(inv => {
    invoiceMap.set(inv.invoiceNo, inv);
  });

  collections.forEach(coll => {
    const list = collectionsByInvoice.get(coll.invoiceNo) || [];
    list.push(coll);
    collectionsByInvoice.set(coll.invoiceNo, list);
  });

  let totalBilling = 0;
  let totalCollection = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;
  let matchedCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;
  let overcollectedCount = 0;

  // Process invoices
  const reconciledInvoices: ReconciledInvoice[] = invoices.map(inv => {
    const matchedColls = collectionsByInvoice.get(inv.invoiceNo) || [];
    const invCollectionTotal = matchedColls.reduce((sum, c) => sum + c.collectionAmount, 0);
    const outstanding = Math.max(0, inv.invoiceAmount - invCollectionTotal);
    const collectionPercentage = inv.invoiceAmount > 0 ? (invCollectionTotal / inv.invoiceAmount) * 100 : 0;
    
    // Calculate overdue days
    const daysSinceDue = daysDiff(asOfDate, inv.dueDate);
    const overdueDays = outstanding > 0.01 ? Math.max(0, daysSinceDue) : 0;
    const ageingBucket = determineAgeingBucket(overdueDays, outstanding);
    const invoiceStatus = determineInvoiceStatus(inv.invoiceAmount, invCollectionTotal);

    totalBilling += inv.invoiceAmount;
    totalCollection += invCollectionTotal;
    totalOutstanding += outstanding;
    if (overdueDays > 0) {
      totalOverdue += outstanding;
    }

    if (invoiceStatus === 'Fully Paid') matchedCount++;
    else if (invoiceStatus === 'Partially Paid') partialCount++;
    else if (invoiceStatus === 'Unpaid') unpaidCount++;
    else if (invoiceStatus === 'Overcollected') overcollectedCount++;

    return {
      ...inv,
      collectionAmount: invCollectionTotal,
      outstandingAmount: outstanding,
      collectionPercentage,
      overdueDays,
      ageingBucket,
      invoiceStatus,
      collections: matchedColls
    };
  });

  // Process collection details and reconciliation status
  let unmatchedCollectionsCount = 0;
  let unmatchedCollectionsAmount = 0;

  const reconciledCollections: ReconciledCollection[] = collections.map(coll => {
    const inv = invoiceMap.get(coll.invoiceNo);
    let reconciliationStatus: ReconciledCollection['reconciliationStatus'] = 'Matched';

    if (!inv) {
      reconciliationStatus = 'Unmatched Invoice';
      unmatchedCollectionsCount++;
      unmatchedCollectionsAmount += coll.collectionAmount;
    } else {
      const allColls = collectionsByInvoice.get(coll.invoiceNo) || [];
      const totalCollForInv = allColls.reduce((s, c) => s + c.collectionAmount, 0);
      if (totalCollForInv > inv.invoiceAmount) {
        reconciliationStatus = 'Overcollected';
      } else if (totalCollForInv < inv.invoiceAmount) {
        reconciliationStatus = 'Partial Match';
      } else {
        reconciliationStatus = 'Matched';
      }
    }

    return {
      ...coll,
      // Fill customer/region/state from invoice if missing in collection record
      customer: coll.customer || (inv ? inv.customer : 'Unknown Customer'),
      region: coll.region || (inv ? inv.region : 'Unspecified'),
      state: coll.state || (inv ? inv.state : 'Unspecified'),
      reconciliationStatus
    };
  });

  // Customer Summaries aggregation
  const customerMap = new Map<string, {
    customer: string;
    region: string;
    state: string;
    invoices: ReconciledInvoice[];
    collections: CollectionRecord[];
  }>();

  reconciledInvoices.forEach(inv => {
    const cData = customerMap.get(inv.customer) || {
      customer: inv.customer,
      region: inv.region,
      state: inv.state,
      invoices: [],
      collections: []
    };
    cData.invoices.push(inv);
    cData.collections.push(...inv.collections);
    customerMap.set(inv.customer, cData);
  });

  const customerSummaries: CustomerSummaryRecord[] = Array.from(customerMap.values()).map(c => {
    const totalBillingCust = c.invoices.reduce((sum, i) => sum + i.invoiceAmount, 0);
    const totalCollectionCust = c.invoices.reduce((sum, i) => sum + i.collectionAmount, 0);
    const totalOutstandingCust = Math.max(0, totalBillingCust - totalCollectionCust);
    const collectionPercentage = totalBillingCust > 0 ? (totalCollectionCust / totalBillingCust) * 100 : 0;
    const overdueOutstanding = c.invoices.reduce((sum, i) => i.overdueDays > 0 ? sum + i.outstandingAmount : sum, 0);

    // Calculate average payment delay (collectionDate - dueDate) for matched collections
    let totalDelayDays = 0;
    let delayCount = 0;
    let latestCollDate = '';

    c.invoices.forEach(inv => {
      inv.collections.forEach(coll => {
        if (!latestCollDate || coll.collectionDate > latestCollDate) {
          latestCollDate = coll.collectionDate;
        }
        const delay = daysDiff(coll.collectionDate, inv.dueDate);
        totalDelayDays += Math.max(0, delay);
        delayCount++;
      });
    });

    const averagePaymentDelay = delayCount > 0 ? Math.round(totalDelayDays / delayCount) : 0;

    // Worst ageing bucket for the customer's open invoices
    let maxOverdueDays = 0;
    c.invoices.forEach(i => {
      if (i.outstandingAmount > 0 && i.overdueDays > maxOverdueDays) {
        maxOverdueDays = i.overdueDays;
      }
    });
    const ageingBucket = determineAgeingBucket(maxOverdueDays, totalOutstandingCust);

    // Customer Risk Category
    let customerRiskCategory: CustomerRisk = 'Low Risk';
    if (maxOverdueDays > 60 || (overdueOutstanding > 500000 && collectionPercentage < 60)) {
      customerRiskCategory = 'High Risk';
    } else if (maxOverdueDays > 30 || overdueOutstanding > 200000 || collectionPercentage < 80) {
      customerRiskCategory = 'Medium Risk';
    }

    return {
      customer: c.customer,
      region: c.region,
      state: c.state,
      totalBilling: totalBillingCust,
      totalCollection: totalCollectionCust,
      totalOutstanding: totalOutstandingCust,
      collectionPercentage,
      overdueOutstanding,
      averagePaymentDelay,
      lastCollectionDate: latestCollDate || '-',
      ageingBucket,
      customerRiskCategory
    };
  });

  // Sort customer summaries by highest outstanding amount
  customerSummaries.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  const collectionEfficiency = totalBilling > 0 ? (totalCollection / totalBilling) * 100 : 0;
  const balanceDiff = Math.abs((totalBilling - totalCollection) - totalOutstanding);

  return {
    reconciledInvoices,
    reconciledCollections,
    customerSummaries,
    summary: {
      totalInvoicesCount: invoices.length,
      totalCollectionsCount: collections.length,
      totalBillingAmount: totalBilling,
      totalCollectionAmount: totalCollection,
      totalOutstandingAmount: totalOutstanding,
      totalOverdueAmount: totalOverdue,
      collectionEfficiency,
      matchedCount,
      partialCount,
      unpaidCount,
      overcollectedCount,
      unmatchedCollectionsCount,
      unmatchedCollectionsAmount,
      reconciliationBalanceDiff: balanceDiff
    }
  };
}

// Sample Comprehensive PAN India Data
export function getSamplePANIndiaData(): { invoices: InvoiceRecord[]; collections: CollectionRecord[] } {
  const invoices: InvoiceRecord[] = [
    { invoiceNo: 'INV/2026/0101', customer: 'Tata Consultancy Services Ltd', region: 'West', state: 'Maharashtra', salesperson: 'Amit Sharma', invoiceDate: '2026-08-05', dueDate: '2026-09-04', invoiceAmount: 1850000 },
    { invoiceNo: 'INV/2026/0102', customer: 'Reliance Retail Ventures', region: 'West', state: 'Gujarat', salesperson: 'Amit Sharma', invoiceDate: '2026-08-10', dueDate: '2026-09-09', invoiceAmount: 2400000 },
    { invoiceNo: 'INV/2026/0103', customer: 'Infosys Technologies Ltd', region: 'South', state: 'Karnataka', salesperson: 'Deepak Rao', invoiceDate: '2026-08-15', dueDate: '2026-09-14', invoiceAmount: 1450000 },
    { invoiceNo: 'INV/2026/0104', customer: 'HCL Technologies', region: 'North', state: 'Uttar Pradesh', salesperson: 'Pooja Verma', invoiceDate: '2026-08-20', dueDate: '2026-09-19', invoiceAmount: 980000 },
    { invoiceNo: 'INV/2026/0105', customer: 'Wipro Enterprises Ltd', region: 'South', state: 'Karnataka', salesperson: 'Deepak Rao', invoiceDate: '2026-08-28', dueDate: '2026-09-27', invoiceAmount: 1120000 },
    { invoiceNo: 'INV/2026/0106', customer: 'Larsen & Toubro Ltd', region: 'West', state: 'Maharashtra', salesperson: 'Amit Sharma', invoiceDate: '2026-09-01', dueDate: '2026-10-01', invoiceAmount: 3200000 },
    { invoiceNo: 'INV/2026/0107', customer: 'Mahindra & Mahindra', region: 'West', state: 'Maharashtra', salesperson: 'Amit Sharma', invoiceDate: '2026-09-05', dueDate: '2026-10-05', invoiceAmount: 1650000 },
    { invoiceNo: 'INV/2026/0108', customer: 'Sun Pharmaceutical Ltd', region: 'West', state: 'Gujarat', salesperson: 'Vikram Joshi', invoiceDate: '2026-09-10', dueDate: '2026-10-10', invoiceAmount: 890000 },
    { invoiceNo: 'INV/2026/0109', customer: 'ITC Limited', region: 'East', state: 'West Bengal', salesperson: 'Sourav Roy', invoiceDate: '2026-09-12', dueDate: '2026-10-12', invoiceAmount: 2150000 },
    { invoiceNo: 'INV/2026/0110', customer: 'Bharti Airtel Ltd', region: 'North', state: 'Delhi', salesperson: 'Pooja Verma', invoiceDate: '2026-09-15', dueDate: '2026-10-15', invoiceAmount: 2750000 },
    { invoiceNo: 'INV/2026/0111', customer: 'Asian Paints Ltd', region: 'West', state: 'Maharashtra', salesperson: 'Amit Sharma', invoiceDate: '2026-09-18', dueDate: '2026-10-18', invoiceAmount: 1350000 },
    { invoiceNo: 'INV/2026/0112', customer: 'Apollo Hospitals Enterprise', region: 'South', state: 'Tamil Nadu', salesperson: 'Karthik Raja', invoiceDate: '2026-09-22', dueDate: '2026-10-22', invoiceAmount: 1980000 },
    { invoiceNo: 'INV/2026/0113', customer: 'Maruti Suzuki India', region: 'North', state: 'Haryana', salesperson: 'Pooja Verma', invoiceDate: '2026-09-25', dueDate: '2026-10-25', invoiceAmount: 3100000 },
    { invoiceNo: 'INV/2026/0114', customer: 'Titan Company Ltd', region: 'South', state: 'Karnataka', salesperson: 'Deepak Rao', invoiceDate: '2026-09-28', dueDate: '2026-10-28', invoiceAmount: 820000 },
    { invoiceNo: 'INV/2026/0115', customer: 'Dr Reddys Laboratories', region: 'South', state: 'Telangana', salesperson: 'Karthik Raja', invoiceDate: '2026-10-01', dueDate: '2026-10-31', invoiceAmount: 1420000 },
    { invoiceNo: 'INV/2026/0116', customer: 'Bajaj Finance Ltd', region: 'West', state: 'Maharashtra', salesperson: 'Amit Sharma', invoiceDate: '2026-10-04', dueDate: '2026-11-03', invoiceAmount: 2100000 },
    { invoiceNo: 'INV/2026/0117', customer: 'Adani Ports & SEZ', region: 'West', state: 'Gujarat', salesperson: 'Vikram Joshi', invoiceDate: '2026-10-08', dueDate: '2026-11-07', invoiceAmount: 3800000 },
    { invoiceNo: 'INV/2026/0118', customer: 'JSW Steel Ltd', region: 'East', state: 'Odisha', salesperson: 'Sourav Roy', invoiceDate: '2026-10-12', dueDate: '2026-11-11', invoiceAmount: 2900000 },
    { invoiceNo: 'INV/2026/0119', customer: 'UltraTech Cement', region: 'Central', state: 'Madhya Pradesh', salesperson: 'Pooja Verma', invoiceDate: '2026-10-15', dueDate: '2026-11-14', invoiceAmount: 1750000 },
    { invoiceNo: 'INV/2026/0120', customer: 'Tata Motors Ltd', region: 'West', state: 'Maharashtra', salesperson: 'Amit Sharma', invoiceDate: '2026-10-18', dueDate: '2026-11-17', invoiceAmount: 2600000 },
    { invoiceNo: 'INV/2026/0121', customer: 'Hero MotoCorp Ltd', region: 'North', state: 'Delhi', salesperson: 'Pooja Verma', invoiceDate: '2026-10-22', dueDate: '2026-11-21', invoiceAmount: 1550000 },
    { invoiceNo: 'INV/2026/0122', customer: 'Havells India Ltd', region: 'North', state: 'Uttar Pradesh', salesperson: 'Pooja Verma', invoiceDate: '2026-10-24', dueDate: '2026-11-23', invoiceAmount: 940000 },
    { invoiceNo: 'INV/2026/0123', customer: 'Britannia Industries', region: 'East', state: 'West Bengal', salesperson: 'Sourav Roy', invoiceDate: '2026-10-26', dueDate: '2026-11-25', invoiceAmount: 1180000 },
    { invoiceNo: 'INV/2026/0124', customer: 'Godrej Consumer Products', region: 'West', state: 'Maharashtra', salesperson: 'Amit Sharma', invoiceDate: '2026-10-28', dueDate: '2026-11-27', invoiceAmount: 1280000 }
  ];

  const collections: CollectionRecord[] = [
    // Multiple collections for INV/2026/0101 (Fully Paid in 2 tranches)
    { id: 'C1001', invoiceNo: 'INV/2026/0101', customer: 'Tata Consultancy Services Ltd', collectionDate: '2026-08-25', collectionAmount: 1000000, paymentReference: 'UTR/HDFC/908123', paymentMode: 'RTGS', bank: 'HDFC Bank', region: 'West', state: 'Maharashtra' },
    { id: 'C1002', invoiceNo: 'INV/2026/0101', customer: 'Tata Consultancy Services Ltd', collectionDate: '2026-09-02', collectionAmount: 850000, paymentReference: 'UTR/HDFC/912845', paymentMode: 'RTGS', bank: 'HDFC Bank', region: 'West', state: 'Maharashtra' },

    // Partial collection for INV/2026/0102 (₹15L out of ₹24L)
    { id: 'C1003', invoiceNo: 'INV/2026/0102', customer: 'Reliance Retail Ventures', collectionDate: '2026-09-12', collectionAmount: 1500000, paymentReference: 'UTR/ICIC/881203', paymentMode: 'NEFT', bank: 'ICICI Bank', region: 'West', state: 'Gujarat' },

    // Full collection for INV/2026/0103
    { id: 'C1004', invoiceNo: 'INV/2026/0103', customer: 'Infosys Technologies Ltd', collectionDate: '2026-09-10', collectionAmount: 1450000, paymentReference: 'UTR/SBIN/442190', paymentMode: 'RTGS', bank: 'State Bank of India', region: 'South', state: 'Karnataka' },

    // Full collection for INV/2026/0104
    { id: 'C1005', invoiceNo: 'INV/2026/0104', customer: 'HCL Technologies', collectionDate: '2026-09-18', collectionAmount: 980000, paymentReference: 'UTR/AXIS/771928', paymentMode: 'NEFT', bank: 'Axis Bank', region: 'North', state: 'Uttar Pradesh' },

    // Partial collection for INV/2026/0105
    { id: 'C1006', invoiceNo: 'INV/2026/0105', customer: 'Wipro Enterprises Ltd', collectionDate: '2026-10-02', collectionAmount: 600000, paymentReference: 'UTR/KKBK/312455', paymentMode: 'NEFT', bank: 'Kotak Mahindra', region: 'South', state: 'Karnataka' },

    // Partial collection for INV/2026/0106 (3 tranches: ₹10L + ₹10L + ₹5L = ₹25L out of ₹32L)
    { id: 'C1007', invoiceNo: 'INV/2026/0106', customer: 'Larsen & Toubro Ltd', collectionDate: '2026-09-20', collectionAmount: 1000000, paymentReference: 'UTR/HDFC/992811', paymentMode: 'RTGS', bank: 'HDFC Bank', region: 'West', state: 'Maharashtra' },
    { id: 'C1008', invoiceNo: 'INV/2026/0106', customer: 'Larsen & Toubro Ltd', collectionDate: '2026-10-05', collectionAmount: 1000000, paymentReference: 'UTR/HDFC/993412', paymentMode: 'RTGS', bank: 'HDFC Bank', region: 'West', state: 'Maharashtra' },
    { id: 'C1009', invoiceNo: 'INV/2026/0106', customer: 'Larsen & Toubro Ltd', collectionDate: '2026-10-22', collectionAmount: 500000, paymentReference: 'UTR/HDFC/994101', paymentMode: 'NEFT', bank: 'HDFC Bank', region: 'West', state: 'Maharashtra' },

    // Full collection for INV/2026/0107
    { id: 'C1010', invoiceNo: 'INV/2026/0107', customer: 'Mahindra & Mahindra', collectionDate: '2026-10-04', collectionAmount: 1650000, paymentReference: 'UTR/ICIC/992102', paymentMode: 'RTGS', bank: 'ICICI Bank', region: 'West', state: 'Maharashtra' },

    // Full collection for INV/2026/0108
    { id: 'C1011', invoiceNo: 'INV/2026/0108', customer: 'Sun Pharmaceutical Ltd', collectionDate: '2026-10-09', collectionAmount: 890000, paymentReference: 'UTR/SBIN/556712', paymentMode: 'NEFT', bank: 'State Bank of India', region: 'West', state: 'Gujarat' },

    // Partial collection for INV/2026/0109 (₹15L out of ₹21.5L)
    { id: 'C1012', invoiceNo: 'INV/2026/0109', customer: 'ITC Limited', collectionDate: '2026-10-11', collectionAmount: 1500000, paymentReference: 'UTR/HDFC/110293', paymentMode: 'RTGS', bank: 'HDFC Bank', region: 'East', state: 'West Bengal' },

    // Full collection for INV/2026/0110
    { id: 'C1013', invoiceNo: 'INV/2026/0110', customer: 'Bharti Airtel Ltd', collectionDate: '2026-10-14', collectionAmount: 2750000, paymentReference: 'UTR/AXIS/882109', paymentMode: 'RTGS', bank: 'Axis Bank', region: 'North', state: 'Delhi' },

    // Full collection for INV/2026/0111
    { id: 'C1014', invoiceNo: 'INV/2026/0111', customer: 'Asian Paints Ltd', collectionDate: '2026-10-17', collectionAmount: 1350000, paymentReference: 'UTR/KKBK/771234', paymentMode: 'RTGS', bank: 'Kotak Mahindra', region: 'West', state: 'Maharashtra' },

    // Partial collection for INV/2026/0112 (₹10L out of ₹19.8L)
    { id: 'C1015', invoiceNo: 'INV/2026/0112', customer: 'Apollo Hospitals Enterprise', collectionDate: '2026-10-21', collectionAmount: 1000000, paymentReference: 'UTR/ICIC/441209', paymentMode: 'NEFT', bank: 'ICICI Bank', region: 'South', state: 'Tamil Nadu' },

    // Full collection for INV/2026/0113
    { id: 'C1016', invoiceNo: 'INV/2026/0113', customer: 'Maruti Suzuki India', collectionDate: '2026-10-24', collectionAmount: 3100000, paymentReference: 'UTR/SBIN/998124', paymentMode: 'RTGS', bank: 'State Bank of India', region: 'North', state: 'Haryana' },

    // Full collection for INV/2026/0114
    { id: 'C1017', invoiceNo: 'INV/2026/0114', customer: 'Titan Company Ltd', collectionDate: '2026-10-27', collectionAmount: 820000, paymentReference: 'UTR/HDFC/334211', paymentMode: 'NEFT', bank: 'HDFC Bank', region: 'South', state: 'Karnataka' },

    // Early partial collection for INV/2026/0116 (Not due yet)
    { id: 'C1018', invoiceNo: 'INV/2026/0116', customer: 'Bajaj Finance Ltd', collectionDate: '2026-10-29', collectionAmount: 1000000, paymentReference: 'UTR/AXIS/129845', paymentMode: 'RTGS', bank: 'Axis Bank', region: 'West', state: 'Maharashtra' },

    // Partial collection for INV/2026/0117 (₹18L out of ₹38L)
    { id: 'C1019', invoiceNo: 'INV/2026/0117', customer: 'Adani Ports & SEZ', collectionDate: '2026-10-30', collectionAmount: 1800000, paymentReference: 'UTR/ICIC/776123', paymentMode: 'RTGS', bank: 'ICICI Bank', region: 'West', state: 'Gujarat' },

    // Unmatched collection example (Payment received with unknown or cancelled invoice number)
    { id: 'C1020', invoiceNo: 'INV/2026/9999', customer: 'Unidentified Depositor Corp', collectionDate: '2026-10-28', collectionAmount: 250000, paymentReference: 'UTR/HDFC/999999', paymentMode: 'NEFT', bank: 'HDFC Bank', region: 'North', state: 'Delhi' }
  ];

  return { invoices, collections };
}
