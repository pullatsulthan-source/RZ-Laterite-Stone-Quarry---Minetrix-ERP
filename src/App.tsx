import React, { useState, useMemo } from 'react';
import { QuarryProvider, useQuarry } from './context/QuarryContext';
import { Header, ActiveModuleType } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';

// Locked 3 Master Operational Modules
import { QuarryModuleView } from './views/modules/QuarryModuleView';
import { VehicleModuleView } from './views/modules/VehicleModuleView';
import { OrderModuleView } from './views/modules/OrderModuleView';

// Modals
import { NewLoadModal } from './components/modals/NewLoadModal';
import { GatePassModal } from './components/modals/GatePassModal';
import { StatementPrintModal } from './components/modals/StatementPrintModal';
import { PaymentModal } from './components/modals/PaymentModal';
import { ExpenseModal } from './components/modals/ExpenseModal';
import { ProductionModal } from './components/modals/ProductionModal';

// Views
import { DashboardView } from './views/DashboardView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';

import { Customer, GatePass, LoadOrder } from './types/quarry';

const QuarryAppInner: React.FC = () => {
  const { gatePasses, customers, loads } = useQuarry();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [newLoadModalOpen, setNewLoadModalOpen] = useState(false);
  const [initialLoadData, setInitialLoadData] = useState<Partial<LoadOrder> | undefined>(undefined);

  const [gatePassModalOpen, setGatePassModalOpen] = useState(false);
  const [selectedGatePass, setSelectedGatePass] = useState<GatePass | null>(null);

  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);
  const [statementDateRange, setStatementDateRange] = useState({ from: '', to: '' });
  const [statementOptions, setStatementOptions] = useState<{
    vehicleNumber?: string;
    driverName?: string;
    materialFilter?: string;
  }>({});

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [defaultPaymentCustomerId, setDefaultPaymentCustomerId] = useState<string | undefined>(undefined);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [productionModalOpen, setProductionModalOpen] = useState(false);

  // Direct access: No login screen, opens directly to Quarry Dashboard

  // Handlers
  const handleOpenNewLoad = (initialData?: Partial<LoadOrder>) => {
    setInitialLoadData(initialData);
    setNewLoadModalOpen(true);
  };

  const handleOpenGatePassModal = (gp: GatePass) => {
    setSelectedGatePass(gp);
    setGatePassModalOpen(true);
  };

  const handleViewGatePassByNumber = (gpNumber: string) => {
    const gp = gatePasses.find((g) => g.gatePassNumber === gpNumber);
    if (gp) {
      setSelectedGatePass(gp);
      setGatePassModalOpen(true);
    } else {
      alert(`Gate Pass ${gpNumber} not found.`);
    }
  };

  const handleOpenStatementModal = (
    customer: Customer,
    dateRange: { from: string; to: string },
    options?: { vehicleNumber?: string; driverName?: string; materialFilter?: string }
  ) => {
    setStatementCustomer(customer);
    setStatementDateRange(dateRange);
    setStatementOptions(options || {});
    setStatementModalOpen(true);
  };

  const handleOpenPaymentModal = (customerId?: string) => {
    setDefaultPaymentCustomerId(customerId);
    setPaymentModalOpen(true);
  };

  const handleNavigateToCustomerLedger = (customerId: string) => {
    setCurrentTab('customer_accounts');
  };

  // Determine active module based on current navigation tab
  const activeModule: ActiveModuleType = useMemo(() => {
    if (
      currentTab === 'quarry_module' ||
      currentTab === 'quarry_mgmt' ||
      currentTab === 'production' ||
      currentTab === 'quality' ||
      currentTab === 'stock' ||
      currentTab === 'gate_pass' ||
      currentTab === 'expenses' ||
      currentTab === 'daily_account' ||
      currentTab === 'staff' ||
      currentTab === 'attendance' ||
      currentTab === 'salary' ||
      currentTab === 'payslips' ||
      currentTab === 'income'
    ) {
      return 'quarry';
    }
    if (
      currentTab === 'vehicle_module' ||
      currentTab === 'vehicles' ||
      currentTab === 'drivers' ||
      currentTab === 'rotation' ||
      currentTab === 'trips' ||
      currentTab === 'vehicle_expenses' ||
      currentTab === 'vehicle_accounts' ||
      currentTab === 'driver_accounts' ||
      currentTab === 'vehicle_ledger'
    ) {
      return 'vehicle';
    }
    if (
      currentTab === 'order_module' ||
      currentTab === 'loads' ||
      currentTab === 'customers' ||
      currentTab === 'agents' ||
      currentTab === 'customer_accounts' ||
      currentTab === 'rates' ||
      currentTab === 'delivery' ||
      currentTab === 'payment_terms' ||
      currentTab === 'payments' ||
      currentTab === 'bill_generator'
    ) {
      return 'order';
    }
    return 'dashboard';
  }, [currentTab]);

  const handleSelectModule = (mod: ActiveModuleType) => {
    if (mod === 'quarry') setCurrentTab('quarry_module');
    else if (mod === 'vehicle') setCurrentTab('vehicle_module');
    else if (mod === 'order') setCurrentTab('order_module');
    else setCurrentTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#090a0d] text-[#e5e7eb] flex flex-col antialiased">
      {/* Top Header with 3 Master Operational Module Switcher */}
      <Header
        onOpenNewLoad={() => handleOpenNewLoad()}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        activeModule={activeModule}
        onSelectModule={handleSelectModule}
      />

      <div className="flex flex-1">
        {/* Sidebar for Desktop & Drawer for Mobile */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-72 p-3 sm:p-6 pb-20 lg:pb-8 max-w-7xl w-full mx-auto">
          {/* Executive Pipeline Dashboard */}
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenNewLoad={() => handleOpenNewLoad()}
              onOpenGatePass={() => setCurrentTab('gate_pass')}
              onOpenPayment={() => handleOpenPaymentModal()}
              onOpenExpense={() => setExpenseModalOpen(true)}
              onOpenProduction={() => setProductionModalOpen(true)}
            />
          )}

          {/* 1. QUARRY MANAGEMENT MODULE */}
          {(currentTab === 'quarry_module' ||
            currentTab === 'quarry_mgmt' ||
            currentTab === 'machinery' ||
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
            currentTab === 'payslips') && (
            <QuarryModuleView
              initialTab={
                currentTab === 'machinery'
                  ? 'machinery'
                  : currentTab === 'production'
                  ? 'production'
                  : currentTab === 'quality'
                  ? 'quality'
                  : currentTab === 'stock'
                  ? 'stock'
                  : currentTab === 'gate_pass'
                  ? 'gate'
                  : currentTab === 'expenses'
                  ? 'expenses'
                  : currentTab === 'daily_account' || currentTab === 'income'
                  ? 'billing'
                  : currentTab === 'staff'
                  ? 'staff'
                  : currentTab === 'attendance'
                  ? 'attendance'
                  : currentTab === 'salary'
                  ? 'salary'
                  : currentTab === 'payslips'
                  ? 'payslips'
                  : 'production'
              }
              onOpenProductionModal={() => setProductionModalOpen(true)}
              onOpenExpenseModal={() => setExpenseModalOpen(true)}
              onSelectGatePass={handleOpenGatePassModal}
              onOpenNewLoad={() => handleOpenNewLoad()}
            />
          )}

          {/* 2. VEHICLE MANAGEMENT MODULE */}
          {(currentTab === 'vehicle_module' ||
            currentTab === 'vehicles' ||
            currentTab === 'drivers' ||
            currentTab === 'rotation' ||
            currentTab === 'trips' ||
            currentTab === 'vehicle_expenses' ||
            currentTab === 'vehicle_accounts' ||
            currentTab === 'driver_accounts' ||
            currentTab === 'vehicle_ledger') && (
            <VehicleModuleView
              initialTab={
                currentTab === 'vehicles'
                  ? 'vehicles'
                  : currentTab === 'drivers'
                  ? 'drivers'
                  : currentTab === 'rotation'
                  ? 'rotation'
                  : currentTab === 'trips'
                  ? 'trips'
                  : currentTab === 'vehicle_expenses'
                  ? 'expenses'
                  : currentTab === 'vehicle_accounts'
                  ? 'accounts'
                  : currentTab === 'driver_accounts'
                  ? 'driver_collections'
                  : currentTab === 'vehicle_ledger'
                  ? 'ledger'
                  : 'vehicles'
              }
            />
          )}

          {/* 3. ORDER MANAGEMENT MODULE */}
          {(currentTab === 'order_module' ||
            currentTab === 'loads' ||
            currentTab === 'customers' ||
            currentTab === 'agents' ||
            currentTab === 'customer_accounts' ||
            currentTab === 'rates' ||
            currentTab === 'delivery' ||
            currentTab === 'payment_terms' ||
            currentTab === 'payments' ||
            currentTab === 'bill_generator') && (
            <OrderModuleView
              initialTab={
                currentTab === 'customers'
                  ? 'customers'
                  : currentTab === 'agents'
                  ? 'agents'
                  : currentTab === 'rates'
                  ? 'rate_master'
                  : currentTab === 'delivery'
                  ? 'delivery'
                  : currentTab === 'payment_terms'
                  ? 'payment_terms'
                  : currentTab === 'payments'
                  ? 'collections'
                  : currentTab === 'bill_generator' || currentTab === 'customer_accounts'
                  ? 'billing'
                  : 'orders'
              }
              onOpenNewLoad={handleOpenNewLoad}
              onViewGatePass={handleViewGatePassByNumber}
              onViewCustomerLedger={handleNavigateToCustomerLedger}
              onOpenStatementModal={handleOpenStatementModal}
              onOpenPaymentModal={handleOpenPaymentModal}
            />
          )}

          {/* System & Global Config */}
          {currentTab === 'reports' && <ReportsView />}
          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenNewLoad={() => handleOpenNewLoad()}
      />

      {/* Global Modals */}
      <NewLoadModal
        isOpen={newLoadModalOpen}
        onClose={() => setNewLoadModalOpen(false)}
        initialData={initialLoadData}
      />

      <GatePassModal
        isOpen={gatePassModalOpen}
        onClose={() => setGatePassModalOpen(false)}
        gatePass={selectedGatePass}
      />

      <StatementPrintModal
        isOpen={statementModalOpen}
        onClose={() => setStatementModalOpen(false)}
        customer={statementCustomer}
        loads={loads}
        dateRange={statementDateRange}
        vehicleNumber={statementOptions.vehicleNumber}
        driverName={statementOptions.driverName}
        materialFilter={statementOptions.materialFilter}
      />

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        defaultCustomerId={defaultPaymentCustomerId}
      />

      <ExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />

      <ProductionModal
        isOpen={productionModalOpen}
        onClose={() => setProductionModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <QuarryProvider>
      <QuarryAppInner />
    </QuarryProvider>
  );
}
