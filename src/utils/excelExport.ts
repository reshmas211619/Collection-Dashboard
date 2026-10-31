/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import {
  ReconciledInvoice,
  ReconciledCollection,
  CustomerSummaryRecord,
  ValidationError,
  formatINR
} from './reconciliation';

export function exportReconciliationWorkbook(
  invoices: ReconciledInvoice[],
  collections: ReconciledCollection[],
  customerSummaries: CustomerSummaryRecord[],
  filename = 'PAN_India_Collection_Report.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // 1. SHEET 1: Invoice Master
  const sheet1Data: any[] = invoices.map(inv => ({
    'Invoice No': inv.invoiceNo,
    'Customer': inv.customer,
    'Region': inv.region,
    'State': inv.state,
    'Salesperson': inv.salesperson,
    'Invoice Date': inv.invoiceDate,
    'Due Date': inv.dueDate,
    'Invoice Amount': inv.invoiceAmount,
    'Collection Amount': inv.collectionAmount,
    'Outstanding Amount': inv.outstandingAmount,
    'Collection %': `${inv.collectionPercentage.toFixed(1)}%`,
    'Overdue Days': inv.overdueDays,
    'Ageing Bucket': inv.ageingBucket,
    'Invoice Status': inv.invoiceStatus
  }));

  // Totals row for Invoice Master
  const totalInvAmount = invoices.reduce((s, i) => s + i.invoiceAmount, 0);
  const totalCollAmount = invoices.reduce((s, i) => s + i.collectionAmount, 0);
  const totalOutAmount = invoices.reduce((s, i) => s + i.outstandingAmount, 0);
  const avgEfficiency = totalInvAmount > 0 ? (totalCollAmount / totalInvAmount) * 100 : 0;

  sheet1Data.push({
    'Invoice No': 'TOTAL',
    'Customer': `Count: ${invoices.length}`,
    'Region': '',
    'State': '',
    'Salesperson': '',
    'Invoice Date': '',
    'Due Date': '',
    'Invoice Amount': totalInvAmount,
    'Collection Amount': totalCollAmount,
    'Outstanding Amount': totalOutAmount,
    'Collection %': `${avgEfficiency.toFixed(1)}%`,
    'Overdue Days': '',
    'Ageing Bucket': '',
    'Invoice Status': ''
  });

  const ws1 = XLSX.utils.json_to_sheet(sheet1Data);

  // Set column widths
  ws1['!cols'] = [
    { wch: 16 }, // Invoice No
    { wch: 28 }, // Customer
    { wch: 12 }, // Region
    { wch: 16 }, // State
    { wch: 18 }, // Salesperson
    { wch: 13 }, // Invoice Date
    { wch: 13 }, // Due Date
    { wch: 16 }, // Invoice Amount
    { wch: 16 }, // Collection Amount
    { wch: 18 }, // Outstanding Amount
    { wch: 14 }, // Collection %
    { wch: 14 }, // Overdue Days
    { wch: 16 }, // Ageing Bucket
    { wch: 16 }  // Invoice Status
  ];

  // Freeze header row & add autofilter
  if (invoices.length > 0) {
    ws1['!freeze'] = { xSplit: 0, ySplit: 1 };
    ws1['!autofilter'] = { ref: `A1:N${invoices.length + 1}` };
  }

  XLSX.utils.book_append_sheet(wb, ws1, 'Invoice Master');

  // 2. SHEET 2: Collection Details
  const sheet2Data: any[] = collections.map(coll => ({
    'Invoice No': coll.invoiceNo,
    'Customer': coll.customer,
    'Collection Date': coll.collectionDate,
    'Collection Amount': coll.collectionAmount,
    'Payment Reference': coll.paymentReference,
    'Payment Mode': coll.paymentMode,
    'Bank': coll.bank,
    'Region': coll.region,
    'State': coll.state,
    'Reconciliation Status': coll.reconciliationStatus
  }));

  const totalCollsAmt = collections.reduce((s, c) => s + c.collectionAmount, 0);
  sheet2Data.push({
    'Invoice No': 'TOTAL',
    'Customer': `Count: ${collections.length}`,
    'Collection Date': '',
    'Collection Amount': totalCollsAmt,
    'Payment Reference': '',
    'Payment Mode': '',
    'Bank': '',
    'Region': '',
    'State': '',
    'Reconciliation Status': ''
  });

  const ws2 = XLSX.utils.json_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 16 }, // Invoice No
    { wch: 28 }, // Customer
    { wch: 14 }, // Collection Date
    { wch: 18 }, // Collection Amount
    { wch: 20 }, // Payment Reference
    { wch: 14 }, // Payment Mode
    { wch: 20 }, // Bank
    { wch: 12 }, // Region
    { wch: 16 }, // State
    { wch: 20 }  // Reconciliation Status
  ];

  if (collections.length > 0) {
    ws2['!freeze'] = { xSplit: 0, ySplit: 1 };
    ws2['!autofilter'] = { ref: `A1:J${collections.length + 1}` };
  }

  XLSX.utils.book_append_sheet(wb, ws2, 'Collection Details');

  // 3. SHEET 3: Customer Summary
  const sheet3Data: any[] = customerSummaries.map(c => ({
    'Customer': c.customer,
    'Region': c.region,
    'State': c.state,
    'Total Billing': c.totalBilling,
    'Total Collection': c.totalCollection,
    'Total Outstanding': c.totalOutstanding,
    'Collection %': `${c.collectionPercentage.toFixed(1)}%`,
    'Overdue Outstanding': c.overdueOutstanding,
    'Average Payment Delay': `${c.averagePaymentDelay} Days`,
    'Last Collection Date': c.lastCollectionDate,
    'Ageing Bucket': c.ageingBucket,
    'Customer Risk Category': c.customerRiskCategory
  }));

  const totalCustBilling = customerSummaries.reduce((s, c) => s + c.totalBilling, 0);
  const totalCustCollection = customerSummaries.reduce((s, c) => s + c.totalCollection, 0);
  const totalCustOutstanding = customerSummaries.reduce((s, c) => s + c.totalOutstanding, 0);
  const totalCustOverdue = customerSummaries.reduce((s, c) => s + c.overdueOutstanding, 0);

  sheet3Data.push({
    'Customer': 'TOTAL',
    'Region': `Count: ${customerSummaries.length}`,
    'State': '',
    'Total Billing': totalCustBilling,
    'Total Collection': totalCustCollection,
    'Total Outstanding': totalCustOutstanding,
    'Collection %': totalCustBilling > 0 ? `${((totalCustCollection / totalCustBilling) * 100).toFixed(1)}%` : '0.0%',
    'Overdue Outstanding': totalCustOverdue,
    'Average Payment Delay': '',
    'Last Collection Date': '',
    'Ageing Bucket': '',
    'Customer Risk Category': ''
  });

  const ws3 = XLSX.utils.json_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 30 }, // Customer
    { wch: 12 }, // Region
    { wch: 16 }, // State
    { wch: 16 }, // Total Billing
    { wch: 16 }, // Total Collection
    { wch: 18 }, // Total Outstanding
    { wch: 14 }, // Collection %
    { wch: 18 }, // Overdue Outstanding
    { wch: 22 }, // Average Payment Delay
    { wch: 18 }, // Last Collection Date
    { wch: 16 }, // Ageing Bucket
    { wch: 22 }  // Customer Risk Category
  ];

  if (customerSummaries.length > 0) {
    ws3['!freeze'] = { xSplit: 0, ySplit: 1 };
    ws3['!autofilter'] = { ref: `A1:L${customerSummaries.length + 1}` };
  }

  XLSX.utils.book_append_sheet(wb, ws3, 'Customer Summary');

  // Trigger download
  XLSX.writeFile(wb, filename);
}

