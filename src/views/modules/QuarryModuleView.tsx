import React, { useState } from 'react';
import { useQuarry } from '../../context/QuarryContext';
import { GatePass } from '../../types/quarry';
import { formatCurrency } from '../../utils/formatters';

// Existing Views
import { ProductionView } from '../ProductionView';
import { DailyGapEngineView } from '../DailyGapEngineView';
import { QuarryMachineryView } from '../QuarryMachineryView';
import { StockView } from '../StockView';
import { GatePassView } from '../GatePassView';
import { QuarryExpensesView } from '../QuarryExpensesView';
import { DailyAccountView } from '../DailyAccountView';
import { StaffManagementView } from '../StaffManagementView';
import { StaffAttendanceView } from '../StaffAttendanceView';
import { StaffSalaryPayrollView } from '../StaffSalaryPayrollView';
import { SalarySlipModal } from '../../components/modals/SalarySlipModal';
import { LandOwnerLedgerView } from '../LandOwnerLedgerView';

import {
  Mountain,
  PackageCheck,
  Award,
  Boxes,
  Ticket,
  Receipt,
  Coins,
  Users,
  CalendarCheck,
  Wallet,
  FileText,
  Plus,
  ShieldCheck,
  TrendingUp,
  Repeat,
  Wrench,
  Landmark,
} from 'lucide-react';

export type QuarrySubTab =
  | 'production'
  | 'gap'
  | 'machinery'
  | 'quality'
  | 'stock'
  | 'gate'
  | 'expenses'
  | 'land'
  | 'billing'
  | 'staff'
  | 'attendance'
  | 'salary'
  | 'payslips';

interface QuarryModuleViewProps {
  onOpenProductionModal: () => void;
  onOpenExpenseModal: () => void;
  onSelectGatePass: (gp: GatePass) => void;
  onOpenNewLoad: () => void;
  initialTab?: QuarrySubTab;
}

