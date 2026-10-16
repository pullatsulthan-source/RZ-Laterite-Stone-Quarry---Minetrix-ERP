import React, { useState, useMemo } from 'react';
import { useQuarry } from '../../context/QuarryContext';
import { LoadOrder, Customer, PaymentMode } from '../../types/quarry';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Existing Views
import { OrderManagementView } from '../OrderManagementView';
import { LoadManagementView } from '../LoadManagementView';
import { CustomerManagementView } from '../CustomerManagementView';
import { CustomerAccountsView } from '../CustomerAccountsView';
import { RateMasterView } from '../RateMasterView';
import { PaymentsCollectionsView } from '../PaymentsCollectionsView';
import { StatementBillGeneratorView } from '../StatementBillGeneratorView';

import {
  FileText,
  Building2,
  Users2,
  Percent,
  MapPin,
  CreditCard,
  FileSpreadsheet,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Boxes,
  Truck,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export type OrderSubTab =
  | 'orders'
  | 'loads'
  | 'customers'
  | 'agents'
  | 'rate_master'
  | 'delivery'
  | 'payment_terms'
  | 'billing'
  | 'collections';

interface OrderModuleViewProps {
  onOpenNewLoad: (initialData?: Partial<LoadOrder>) => void;
  onViewGatePass: (gatePassNumber: string) => void;
  onViewCustomerLedger: (customerId: string) => void;
  onOpenStatementModal: (
    customer: Customer,
    dateRange: { from: string; to: string },
    options?: { vehicleNumber?: string; driverName?: string; materialFilter?: string }
  ) => void;
  onOpenPaymentModal: (customerId?: string) => void;
  initialTab?: OrderSubTab;
}

export const OrderModuleView: React.FC<OrderModuleViewProps> = ({
  onOpenNewLoad,
  onViewGatePass,
  onViewCustomerLedger,
  onOpenStatementModal,
  onOpenPaymentModal,
  initialTab = 'orders',
}) => {
  const { loads, customers, payments, stock, rates, orders } = useQuarry();

  const [activeTab, setActiveTab] = useState<OrderSubTab>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Dynamic Ordermen / Agents list computed from loads
  const ordermen = useMemo(() => {
    const agentMap = new Map<
      string,
      {
        name: string;
        ordersCount: number;
        totalBlocks: number;
        totalCommission: number;
        paidCommission: number;
      }
    >();

    // Default agents
    const standardAgents = [
      'Shafi (Agent)',
      'Latheef (Agent)',
      'Rasheed (Orderman)',
      'Babu (Orderman)',
      'Direct Order',
    ];

    standardAgents.forEach((name) => {
      agentMap.set(name, {
        name,
        ordersCount: 0,
        totalBlocks: 0,
        totalCommission: 0,
        paidCommission: 0,
      });
    });

    loads.forEach((l) => {
      const agent = l.agentName || (l.vehicleCategory === 'RZ Mining' ? 'Shafi (Agent)' : 'Direct Order');
      const existing = agentMap.get(agent) || {
        name: agent,
        ordersCount: 0,
        totalBlocks: 0,
        totalCommission: 0,
        paidCommission: 0,
      };
      existing.ordersCount += 1;
      existing.totalBlocks += l.quantity;
      const commission = l.orderCommission || (l.material === 'Laterite Stone — 3rd' ? 300 : 250);
      existing.totalCommission += commission;
      if (l.status === 'Settled' || l.paymentReceived > 0) {
        existing.paidCommission += commission;
      }
      agentMap.set(agent, existing);
    });

    return Array.from(agentMap.values());
  }, [loads]);

  // Order Metrics
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'PAID' && o.status !== 'CANCELLED').length;
  const dispatchedOrders = orders.filter((o) => o.status === 'DISPATCHED' || o.status === 'DELIVERED').length;
  const totalOrderRevenue = orders.reduce((sum, o) => sum + (o.grossAmount || 0), 0);
  const totalPaymentsReceived = orders.reduce((sum, o) => sum + (o.paymentReceived || 0), 0);
  const totalOutstanding = totalOrderRevenue - totalPaymentsReceived;

  const subTabs = [
    { id: 'orders', label: 'Stone Orders & Workflow', icon: FileText, badge: `${orders.length}` },
    { id: 'loads', label: 'Quarry Dispatches & Loads', icon: Truck, badge: `${loads.length}` },
    { id: 'customers', label: 'Customer Master', icon: Building2, badge: `${customers.length}` },
    { id: 'agents', label: 'Orderman & Commission', icon: Users2, badge: `${ordermen.length}` },
    { id: 'rate_master', label: 'Rate Master', icon: Percent },
    { id: 'delivery', label: 'Delivery & Dispatch', icon: MapPin },
    { id: 'payment_terms', label: 'Payment Terms', icon: CreditCard },
    { id: 'collections', label: 'Collections', icon: DollarSign },
    { id: 'billing', label: 'Customer Billing & Statements', icon: FileSpreadsheet, badge: 'A4' },
  ];

  return (
    <div className="space-y-6">
      {/* Module Master Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0d1813] via-[#0f1915] to-[#0c1611] border border-emerald-500/35 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-black flex items-center justify-center shadow-lg font-black">
              <FileText className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 font-bold">
                  MODULE 3
                </span>
                <span className="text-xs text-gray-400">Customer Orders, Billing, Agents & Delivery</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 mt-0.5 tracking-wide">
                ORDER MANAGEMENT
              </h1>
            </div>
          </div>

          {/* Module Action Shortcuts */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenNewLoad()}
              className="gold-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book Customer Order</span>
            </button>
          </div>
        </div>

        {/* Real-time Order Module Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1d3527]">
          <div className="p-3 rounded-2xl bg-[#08130d]/70 border border-[#1b3525]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Active Orders
            </span>
            <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">
              {activeOrders} Booked
            </span>
            <span className="text-[10px] text-gray-400">Awaiting Dispatch</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#08130d]/70 border border-[#1b3525]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Dispatched Today
            </span>
            <span className="text-lg font-black font-mono text-sky-400 mt-0.5 block">
              {dispatchedOrders} In Transit
            </span>
            <span className="text-[10px] text-gray-400">Gate Pass Issued</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#08130d]/70 border border-[#1b3525]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Total Order Sales
            </span>
            <span className="text-lg font-black font-mono text-[#f3c64c] mt-0.5 block">
              {formatCurrency(totalOrderRevenue)}
            </span>
            <span className="text-[10px] text-gray-400">Gross Billed Value</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#08130d]/70 border border-[#1b3525]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Receivables Balance
            </span>
            <span className="text-lg font-black font-mono text-rose-400 mt-0.5 block">
              {formatCurrency(totalOutstanding)}
            </span>
            <span className="text-[10px] text-gray-400">Customer Balance Due</span>
          </div>
        </div>
      </div>

      {/* Module Sub-Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#222736]">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OrderSubTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-[#090a0d] shadow-md shadow-emerald-500/25 font-black'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#141722] bg-[#0d0f15] border border-[#1e2332]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-black/30 text-black' : 'bg-[#1b202e] text-gray-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-View Content */}
      <div className="pt-1">
        {activeTab === 'orders' && (
          <OrderManagementView
            onOpenNewLoad={onOpenNewLoad}
            onViewGatePass={onViewGatePass}
            onViewCustomerLedger={onViewCustomerLedger}
          />
        )}

        {activeTab === 'loads' && (
          <div className="space-y-4">
            {/* Live Pipeline Flow Visualizer */}
            <div className="p-3.5 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-[#f3c64c] flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#d4af37]" />
                Transaction Pipeline:
              </span>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-[#181c28] border border-[#262c3e] text-gray-300 font-semibold">
                  1. Quarry Stock Allocation
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                <span className="px-2.5 py-1 rounded-lg bg-[#181c28] border border-[#262c3e] text-gray-300 font-semibold">
                  2. Vehicle / Driver Assign
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                <span className="px-2.5 py-1 rounded-lg bg-[#181c28] border border-[#262c3e] text-gray-300 font-semibold">
                  3. Gate Pass Dispatch
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                <span className="px-2.5 py-1 rounded-lg bg-[#181c28] border border-[#262c3e] text-emerald-400 font-semibold">
                  4. Site Delivery & Payment
                </span>
              </div>
            </div>

            <LoadManagementView
              onOpenNewLoad={onOpenNewLoad}
              onViewGatePass={onViewGatePass}
            />
          </div>
        )}

        {activeTab === 'customers' && (
          <CustomerManagementView onViewCustomerLedger={onViewCustomerLedger} />
        )}

        {activeTab === 'agents' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-cinzel text-gray-100">
                  Orderman & Sales Agent Commission Ledger
                </h3>
                <p className="text-xs text-gray-400">
                  Track orders brought by sales agents and ordermen with standard commission of ₹250 / load (₹1 / stone)
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-xl border border-emerald-800/40">
                Total Agents: {ordermen.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ordermen.map((agent) => (
                <div
                  key={agent.name}
                  className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] hover:border-emerald-500/40 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-100">{agent.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50">
                      {agent.ordersCount} Orders
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between text-gray-400">
                      <span>Total Stone Blocks:</span>
                      <span className="font-mono text-gray-200">{agent.totalBlocks.toLocaleString()} pcs</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Standard Commission:</span>
                      <span className="font-mono text-gray-200">₹250 / load</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Total Earned:</span>
                      <span className="font-mono font-bold text-white">{formatCurrency(agent.totalCommission)}</span>
                    </div>
                    <div className="flex justify-between border-t border-[#202534] pt-1">
                      <span className="text-emerald-400 font-semibold">Commission Paid / Settled:</span>
                      <span className="font-mono font-bold text-emerald-400">{formatCurrency(agent.paidCommission)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rate_master' && <RateMasterView />}

        {activeTab === 'delivery' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-cinzel text-gray-100">
                  Delivery & Dispatch Live Tracking
                </h3>
                <p className="text-xs text-gray-400">
                  Real-time status of orders dispatched from quarry to customer delivery sites
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#232736] bg-[#12141a]">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#161924] border-b border-[#232736] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="p-3.5">Order / Pass</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Destination Site</th>
                    <th className="p-3.5">Assigned Vehicle</th>
                    <th className="p-3.5">Driver</th>
                    <th className="p-3.5">Material & Quantity</th>
                    <th className="p-3.5">Dispatch Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2332]">
                  {loads.map((l) => (
                    <tr key={l.id} className="hover:bg-[#161a26] transition-colors">
                      <td className="p-3.5 font-mono">
                        <span className="text-white font-bold block">{l.loadNumber}</span>
                        {l.gatePassNumber && (
                          <span className="text-[10px] text-[#f3c64c] block">{l.gatePassNumber}</span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-gray-200">{l.customerName}</td>
                      <td className="p-3.5 text-gray-300 flex items-center gap-1.5 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{l.destination || 'Direct Site'}</span>
                      </td>
                      <td className="p-3.5 font-mono text-white">{l.vehicleNumber}</td>
                      <td className="p-3.5 text-gray-300">{l.driver}</td>
                      <td className="p-3.5 font-mono">
                        {l.quantity} {l.unit} ({l.material})
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.status === 'Delivered' || l.status === 'Settled'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : l.status === 'Gate Pass Generated' || l.status === 'Dispatched'
                            ? 'bg-sky-950 text-sky-400 border border-sky-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payment_terms' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736]">
              <h3 className="text-lg font-bold font-cinzel text-gray-100">
                Customer Payment Terms & Policies
              </h3>
              <p className="text-xs text-gray-400">
                Standard payment term contracts governing quarry material orders
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#12141a] border border-emerald-900/40 space-y-2">
                <span className="text-xs font-bold text-emerald-400 block uppercase">Cash on Delivery (COD)</span>
                <p className="text-xs text-gray-400">
                  Driver collects payment on site upon offloading stone. Remitted to quarry cash counter daily.
                </p>
                <div className="text-xs font-mono font-bold text-white pt-2 border-t border-[#1e2332]">
                  {loads.filter(l => !l.paymentTerms || l.paymentTerms === 'Cash on Delivery').length} Orders Under COD
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#12141a] border border-blue-900/40 space-y-2">
                <span className="text-xs font-bold text-blue-400 block uppercase">Immediate UPI / Bank</span>
                <p className="text-xs text-gray-400">
                  Customer initiates bank transfer or UPI payment directly to quarry account before release.
                </p>
                <div className="text-xs font-mono font-bold text-white pt-2 border-t border-[#1e2332]">
                  Direct Bank Remittance
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#12141a] border border-amber-900/40 space-y-2">
                <span className="text-xs font-bold text-amber-400 block uppercase">7-Day Credit</span>
                <p className="text-xs text-gray-400">
                  Approved builders and contractors with verified credit limit. Settled weekly via statement.
                </p>
                <div className="text-xs font-mono font-bold text-white pt-2 border-t border-[#1e2332]">
                  Weekly Reconciled
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#12141a] border border-purple-900/40 space-y-2">
                <span className="text-xs font-bold text-purple-400 block uppercase">15-Day Project Credit</span>
                <p className="text-xs text-gray-400">
                  Major infrastructure and government projects. Billed bi-weekly with formal A4 Tax Invoice.
                </p>
                <div className="text-xs font-mono font-bold text-white pt-2 border-t border-[#1e2332]">
                  Fortnightly Statement
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <PaymentsCollectionsView onOpenPaymentModal={() => onOpenPaymentModal()} />
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <StatementBillGeneratorView onOpenStatementModal={onOpenStatementModal} />
            <CustomerAccountsView
              onOpenStatementModal={onOpenStatementModal}
              onOpenPaymentModal={onOpenPaymentModal}
            />
          </div>
        )}
      </div>
    </div>
  );
};
