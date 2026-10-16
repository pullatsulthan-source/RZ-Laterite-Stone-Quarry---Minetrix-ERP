import React, { useState, useMemo } from 'react';
import { useQuarry } from '../context/QuarryContext';
import {
  DriverCollection,
  DriverCollectionSettlementStatus,
  PaymentMode,
  PaymentCollectionMode,
} from '../types/quarry';
import { formatCurrency, formatDate, getTodayDateString } from '../utils/formatters';
import {
  HandCoins,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Plus,
  Search,
  Filter,
  Truck,
  User,
  Calendar,
  ArrowRight,
  FileText,
  Building2,
  X,
  CreditCard,
  Eye,
  Check,
} from 'lucide-react';

interface DriverCollectionsViewProps {
  initialDriverFilter?: string;
  onViewOrder?: (orderId: string) => void;
}

export const DriverCollectionsView: React.FC<DriverCollectionsViewProps> = ({
  initialDriverFilter,
  onViewOrder,
}) => {
  const {
    driverCollections,
    addDriverCollection,
    settleDriverCollection,
    drivers,
    vehicles,
    customers,
    orders,
    currentUser,
  } = useQuarry();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DriverCollectionSettlementStatus>('ALL');
  const [driverFilter, setDriverFilter] = useState<string>(initialDriverFilter || 'ALL');

  // Settlement Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState<DriverCollection | null>(null);
  const [settleAmount, setSettleAmount] = useState<number | ''>('');
  const [settleNotes, setSettleNotes] = useState('');

  // New Collection Entry Modal State
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newOrderId, setNewOrderId] = useState('');
  const [newDriver, setNewDriver] = useState(drivers[0]?.name || 'Pasha');
  const [newVehicle, setNewVehicle] = useState(vehicles[0]?.vehicleNumber || '');
  const [newCustomer, setNewCustomer] = useState(customers[0]?.name || '');
  const [newCustomerId, setNewCustomerId] = useState(customers[0]?.id || '');
  const [newAmount, setNewAmount] = useState<number | ''>('');
  const [newDate, setNewDate] = useState(getTodayDateString());
  const [newPaymentMode, setNewPaymentMode] = useState<PaymentMode>('Cash');
  const [newRemarks, setNewRemarks] = useState('');

  // Auto-populate driver and vehicle when order is selected in New Collection Modal
  const handleOrderSelect = (ordId: string) => {
    setNewOrderId(ordId);
    const ord = orders.find((o) => o.id === ordId || o.orderId === ordId);
    if (ord) {
      if (ord.driver) setNewDriver(ord.driver);
      if (ord.assignedVehicle) setNewVehicle(ord.assignedVehicle);
      if (ord.customer) setNewCustomer(ord.customer);
      if (ord.customerId) setNewCustomerId(ord.customerId);
      if (ord.balance > 0) setNewAmount(ord.balance);
    }
  };

  // Filtered collections
  const filteredCollections = useMemo(() => {
    return driverCollections.filter((col) => {
      if (statusFilter !== 'ALL' && col.settlementStatus !== statusFilter) return false;
      if (driverFilter !== 'ALL' && col.driver !== driverFilter) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches =
          col.collectionId.toLowerCase().includes(term) ||
          col.orderId.toLowerCase().includes(term) ||
          col.driver.toLowerCase().includes(term) ||
          col.vehicle.toLowerCase().includes(term) ||
          col.customer.toLowerCase().includes(term) ||
          (col.remarks && col.remarks.toLowerCase().includes(term)) ||
          (col.paymentMode && col.paymentMode.toLowerCase().includes(term));
        if (!matches) return false;
      }

      return true;
    });
  }, [driverCollections, statusFilter, driverFilter, searchTerm]);

  // Aggregate Metrics
  const totalCollectionsCount = driverCollections.length;
  const totalCollectedAmount = driverCollections.reduce((sum, c) => sum + c.amount, 0);

  const totalUnsettledAmount = driverCollections
    .filter((c) => c.settlementStatus !== 'SETTLED')
    .reduce((sum, c) => sum + (c.unsettledAmount ?? (c.amount - (c.settledAmount || 0))), 0);

  const totalSettledAmount = driverCollections.reduce(
    (sum, c) => sum + (c.settledAmount || (c.settlementStatus === 'SETTLED' ? c.amount : 0)),
    0
  );

  const unsettledCount = driverCollections.filter((c) => c.settlementStatus === 'UNSETTLED').length;
  const partiallySettledCount = driverCollections.filter(
    (c) => c.settlementStatus === 'PARTIALLY SETTLED'
  ).length;

  // Open Settlement Modal
  const handleOpenSettle = (col: DriverCollection) => {
    setActiveCollection(col);
    const pending = col.unsettledAmount ?? (col.amount - (col.settledAmount || 0));
    setSettleAmount(pending);
    setSettleNotes(`Handover from ${col.driver} on ${getTodayDateString()}`);
    setSettleModalOpen(true);
  };

  // Submit Settlement
  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCollection || !settleAmount || Number(settleAmount) <= 0) return;

    settleDriverCollection(activeCollection.id, Number(settleAmount), settleNotes);
    setSettleModalOpen(false);
    setActiveCollection(null);
  };

  // Submit New Collection Entry
  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || Number(newAmount) <= 0) return;

    addDriverCollection({
      orderId: newOrderId || 'DIRECT-ON-SITE',
      driver: newDriver,
      vehicle: newVehicle,
      customer: newCustomer,
      customerId: newCustomerId,
      amount: Number(newAmount),
      date: newDate,
      paymentMode: newPaymentMode,
      settlementStatus: 'UNSETTLED',
      unsettledAmount: Number(newAmount),
      settledAmount: 0,
      remarks: newRemarks || `On-site cash collection by driver ${newDriver}`,
    });

    setNewModalOpen(false);
    setNewAmount('');
    setNewRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Workflow Logic Callout */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#141208] via-[#1a170b] to-[#121008] border border-amber-500/35 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center shadow-lg font-black">
              <HandCoins className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/50 font-bold">
                  DRIVER COLLECTION WORKFLOW
                </span>
                <span className="text-xs text-gray-400">
                  On-site Customer Collections → Handover & Company Settlement
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 mt-0.5 tracking-wide">
                Driver Payment Collections & Settlement
              </h1>
            </div>
          </div>

          {/* Action button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewModalOpen(true)}
              className="gold-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log Driver Collection</span>
            </button>
          </div>
        </div>

        {/* Operational Workflow Breadcrumb Rule */}
        <div className="mt-4 p-3 rounded-2xl bg-[#0a0a0d]/70 border border-amber-500/20 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-300">
            <span className="font-bold text-amber-400">Strict Operating Rule:</span>
            <span className="px-2 py-0.5 rounded bg-black/50 text-gray-300">Order Dispatched</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
            <span className="px-2 py-0.5 rounded bg-black/50 text-gray-300">Customer Delivery</span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
            <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 font-bold border border-amber-800/40">
              Driver Collects On-Site
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
            <span className="px-2 py-0.5 rounded bg-orange-950/60 text-orange-300 font-bold border border-orange-800/40 animate-pulse">
              UNSETTLED DRIVER COLLECTION
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/40">
              Company Settlement (Settled Cash)
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            ⚠️ Driver collection amounts are held in the driver’s custody upon site delivery. They are
            NOT credited to company cash accounts until the driver submits cash at the quarry office
            and company settlement is confirmed.
          </p>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-amber-500/20">
          <div className="p-3.5 rounded-2xl bg-[#0c0d12]/70 border border-[#232738]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Total Recorded Collections
            </span>
            <span className="text-xl font-black font-mono text-gray-100 mt-0.5 block">
              {formatCurrency(totalCollectedAmount)}
            </span>
            <span className="text-[10px] text-gray-400">{totalCollectionsCount} Site Receipts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-950/30 to-[#120f08] border border-orange-500/40">
            <span className="text-[10px] text-orange-400 uppercase font-bold tracking-wider block">
              Unsettled Driver Cash
            </span>
            <span className="text-xl font-black font-mono text-orange-400 mt-0.5 block">
              {formatCurrency(totalUnsettledAmount)}
            </span>
            <span className="text-[10px] text-orange-300/80">
              {unsettledCount + partiallySettledCount} Pending in Drivers&apos; Hand
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0c0d12]/70 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
              Settled Company Cash
            </span>
            <span className="text-xl font-black font-mono text-emerald-400 mt-0.5 block">
              {formatCurrency(totalSettledAmount)}
            </span>
            <span className="text-[10px] text-gray-400">Credited to Quarry Income</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0c0d12]/70 border border-[#232738]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Settlement Health
            </span>
            <span className="text-xl font-black font-mono text-[#f3c64c] mt-0.5 block">
              {totalCollectedAmount > 0
                ? `${Math.round((totalSettledAmount / totalCollectedAmount) * 100)}%`
                : '100%'}
            </span>
            <span className="text-[10px] text-gray-400">Remittance Completion</span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#11131a] p-3 rounded-2xl border border-[#232738]">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Collection ID, Order #, Driver, Customer..."
            className="w-full bg-[#161924] border border-[#262c3e] rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'ALL' | DriverCollectionSettlementStatus)
            }
            className="bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-1.5 text-xs text-gray-200 font-bold focus:outline-none focus:border-[#d4af37]"
          >
            <option value="ALL">All Settlement Statuses</option>
            <option value="UNSETTLED">UNSETTLED Only (Driver Holding Cash)</option>
            <option value="PARTIALLY SETTLED">PARTIALLY SETTLED</option>
            <option value="SETTLED">SETTLED (Remitted to Office)</option>
          </select>

          {/* Driver Filter */}
          <select
            value={driverFilter}
            onChange={(e) => setDriverFilter(e.target.value)}
            className="bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#d4af37]"
          >
            <option value="ALL">All Drivers</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name} ({d.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Driver Collections Table */}
      <div className="bg-[#11131a] rounded-2xl border border-[#232738] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#161924] border-b border-[#232738] text-gray-400 text-[11px] uppercase tracking-wider">
                <th className="p-3.5">Collection ID</th>
                <th className="p-3.5">Order ID</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Driver & Vehicle</th>
                <th className="p-3.5">Customer / Site</th>
                <th className="p-3.5 text-right">Collected (₹)</th>
                <th className="p-3.5 text-center">Settlement Status</th>
                <th className="p-3.5 text-right">Unsettled Due (₹)</th>
                <th className="p-3.5">Settlement Info</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2332]">
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-500">
                    No driver collections found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredCollections.map((col) => {
                  const pendingDue =
                    col.unsettledAmount ?? (col.amount - (col.settledAmount || 0));
                  const isUnsettled = col.settlementStatus === 'UNSETTLED';
                  const isPartial = col.settlementStatus === 'PARTIALLY SETTLED';
                  const isSettled = col.settlementStatus === 'SETTLED';

                  return (
                    <tr
                      key={col.id}
                      className={`hover:bg-[#151824] transition-colors ${
                        isUnsettled ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      {/* Collection ID */}
                      <td className="p-3.5 font-mono font-bold text-amber-400">
                        {col.collectionId}
                      </td>

                      {/* Order ID */}
                      <td className="p-3.5 font-mono">
                        {col.orderId ? (
                          <button
                            onClick={() => onViewOrder && onViewOrder(col.orderId)}
                            className="text-sky-400 hover:underline font-bold"
                            title="Click to view order details"
                          >
                            {col.orderId}
                          </button>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-3.5 font-mono text-gray-300">{formatDate(col.date)}</td>

                      {/* Driver & Vehicle */}
                      <td className="p-3.5">
                        <div className="font-bold text-gray-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{col.driver}</span>
                        </div>
                        <div className="font-mono text-gray-400 text-[10px] flex items-center gap-1 mt-0.5">
                          <Truck className="w-3 h-3 text-gray-500 shrink-0" />
                          <span>{col.vehicle}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5 max-w-xs">
                        <div className="text-gray-200 font-semibold truncate" title={col.customer}>
                          {col.customer}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                          Mode: {col.paymentMode || 'Cash'}
                        </div>
                      </td>

                      {/* Collected Amount */}
                      <td className="p-3.5 text-right font-mono font-bold text-gray-100 text-sm">
                        {formatCurrency(col.amount)}
                      </td>

                      {/* Settlement Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider ${
                            isUnsettled
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50 animate-pulse'
                              : isPartial
                              ? 'bg-orange-950/80 text-orange-300 border border-orange-600/50'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                          }`}
                        >
                          {col.settlementStatus}
                        </span>
                      </td>

                      {/* Unsettled Due */}
                      <td className="p-3.5 text-right font-mono">
                        {pendingDue > 0 ? (
                          <span className="font-bold text-orange-400">
                            {formatCurrency(pendingDue)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-bold">₹0 (Cleared)</span>
                        )}
                      </td>

                      {/* Settlement Info */}
                      <td className="p-3.5 text-xs text-gray-400">
                        {isSettled ? (
                          <div>
                            <span className="text-emerald-400 font-semibold block text-[11px]">
                              Settled on {col.settlementDate ? formatDate(col.settlementDate) : '—'}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              By: {col.settledBy || 'Nafid'}
                            </span>
                          </div>
                        ) : isPartial ? (
                          <div>
                            <span className="text-orange-400 font-semibold block text-[11px]">
                              Paid {formatCurrency(col.settledAmount || 0)}
                            </span>
                            <span className="text-[10px] text-gray-500 block">
                              Balance: {formatCurrency(pendingDue)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-amber-400/90 text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>In Driver&apos;s Hand</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        {!isSettled ? (
                          <button
                            onClick={() => handleOpenSettle(col)}
                            className="gold-btn px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto shadow cursor-pointer"
                            title="Confirm cash receipt from driver and settle into company cash"
                          >
                            <HandCoins className="w-3.5 h-3.5" />
                            <span>Settle</span>
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Settled</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: Settle Driver Collection (Converts to Company Cash) */}
      {settleModalOpen && activeCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121520] border border-[#2b334a] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#23293e] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <HandCoins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-cinzel font-bold text-base text-gray-100">
                    Company Cash Settlement
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Handover from Driver {activeCollection.driver} • {activeCollection.collectionId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSettleModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-4">
              {/* Collection Summary Box */}
              <div className="p-3.5 rounded-xl bg-[#0c0e14] border border-[#202638] text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="font-mono font-bold text-sky-400">{activeCollection.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer:</span>
                  <span className="font-bold text-white">{activeCollection.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Driver & Vehicle:</span>
                  <span className="text-amber-400 font-medium">
                    {activeCollection.driver} ({activeCollection.vehicle})
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#1a1f2e]">
                  <span className="text-gray-400">Total Collected On Site:</span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(activeCollection.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Already Settled:</span>
                  <span className="font-mono text-emerald-400">
                    {formatCurrency(activeCollection.settledAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#1a1f2e]">
                  <span className="text-orange-400 font-bold">Unsettled Due from Driver:</span>
                  <span className="font-mono font-black text-orange-400 text-sm">
                    {formatCurrency(
                      activeCollection.unsettledAmount ??
                        (activeCollection.amount - (activeCollection.settledAmount || 0))
                    )}
                  </span>
                </div>
              </div>

              {/* Amount to Settle */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Amount Received at Quarry Counter (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    activeCollection.unsettledAmount ??
                    (activeCollection.amount - (activeCollection.settledAmount || 0))
                  }
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value) || '')}
                  className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Settlement Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Settlement Notes / Quarry Counter Receipt
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Full cash handover received at gate office"
                  className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300">
                ✓ Once confirmed, {formatCurrency(Number(settleAmount) || 0)} will be transferred from
                driver custody into settled quarry cash (Quarry Income Counter).
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23293e]">
                <button
                  type="button"
                  onClick={() => setSettleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-400 text-black hover:bg-emerald-300 font-black shadow-md shadow-emerald-400/20 cursor-pointer"
                >
                  Confirm & Credit to Quarry Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Manual Driver Collection Log */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121520] border border-[#2b334a] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#23293e] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <HandCoins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-cinzel font-bold text-base text-gray-100">
                    Log Driver-Based Payment Collection
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Order Delivery → Driver Collects → UNSETTLED DRIVER COLLECTION
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNewModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-3.5">
              {/* Optional Link to Existing Order */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Link to Order (Optional — Auto-populates fields)
                </label>
                <select
                  value={newOrderId}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Manual Entry / Direct On-Site --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.orderId}>
                      {o.orderId} • {o.customer} ({o.assignedVehicle || 'No Fleet'} • Due:{' '}
                      {formatCurrency(o.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver & Vehicle */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Collecting Driver *
                  </label>
                  <select
                    value={newDriver}
                    onChange={(e) => {
                      const dName = e.target.value;
                      setNewDriver(dName);
                      const d = drivers.find((drv) => drv.name === dName);
                      if (d && d.vehicle) setNewVehicle(d.vehicle);
                    }}
                    required
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Customer & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Collection Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Amount & Mode */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Amount Collected (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value) || '')}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Payment Mode
                  </label>
                  <select
                    value={newPaymentMode}
                    onChange={(e) => setNewPaymentMode(e.target.value as PaymentMode)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Cash">Cash (Driver Custody)</option>
                    <option value="UPI">UPI / GPay to Driver Phone</option>
                    <option value="Bank">Direct Transfer</option>
                    <option value="Cheque">Customer Cheque Handover</option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Remarks / Site Location
                </label>
                <input
                  type="text"
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  placeholder="e.g. Paid in full upon unloading at Perinthalmanna site"
                  className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300">
                ⚠️ This entry will be created as <strong>UNSETTLED</strong>. Company cash ledger will
                NOT be modified until the driver settles this amount with the quarry counter.
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23293e]">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 font-black shadow-md shadow-amber-400/20 cursor-pointer"
                >
                  Log Collection Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
