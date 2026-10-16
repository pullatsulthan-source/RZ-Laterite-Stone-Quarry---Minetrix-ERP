import React, { useState, useMemo } from 'react';
import { useQuarry } from '../context/QuarryContext';
import {
  Vehicle,
  VehicleOwnerType,
  VehicleTransaction,
  VehicleTransactionType,
  VehicleIncomeCategory,
  VehicleExpenseCategory,
  VehicleReceivableCategory,
  VehiclePayableCategory,
  PaymentMode,
} from '../types/quarry';
import {
  computeVehicleAccount,
  resolveVehicleOwnerType,
} from '../utils/vehicleAccountingEngine';
import { formatCurrency, formatNumber, formatDate, getTodayDateString, getCurrentTimeString } from '../utils/formatters';
import {
  Car,
  TrendingUp,
  TrendingDown,
  Building2,
  Truck,
  Plus,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Edit2,
  X,
  Calendar,
  DollarSign,
  User,
  Info,
} from 'lucide-react';

export const VehicleAccountsView: React.FC = () => {
  const {
    vehicles,
    loads,
    vehicleTransactions,
    addVehicleTransaction,
    updateVehicleTransaction,
    deleteVehicleTransaction,
    updateVehicleOwnerType,
    currentUser,
  } = useQuarry();

  // Filter fleet by ownership
  const [fleetFilter, setFleetFilter] = useState<'ALL' | 'COMPANY' | 'OUTSIDE'>('ALL');
  const [selectedVehicleNum, setSelectedVehicleNum] = useState<string>(
    vehicles[0]?.vehicleNumber || ''
  );
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('ALL');

  // Modal states
  const [showAddTxnModal, setShowAddTxnModal] = useState(false);
  const [showEditOwnerModal, setShowEditOwnerModal] = useState(false);

  // New Transaction Form State
  const [txnType, setTxnType] = useState<VehicleTransactionType>('Income');
  const [txnCategory, setTxnCategory] = useState<string>('Trip income');
  const [txnAmount, setTxnAmount] = useState<string>('');
  const [txnDate, setTxnDate] = useState<string>(getTodayDateString());
  const [txnTime, setTxnTime] = useState<string>(getCurrentTimeString());
  const [txnCounterParty, setTxnCounterParty] = useState<string>('');
  const [txnRefId, setTxnRefId] = useState<string>('');
  const [txnPaymentMode, setTxnPaymentMode] = useState<PaymentMode>('Cash');
  const [txnDescription, setTxnDescription] = useState<string>('');
  const [txnStatus, setTxnStatus] = useState<'Cleared' | 'Pending' | 'Settled'>('Cleared');

  // Edit Ownership Form State
  const [editOwnerType, setEditOwnerType] = useState<VehicleOwnerType>('COMPANY');
  const [editOwnerName, setEditOwnerName] = useState<string>('');

  // Auto-select first vehicle if selectedVehicleNum is missing or removed
  const activeVehicle = useMemo(() => {
    return (
      vehicles.find(
        (v) => v.vehicleNumber.trim().toUpperCase() === selectedVehicleNum.trim().toUpperCase()
      ) || vehicles[0]
    );
  }, [vehicles, selectedVehicleNum]);

  // Compute unified account for every vehicle using identical logic
  const allVehicleAccounts = useMemo(() => {
    return vehicles.map((veh) => computeVehicleAccount(veh, vehicleTransactions, loads));
  }, [vehicles, vehicleTransactions, loads]);

  // Filtered vehicles for list display
  const displayedVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const oType = resolveVehicleOwnerType(v);
      if (fleetFilter === 'ALL') return true;
      return oType === fleetFilter;
    });
  }, [vehicles, fleetFilter]);

  // Active vehicle's account
  const activeAccount = useMemo(() => {
    if (!activeVehicle) return null;
    return (
      allVehicleAccounts.find(
        (acc) =>
          acc.vehicleNumber.trim().toUpperCase() === activeVehicle.vehicleNumber.trim().toUpperCase()
      ) || computeVehicleAccount(activeVehicle, vehicleTransactions, loads)
    );
  }, [activeVehicle, allVehicleAccounts, vehicleTransactions, loads]);

  // Active vehicle's transactions filtered
  const displayedTransactions = useMemo(() => {
    if (!activeAccount) return [];
    let list = [...activeAccount.transactions];
    if (transactionTypeFilter !== 'ALL') {
      list = list.filter((t) => t.type === transactionTypeFilter);
    }
    return list.sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
  }, [activeAccount, transactionTypeFilter]);

  // Fleet wide aggregations
  const fleetSummary = useMemo(() => {
    let companyCount = 0;
    let outsideCount = 0;
    let totalFleetIncome = 0;
    let totalFleetExpenses = 0;
    let totalFleetReceivables = 0;
    let totalFleetPayables = 0;

    allVehicleAccounts.forEach((acc) => {
      if (acc.ownerType === 'COMPANY') companyCount++;
      else outsideCount++;

      totalFleetIncome += acc.income.totalIncome;
      totalFleetExpenses += acc.expenses.totalExpenses;
      totalFleetReceivables += acc.receivables.totalReceivables;
      totalFleetPayables += acc.payables.totalPayables;
    });

    return {
      totalVehicles: vehicles.length,
      companyCount,
      outsideCount,
      totalFleetIncome,
      totalFleetExpenses,
      totalFleetReceivables,
      totalFleetPayables,
      fleetNetProfit: totalFleetIncome - totalFleetExpenses,
      fleetNetBalance:
        totalFleetIncome + totalFleetReceivables - (totalFleetExpenses + totalFleetPayables),
    };
  }, [vehicles, allVehicleAccounts]);

  // Handle open add transaction modal
  const handleOpenAddTxn = (defaultType?: VehicleTransactionType) => {
    const t = defaultType || 'Income';
    setTxnType(t);
    if (t === 'Income') setTxnCategory('Trip income');
    else if (t === 'Expense') setTxnCategory('Fuel');
    else if (t === 'Receivable') setTxnCategory('Customer pending');
    else setTxnCategory('Driver');

    setTxnAmount('');
    setTxnDate(getTodayDateString());
    setTxnTime(getCurrentTimeString());
    setTxnCounterParty(
      t === 'Expense' ? (activeVehicle?.driver || '') : (activeVehicle?.owner || '')
    );
    setTxnRefId('');
    setTxnPaymentMode('Cash');
    setTxnDescription('');
    setTxnStatus(t === 'Receivable' || t === 'Payable' ? 'Pending' : 'Cleared');
    setShowAddTxnModal(true);
  };

  // Submit new transaction
  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle || !txnAmount || Number(txnAmount) <= 0) return;

    const ownerType = resolveVehicleOwnerType(activeVehicle);

    await addVehicleTransaction({
      date: txnDate,
      time: txnTime,
      vehicleNumber: activeVehicle.vehicleNumber,
      ownerType,
      type: txnType,
      category: txnCategory as any,
      description:
        txnDescription.trim() ||
        `${txnCategory} for ${activeVehicle.vehicleNumber} (${activeVehicle.driver})`,
      amount: Number(txnAmount),
      status: txnStatus,
      referenceId: txnRefId.trim() || undefined,
      counterParty: txnCounterParty.trim() || undefined,
      paymentMode: txnPaymentMode,
      enteredBy: currentUser,
    });

    setShowAddTxnModal(false);
  };

  // Handle open edit ownership
  const handleOpenEditOwner = () => {
    if (!activeVehicle) return;
    setEditOwnerType(resolveVehicleOwnerType(activeVehicle));
    setEditOwnerName(activeVehicle.owner || '');
    setShowEditOwnerModal(true);
  };

  // Save ownership change
  const handleSaveOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle) return;

    await updateVehicleOwnerType(
      activeVehicle.vehicleNumber,
      editOwnerType,
      editOwnerName.trim() || (editOwnerType === 'COMPANY' ? 'RZ Mining' : activeVehicle.owner)
    );

    setShowEditOwnerModal(false);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#10131b] border border-[#232736] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 text-amber-400">
                <Car className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 tracking-wide">
                Vehicle Accounts Engine
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Universal Accounting Standard
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 max-w-2xl leading-relaxed">
              Company-owned vehicles and outside-owned vehicles calculate through the{' '}
              <span className="text-amber-400 font-bold">identical transaction model</span>.
              Ownership information (<span className="text-amber-300 font-mono">COMPANY</span> vs{' '}
              <span className="text-sky-300 font-mono">OUTSIDE</span>) does not alter the accounting
              formula. Historical transactions are permanently preserved.
            </p>
          </div>

          {/* Quick Fleet Metrics Pill */}
          <div className="grid grid-cols-3 gap-2 shrink-0 bg-[#0c0e14] p-2 rounded-xl border border-[#1f2537]">
            <div className="text-center px-2 py-1">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Total Fleet</div>
              <div className="text-base font-bold font-mono text-gray-100">
                {fleetSummary.totalVehicles}
              </div>
            </div>
            <div className="text-center px-2 py-1 border-x border-[#1e2333]">
              <div className="text-[10px] text-amber-400 uppercase font-semibold">Company</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {fleetSummary.companyCount}
              </div>
            </div>
            <div className="text-center px-2 py-1">
              <div className="text-[10px] text-sky-400 uppercase font-semibold">Outside</div>
              <div className="text-base font-bold font-mono text-sky-400">
                {fleetSummary.outsideCount}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Fleet Filter & Vehicle Selection Strip */}
      <div className="p-3.5 rounded-2xl bg-[#12151f] border border-[#232736] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Ownership Type Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-[#0a0c12] p-1 rounded-xl border border-[#1c2233]">
          <button
            onClick={() => setFleetFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              fleetFilter === 'ALL'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            All Fleet ({vehicles.length})
          </button>
          <button
            onClick={() => setFleetFilter('COMPANY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              fleetFilter === 'COMPANY'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Building2 className="w-3 h-3" />
            Company ({fleetSummary.companyCount})
          </button>
          <button
            onClick={() => setFleetFilter('OUTSIDE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              fleetFilter === 'OUTSIDE'
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow'
                : 'text-sky-400/80 hover:text-sky-300'
            }`}
          >
            <Truck className="w-3 h-3" />
            Outside ({fleetSummary.outsideCount})
          </button>
        </div>

        {/* Vehicle Quick Tabs Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {displayedVehicles.map((v) => {
            const oType = resolveVehicleOwnerType(v);
            const isSelected =
              activeVehicle?.vehicleNumber.trim().toUpperCase() ===
              v.vehicleNumber.trim().toUpperCase();
            return (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleNum(v.vehicleNumber)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isSelected
                    ? oType === 'COMPANY'
                      ? 'bg-amber-400 text-black border-amber-300 shadow-md font-black'
                      : 'bg-sky-500 text-white border-sky-400 shadow-md font-black'
                    : 'bg-[#161a26] text-gray-300 border-[#252c3f] hover:bg-[#1d2232]'
                }`}
              >
                <span>{v.vehicleNumber}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-sans uppercase font-bold ${
                    isSelected
                      ? 'bg-black/20 text-black'
                      : oType === 'COMPANY'
                      ? 'bg-amber-950/70 text-amber-400 border border-amber-800/40'
                      : 'bg-sky-950/70 text-sky-400 border border-sky-800/40'
                  }`}
                >
                  {oType}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Selected Vehicle Master Header */}
      {activeVehicle && activeAccount && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#121520] via-[#141826] to-[#121520] border border-[#282f44] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`p-3 rounded-2xl border ${
                activeAccount.ownerType === 'COMPANY'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
              }`}
            >
              {activeAccount.ownerType === 'COMPANY' ? (
                <Building2 className="w-7 h-7" />
              ) : (
                <Truck className="w-7 h-7" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black font-mono text-white tracking-wider">
                  {activeVehicle.vehicleNumber}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono border ${
                    activeAccount.ownerType === 'COMPANY'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/50 shadow-sm'
                      : 'bg-sky-950/80 text-sky-300 border-sky-700/50 shadow-sm'
                  }`}
                >
                  Owner Type: {activeAccount.ownerType}
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#1d2335] text-gray-300 border border-[#2b344e]">
                  Status: {activeVehicle.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mt-1.5">
                <div>
                  <span className="text-gray-500">Owner: </span>
                  <span className="font-semibold text-gray-200">{activeVehicle.owner}</span>
                </div>
                <div>
                  <span className="text-gray-500">Driver: </span>
                  <span className="font-semibold text-gray-200">{activeVehicle.driver}</span>
                </div>
                <div>
                  <span className="text-gray-500">Capacity: </span>
                  <span className="font-mono text-gray-300">{activeVehicle.capacity || 250} pcs</span>
                </div>
                <div>
                  <span className="text-gray-500">Recorded Trips: </span>
                  <span className="font-mono font-bold text-amber-400">{activeAccount.totalTrips}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleOpenEditOwner}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#1a1f2e] text-gray-300 hover:text-white border border-[#2d354d] hover:border-amber-500/50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Ownership</span>
            </button>

            <button
              onClick={() => handleOpenAddTxn('Income')}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-black hover:from-emerald-400 hover:to-teal-500 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer font-black"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Transaction</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. THE 4 CORE ACCOUNTING PILLARS (Required Vehicle Account Structure) */}
      {activeAccount && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PILLAR 1: INCOME */}
          <div className="p-4 rounded-2xl bg-[#0e121a] border border-emerald-900/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-emerald-900/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-cinzel text-emerald-300 uppercase tracking-wider">
                      Income
                    </h4>
                    <span className="text-[10px] text-gray-500">Universal Inflows</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAddTxn('Income')}
                  className="p-1 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-800/40"
                  title="Add Income"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-300 py-0.5">
                  <span className="text-gray-400">• Trip income</span>
                  <span className="font-mono font-bold text-gray-100">
                    {formatCurrency(activeAccount.income.tripIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300 py-0.5">
                  <span className="text-gray-400">• Delivery income</span>
                  <span className="font-mono font-bold text-gray-100">
                    {formatCurrency(activeAccount.income.deliveryIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300 py-0.5">
                  <span className="text-gray-400">• Other income</span>
                  <span className="font-mono font-bold text-gray-100">
                    {formatCurrency(activeAccount.income.otherIncome)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase">Total Income</span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {formatCurrency(activeAccount.income.totalIncome)}
              </span>
            </div>
          </div>

          {/* PILLAR 2: EXPENSES */}
          <div className="p-4 rounded-2xl bg-[#0e121a] border border-rose-900/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-rose-900/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-cinzel text-rose-300 uppercase tracking-wider">
                      Expenses
                    </h4>
                    <span className="text-[10px] text-gray-500">Universal Outflows</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAddTxn('Expense')}
                  className="p-1 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 border border-rose-800/40"
                  title="Add Expense"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">• Fuel</span>
                  <span className="font-mono font-bold text-gray-200">
                    {formatCurrency(activeAccount.expenses.fuel)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">• Driver payment</span>
                  <span className="font-mono font-bold text-gray-200">
                    {formatCurrency(activeAccount.expenses.driverPayment)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">• Loading</span>
                  <span className="font-mono font-bold text-gray-200">
                    {formatCurrency(activeAccount.expenses.loading)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">• Repair</span>
                  <span className="font-mono font-bold text-gray-200">
                    {formatCurrency(activeAccount.expenses.repair)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">• Maintenance</span>
                  <span className="font-mono font-bold text-gray-200">
                    {formatCurrency(activeAccount.expenses.maintenance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">• Tyre</span>
                  <span className="font-mono font-bold text-gray-200">
                    {formatCurrency(activeAccount.expenses.tyre)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">• Toll</span>
                  <span className="font-mono font-bold text-gray-200">
                    {formatCurrency(activeAccount.expenses.toll)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-gray-400">• Other vehicle expenses</span>
                  <span className="font-mono font-bold text-gray-200">
                    {formatCurrency(activeAccount.expenses.otherVehicleExpenses)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-900/40 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase">Total Expenses</span>
              <span className="text-lg font-black font-mono text-rose-400">
                {formatCurrency(activeAccount.expenses.totalExpenses)}
              </span>
            </div>
          </div>

          {/* PILLAR 3: RECEIVABLES */}
          <div className="p-4 rounded-2xl bg-[#0e121a] border border-amber-900/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-cinzel text-amber-300 uppercase tracking-wider">
                      Receivables
                    </h4>
                    <span className="text-[10px] text-gray-500">Pending Collections</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAddTxn('Receivable')}
                  className="p-1 rounded-lg bg-amber-950/40 text-amber-400 hover:bg-amber-900/60 border border-amber-800/40"
                  title="Add Receivable"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-300 py-0.5">
                  <span className="text-gray-400">• Customer pending</span>
                  <span className="font-mono font-bold text-amber-300">
                    {formatCurrency(activeAccount.receivables.customerPending)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300 py-0.5">
                  <span className="text-gray-400">• Driver collection pending</span>
                  <span className="font-mono font-bold text-amber-300">
                    {formatCurrency(activeAccount.receivables.driverCollectionPending)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Total Receivables</span>
              <span className="text-lg font-black font-mono text-amber-400">
                {formatCurrency(activeAccount.receivables.totalReceivables)}
              </span>
            </div>
          </div>

          {/* PILLAR 4: PAYABLES */}
          <div className="p-4 rounded-2xl bg-[#0e121a] border border-indigo-900/30 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-indigo-900/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-cinzel text-indigo-300 uppercase tracking-wider">
                      Payables
                    </h4>
                    <span className="text-[10px] text-gray-500">Pending Obligations</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenAddTxn('Payable')}
                  className="p-1 rounded-lg bg-indigo-950/40 text-indigo-400 hover:bg-indigo-900/60 border border-indigo-800/40"
                  title="Add Payable"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-300 py-0.5">
                  <span className="text-gray-400">• Driver</span>
                  <span className="font-mono font-bold text-indigo-200">
                    {formatCurrency(activeAccount.payables.driver)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300 py-0.5">
                  <span className="text-gray-400">• Owner</span>
                  <span className="font-mono font-bold text-indigo-200">
                    {formatCurrency(activeAccount.payables.owner)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300 py-0.5">
                  <span className="text-gray-400">• Other party</span>
                  <span className="font-mono font-bold text-indigo-200">
                    {formatCurrency(activeAccount.payables.otherParty)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-indigo-900/40 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase">Total Payables</span>
              <span className="text-lg font-black font-mono text-indigo-400">
                {formatCurrency(activeAccount.payables.totalPayables)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Net Performance & Balance Banner */}
      {activeAccount && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#121622] border border-[#232a3e]">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">Net Operating Profit</div>
            <div
              className={`text-2xl font-black font-mono mt-1 ${
                activeAccount.netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(activeAccount.netOperatingProfit)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Income − Expenses</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121622] border border-[#232a3e]">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">Net Account Balance</div>
            <div
              className={`text-2xl font-black font-mono mt-1 ${
                activeAccount.netBalance >= 0 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(activeAccount.netBalance)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">(Income+Rec.) − (Exp.+Pay.)</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121622] border border-[#232a3e]">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">Stone Dispatched</div>
            <div className="text-2xl font-black font-mono text-gray-100 mt-1">
              {formatNumber(activeAccount.totalStoneQty)}
              <span className="text-xs font-normal text-gray-400 ml-1">pcs</span>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Across {activeAccount.totalTrips} verified trips</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121622] border border-[#232a3e]">
            <div className="text-[10px] text-gray-400 uppercase font-semibold">Operating Margin</div>
            <div className="text-2xl font-black font-mono text-sky-400 mt-1">
              {activeAccount.income.totalIncome > 0
                ? `${Math.round(
                    (activeAccount.netOperatingProfit / activeAccount.income.totalIncome) * 100
                  )}%`
                : '0%'}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">Profit on vehicle income</div>
          </div>
        </div>
      )}

      {/* 6. Unified Fleet Comparison Ledger (All Vehicles Side-by-Side) */}
      <div className="bg-[#12151f] rounded-2xl border border-[#232736] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f2537] pb-3">
          <div>
            <h3 className="font-cinzel font-bold text-sm text-gray-200">
              Cross-Fleet Ledger Audit (Identical Accounting Formula)
            </h3>
            <p className="text-[11px] text-gray-400">
              Compare all vehicles side-by-side. Company and Outside tippers share the exact same calculation columns.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-gray-400">
              Showing {displayedVehicles.length} of {vehicles.length} Vehicles
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#161a26] border-b border-[#232736] text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="p-3">Vehicle #</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Driver</th>
                <th className="p-3 text-center">Owner Type</th>
                <th className="p-3 text-right">Trips</th>
                <th className="p-3 text-right">Total Income (₹)</th>
                <th className="p-3 text-right">Total Expenses (₹)</th>
                <th className="p-3 text-right">Operating Profit (₹)</th>
                <th className="p-3 text-right">Receivables (₹)</th>
                <th className="p-3 text-right">Payables (₹)</th>
                <th className="p-3 text-right">Net Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2332]">
              {allVehicleAccounts
                .filter((acc) => {
                  if (fleetFilter === 'ALL') return true;
                  return acc.ownerType === fleetFilter;
                })
                .map((acc) => {
                  const isSelected =
                    activeVehicle?.vehicleNumber.trim().toUpperCase() ===
                    acc.vehicleNumber.trim().toUpperCase();
                  return (
                    <tr
                      key={acc.vehicleNumber}
                      onClick={() => setSelectedVehicleNum(acc.vehicleNumber)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#1a2133] border-l-4 border-l-amber-400' : 'hover:bg-[#151824]'
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-gray-100 flex items-center gap-1.5">
                        {acc.vehicleNumber}
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </td>
                      <td className="p-3 text-gray-300">{acc.owner}</td>
                      <td className="p-3 text-gray-300">{acc.driver}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                            acc.ownerType === 'COMPANY'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                              : 'bg-sky-950/70 text-sky-300 border border-sky-800/40'
                          }`}
                        >
                          {acc.ownerType}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-gray-300">
                        {acc.totalTrips}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(acc.income.totalIncome)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-rose-400">
                        {formatCurrency(acc.expenses.totalExpenses)}
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-black ${
                          acc.netOperatingProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(acc.netOperatingProfit)}
                      </td>
                      <td className="p-3 text-right font-mono text-amber-300">
                        {formatCurrency(acc.receivables.totalReceivables)}
                      </td>
                      <td className="p-3 text-right font-mono text-indigo-300">
                        {formatCurrency(acc.payables.totalPayables)}
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-black ${
                          acc.netBalance >= 0 ? 'text-amber-400' : 'text-rose-400'
                        }`}
                      >
                        {formatCurrency(acc.netBalance)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Detailed Transaction Ledger for Selected Vehicle */}
      {activeAccount && (
        <div className="bg-[#12151f] rounded-2xl border border-[#232736] p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f2537] pb-3">
            <div>
              <h3 className="font-cinzel font-bold text-sm text-gray-200">
                Detailed Transaction Audit Ledger — {activeAccount.vehicleNumber}
              </h3>
              <p className="text-[11px] text-gray-400">
                All individual Incomes, Expenses, Receivables, and Payables tagged to this vehicle
              </p>
            </div>

            {/* Filter by Transaction Type */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['ALL', 'Income', 'Expense', 'Receivable', 'Payable'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTransactionTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    transactionTypeFilter === type
                      ? 'bg-amber-400 text-black shadow font-black'
                      : 'bg-[#181c28] text-gray-400 hover:text-gray-200 border border-[#252b3e]'
                  }`}
                >
                  {type === 'ALL' ? 'All Transactions' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#161a26] border-b border-[#232736] text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Ref #</th>
                  <th className="p-3">Counterparty</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2332]">
                {displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-500 text-xs">
                      No vehicle transactions recorded matching this filter.
                    </td>
                  </tr>
                ) : (
                  displayedTransactions.map((txn) => {
                    const isInflow = txn.type === 'Income' || txn.type === 'Receivable';
                    return (
                      <tr key={txn.id} className="hover:bg-[#151926] transition-colors">
                        <td className="p-3 font-mono text-gray-300">
                          <div>{formatDate(txn.date)}</div>
                          {txn.time && <div className="text-[10px] text-gray-500">{txn.time}</div>}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              txn.type === 'Income'
                                ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40'
                                : txn.type === 'Expense'
                                ? 'bg-rose-950/70 text-rose-400 border border-rose-800/40'
                                : txn.type === 'Receivable'
                                ? 'bg-amber-950/70 text-amber-400 border border-amber-800/40'
                                : 'bg-indigo-950/70 text-indigo-400 border border-indigo-800/40'
                            }`}
                          >
                            {txn.type}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-gray-200">{txn.category}</td>
                        <td className="p-3 text-gray-300 max-w-xs truncate" title={txn.description}>
                          {txn.description}
                        </td>
                        <td className="p-3 font-mono text-[#d4af37] text-[11px]">
                          {txn.referenceId || '—'}
                        </td>
                        <td className="p-3 text-gray-300">{txn.counterParty || '—'}</td>
                        <td className="p-3 text-gray-400 text-[11px]">{txn.paymentMode || '—'}</td>
                        <td className="p-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              txn.status === 'Cleared' || txn.status === 'Settled'
                                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40'
                                : 'bg-amber-950/50 text-amber-400 border border-amber-800/40'
                            }`}
                          >
                            {txn.status}
                          </span>
                        </td>
                        <td
                          className={`p-3 text-right font-mono font-bold ${
                            isInflow ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isInflow ? '+' : '-'} {formatCurrency(txn.amount)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => deleteVehicleTransaction(txn.id)}
                            className="text-gray-500 hover:text-rose-400 text-xs transition-colors p-1"
                            title="Delete transaction"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
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

      {/* 8. MODAL: Add Vehicle Transaction */}
      {showAddTxnModal && activeVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121520] border border-[#2b334a] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#23293e] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-cinzel font-bold text-base text-gray-100">
                  Log Vehicle Transaction — {activeVehicle.vehicleNumber}
                </h3>
              </div>
              <button
                onClick={() => setShowAddTxnModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="space-y-4">
              {/* Type Switcher */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Transaction Type
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-[#0a0c12] p-1 rounded-xl border border-[#202638]">
                  {(['Income', 'Expense', 'Receivable', 'Payable'] as VehicleTransactionType[]).map(
                    (t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => {
                          setTxnType(t);
                          if (t === 'Income') setTxnCategory('Trip income');
                          else if (t === 'Expense') setTxnCategory('Fuel');
                          else if (t === 'Receivable') setTxnCategory('Customer pending');
                          else setTxnCategory('Driver');
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          txnType === t
                            ? 'bg-amber-400 text-black shadow font-black'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Category Selector based on Transaction Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Category (Strict Standard)
                  </label>
                  <select
                    value={txnCategory}
                    onChange={(e) => setTxnCategory(e.target.value)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {txnType === 'Income' && (
                      <>
                        <option value="Trip income">Trip income</option>
                        <option value="Delivery income">Delivery income</option>
                        <option value="Other income">Other income</option>
                      </>
                    )}
                    {txnType === 'Expense' && (
                      <>
                        <option value="Fuel">Fuel</option>
                        <option value="Driver payment">Driver payment</option>
                        <option value="Loading">Loading</option>
                        <option value="Repair">Repair</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Tyre">Tyre</option>
                        <option value="Toll">Toll</option>
                        <option value="Other vehicle expenses">Other vehicle expenses</option>
                      </>
                    )}
                    {txnType === 'Receivable' && (
                      <>
                        <option value="Customer pending">Customer pending</option>
                        <option value="Driver collection pending">Driver collection pending</option>
                      </>
                    )}
                    {txnType === 'Payable' && (
                      <>
                        <option value="Driver">Driver</option>
                        <option value="Owner">Owner</option>
                        <option value="Other party">Other party</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Date, Time & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Payment Mode
                  </label>
                  <select
                    value={txnPaymentMode}
                    onChange={(e) => setTxnPaymentMode(e.target.value as PaymentMode)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Status
                  </label>
                  <select
                    value={txnStatus}
                    onChange={(e) => setTxnStatus(e.target.value as any)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Cleared">Cleared</option>
                    <option value="Pending">Pending</option>
                    <option value="Settled">Settled</option>
                  </select>
                </div>
              </div>

              {/* Counterparty & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Counterparty (Driver / Owner / Vendor / Client)
                  </label>
                  <input
                    type="text"
                    value={txnCounterParty}
                    onChange={(e) => setTxnCounterParty(e.target.value)}
                    placeholder="e.g. Pasha or Metro Builders"
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Ref ID / Voucher #
                  </label>
                  <input
                    type="text"
                    value={txnRefId}
                    onChange={(e) => setTxnRefId(e.target.value)}
                    placeholder="e.g. LD-1001 or DSL-88"
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Description / Remarks
                </label>
                <input
                  type="text"
                  value={txnDescription}
                  onChange={(e) => setTxnDescription(e.target.value)}
                  placeholder="Enter details of transaction..."
                  className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23293e]">
                <button
                  type="button"
                  onClick={() => setShowAddTxnModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 font-black shadow-md shadow-amber-400/20"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: Edit Vehicle Ownership */}
      {showEditOwnerModal && activeVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121520] border border-[#2b334a] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#23293e] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="font-cinzel font-bold text-base text-gray-100">
                  Manage Vehicle Ownership
                </h3>
              </div>
              <button
                onClick={() => setShowEditOwnerModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOwnership} className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  <strong className="text-amber-300">Accounting Rule Notice:</strong> Switching
                  ownership updates the vehicle's registry classification. In accordance with the
                  universal accounting engine rules, historical transactions will never change.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Vehicle
                </label>
                <div className="font-mono font-bold text-white text-sm bg-[#161a26] p-2.5 rounded-xl border border-[#283045]">
                  {activeVehicle.vehicleNumber} ({activeVehicle.driver})
                </div>
              </div>

              {/* Owner Type Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Owner Type
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#0a0c12] p-1 rounded-xl border border-[#202638]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditOwnerType('COMPANY');
                      setEditOwnerName('RZ Mining');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      editOwnerType === 'COMPANY'
                        ? 'bg-amber-400 text-black font-black shadow'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    COMPANY
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditOwnerType('OUTSIDE');
                      if (editOwnerName === 'RZ Mining') setEditOwnerName('');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      editOwnerType === 'OUTSIDE'
                        ? 'bg-sky-500 text-white font-black shadow'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    OUTSIDE
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Owner Entity Name
                </label>
                <input
                  type="text"
                  required
                  value={editOwnerName}
                  onChange={(e) => setEditOwnerName(e.target.value)}
                  placeholder={editOwnerType === 'COMPANY' ? 'RZ Mining' : 'e.g. Kabeer or Ali'}
                  className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23293e]">
                <button
                  type="button"
                  onClick={() => setShowEditOwnerModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 font-black shadow-md shadow-amber-400/20"
                >
                  Save Ownership
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
