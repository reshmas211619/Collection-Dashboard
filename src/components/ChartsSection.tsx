/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import {
  ReconciledInvoice,
  ReconciledCollection,
  CustomerSummaryRecord,
  formatINR,
  getWeekString
} from '../utils/reconciliation';
import { TrendingUp, AlertTriangle, Clock, MapPin, Building2, Calendar } from 'lucide-react';

Chart.register(...registerables);

interface ChartsSectionProps {
  invoices: ReconciledInvoice[];
  collections: ReconciledCollection[];
  customerSummaries: CustomerSummaryRecord[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  invoices,
  collections,
  customerSummaries
}) => {
  const weeklyChartRef = useRef<HTMLCanvasElement>(null);
  const regionChartRef = useRef<HTMLCanvasElement>(null);
  const stateChartRef = useRef<HTMLCanvasElement>(null);
  const ageingChartRef = useRef<HTMLCanvasElement>(null);

  const weeklyChartInstance = useRef<Chart | null>(null);
  const regionChartInstance = useRef<Chart | null>(null);
  const stateChartInstance = useRef<Chart | null>(null);
  const ageingChartInstance = useRef<Chart | null>(null);

  // 1. Calculate Weekly Data (Billing vs Collection)
  const weekMap = new Map<string, { billing: number; collection: number }>();
  invoices.forEach(inv => {
    const w = getWeekString(inv.invoiceDate) || 'Other';
    const cur = weekMap.get(w) || { billing: 0, collection: 0 };
    cur.billing += inv.invoiceAmount;
    weekMap.set(w, cur);
  });
  collections.forEach(coll => {
    const w = getWeekString(coll.collectionDate) || 'Other';
    const cur = weekMap.get(w) || { billing: 0, collection: 0 };
    cur.collection += coll.collectionAmount;
    weekMap.set(w, cur);
  });

  const sortedWeeks = Array.from(weekMap.keys()).sort();
  const weeklyLabels = sortedWeeks.length > 0 ? sortedWeeks : ['W1', 'W2', 'W3'];
  const weeklyBillingData = weeklyLabels.map(w => weekMap.get(w)?.billing || 0);
  const weeklyCollectionData = weeklyLabels.map(w => weekMap.get(w)?.collection || 0);

  // Week-on-Week calculation for collections
  let currentWeekColl = 0;
  let prevWeekColl = 0;
  let wowChangePercent = 0;
  if (sortedWeeks.length >= 2) {
    const lastW = sortedWeeks[sortedWeeks.length - 1];
    const prevW = sortedWeeks[sortedWeeks.length - 2];
    currentWeekColl = weekMap.get(lastW)?.collection || 0;
    prevWeekColl = weekMap.get(prevW)?.collection || 0;
    if (prevWeekColl > 0) {
      wowChangePercent = ((currentWeekColl - prevWeekColl) / prevWeekColl) * 100;
    }
  }

  // 2. Region-wise Collection
  const regionMap = new Map<string, number>();
  ['North', 'South', 'West', 'East', 'Central'].forEach(r => regionMap.set(r, 0));
  collections.forEach(coll => {
    const r = coll.region || 'West';
    regionMap.set(r, (regionMap.get(r) || 0) + coll.collectionAmount);
  });
  const regionLabels = Array.from(regionMap.keys());
  const regionData = regionLabels.map(r => regionMap.get(r) || 0);

  // 3. State-wise Outstanding
  const stateMap = new Map<string, number>();
  invoices.forEach(inv => {
    const st = inv.state || 'Other';
    stateMap.set(st, (stateMap.get(st) || 0) + inv.outstandingAmount);
  });
  // Sort states by top outstanding
  const topStates = Array.from(stateMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const stateLabels = topStates.map(s => s[0]);
  const stateData = topStates.map(s => s[1]);

  // 4. Ageing Bucket Distribution
  const ageingBuckets: Record<string, number> = {
    'Not Due': 0,
    '1–30 Days': 0,
    '31–60 Days': 0,
    '61–90 Days': 0,
    'Above 90 Days': 0
  };
  invoices.forEach(inv => {
    if (inv.outstandingAmount > 0) {
      ageingBuckets[inv.ageingBucket] = (ageingBuckets[inv.ageingBucket] || 0) + inv.outstandingAmount;
    }
  });

  // Top 10 Customers by Outstanding
  const top10Customers = [...customerSummaries]
    .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
    .slice(0, 10);

  // High-Risk Accounts identification
  const highRiskAccounts = customerSummaries.filter(c => c.customerRiskCategory === 'High Risk');

  // Average delay overall
  const overallAvgDelay = customerSummaries.length > 0
    ? Math.round(customerSummaries.reduce((s, c) => s + c.averagePaymentDelay, 0) / customerSummaries.length)
    : 0;

  useEffect(() => {
    // 1. Weekly Billing vs Collection Chart
    if (weeklyChartRef.current) {
      if (weeklyChartInstance.current) weeklyChartInstance.current.destroy();

      weeklyChartInstance.current = new Chart(weeklyChartRef.current, {
        type: 'bar',
        data: {
          labels: weeklyLabels,
          datasets: [
            {
              label: 'Billed Amount (₹)',
              data: weeklyBillingData,
              backgroundColor: 'rgba(59, 130, 246, 0.75)',
              borderColor: '#2563eb',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Realized Collection (₹)',
              data: weeklyCollectionData,
              backgroundColor: 'rgba(16, 185, 129, 0.85)',
              borderColor: '#059669',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${formatINR(Number(ctx.raw))}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'JetBrains Mono', size: 10 } }
            },
            y: {
              beginAtZero: true,
              ticks: {
                font: { family: 'JetBrains Mono', size: 10 },
                callback: (val) => formatINR(Number(val), { short: true })
              }
            }
          }
        }
      });
    }

    // 2. Region-wise Collection Chart (Donut)
    if (regionChartRef.current) {
      if (regionChartInstance.current) regionChartInstance.current.destroy();

      regionChartInstance.current = new Chart(regionChartRef.current, {
        type: 'doughnut',
        data: {
          labels: regionLabels,
          datasets: [
            {
              data: regionData,
              backgroundColor: ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { boxWidth: 10, font: { family: 'Plus Jakarta Sans', size: 11 } }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${formatINR(Number(ctx.raw))} (${formatINR(Number(ctx.raw), { short: true })})`
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // 3. State-wise Outstanding Chart (Horizontal Bar)
    if (stateChartRef.current) {
      if (stateChartInstance.current) stateChartInstance.current.destroy();

      stateChartInstance.current = new Chart(stateChartRef.current, {
        type: 'bar',
        data: {
          labels: stateLabels,
          datasets: [
            {
              label: 'Outstanding Debt (₹)',
              data: stateData,
              backgroundColor: 'rgba(239, 68, 68, 0.75)',
              borderColor: '#dc2626',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Outstanding: ${formatINR(Number(ctx.raw))}`
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                font: { family: 'JetBrains Mono', size: 10 },
                callback: (val) => formatINR(Number(val), { short: true })
              }
            },
            y: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } }
            }
          }
        }
      });
    }

    // 4. Ageing Bucket Chart
    if (ageingChartRef.current) {
      if (ageingChartInstance.current) ageingChartInstance.current.destroy();

      ageingChartInstance.current = new Chart(ageingChartRef.current, {
        type: 'bar',
        data: {
          labels: Object.keys(ageingBuckets),
          datasets: [
            {
              label: 'Outstanding in Bucket (₹)',
              data: Object.values(ageingBuckets),
              backgroundColor: [
                '#10b981', // Not Due
                '#3b82f6', // 1-30 Days
                '#f59e0b', // 31-60 Days
                '#f97316', // 61-90 Days
                '#ef4444'  // Above 90 Days
              ],
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` Amount: ${formatINR(Number(ctx.raw))}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } }
            },
            y: {
              beginAtZero: true,
              ticks: {
                font: { family: 'JetBrains Mono', size: 10 },
                callback: (val) => formatINR(Number(val), { short: true })
              }
            }
          }
        }
      });
    }

    return () => {
      weeklyChartInstance.current?.destroy();
      regionChartInstance.current?.destroy();
      stateChartInstance.current?.destroy();
      ageingChartInstance.current?.destroy();
    };
  }, [invoices, collections, customerSummaries]);

  return (
    <div className="space-y-6 mb-8">

      {/* Week-on-Week & High-Risk Deep Dive Insight Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* WoW Comparison */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider">
              Week-on-Week Realization
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-bold text-slate-900 font-mono">
                {formatINR(currentWeekColl, { short: true })}
              </span>
              <span className={`text-xs font-semibold ${wowChangePercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {wowChangePercent >= 0 ? `+${wowChangePercent.toFixed(1)}%` : `${wowChangePercent.toFixed(1)}%`} WoW
              </span>
            </div>
            <p className="text-3xs text-slate-400 truncate">
              Prior Week: {formatINR(prevWeekColl, { short: true })}
            </p>
          </div>
        </div>

        {/* High Risk Accounts Identified */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            highRiskAccounts.length > 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider">
              High-Risk Overdue Accounts
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-bold text-slate-900 font-mono">
                {highRiskAccounts.length} Customers
              </span>
              <span className="text-xs text-red-600 font-medium">
                (&gt;60 Days or Large Outstanding)
              </span>
            </div>
            <p className="text-3xs text-slate-400 truncate">
              Requires immediate legal / dunning notice
            </p>
          </div>
        </div>

        {/* Customer Delay Behaviour */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-2xs font-bold uppercase text-slate-500 tracking-wider">
              Avg Collection Delay
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-bold text-slate-900 font-mono">
                {overallAvgDelay} Days
              </span>
              <span className="text-xs text-slate-500">
                post due date
              </span>
            </div>
            <p className="text-3xs text-slate-400 truncate">
              National payment velocity benchmark
            </p>
          </div>
        </div>

      </div>

      {/* 4 Primary Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Weekly Billing vs Collection */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Weekly Billing vs Collection Trend
              </h3>
              <p className="text-2xs text-slate-500">Comparison of invoice billings vs payments realized per week</p>
            </div>
          </div>
          <div className="h-64 mt-4">
            <canvas ref={weeklyChartRef} />
          </div>
        </div>

        {/* Chart 2: Outstanding Ageing Analysis */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Outstanding Ageing Analysis (Buckets)
              </h3>
              <p className="text-2xs text-slate-500">Overdue debt distributed by ageing brackets</p>
            </div>
          </div>
          <div className="h-64 mt-4">
            <canvas ref={ageingChartRef} />
          </div>
        </div>

        {/* Chart 3: Region-wise Collection */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Region-wise Collection Performance
              </h3>
              <p className="text-2xs text-slate-500">PAN India regional collection share (North, South, East, West, Central)</p>
            </div>
          </div>
          <div className="h-64 mt-4">
            <canvas ref={regionChartRef} />
          </div>
        </div>

        {/* Chart 4: State-wise Outstanding */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Top States by Outstanding Balance
              </h3>
              <p className="text-2xs text-slate-500">Concentration of pending receivables across states</p>
            </div>
          </div>
          <div className="h-64 mt-4">
            <canvas ref={stateChartRef} />
          </div>
        </div>

      </div>

      {/* Top 10 Customers by Outstanding Table/List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Top 10 Customers by Outstanding Debt & Risk Profile
            </h3>
            <p className="text-2xs text-slate-500">
              Ranked by exposure with credit delay metrics and automated risk classification
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Region / State</th>
                <th className="py-2.5 px-3 text-right">Total Billing</th>
                <th className="py-2.5 px-3 text-right">Total Collection</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3 text-center">Collection %</th>
                <th className="py-2.5 px-3 text-center">Avg Delay</th>
                <th className="py-2.5 px-3 text-center">Risk Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {top10Customers.map((cust, i) => (
                <tr key={cust.customer} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2 px-3 font-mono text-slate-400">{i + 1}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{cust.customer}</td>
                  <td className="py-2 px-3 text-slate-600">{cust.region} · {cust.state}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">{formatINR(cust.totalBilling)}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-700 font-medium">{formatINR(cust.totalCollection)}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-red-700 font-semibold">{formatINR(cust.totalOutstanding)}</td>
                  <td className="py-2 px-3 text-center font-mono">
                    <span className="text-slate-800 font-medium">{cust.collectionPercentage.toFixed(1)}%</span>
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-600">
                    {cust.averagePaymentDelay}d
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
      </div>

    </div>
  );
};
