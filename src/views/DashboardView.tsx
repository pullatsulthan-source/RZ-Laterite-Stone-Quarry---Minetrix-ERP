import React, { useMemo } from 'react';
import { useQuarry } from '../context/QuarryContext';
import { formatCurrency, formatNumber, getTodayDateString } from '../utils/formatters';
import {
  Truck,
  Ticket,
  Boxes,
  PackageCheck,
  TrendingUp,
  Receipt,
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Plus,
  Car,
  Users,
  Building2,
  CalendarCheck,
  Percent,
  Repeat,
} from 'lucide-react';
import { NavTab } from '../components/common/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenNewLoad: () => void;
  onOpenGatePass: () => void;
  onOpenPayment: () => void;
  onOpenExpense: () => void;
  onOpenProduction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewLoad,
  onOpenGatePass,
  onOpenPayment,
  onOpenExpense,
  onOpenProduction,
}) => {
  const {
    loads,
    gatePasses,
    production,
    stock,
    income,
    expenses,
    payments,
    customers,
    advances,
    currentUser,
    rotations,
  } = useQuarry();

  const today = getTodayDateString();

  // Metrics calculation
  const metrics = useMemo(() => {
    // Today's loads
    const todayLoads = loads.filter((l) => l.date === today);
    const todayGatePasses = gatePasses.filter((g) => g.date === today);

    // Total Trips / Dispatched
    const totalTrips = todayGatePasses.length;
    const totalLoads = todayLoads.length;

    // Total Quantity (sum of pcs + loads)
    const totalQuantityPcs = todayLoads.reduce((sum, l) => sum + (l.unit === 'pcs' ? l.quantity : 0), 0);
    const totalQuantityLoads = todayLoads.reduce((sum, l) => sum + (l.unit === 'load' ? l.quantity : 0), 0);

    // Quarry Sales (sum of quarryAmount for confirmed/dispatched loads today)
    const quarrySales = todayLoads.reduce((sum, l) => sum + l.quarryAmount, 0);

    // Customer Collections today
    const customerCollections = payments
      .filter((p) => p.date === today)
      .reduce((sum, p) => sum + p.amount, 0);

    // Outstanding (All customers total opening + sales - payments)
    const totalCustOpening = customers.reduce((sum, c) => sum + c.openingBalance, 0);
    const totalCustSales = loads.reduce((sum, l) => sum + l.customerSaleAmount, 0);
    const totalCustPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalOutstanding = Math.max(0, totalCustOpening + totalCustSales - totalCustPaid);

    // Quarry Expenses today
    const todayExpenses = expenses
      .filter((e) => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);

    // Staff Advance/Salary today
    const todayStaffAdvances = advances
      .filter((a) => a.date === today)
      .reduce((sum, a) => sum + a.amount, 0);

    // Production today
    const todayProductionPcs = production
      .filter((p) => p.date === today && p.unit === 'pcs')
      .reduce((sum, p) => sum + p.quantity, 0);
    const todayProductionLoads = production
      .filter((p) => p.date === today && p.unit === 'load')
      .reduce((sum, p) => sum + p.quantity, 0);

    // Vehicles In & Out
    const vehiclesOut = totalTrips;
    const vehiclesIn = todayLoads.filter((l) => l.status === 'Draft' || l.status === 'Loaded').length;

    // RZ Mining Sales & Net
    const rzLoads = todayLoads.filter((l) => l.vehicleCategory === 'RZ Mining');
    const rzMiningSales = rzLoads.reduce((sum, l) => sum + l.customerSaleAmount, 0);
    const rzMiningNet = rzLoads.reduce((sum, l) => sum + l.netProfit, 0);

    // Daily Net = (Customer Collections + Other Quarry Incomes) - Today Expenses
    const todayIncomesTotal = income
      .filter((i) => i.date === today)
      .reduce((sum, i) => sum + i.amount, 0);
    const dailyNet = customerCollections + todayIncomesTotal - todayExpenses;

    return {
      totalLoads,
      totalTrips,
      totalQuantityPcs,
      totalQuantityLoads,
      quarrySales,
      customerCollections,
      totalOutstanding,
      todayExpenses,
      todayStaffAdvances,
      todayProductionPcs,
      todayProductionLoads,
      vehiclesIn,
      vehiclesOut,
      rzMiningSales,
      rzMiningNet,
      dailyNet,
    };
  }, [loads, gatePasses, production, income, expenses, payments, customers, advances, today]);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#141722] via-[#10121a] to-[#0c0e14] border border-[#252b3d] shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-cinzel text-xs font-bold text-[#d4af37] tracking-widest uppercase">
              EXECUTIVE QUARRY MONITOR
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-400">Shift Active: {currentUser}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-100 font-cinzel tracking-wide">
            RZ Laterite Stone Quarry Dashboard
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time daily quarry dispatches, fleet financials, gate passes & stock tracking
          </p>
        </div>

        {/* Quick Buttons Grid */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewLoad}
            className="gold-btn px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Load</span>
          </button>

          <button
            onClick={() => onNavigate('gate_pass')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a1e2b] hover:bg-[#23293a] text-gray-200 border border-[#2d3448] flex items-center gap-1.5 transition-colors"
          >
            <Ticket className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Gate Pass</span>
          </button>

          <button
            onClick={() => onNavigate('bill_generator')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a1e2b] hover:bg-[#23293a] text-[#B84D20] border border-[#B84D20]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-[#B84D20]" />
            <span>Statement / Bill</span>
          </button>

          <button
            onClick={onOpenPayment}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a1e2b] hover:bg-[#23293a] text-gray-200 border border-[#2d3448] flex items-center gap-1.5 transition-colors"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>Collection</span>
          </button>

          <button
            onClick={onOpenExpense}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a1e2b] hover:bg-[#23293a] text-gray-200 border border-[#2d3448] flex items-center gap-1.5 transition-colors"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-400" />
            <span>Expense</span>
          </button>

          <button
            onClick={onOpenProduction}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a1e2b] hover:bg-[#23293a] text-gray-200 border border-[#2d3448] flex items-center gap-1.5 transition-colors"
          >
            <PackageCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Production</span>
          </button>
        </div>
      </div>

      {/* CORE OPERATIONAL PIPELINE: QUARRY ➔ STOCK ➔ ORDER ➔ VEHICLE ➔ DISPATCH ➔ PAYMENT */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1118] border border-[#232736] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1f2434] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
            <h3 className="font-cinzel text-xs sm:text-sm font-bold text-gray-200 uppercase tracking-wider">
              Core Operational Pipeline & Shared Transaction Architecture
            </h3>
          </div>
          <span className="text-[11px] text-gray-400">
            Automated data flow: Zero manual re-entry across modules
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Step 1: Quarry */}
          <div
            onClick={() => onNavigate('production')}
            className="p-3 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-[#d4af37]/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-[#f3c64c] font-bold uppercase mb-1">
              <span>1. Quarry</span>
              <span className="text-gray-500 group-hover:text-white">➔</span>
            </div>
            <div className="font-bold text-gray-200 truncate">Pit Production</div>
            <div className="text-xs font-mono font-bold text-[#d4af37] mt-1">
              {metrics.todayProductionPcs.toLocaleString()} pcs
            </div>
            <div className="text-[9px] text-gray-500">Adds to Stock</div>
          </div>

          {/* Step 2: Stock */}
          <div
            onClick={() => onNavigate('stock')}
            className="p-3 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-[#d4af37]/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-[#f3c64c] font-bold uppercase mb-1">
              <span>2. Stock</span>
              <span className="text-gray-500 group-hover:text-white">➔</span>
            </div>
            <div className="font-bold text-gray-200 truncate">Inventory Pit</div>
            <div className="text-xs font-mono font-bold text-[#d4af37] mt-1">
              {(stock['Laterite Stone — 1st'] + stock['Laterite Stone — 2nd']).toLocaleString()} pcs
            </div>
            <div className="text-[9px] text-gray-500">Ready for Orders</div>
          </div>

          {/* Step 3: Order */}
          <div
            onClick={() => onNavigate('loads')}
            className="p-3 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-emerald-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold uppercase mb-1">
              <span>3. Order</span>
              <span className="text-gray-500 group-hover:text-white">➔</span>
            </div>
            <div className="font-bold text-gray-200 truncate">Stock Allocation</div>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
              {loads.filter(l => l.status === 'Draft' || l.status === 'Loaded').length} Booked
            </div>
            <div className="text-[9px] text-gray-500">Assigns Truck/Driver</div>
          </div>

          {/* Step 4: Vehicle & Driver */}
          <div
            onClick={() => onNavigate('vehicles')}
            className="p-3 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-sky-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-sky-400 font-bold uppercase mb-1">
              <span>4. Fleet</span>
              <span className="text-gray-500 group-hover:text-white">➔</span>
            </div>
            <div className="font-bold text-gray-200 truncate">Vehicle & Driver</div>
            <div className="text-xs font-mono font-bold text-sky-400 mt-1">
              {loads.filter(l => l.vehicleCategory === 'RZ Mining').length} RZ Trips
            </div>
            <div className="text-[9px] text-gray-500">Pit Rotation Queue</div>
          </div>

          {/* Step 5: Dispatch */}
          <div
            onClick={() => onNavigate('gate_pass')}
            className="p-3 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-[#d4af37]/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-[#f3c64c] font-bold uppercase mb-1">
              <span>5. Dispatch</span>
              <span className="text-gray-500 group-hover:text-white">➔</span>
            </div>
            <div className="font-bold text-gray-200 truncate">Gate Pass Issued</div>
            <div className="text-xs font-mono font-bold text-[#f3c64c] mt-1">
              {gatePasses.length} Dispatched
            </div>
            <div className="text-[9px] text-gray-500">Deducts Stock & Out</div>
          </div>

          {/* Step 6: Delivery & Payment */}
          <div
            onClick={() => onNavigate('payments')}
            className="p-3 rounded-xl bg-[#141722] hover:bg-[#1a1f2e] border border-emerald-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold uppercase mb-1">
              <span>6. Settlement</span>
              <span className="text-emerald-400">✓</span>
            </div>
            <div className="font-bold text-gray-200 truncate">Site Delivery</div>
            <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
              {formatCurrency(metrics.customerCollections)}
            </div>
            <div className="text-[9px] text-gray-500">Driver/Client Payment</div>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (15 Key Metrics Requested by User) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Total Loads */}
        <div
          onClick={() => onNavigate('loads')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] hover:border-[#d4af37]/40 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Today Loads</span>
            <Truck className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-gray-100">
            {metrics.totalLoads}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Dispatched & Drafts</div>
        </div>

        {/* 2. Total Trips / Gate Passes */}
        <div
          onClick={() => onNavigate('gate_pass')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] hover:border-[#d4af37]/40 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Total Trips</span>
            <Ticket className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#f3c64c]">
            {metrics.totalTrips}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">Cleared via Gate Pass</div>
        </div>

        {/* 3. Total Quantity */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Total Quantity</span>
            <Boxes className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-gray-100">
            {formatNumber(metrics.totalQuantityPcs)}{' '}
            <span className="text-xs font-normal text-gray-400">pcs</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            + {metrics.totalQuantityLoads} loads (3rd)
          </div>
        </div>

        {/* 4. Quarry Sales */}
        <div
          onClick={() => onNavigate('income')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] hover:border-[#d4af37]/40 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Quarry Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-gray-100">
            {formatCurrency(metrics.quarrySales)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Base Quarry Revenue</div>
        </div>

        {/* 5. Customer Collections */}
        <div
          onClick={() => onNavigate('payments')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] hover:border-emerald-500/40 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
            <span>Customer Collections</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            {formatCurrency(metrics.customerCollections)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Cash / UPI / Bank In</div>
        </div>

        {/* 6. Total Outstanding */}
        <div
          onClick={() => onNavigate('customer_accounts')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] hover:border-rose-500/40 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Total Outstanding</span>
            <Wallet className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-400">
            {formatCurrency(metrics.totalOutstanding)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Customer Ledger Due</div>
        </div>

        {/* 7. Quarry Expenses */}
        <div
          onClick={() => onNavigate('expenses')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] hover:border-rose-500/40 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Quarry Expenses</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-300">
            {formatCurrency(metrics.todayExpenses)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Fuel, Loading & Batta</div>
        </div>

        {/* 8. Staff Advance */}
        <div
          onClick={() => onNavigate('salary')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Staff Advance</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-gray-100">
            {formatCurrency(metrics.todayStaffAdvances)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Deductible in payroll</div>
        </div>

        {/* 9. Production Today */}
        <div
          onClick={() => onNavigate('production')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] hover:border-emerald-500/40 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Production Today</span>
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-gray-100">
            {formatNumber(metrics.todayProductionPcs)}{' '}
            <span className="text-xs font-normal text-gray-400">pcs</span>
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5">
            + {metrics.todayProductionLoads} rubble loads
          </div>
        </div>

        {/* 10. Current Stock (1st Quality) */}
        <div
          onClick={() => onNavigate('stock')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] hover:border-[#d4af37]/40 cursor-pointer transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Stock (1st Quality)</span>
            <Boxes className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#d4af37]">
            {formatNumber(stock['Laterite Stone — 1st'])}{' '}
            <span className="text-xs font-normal text-gray-400">pcs</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            2nd: {formatNumber(stock['Laterite Stone — 2nd'])} pcs
          </div>
        </div>

        {/* 11. Vehicles In vs Out */}
        <div
          onClick={() => onNavigate('vehicles')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#232736] shadow-sm"
        >
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Vehicles Gate</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-xl sm:text-2xl font-black text-emerald-400">
              {metrics.vehiclesOut}
            </span>
            <span className="text-xs text-gray-500">Out</span>
            <span className="text-xs text-gray-600">/</span>
            <span className="text-sm font-bold text-gray-300">
              {metrics.vehiclesIn}
            </span>
            <span className="text-xs text-gray-500">In</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Fleet Traffic</div>
        </div>

        {/* 12. RZ Mining Sales */}
        <div
          onClick={() => onNavigate('vehicle_accounts')}
          className="p-3.5 sm:p-4 rounded-xl bg-[#12141c] border border-[#d4af37]/30 shadow-sm"
        >
          <div className="flex items-center justify-between text-[#d4af37] text-xs mb-1">
            <span>RZ Mining Sales</span>
            <TrendingUp className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#f3c64c]">
            {formatCurrency(metrics.rzMiningSales)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Pasha, Saidu, Nuhman</div>
        </div>

        {/* 13. RZ Mining Net Profit */}
        <div
          onClick={() => onNavigate('vehicle_accounts')}
          className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-[#12141c] to-[#151c14] border border-emerald-500/30 shadow-sm"
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-1">
            <span>RZ Mining Net</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            {formatCurrency(metrics.rzMiningNet)}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">After quarry & trip exp</div>
        </div>

        {/* 14. Daily Net (Cash Flow) */}
        <div
          onClick={() => onNavigate('daily_account')}
          className="col-span-2 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-[#141722] to-[#1a1710] border border-[#d4af37]/40 shadow-sm"
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-[#d4af37]">Daily Net Cash Generated</span>
            <Coins className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#ffe685]">
            {formatCurrency(metrics.dailyNet)}
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            (Collections + Incomes) - Total Quarry Expenses
          </div>
        </div>
      </div>

      {/* Two-Column Quarry Operations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Dispatches & Gate Passes Table */}
        <div className="lg:col-span-2 bg-[#12141a] rounded-2xl border border-[#232736] p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-cinzel font-bold text-base text-gray-100 tracking-wide">
                Recent Quarry Dispatches & Gate Passes
              </h3>
              <p className="text-xs text-gray-400">Live vehicle clearances from the gate</p>
            </div>
            <button
              onClick={() => onNavigate('loads')}
              className="text-xs text-[#d4af37] hover:underline font-semibold"
            >
              View All Loads →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#232736] text-gray-400 text-[11px]">
                  <th className="pb-2">Time / Load</th>
                  <th className="pb-2">Vehicle & Driver</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Customer / Material</th>
                  <th className="pb-2 text-right">Quarry (₹)</th>
                  <th className="pb-2 text-right">Customer (₹)</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2230]">
                {loads.slice(0, 5).map((l) => (
                  <tr key={l.id} className="hover:bg-[#161922] transition-colors">
                    <td className="py-2.5 font-mono">
                      <div className="text-gray-200 font-bold">{l.time}</div>
                      <div className="text-[10px] text-gray-500">{l.loadNumber}</div>
                    </td>
                    <td className="py-2.5">
                      <div className="font-bold text-gray-200">{l.vehicleNumber}</div>
                      <div className="text-[11px] text-gray-400">{l.driver}</div>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.vehicleCategory === 'RZ Mining'
                            ? 'bg-[#d4af37]/15 text-[#f3c64c] border border-[#d4af37]/30'
                            : 'bg-blue-900/20 text-blue-400 border border-blue-700/30'
                        }`}
                      >
                        {l.vehicleCategory}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="text-gray-200 font-medium truncate max-w-[140px]">
                        {l.customerName}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {l.material} ({l.quantity} {l.unit})
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono text-gray-300">
                      {formatCurrency(l.quarryAmount)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#f3c64c]">
                      {formatCurrency(l.customerSaleAmount)}
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'Dispatched' || l.status === 'Gate Pass Generated'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Module Launchpad & Quarry Status */}
        <div className="space-y-4">
          {/* Quarry Stock Summary Card */}
          <div className="bg-[#12141a] rounded-2xl border border-[#232736] p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-sm text-gray-200">
                Live Stock Status
              </h3>
              <button
                onClick={() => onNavigate('stock')}
                className="text-[11px] text-[#d4af37] hover:underline"
              >
                Stock Log →
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2434] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-200">Laterite Stone — 1st</div>
                  <div className="text-[10px] text-gray-500">Standard cut (₹43 quarry / ₹65 sale)</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-[#f3c64c]">
                    {formatNumber(stock['Laterite Stone — 1st'])} pcs
                  </div>
                  <div className="text-[9px] text-emerald-400">Available</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2434] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-200">Laterite Stone — 2nd</div>
                  <div className="text-[10px] text-gray-500">Standard cut (₹33 quarry / ₹55 sale)</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-gray-200">
                    {formatNumber(stock['Laterite Stone — 2nd'])} pcs
                  </div>
                  <div className="text-[9px] text-emerald-400">Available</div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2434] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-200">Laterite Stone — 3rd</div>
                  <div className="text-[10px] text-gray-500">Rubble load (₹1,000 / ₹5,000)</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-gray-200">
                    {stock['Laterite Stone — 3rd']} loads
                  </div>
                  <div className="text-[9px] text-emerald-400">Available</div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Vehicle Rotation Turn Card */}
          {(() => {
            const todayRotation = (rotations || []).find((r) => r.rotationDate === today) || rotations?.[0];
            const fixedUnit = todayRotation?.entries?.find((e) => e.isFixed) || todayRotation?.entries?.[0];
            const nextUnit = todayRotation?.entries?.find((e) => !e.isFixed) || todayRotation?.entries?.[1];

            return (
              <div className="bg-[#12141a] rounded-2xl border border-amber-500/30 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-amber-400" />
                    <h3 className="font-cinzel font-bold text-sm text-gray-200">
                      Vehicle Rotation Engine
                    </h3>
                  </div>
                  <button
                    onClick={() => onNavigate('rotation')}
                    className="text-[11px] text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    View Queue →
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#17130a] to-[#121008] border border-amber-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-black">
                        #1 FIXED
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {fixedUnit?.vehicleNumber || 'KL-55-RZ-01'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-300">
                      RZ MINING
                    </span>
                  </div>

                  {nextUnit && (
                    <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2434] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-800">
                          #{nextUnit.position || 2} NEXT
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {nextUnit.vehicleNumber}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {nextUnit.driver} ({nextUnit.owner})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400 border-t border-[#1e2332]">
                  <span>Cycle #{todayRotation?.rotationNumber || 11}</span>
                  <span className="text-amber-400/90 font-mono">
                    {todayRotation?.entries?.length || 7} Trucks in Queue
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Quick Nav Launchpad */}
          <div className="bg-[#12141a] rounded-2xl border border-[#232736] p-4 sm:p-5 shadow-sm space-y-3">
            <h3 className="font-cinzel font-bold text-sm text-gray-200">
              Quarry Quick Modules
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate('customer_accounts')}
                className="p-2.5 rounded-xl bg-[#171a24] hover:bg-[#202534] border border-[#252a3a] text-left transition-colors flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-[#d4af37]" />
                <span className="font-medium text-gray-200">Customer Ledgers</span>
              </button>

              <button
                onClick={() => onNavigate('vehicle_accounts')}
                className="p-2.5 rounded-xl bg-[#171a24] hover:bg-[#202534] border border-[#252a3a] text-left transition-colors flex items-center gap-2"
              >
                <Car className="w-4 h-4 text-[#d4af37]" />
                <span className="font-medium text-gray-200">RZ Vehicles</span>
              </button>

              <button
                onClick={() => onNavigate('driver_accounts')}
                className="p-2.5 rounded-xl bg-[#171a24] hover:bg-[#202534] border border-[#252a3a] text-left transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-[#d4af37]" />
                <span className="font-medium text-gray-200">Driver Batta</span>
              </button>

              <button
                onClick={() => onNavigate('bill_generator')}
                className="p-2.5 rounded-xl bg-[#171a24] hover:bg-[#202534] border border-[#252a3a] text-left transition-colors flex items-center gap-2"
              >
                <Ticket className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-gray-200">Bill Generator</span>
              </button>

              <button
                onClick={() => onNavigate('daily_account')}
                className="p-2.5 rounded-xl bg-[#171a24] hover:bg-[#202534] border border-[#252a3a] text-left transition-colors flex items-center gap-2"
              >
                <Coins className="w-4 h-4 text-[#f3c64c]" />
                <span className="font-medium text-gray-200">Daily Cash Book</span>
              </button>

              <button
                onClick={() => onNavigate('rates')}
                className="p-2.5 rounded-xl bg-[#171a24] hover:bg-[#202534] border border-[#252a3a] text-left transition-colors flex items-center gap-2"
              >
                <Percent className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-gray-200">Rate Master</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