// Export Validation Errors Report
export function exportValidationErrorReport(errors: ValidationError[], filename = 'Validation_Errors_Report.xlsx') {
  const wb = XLSX.utils.book_new();
  const data = errors.map(err => ({
    'File Type': err.file === 'billing' ? 'Customer Billing Data' : 'Collection File',
    'Row Number': err.row,
    'Field Name': err.field,
    'Erroneous Value': String(err.value ?? ''),
    'Severity': err.severity.toUpperCase(),
    'Validation Message': err.message
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 18 },
    { wch: 22 },
    { wch: 12 },
    { wch: 50 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Validation Errors');
  XLSX.writeFile(wb, filename);
}

// Download Sample Billing template
export function downloadSampleBillingFile() {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    { 'Invoice No': 'INV/2026/0201', 'Customer': 'Tata Steel Ltd', 'Region': 'East', 'State': 'Jharkhand', 'Salesperson': 'Sourav Roy', 'Invoice Date': '2026-09-01', 'Due Date': '2026-10-01', 'Invoice Amount': 1500000 },
    { 'Invoice No': 'INV/2026/0202', 'Customer': 'Infosys Ltd', 'Region': 'South', 'State': 'Karnataka', 'Salesperson': 'Deepak Rao', 'Invoice Date': '2026-09-10', 'Due Date': '2026-10-10', 'Invoice Amount': 2200000 },
    { 'Invoice No': 'INV/2026/0203', 'Customer': 'Reliance Industries', 'Region': 'West', 'State': 'Gujarat', 'Salesperson': 'Amit Sharma', 'Invoice Date': '2026-09-15', 'Due Date': '2026-10-15', 'Invoice Amount': 3500000 },
    { 'Invoice No': 'INV/2026/0204', 'Customer': 'Airtel Enterprise', 'Region': 'North', 'State': 'Delhi', 'Salesperson': 'Pooja Verma', 'Invoice Date': '2026-09-25', 'Due Date': '2026-10-25', 'Invoice Amount': 1800000 },
    { 'Invoice No': 'INV/2026/0205', 'Customer': 'Larsen & Toubro', 'Region': 'West', 'State': 'Maharashtra', 'Salesperson': 'Amit Sharma', 'Invoice Date': '2026-10-01', 'Due Date': '2026-10-31', 'Invoice Amount': 2750000 }
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Billing Data');
  XLSX.writeFile(wb, 'Sample_Customer_Billing_Data.xlsx');
}

// Download Sample Collection template
export function downloadSampleCollectionFile() {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    { 'Invoice No': 'INV/2026/0201', 'Customer': 'Tata Steel Ltd', 'Collection Date': '2026-09-28', 'Collection Amount': 1500000, 'Payment Reference': 'UTR/SBIN/887123', 'Payment Mode': 'RTGS', 'Bank': 'SBI', 'Region': 'East', 'State': 'Jharkhand' },
    { 'Invoice No': 'INV/2026/0202', 'Customer': 'Infosys Ltd', 'Collection Date': '2026-10-05', 'Collection Amount': 1000000, 'Payment Reference': 'UTR/HDFC/441209', 'Payment Mode': 'RTGS', 'Bank': 'HDFC Bank', 'Region': 'South', 'State': 'Karnataka' },
    { 'Invoice No': 'INV/2026/0202', 'Customer': 'Infosys Ltd', 'Collection Date': '2026-10-18', 'Collection Amount': 1200000, 'Payment Reference': 'UTR/HDFC/445891', 'Payment Mode': 'RTGS', 'Bank': 'HDFC Bank', 'Region': 'South', 'State': 'Karnataka' },
    { 'Invoice No': 'INV/2026/0203', 'Customer': 'Reliance Industries', 'Collection Date': '2026-10-12', 'Collection Amount': 2000000, 'Payment Reference': 'UTR/ICIC/992102', 'Payment Mode': 'RTGS', 'Bank': 'ICICI Bank', 'Region': 'West', 'State': 'Gujarat' },
    { 'Invoice No': 'INV/2026/0204', 'Customer': 'Airtel Enterprise', 'Collection Date': '2026-10-22', 'Collection Amount': 1800000, 'Payment Reference': 'UTR/AXIS/771234', 'Payment Mode': 'NEFT', 'Bank': 'Axis Bank', 'Region': 'North', 'State': 'Delhi' }
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Collection Data');
  XLSX.writeFile(wb, 'Sample_Collection_File.xlsx');
}