export const QuarryModuleView: React.FC<QuarryModuleViewProps> = ({
  onOpenProductionModal,
  onOpenExpenseModal,
  onSelectGatePass,
  onOpenNewLoad,
  initialTab = 'production',
}) => {
  const {
    production,
    dailyProductionRecords,
    stock,
    expenses,
    income,
    staff,
    attendance,
    payrolls,
    gatePasses,
    rates,
    machines,
  } = useQuarry();

  const [activeTab, setActiveTab] = useState<QuarrySubTab>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  // Quarry KPIs
  const totalProductionBlocks = dailyProductionRecords.reduce((sum, p) => sum + (p.finishedQuantity || 0), 0);
  const totalQuarryExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const subTabs = [
    { id: 'production', label: 'Production Log', icon: PackageCheck, badge: `${dailyProductionRecords.length || production.length}` },
    { id: 'gap', label: 'Daily Gap Engine', icon: Repeat, badge: 'Pos 1 Fixed' },
    { id: 'machinery', label: 'Machinery & JCB', icon: Wrench, badge: `${machines.length}` },
    { id: 'quality', label: 'Quality & Grades', icon: Award },
    { id: 'stock', label: 'Throughput & Pipeline', icon: Boxes },
    { id: 'gate', label: 'Gate Management', icon: Ticket, badge: `${gatePasses.length}` },
    { id: 'expenses', label: 'Quarry Expenses', icon: Receipt },
    { id: 'land', label: 'Land Owner Ledger', icon: Landmark, badge: '20 Cent' },
    { id: 'billing', label: 'Quarry Billing', icon: Coins },
    { id: 'staff', label: 'Staff Directory', icon: Users, badge: `${staff.length}` },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
    { id: 'salary', label: 'Salary & Payroll', icon: Wallet },
    { id: 'payslips', label: 'Salary Slips', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Module Master Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#17140f] via-[#121319] to-[#14120f] border border-[#d4af37]/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-[#d4af37]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8f741c] text-black flex items-center justify-center shadow-lg font-black">
              <Mountain className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40 font-bold">
                  MODULE 1
                </span>
                <span className="text-xs text-gray-400">Pit Extraction & Physical Quarry</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 mt-0.5 tracking-wide">
                QUARRY MANAGEMENT
              </h1>
            </div>
          </div>

          {/* Module Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenProductionModal}
              className="gold-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Production</span>
            </button>
            <button
              onClick={onOpenExpenseModal}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1a1e2b] hover:bg-[#252b3d] text-gray-200 border border-[#2d354b] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#d4af37]" />
              <span>Quarry Expense</span>
            </button>
          </div>
        </div>

        {/* Real-time Quarry Module Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#262b3b]">
          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Quarry Production Model
            </span>
            <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">
              Direct Loading
            </span>
            <span className="text-[10px] text-gray-400">Zero Warehouse Stock</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Total Cut & Dispatched
            </span>
            <span className="text-lg font-black font-mono text-gray-100 mt-0.5 block">
              {totalProductionBlocks.toLocaleString()} pcs
            </span>
            <span className="text-[10px] text-gray-400">Recorded Pit Output</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Quarry Expenses
            </span>
            <span className="text-lg font-black font-mono text-rose-400 mt-0.5 block">
              {formatCurrency(totalQuarryExpense)}
            </span>
            <span className="text-[10px] text-gray-400">Diesel, Spares, Power</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Staff Active
            </span>
            <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">
              {staff.filter((s) => s.status === 'Active').length} Personnel
            </span>
            <span className="text-[10px] text-gray-400">Operators & Cutters</span>
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
              onClick={() => setActiveTab(tab.id as QuarrySubTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b89222] text-[#090a0d] shadow-md shadow-[#d4af37]/25 font-black'
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
        {activeTab === 'production' && (
          <ProductionView onOpenProductionModal={onOpenProductionModal} />
        )}

        {activeTab === 'gap' && <DailyGapEngineView />}

        {activeTab === 'machinery' && <QuarryMachineryView />}

        {activeTab === 'quality' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-cinzel text-gray-100">
                  Operational Quality Standards & Classification
                </h3>
                <p className="text-xs text-gray-400">
                  Observed post-splitting • 4 defined quarry quality categories • Zero physical warehouse stock
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40">
                PROMPT 2 COMPLIANT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 1st Quality */}
              <div className="p-4 rounded-2xl bg-[#12141a] border border-[#d4af37]/50 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-[#d4af37] text-black">
                    1ST QUALITY
                  </span>
                  <span className="text-xs font-mono font-bold text-[#f3c64c]">
                    ₹43 / pc (Std) • ₹41 (Weaker)
                  </span>
                </div>
                <h4 className="font-bold text-gray-100 text-sm">All 8 Corners Intact</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  All 8 corners are obtained intact after manual wedge splitting. High-compaction construction blocks used for load-bearing masonry.
                </p>
                <div className="pt-2 border-t border-[#202534] text-xs space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span>Default Queue:</span>
                    <span className="font-mono text-emerald-400 font-bold">1st Gap Vehicle</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Standard Load:</span>
                    <span className="font-mono text-white">260 pc + 5 Free = 255 Rated</span>
                  </div>
                </div>
              </div>

              {/* 2nd Quality */}
              <div className="p-4 rounded-2xl bg-[#12141a] border border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-blue-600 text-white">
                    2ND QUALITY
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    ₹33 / pc (Std) • ₹31 (Weaker)
                  </span>
                </div>
                <h4 className="font-bold text-gray-100 text-sm">~3/4 Corners Intact</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Approximately 3/4 corners are remaining according to quarry classification. Ideal for residential basements, foundation footings, and boundary fences.
                </p>
                <div className="pt-2 border-t border-[#202534] text-xs space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span>Default Queue:</span>
                    <span className="font-mono text-blue-400 font-bold">2nd Gap Vehicle</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Standard Load:</span>
                    <span className="font-mono text-white">260 pc + 5 Free = 255 Rated</span>
                  </div>
                </div>
              </div>

              {/* Latt / 3rd Number */}
              <div className="p-4 rounded-2xl bg-[#12141a] border border-orange-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-orange-600 text-white">
                    LATT / 3RD NUMBER
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-400">
                    ₹2,500 / load
                  </span>
                </div>
                <h4 className="font-bold text-gray-100 text-sm">Damaged / Defect Material</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Stone that suffered damage or structural defect during extraction/splitting that does not qualify as 2nd quality stone.
                </p>
                <div className="pt-2 border-t border-[#202534] text-xs space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span>Default Queue:</span>
                    <span className="font-mono text-orange-400 font-bold">4th Gap / Open Offer</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Standard Load:</span>
                    <span className="font-mono text-white">260 pc + 5 Free = 255 Rated</span>
                  </div>
                </div>
              </div>

              {/* Mury */}
              <div className="p-4 rounded-2xl bg-[#12141a] border border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-600 text-white">
                    MURY
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    ₹1,000 / load
                  </span>
                </div>
                <h4 className="font-bold text-gray-100 text-sm">Broken Stone Rubble</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Stone breaks or splits during the cutting/splitting process into rubble. Recorded as Quantity + Unit = LOAD (no piece count).
                </p>
                <div className="pt-2 border-t border-[#202534] text-xs space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span>Default Queue:</span>
                    <span className="font-mono text-amber-400 font-bold">3rd Gap Vehicle</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Measurement:</span>
                    <span className="font-mono text-white">Sold Strictly by LOAD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock' && <StockView />}

        {activeTab === 'gate' && (
          <GatePassView
            onSelectGatePass={onSelectGatePass}
            onOpenNewLoad={onOpenNewLoad}
          />
        )}

        {activeTab === 'expenses' && (
          <QuarryExpensesView onOpenExpenseModal={onOpenExpenseModal} />
        )}

        {activeTab === 'land' && <LandOwnerLedgerView />}

        {activeTab === 'billing' && <DailyAccountView />}

        {activeTab === 'staff' && <StaffManagementView />}

        {activeTab === 'attendance' && <StaffAttendanceView />}

        {activeTab === 'salary' && <StaffSalaryPayrollView />}

        {activeTab === 'payslips' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-cinzel text-gray-100">
                  Staff Salary Slips (A4 Printable)
                </h3>
                <p className="text-xs text-gray-400">
                  Generate and print formal employee payslips with earnings, advance deductions, and authorization signature
                </p>
              </div>
            </div>

            {payrolls.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#12141a] border border-[#232736] text-gray-400 text-xs">
                No salary payroll generated yet. Visit the Salary & Payroll tab to calculate monthly salary.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {payrolls.map((payroll) => (
                  <div
                    key={payroll.id}
                    className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] hover:border-[#d4af37]/40 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-200">{payroll.employeeName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#d4af37]/20 text-[#f3c64c]">
                        {payroll.month}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="flex justify-between text-gray-400">
                        <span>Role:</span>
                        <span className="text-gray-200">{payroll.role}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Present:</span>
                        <span className="font-mono text-gray-200">{payroll.presentDays} Days</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Advance Deducted:</span>
                        <span className="font-mono text-rose-400">-{formatCurrency(payroll.advanceDeduction)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-[#202534] pt-1">
                        <span className="text-gray-300">Net Salary:</span>
                        <span className="font-mono text-[#f3c64c]">{formatCurrency(payroll.netSalary)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedPayslip(payroll)}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-[#1e2332] hover:bg-[#282f42] text-gray-200 border border-[#2f364c] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>View & Print Payslip</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Salary Slip Print Modal */}
      <SalarySlipModal
        isOpen={Boolean(selectedPayslip)}
        onClose={() => setSelectedPayslip(null)}
        payroll={selectedPayslip}
      />
    </div>
  );
};
