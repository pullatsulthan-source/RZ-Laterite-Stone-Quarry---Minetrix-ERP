import React, { useState, useMemo } from 'react';
import { useQuarry } from '../context/QuarryContext';
import { formatCurrency, formatNumber, formatDate, getTodayDateString } from '../utils/formatters';
import { Users, DollarSign, Plus, CheckCircle2, HandCoins, Truck, Clock, X } from 'lucide-react';
import { DriverCollection } from '../types/quarry';

export const DriverAccountsView: React.FC = () => {
  const {
    drivers,
    loads,
    expenses,
    addQuarryExpense,
    currentUser,
    driverCollections,
    settleDriverCollection,
  } = useQuarry();

  const [selectedDriverName, setSelectedDriverName] = useState<string>(
    drivers[0]?.name || ''
  );
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payRemarks, setPayRemarks] = useState('');

  // Settlement Modal for Driver Handover
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [activeCollectionToSettle, setActiveCollectionToSettle] = useState<DriverCollection | null>(null);
  const [collectionSettleAmount, setCollectionSettleAmount] = useState<number | ''>('');
  const [collectionSettleNotes, setCollectionSettleNotes] = useState('');

  // Compute stats per driver
  const driverAccounts = useMemo(() => {
    return drivers.map((drv) => {
      const drvLoads = loads.filter((l) => l.driver === drv.name);
      const trips = drvLoads.length;
      const totalQty = drvLoads.reduce((sum, l) => sum + l.quantity, 0);

      // Total earned batta
      const totalBattaEarned = drvLoads.reduce((sum, l) => sum + l.driverBatta, 0);

      // Payments made to driver (tracked in expenses tagged to driver)
      const drvExpenses = expenses.filter((e) => e.driverName === drv.name);
      const totalPaidOut = drvExpenses.reduce((sum, e) => sum + e.amount, 0);

      const balance = totalBattaEarned - totalPaidOut;

      // On-site Driver Collections
      const drvCols = driverCollections.filter((c) => c.driver === drv.name);
      const totalCollected = drvCols.reduce((sum, c) => sum + c.amount, 0);
      const unsettledCash = drvCols.reduce(
        (sum, c) => sum + (c.unsettledAmount ?? (c.amount - (c.settledAmount || 0))),
        0
      );
      const settledCash = drvCols.reduce((sum, c) => sum + (c.settledAmount || 0), 0);

      return {
        driver: drv,
        trips,
        totalQty,
        totalBattaEarned,
        totalPaidOut,
        balance,
        loads: drvLoads,
        expensesList: drvExpenses,
        collections: drvCols,
        totalCollected,
        unsettledCash,
        settledCash,
      };
    });
  }, [drivers, loads, expenses, driverCollections]);

  const activeAccount =
    driverAccounts.find((a) => a.driver.name === selectedDriverName) || driverAccounts[0];

  const handlePayDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || !activeAccount) return;

    addQuarryExpense({
      date: getTodayDateString(),
      category: 'Driver Expense',
      description: `Driver Batta Settlement / Cash to ${activeAccount.driver.name} (${payRemarks || 'Trip Batta'})`,
      amount: Number(payAmount),
      paymentMode: 'Cash',
      driverName: activeAccount.driver.name,
      vehicleNumber: activeAccount.driver.vehicle,
      enteredBy: currentUser,
    });

    setPayModalOpen(false);
    setPayAmount('');
    setPayRemarks('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-xl font-bold font-cinzel text-gray-100">
              Driver Accounts & Trip Batta Ledger
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Auto-calculated trip allowances (₹600/load for RZ Mining), cash disbursements & net balances
          </p>
        </div>

        {/* Driver Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#161924] p-1 rounded-xl border border-[#262c3e]">
          {drivers.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDriverName(d.name)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedDriverName === d.name
                  ? 'bg-[#d4af37] text-black font-bold shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {d.name} ({d.category})
            </button>
          ))}
        </div>
      </div>

      {/* Selected Driver Overview Cards */}
      {activeAccount && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-[#12141a] border border-[#232736]">
            <div className="text-[10px] text-gray-400">Total Trips Completed</div>
            <div className="text-2xl font-bold font-mono text-gray-100">{activeAccount.trips}</div>
            <div className="text-[10px] text-gray-500">{formatNumber(activeAccount.totalQty)} pcs delivered</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#12141a] border border-[#d4af37]/30">
            <div className="text-[10px] text-[#d4af37]">Total Batta Earned</div>
            <div className="text-2xl font-bold font-mono text-[#f3c64c]">{formatCurrency(activeAccount.totalBattaEarned)}</div>
            <div className="text-[10px] text-gray-500">From Gate Pass dispatches</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#12141a] border border-[#232736]">
            <div className="text-[10px] text-gray-400">Paid Out / Advance</div>
            <div className="text-2xl font-bold font-mono text-rose-400">{formatCurrency(activeAccount.totalPaidOut)}</div>
            <div className="text-[10px] text-gray-500">Cash / fuel allocations</div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#12141a] to-[#151c14] border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-emerald-400 font-bold">Payable Batta</div>
              <div className="text-2xl font-bold font-mono text-emerald-400">{formatCurrency(activeAccount.balance)}</div>
              <div className="text-[10px] text-gray-400">Balance due driver</div>
            </div>
            <button
              onClick={() => {
                setPayAmount(activeAccount.balance > 0 ? activeAccount.balance : '');
                setPayModalOpen(true);
              }}
              className="gold-btn px-2.5 py-1.5 rounded-lg text-xs font-bold"
            >
              Pay
            </button>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              activeAccount.unsettledCash > 0
                ? 'bg-gradient-to-br from-amber-950/40 to-[#18130a] border-amber-500/50'
                : 'bg-[#12141a] border-[#232736]'
            }`}
          >
            <div>
              <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                {activeAccount.unsettledCash > 0 && <Clock className="w-3 h-3 text-amber-400 animate-spin" />}
                <span>Unsettled On-Site Cash</span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {formatCurrency(activeAccount.unsettledCash)}
              </div>
              <div className="text-[10px] text-gray-400">Cash held in pocket</div>
            </div>
            {activeAccount.unsettledCash > 0 && (
              <button
                onClick={() => {
                  const firstUnsettled = activeAccount.collections.find(
                    (c) => c.settlementStatus !== 'SETTLED'
                  );
                  if (firstUnsettled) {
                    setActiveCollectionToSettle(firstUnsettled);
                    setCollectionSettleAmount(
                      firstUnsettled.unsettledAmount ??
                        (firstUnsettled.amount - (firstUnsettled.settledAmount || 0))
                    );
                    setCollectionSettleNotes(`Handover from driver ${activeAccount.driver.name}`);
                    setSettleModalOpen(true);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 font-black shadow-md cursor-pointer"
              >
                Settle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Driver Accounts Summary Table */}
      <div className="bg-[#12141a] rounded-2xl border border-[#232736] p-4 space-y-3">
        <h3 className="font-cinzel font-bold text-sm text-gray-200">
          All Quarry Drivers Batta & Balance Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#161924] border-b border-[#232736] text-gray-400 text-[11px]">
                <th className="p-2.5">Driver</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">Vehicle</th>
                <th className="p-2.5 text-right">Trips</th>
                <th className="p-2.5 text-right">Total Quantity</th>
                <th className="p-2.5 text-right">Batta Earned (₹)</th>
                <th className="p-2.5 text-right">Paid Out (₹)</th>
                <th className="p-2.5 text-right">Current Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2230]">
              {driverAccounts.map((acc) => (
                <tr
                  key={acc.driver.id}
                  onClick={() => setSelectedDriverName(acc.driver.name)}
                  className={`cursor-pointer transition-colors ${
                    selectedDriverName === acc.driver.name
                      ? 'bg-[#181d2a]'
                      : 'hover:bg-[#161924]'
                  }`}
                >
                  <td className="p-2.5 font-bold text-gray-100">{acc.driver.name}</td>
                  <td className="p-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.driver.category === 'RZ Mining'
                          ? 'bg-[#d4af37]/15 text-[#f3c64c]'
                          : 'bg-blue-900/20 text-blue-400'
                      }`}
                    >
                      {acc.driver.category}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-gray-300">{acc.driver.vehicle}</td>
                  <td className="p-2.5 text-right font-mono font-bold">{acc.trips}</td>
                  <td className="p-2.5 text-right font-mono">{formatNumber(acc.totalQty)} pcs</td>
                  <td className="p-2.5 text-right font-mono font-bold text-[#f3c64c]">{formatCurrency(acc.totalBattaEarned)}</td>
                  <td className="p-2.5 text-right font-mono text-rose-400">{formatCurrency(acc.totalPaidOut)}</td>
                  <td className="p-2.5 text-right font-mono font-black text-emerald-400">{formatCurrency(acc.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* On-Site Collections Table for Active Driver */}
      {activeAccount && (
        <div className="bg-[#12141a] rounded-2xl border border-[#232736] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-cinzel font-bold text-sm text-gray-200 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>On-Site Payment Collections by {activeAccount.driver.name}</span>
              </h3>
              <p className="text-xs text-gray-400">
                Driver collection entries on stone delivery sites. Unsettled cash must be handed over to quarry office counter.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#161924] border border-[#262c3e] text-gray-300">
                Total Collected: {formatCurrency(activeAccount.totalCollected)}
              </span>
              {activeAccount.unsettledCash > 0 && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-orange-950/60 border border-orange-800/40 text-orange-400 animate-pulse">
                  Unsettled: {formatCurrency(activeAccount.unsettledCash)}
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#161924] border-b border-[#232736] text-gray-400 text-[11px]">
                  <th className="p-2.5">Collection ID</th>
                  <th className="p-2.5">Order ID</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-right">Unsettled Due</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2230]">
                {activeAccount.collections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">
                      No on-site collections logged for {activeAccount.driver.name} yet.
                    </td>
                  </tr>
                ) : (
                  activeAccount.collections.map((col) => {
                    const pendingDue = col.unsettledAmount ?? (col.amount - (col.settledAmount || 0));
                    const isSettled = col.settlementStatus === 'SETTLED';
                    return (
                      <tr key={col.id} className="hover:bg-[#161924]">
                        <td className="p-2.5 font-mono font-bold text-amber-400">{col.collectionId}</td>
                        <td className="p-2.5 font-mono text-gray-300">{col.orderId}</td>
                        <td className="p-2.5 font-mono text-gray-400">{formatDate(col.date)}</td>
                        <td className="p-2.5 font-bold text-gray-200">{col.customer}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-white">{formatCurrency(col.amount)}</td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              col.settlementStatus === 'UNSETTLED'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50 animate-pulse'
                                : col.settlementStatus === 'PARTIALLY SETTLED'
                                ? 'bg-orange-950/80 text-orange-300 border border-orange-600/50'
                                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                            }`}
                          >
                            {col.settlementStatus}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-orange-400">
                          {pendingDue > 0 ? formatCurrency(pendingDue) : '₹0'}
                        </td>
                        <td className="p-2.5 text-center">
                          {!isSettled ? (
                            <button
                              onClick={() => {
                                setActiveCollectionToSettle(col);
                                setCollectionSettleAmount(pendingDue);
                                setCollectionSettleNotes(`Handover from driver ${activeAccount.driver.name}`);
                                setSettleModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 cursor-pointer"
                            >
                              Settle Handover
                            </button>
                          ) : (
                            <span className="text-emerald-400 font-bold text-[11px] flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
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
      )}

      {/* Payment / Settlement Modal */}
      {payModalOpen && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101218] border border-[#262c3e] w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="font-cinzel font-bold text-base text-gray-100">
              Pay Trip Batta to {activeAccount.driver.name}
            </h3>
            <p className="text-xs text-gray-400">
              Disburse cash/advance and record immediately in quarry accounts
            </p>

            <form onSubmit={handlePayDriver} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Amount to Disburse (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || '')}
                  className="w-full bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-[#d4af37]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Remarks / Purpose
                </label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  placeholder="e.g. Weekly batta settlement"
                  className="w-full bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-btn px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Handover Settlement Modal */}
      {settleModalOpen && activeCollectionToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#101218] border border-[#262c3e] w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#23293e] pb-2">
              <div className="flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-emerald-400" />
                <h3 className="font-cinzel font-bold text-base text-gray-100">
                  Settle Driver Handover
                </h3>
              </div>
              <button
                onClick={() => setSettleModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Receive on-site cash from {activeCollectionToSettle.driver} for order{' '}
              <span className="font-mono text-amber-400">{activeCollectionToSettle.orderId}</span> (
              {activeCollectionToSettle.customer})
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!collectionSettleAmount || Number(collectionSettleAmount) <= 0) return;
                settleDriverCollection(
                  activeCollectionToSettle.id,
                  Number(collectionSettleAmount),
                  collectionSettleNotes
                );
                setSettleModalOpen(false);
                setActiveCollectionToSettle(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Handover Amount Received (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    activeCollectionToSettle.unsettledAmount ??
                    (activeCollectionToSettle.amount - (activeCollectionToSettle.settledAmount || 0))
                  }
                  value={collectionSettleAmount}
                  onChange={(e) => setCollectionSettleAmount(Number(e.target.value) || '')}
                  className="w-full bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-[#d4af37]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Settlement Notes / Counter Ref
                </label>
                <input
                  type="text"
                  value={collectionSettleNotes}
                  onChange={(e) => setCollectionSettleNotes(e.target.value)}
                  placeholder="e.g. Received at quarry counter office"
                  className="w-full bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300">
                ✓ Converts driver-held cash to verified company cash in Quarry Income.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSettleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-400 text-black hover:bg-emerald-300 font-black shadow-md cursor-pointer"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
