import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatINR,
  determineAgeingBucket,
  determineInvoiceStatus,
  validateBillingData,
  validateCollectionData,
  reconcileData,
  getIndianFinancialYear,
  getWeekString
} from './reconciliation.ts';

test('formatINR formats numbers into Indian system properly', () => {
  assert.equal(formatINR(1250000), '₹12,50,000');
  assert.equal(formatINR(1250000, { short: true }), '₹12.50 L');
  assert.equal(formatINR(15000000, { short: true }), '₹1.50 Cr');
  assert.equal(formatINR(0), '₹0');
});

test('Indian Financial Year helper identifies April-March cycles', () => {
  assert.equal(getIndianFinancialYear('2026-10-15'), 'FY 2026-27');
  assert.equal(getIndianFinancialYear('2026-02-10'), 'FY 2025-26');
  assert.equal(getIndianFinancialYear('2026-04-01'), 'FY 2026-27');
  assert.equal(getIndianFinancialYear('2026-03-31'), 'FY 2025-26');
});

test('Ageing bucket determination works accurately', () => {
  assert.equal(determineAgeingBucket(0, 5000), 'Not Due');
  assert.equal(determineAgeingBucket(15, 5000), '1–30 Days');
  assert.equal(determineAgeingBucket(45, 5000), '31–60 Days');
  assert.equal(determineAgeingBucket(75, 5000), '61–90 Days');
  assert.equal(determineAgeingBucket(120, 5000), 'Above 90 Days');
  assert.equal(determineAgeingBucket(50, 0), 'Not Due'); // Fully paid invoices have no overdue
});

test('determineInvoiceStatus handles all payment states', () => {
  assert.equal(determineInvoiceStatus(1000, 0), 'Unpaid');
  assert.equal(determineInvoiceStatus(1000, 400), 'Partially Paid');
  assert.equal(determineInvoiceStatus(1000, 1000), 'Fully Paid');
  assert.equal(determineInvoiceStatus(1000, 1200), 'Overcollected');
});

test('validateBillingData flags mandatory blank fields and invalid amounts', () => {
  const sampleRows = [
    { 'Invoice No': '', 'Customer': 'Acme', 'Invoice Date': '2026-08-01', 'Invoice Amount': 5000 },
    { 'Invoice No': 'INV-001', 'Customer': '', 'Invoice Date': '2026-08-01', 'Invoice Amount': 5000 },
    { 'Invoice No': 'INV-002', 'Customer': 'Acme', 'Invoice Date': 'invalid-date', 'Invoice Amount': 5000 },
    { 'Invoice No': 'INV-003', 'Customer': 'Acme', 'Invoice Date': '2026-08-01', 'Invoice Amount': -500 },
    { 'Invoice No': 'INV-004', 'Customer': 'Acme', 'Invoice Date': '2026-08-01', 'Invoice Amount': 10000 }
  ];

  const result = validateBillingData(sampleRows);
  assert.equal(result.valid.length, 1);
  assert.equal(result.valid[0].invoiceNo, 'INV-004');
  assert.ok(result.errors.length >= 4);
});

test('reconcileData correctly aggregates multiple collections and computes balance', () => {
  const invoices = [
    { invoiceNo: 'INV-1', customer: 'Tata Motors', region: 'West', state: 'Maharashtra', salesperson: 'Amit', invoiceDate: '2026-09-01', dueDate: '2026-09-20', invoiceAmount: 100000 },
    { invoiceNo: 'INV-2', customer: 'Tata Motors', region: 'West', state: 'Maharashtra', salesperson: 'Amit', invoiceDate: '2026-09-05', dueDate: '2026-10-05', invoiceAmount: 50000 }
  ];

  const collections = [
    { id: 'c1', invoiceNo: 'INV-1', customer: 'Tata Motors', collectionDate: '2026-09-15', collectionAmount: 60000, paymentReference: 'UTR1', paymentMode: 'RTGS', bank: 'HDFC', region: 'West', state: 'Maharashtra' },
    { id: 'c2', invoiceNo: 'INV-1', customer: 'Tata Motors', collectionDate: '2026-09-25', collectionAmount: 40000, paymentReference: 'UTR2', paymentMode: 'RTGS', bank: 'HDFC', region: 'West', state: 'Maharashtra' },
    { id: 'c3', invoiceNo: 'INV-2', customer: 'Tata Motors', collectionDate: '2026-10-10', collectionAmount: 20000, paymentReference: 'UTR3', paymentMode: 'NEFT', bank: 'ICICI', region: 'West', state: 'Maharashtra' }
  ];

  const result = reconcileData(invoices, collections, '2026-10-31');

  // INV-1 should be fully paid (60k + 40k = 100k)
  const inv1 = result.reconciledInvoices.find(i => i.invoiceNo === 'INV-1');
  assert.ok(inv1);
  assert.equal(inv1?.invoiceStatus, 'Fully Paid');
  assert.equal(inv1?.outstandingAmount, 0);

  // INV-2 should be partially paid (20k / 50k, outstanding 30k)
  const inv2 = result.reconciledInvoices.find(i => i.invoiceNo === 'INV-2');
  assert.ok(inv2);
  assert.equal(inv2?.invoiceStatus, 'Partially Paid');
  assert.equal(inv2?.outstandingAmount, 30000);
  assert.equal(inv2?.ageingBucket, '1–30 Days'); // Due 2026-10-05, asOf 2026-10-31 = 26 days overdue

  // Total Billing = 150000, Collection = 120000, Outstanding = 30000
  assert.equal(result.summary.totalBillingAmount, 150000);
  assert.equal(result.summary.totalCollectionAmount, 120000);
  assert.equal(result.summary.totalOutstandingAmount, 30000);
  assert.equal(result.summary.reconciliationBalanceDiff, 0);

  // Customer Summary
  assert.equal(result.customerSummaries.length, 1);
  const cust = result.customerSummaries[0];
  assert.equal(cust.customer, 'Tata Motors');
  assert.equal(cust.totalBilling, 150000);
  assert.equal(cust.totalCollection, 120000);
  assert.equal(cust.totalOutstanding, 30000);
});
