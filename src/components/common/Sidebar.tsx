import React from 'react';
import {
  LayoutDashboard,
  Mountain,
  Truck,
  Ticket,
  Car,
  Users,
  Building2,
  BookOpen,
  DollarSign,
  PackageCheck,
  Boxes,
  TrendingUp,
  Receipt,
  UserSquare2,
  CalendarCheck,
  Wallet,
  HandCoins,
  Percent,
  FileBarChart,
  FileSpreadsheet,
  Coins,
  Settings,
  X,
  Award,
  FileText,
  Repeat,
  Navigation,
  Wrench,
  MapPin,
  CreditCard,
  Users2,
} from 'lucide-react';
import { useQuarry } from '../../context/QuarryContext';

export type NavTab =
  | 'dashboard'
  | 'quarry_module'
  | 'vehicle_module'
  | 'order_module'
  | 'quarry_mgmt'
  | 'loads'
  | 'gate_pass'
  | 'vehicles'
  | 'drivers'
  | 'customers'
  | 'customer_accounts'
  | 'driver_accounts'
  | 'vehicle_accounts'
  | 'production'
  | 'quality'
  | 'stock'
  | 'income'
  | 'expenses'
  | 'staff'
  | 'attendance'
  | 'salary'
  | 'payslips'
  | 'rotation'
  | 'trips'
  | 'vehicle_expenses'
  | 'vehicle_ledger'
  | 'agents'
  | 'delivery'
  | 'payment_terms'
  | 'payments'
  | 'rates'
  | 'reports'
  | 'bill_generator'
  | 'daily_account'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavGroup {
  label: string;
  badge?: string;
  color?: string;
  items: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const { loads, gatePasses, stock, vehicles, customers } = useQuarry();

  const totalDispatches = gatePasses.length;
  const activeLoads = loads.filter((l) => l.status === 'Draft' || l.status === 'Loaded').length;
  const totalStockBlocks = stock['Laterite Stone — 1st'] + stock['Laterite Stone — 2nd'];

  const groups: NavGroup[] = [
    {
      label: '1. QUARRY MANAGEMENT',
      color: 'text-[#f3c64c]',
      items: [
        { id: 'quarry_module', label: 'Quarry Operations Hub', icon: Mountain },
        { id: 'production', label: 'Production Log', icon: PackageCheck },
        { id: 'quality', label: 'Quality & Grades', icon: Award },
        {
          id: 'stock',
          label: 'Stock & Inventory',
          icon: Boxes,
          badge: `${(totalStockBlocks / 1000).toFixed(1)}k`,
        },
        {
          id: 'gate_pass',
          label: 'Gate Management',
          icon: Ticket,
          badge: totalDispatches,
        },
        { id: 'expenses', label: 'Quarry Expenses', icon: Receipt },
        { id: 'daily_account', label: 'Quarry Billing & Cash', icon: Coins },
        { id: 'staff', label: 'Staff Directory', icon: UserSquare2 },
        { id: 'attendance', label: 'Staff Attendance', icon: CalendarCheck },
        { id: 'salary', label: 'Salary & Payroll', icon: Wallet },
        { id: 'payslips', label: 'Salary Slips', icon: FileText },
      ],
    },
    {
      label: '2. VEHICLE MANAGEMENT',
      color: 'text-sky-400',
      items: [
        { id: 'vehicle_module', label: 'Vehicle Fleet Hub', icon: Truck },
        { id: 'vehicles', label: 'Vehicle Master & Owners', icon: Car, badge: vehicles.length },
        { id: 'drivers', label: 'Driver Master', icon: Users },
        { id: 'rotation', label: 'Daily Rotation Engine', icon: Repeat, badge: 'Pos 1 Fixed' },
        { id: 'trips', label: 'Trips & Freight Log', icon: Navigation, badge: loads.length },
        { id: 'vehicle_expenses', label: 'Vehicle Expenses', icon: Wrench },
        { id: 'vehicle_accounts', label: 'Vehicle Accounts Engine', icon: DollarSign, badge: 'Unified' },
        { id: 'driver_accounts', label: 'Driver Collections', icon: Wallet },
        { id: 'vehicle_ledger', label: 'Vehicle Ledger', icon: BookOpen },
      ],
    },
    {
      label: '3. ORDER MANAGEMENT',
      color: 'text-emerald-400',
      items: [
        { id: 'order_module', label: 'Customer Order Hub', icon: FileSpreadsheet },
        {
          id: 'loads',
          label: 'Customer Orders',
          icon: Truck,
          badge: activeLoads > 0 ? activeLoads : undefined,
        },
        { id: 'customers', label: 'Customer Master', icon: Building2, badge: customers.length },
        { id: 'agents', label: 'Orderman & Commission', icon: Users2 },
        { id: 'rates', label: 'Rate Master', icon: Percent },
        { id: 'delivery', label: 'Delivery & Dispatch', icon: MapPin },
        { id: 'payment_terms', label: 'Payment Terms', icon: CreditCard },
        { id: 'payments', label: 'Payments & Collections', icon: HandCoins },
        { id: 'bill_generator', label: 'Invoices & Statements', icon: FileSpreadsheet, badge: 'A4' },
        { id: 'customer_accounts', label: 'Customer Ledgers', icon: BookOpen },
      ],
    },
    {
      label: 'EXECUTIVE & SYSTEM',
      color: 'text-gray-400',
      items: [
        { id: 'dashboard', label: 'Executive Pipeline', icon: LayoutDashboard },
        { id: 'reports', label: 'Quarry Reports', icon: FileBarChart },
        { id: 'settings', label: 'Settings & Data Vault', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0d0f14] border-r border-[#222633] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#222633]">
          <div className="flex flex-col">
            <span className="font-cinzel font-black text-sm gold-gradient-text tracking-wider">
              RZ MINETRIX
            </span>
            <span className="text-[10px] uppercase text-[#d4af37]/80">
              Quarry Operations
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-[#161922]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Nav Item Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <p className={`px-3 text-[10px] font-bold tracking-widest uppercase ${group.color || 'text-[#d4af37]/60'}`}>
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-[#d4af37]/15 to-[#d4af37]/5 text-[#f3c64c] border-l-3 border-[#d4af37] shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#151821]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#d4af37]'
                            : 'text-gray-500 group-hover:text-gray-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                          isActive
                            ? 'bg-[#d4af37] text-black'
                            : 'bg-[#1e222e] text-gray-400 group-hover:text-gray-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Quarry Status Pill */}
        <div className="p-3 border-t border-[#222633] bg-[#090a0d]">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#13161f] border border-[#232735]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-bold text-gray-200 leading-tight">
                  Quarry Live Active
                </span>
                <span className="text-[9px] text-gray-500">Pit Operations Normal</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/20">
              RZ-1
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
