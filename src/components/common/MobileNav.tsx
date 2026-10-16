import React from 'react';
import { LayoutDashboard, Mountain, Truck, FileText, Plus } from 'lucide-react';
import { NavTab } from './Sidebar';

interface MobileNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSidebar: () => void;
  onOpenNewLoad: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenSidebar,
  onOpenNewLoad,
}) => {
  const isQuarryActive =
    currentTab === 'quarry_module' ||
    currentTab === 'quarry_mgmt' ||
    currentTab === 'production' ||
    currentTab === 'quality' ||
    currentTab === 'stock' ||
    currentTab === 'gate_pass' ||
    currentTab === 'expenses' ||
    currentTab === 'daily_account' ||
    currentTab === 'income' ||
    currentTab === 'staff' ||
    currentTab === 'attendance' ||
    currentTab === 'salary' ||
    currentTab === 'payslips';

  const isVehicleActive =
    currentTab === 'vehicle_module' ||
    currentTab === 'vehicles' ||
    currentTab === 'drivers' ||
    currentTab === 'rotation' ||
    currentTab === 'trips' ||
    currentTab === 'vehicle_expenses' ||
    currentTab === 'vehicle_accounts' ||
    currentTab === 'driver_accounts' ||
    currentTab === 'vehicle_ledger';

  const isOrderActive =
    currentTab === 'order_module' ||
    currentTab === 'loads' ||
    currentTab === 'customers' ||
    currentTab === 'agents' ||
    currentTab === 'customer_accounts' ||
    currentTab === 'rates' ||
    currentTab === 'delivery' ||
    currentTab === 'payment_terms' ||
    currentTab === 'payments' ||
    currentTab === 'bill_generator';

  return (
    <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b0c10]/95 backdrop-blur-md border-t border-[#222633] px-1.5 py-1.5 flex items-center justify-around">
      {/* Executive Pipeline */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
          currentTab === 'dashboard' ? 'text-[#d4af37]' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Pipeline</span>
      </button>

      {/* Module 1: Quarry */}
      <button
        onClick={() => onSelectTab('quarry_module')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
          isQuarryActive ? 'text-[#f3c64c]' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Mountain className="w-4 h-4" />
        <span>1. Quarry</span>
      </button>

      {/* Floating Center Action Button: Quick Book Order */}
      <button
        onClick={onOpenNewLoad}
        className="w-11 h-11 -mt-5 rounded-full gold-btn flex items-center justify-center shadow-lg shadow-[#d4af37]/30 border-2 border-[#0b0c10] cursor-pointer"
        title="Book Customer Order"
      >
        <Plus className="w-5 h-5 stroke-[3]" />
      </button>

      {/* Module 2: Vehicles */}
      <button
        onClick={() => onSelectTab('vehicle_module')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
          isVehicleActive ? 'text-sky-400' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Truck className="w-4 h-4" />
        <span>2. Fleet</span>
      </button>

      {/* Module 3: Orders */}
      <button
        onClick={() => onSelectTab('order_module')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
          isOrderActive ? 'text-emerald-400' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span>3. Orders</span>
      </button>
    </nav>
  );
};
