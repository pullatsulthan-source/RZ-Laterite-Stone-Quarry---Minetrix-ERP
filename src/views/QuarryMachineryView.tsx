import React, { useState, useMemo } from 'react';
import { useQuarry } from '../context/QuarryContext';
import {
  QuarryMachine,
  MachineType,
  MachineOwnerType,
  MachineStatus,
  JcbUsageRecord,
  MachineRentContract,
  DieselEntry,
  OilEntry,
  SparePartEntry,
  BladeRecord,
  MachineMaintenanceRecord,
  VendorShop,
  FoodPurchaseBill,
  ToolsRoomRentRecord,
} from '../types/quarry';
import {
  formatCurrency,
  formatNumber,
  getTodayDateString,
  getCurrentTimeString,
} from '../utils/formatters';
import {
  Wrench,
  Gauge,
  Fuel,
  Disc,
  FileText,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
  RotateCcw,
  Sparkles,
  Users,
  Search,
  Filter,
  DollarSign,
  Utensils,
  Home,
  Check,
  X,
  FileCheck,
  ChevronRight,
  Activity,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export type MachinerySubTab =
  | 'overview'
  | 'jcb'
  | 'contracts'
  | 'ledger'
  | 'diesel_oil'
  | 'spares_blades'
  | 'maintenance'
  | 'vendors_mess'
  | 'staffing_rules';

export const QuarryMachineryView: React.FC = () => {
  const {
    machines,
    addMachine,
    updateMachine,
    replaceMachine,
    deactivateMachine,
    jcbRecords,
    addJcbRecord,
    updateJcbRecord,
    deleteJcbRecord,
    rentContracts,
    addRentContract,
    updateRentContract,
    settleRentContract,
    dieselEntries,
    addDieselEntry,
    deleteDieselEntry,
    oilEntries,
    addOilEntry,
    deleteOilEntry,
    sparePartEntries,
    addSparePartEntry,
    deleteSparePartEntry,
    bladeRecords,
    addBladeRecord,
    updateBladeRecord,
    maintenanceRecords,
    addMaintenanceRecord,
    deleteMaintenanceRecord,
    vendors,
    addVendor,
    foodPurchases,
    addFoodPurchase,
    deleteFoodPurchase,
    toolsRoomRent,
    addToolsRoomRent,
    settleToolsRoomRent,
    activeQuarry,
    currentUser,
  } = useQuarry();

  const [activeSubTab, setActiveSubTab] = useState<MachinerySubTab>('overview');
  const [selectedMachineIdForLedger, setSelectedMachineIdForLedger] = useState<string>(
    machines[0]?.machineId || 'MCH-CM-01'
  );

  // Modals state
  const [showAddMachineModal, setShowAddMachineModal] = useState(false);
  const [showJcbModal, setShowJcbModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [machineToReplace, setMachineToReplace] = useState<QuarryMachine | null>(null);
  const [showAddDieselModal, setShowAddDieselModal] = useState(false);
  const [showAddSpareModal, setShowAddSpareModal] = useState(false);
  const [showAddMaintenanceModal, setShowAddMaintenanceModal] = useState(false);
  const [showSettleRentModal, setShowSettleRentModal] = useState<MachineRentContract | null>(null);

  // JCB Hour Reading Form State
  const [selectedJcbId, setSelectedJcbId] = useState(
    machines.find((m) => m.machineType === 'JCB')?.machineId || 'MCH-JCB-01'
  );
  const [jcbDate, setJcbDate] = useState(getTodayDateString());
  const [jcbStartReading, setJcbStartReading] = useState<number>(1256.5);
  const [jcbEndReading, setJcbEndReading] = useState<number>(1262.5);
  const [jcbRate, setJcbRate] = useState<number>(1400); // Default ₹1,400/hr
  const [jcbDescription, setJcbDescription] = useState('Bench overburden clearing & pit floor grading');
  const [jcbDieselResponsibility, setJcbDieselResponsibility] = useState<'Owner' | 'Quarry Reimbursed'>('Owner');
  const [jcbReimbursedDieselAmount, setJcbReimbursedDieselAmount] = useState<number>(0);
  const [jcbNotes, setJcbNotes] = useState('Verified by Quarry Supervisor.');

  // Calculated JCB values
  const calculatedJcbHours = Math.max(0, Math.round((jcbEndReading - jcbStartReading) * 10) / 10);
  const calculatedJcbAmount = calculatedJcbHours * jcbRate;
  const isJcbReadingValid = jcbEndReading >= jcbStartReading;

  // New Machine Form State
  const [newMachineForm, setNewMachineForm] = useState({
    machineId: `MCH-${String(machines.length + 1).padStart(2, '0')}`,
    machineName: '',
    machineType: 'Cutting Machine' as MachineType,
    ownerType: 'Quarry Owned' as MachineOwnerType,
    ownerName: 'RZ Quarry',
    registrationNumber: '',
    model: '',
    operator: '',
    assistantOperator: '',
    currentHourReading: 0,
    dailyRentAmount: 0,
    notes: '',
  });

  // Machine Replacement Form State
  const [replaceForm, setReplaceForm] = useState({
    newMachineId: '',
    newMachineName: '',
    model: '',
    operator: '',
    assistantOperator: '',
    startingHourReading: 0,
    notes: '',
  });

  // Diesel Form State
  const [dieselForm, setDieselForm] = useState({
    targetType: 'Quarry Machine' as 'Quarry Machine' | 'Vehicle' | 'JCB',
    machineId: machines[0]?.machineId || 'MCH-CM-01',
    supplier: vendors.find((v) => v.category === 'Diesel shop')?.vendorName || 'Hindustan Petroleum Melattur Bunk',
    quantityLiters: 50,
    ratePerLiter: 92,
    billNumber: '',
    notes: '',
  });

  // Selected Machine for Ledger details
  const currentLedgerMachine = useMemo(() => {
    return machines.find((m) => m.machineId === selectedMachineIdForLedger || m.id === selectedMachineIdForLedger) || machines[0];
  }, [machines, selectedMachineIdForLedger]);

  const machineDieselHistory = useMemo(() => {
    if (!currentLedgerMachine) return [];
    return dieselEntries.filter((d) => d.machineId === currentLedgerMachine.machineId || d.machineId === currentLedgerMachine.id);
  }, [dieselEntries, currentLedgerMachine]);

  const machineOilHistory = useMemo(() => {
    if (!currentLedgerMachine) return [];
    return oilEntries.filter((o) => o.machineId === currentLedgerMachine.machineId || o.machineId === currentLedgerMachine.id);
  }, [oilEntries, currentLedgerMachine]);

  const machineSparesHistory = useMemo(() => {
    if (!currentLedgerMachine) return [];
    return sparePartEntries.filter((s) => s.machineId === currentLedgerMachine.machineId || s.machineId === currentLedgerMachine.id);
  }, [sparePartEntries, currentLedgerMachine]);

  const machineMaintenanceHistory = useMemo(() => {
    if (!currentLedgerMachine) return [];
    return maintenanceRecords.filter((m) => m.machineId === currentLedgerMachine.machineId || m.machineId === currentLedgerMachine.id);
  }, [maintenanceRecords, currentLedgerMachine]);

  const machineBladesHistory = useMemo(() => {
    if (!currentLedgerMachine) return [];
    return bladeRecords.filter((b) => b.machineId === currentLedgerMachine.machineId || b.machineId === currentLedgerMachine.id);
  }, [bladeRecords, currentLedgerMachine]);

  // Total expense for selected machine
  const machineTotalDieselCost = machineDieselHistory.reduce((s, d) => s + d.amount, 0);
  const machineTotalOilCost = machineOilHistory.reduce((s, o) => s + o.amount, 0);
  const machineTotalSparesCost = machineSparesHistory.reduce((s, sp) => s + sp.amount, 0);
  const machineTotalMaintenanceCost = machineMaintenanceHistory.reduce((s, m) => s + m.totalCost, 0);
  const machineTotalExpense =
    machineTotalDieselCost + machineTotalOilCost + machineTotalSparesCost + machineTotalMaintenanceCost;

  // JCB Submissions
  const handleSaveJcbReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJcbReadingValid) {
      alert(`Invalid Meter Gauge: End reading (${jcbEndReading}) cannot be less than start reading (${jcbStartReading}).`);
      return;
    }

    const jcbMachine = machines.find((m) => m.machineId === selectedJcbId);
    try {
      addJcbRecord({
        date: jcbDate,
        jcbId: selectedJcbId,
        jcbName: jcbMachine?.machineName || 'JCB Excavator',
        owner: jcbMachine?.ownerName || 'Equipment Contractor',
        operator: jcbMachine?.operator || 'JCB Operator',
        startHourReading: jcbStartReading,
        endHourReading: jcbEndReading,
        ratePerHour: jcbRate,
        workDescription: jcbDescription,
        dieselResponsibility: jcbDieselResponsibility,
        reimbursedDieselAmount: jcbDieselResponsibility === 'Quarry Reimbursed' ? jcbReimbursedDieselAmount : 0,
        notes: jcbNotes,
        quarryId: activeQuarry.id,
      });

      setShowJcbModal(false);
      // Advance default readings for next entry
      setJcbStartReading(jcbEndReading);
      setJcbEndReading(jcbEndReading + 5.0);
    } catch (err: any) {
      alert(err.message || 'Error recording JCB entry');
    }
  };

  const handleCreateMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineForm.machineName.trim()) {
      alert('Please enter machine name.');
      return;
    }

    addMachine({
      machineId: newMachineForm.machineId.trim().toUpperCase(),
      machineName: newMachineForm.machineName.trim(),
      machineType: newMachineForm.machineType,
      ownerType: newMachineForm.ownerType,
      ownerName: newMachineForm.ownerName.trim(),
      registrationNumber: newMachineForm.registrationNumber.trim(),
      model: newMachineForm.model.trim(),
      operator: newMachineForm.operator.trim(),
      assistantOperator: newMachineForm.assistantOperator.trim(),
      currentStatus: 'Active',
      installationDate: getTodayDateString(),
      currentHourReading: Number(newMachineForm.currentHourReading) || 0,
      dailyRentAmount: Number(newMachineForm.dailyRentAmount) || 0,
      notes: newMachineForm.notes.trim(),
      quarryId: activeQuarry.id,
      quarryName: activeQuarry.quarryName,
      active: true,
    });

    setShowAddMachineModal(false);
    setNewMachineForm({
      machineId: `MCH-${String(machines.length + 2).padStart(2, '0')}`,
      machineName: '',
      machineType: 'Cutting Machine',
      ownerType: 'Quarry Owned',
      ownerName: 'RZ Quarry',
      registrationNumber: '',
      model: '',
      operator: '',
      assistantOperator: '',
      currentHourReading: 0,
      dailyRentAmount: 0,
      notes: '',
    });
  };

  const handleExecuteReplacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineToReplace) return;
    if (!replaceForm.newMachineName.trim()) {
      alert('Please enter the new machine name.');
      return;
    }

    replaceMachine(machineToReplace.machineId, {
      machineId: replaceForm.newMachineId.trim().toUpperCase() || `MCH-REP-${Date.now().toString().slice(-4)}`,
      machineName: replaceForm.newMachineName.trim(),
      machineType: machineToReplace.machineType,
      ownerType: machineToReplace.ownerType,
      ownerName: machineToReplace.ownerName,
      model: replaceForm.model.trim() || machineToReplace.model,
      operator: replaceForm.operator.trim() || machineToReplace.operator,
      assistantOperator: replaceForm.assistantOperator.trim() || machineToReplace.assistantOperator,
      currentStatus: 'Active',
      installationDate: getTodayDateString(),
      currentHourReading: Number(replaceForm.startingHourReading) || 0,
      quarryId: activeQuarry.id,
      quarryName: activeQuarry.quarryName,
      notes: replaceForm.notes.trim(),
      active: true,
    });

    setShowReplaceModal(false);
    setMachineToReplace(null);
  };

  const subTabs = [
    { id: 'overview', label: '1. Machinery Master', icon: Wrench, count: machines.length },
    { id: 'jcb', label: '2. JCB Meter Readings', icon: Gauge, count: jcbRecords.length },
    { id: 'contracts', label: '3. Machine Rent Contracts', icon: Building2, count: rentContracts.length },
    { id: 'ledger', label: '4. Machine Ledgers', icon: FileText },
    { id: 'diesel_oil', label: '5. Diesel & Oil Ledgers', icon: Fuel, count: dieselEntries.length + oilEntries.length },
    { id: 'spares_blades', label: '6. Blades & Spares', icon: Disc, count: bladeRecords.length + sparePartEntries.length },
    { id: 'maintenance', label: '7. Maintenance & Repairs', icon: RotateCcw, count: maintenanceRecords.length },
    { id: 'vendors_mess', label: '8. Vendors, Mess & Tools Rent', icon: Utensils },
    { id: 'staffing_rules', label: '9. Staffing Rules & Formulas', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#17140f] via-[#121319] to-[#14120f] border border-[#d4af37]/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-[#d4af37]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8f741c] text-black flex items-center justify-center shadow-lg font-black">
              <Wrench className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40 font-bold">
                  PROMPT 3 COMPLIANT
                </span>
                <span className="text-xs text-gray-400">Quarry Machinery, JCB, Spares & Rent</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 mt-0.5 tracking-wide">
                QUARRY MACHINERY & MAINTENANCE
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowJcbModal(true)}
              className="gold-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Gauge className="w-4 h-4" />
              <span>Record JCB Hours (₹1,400/hr)</span>
            </button>
            <button
              onClick={() => setShowAddMachineModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1a1e2b] hover:bg-[#252b3d] text-gray-200 border border-[#2d354b] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#d4af37]" />
              <span>Add New Machine</span>
            </button>
            <button
              onClick={() => setShowAddDieselModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1a1e2b] hover:bg-[#252b3d] text-gray-200 border border-[#2d354b] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Fuel className="w-4 h-4 text-amber-400" />
              <span>Log Machine Diesel</span>
            </button>
          </div>
        </div>

        {/* Real-time Fleet Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#262b3b]">
          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Active Machinery Fleet
            </span>
            <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">
              {machines.filter((m) => m.currentStatus === 'Active').length} Units
            </span>
            <span className="text-[10px] text-gray-400">
              {machines.filter((m) => m.machineType === 'Cutting Machine').length} Cutters •{' '}
              {machines.filter((m) => m.machineType === 'JCB').length} JCBs •{' '}
              {machines.filter((m) => m.machineType === 'Rail' || m.machineType === 'Adarth Machine').length} Rails
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              JCB Operational Meter
            </span>
            <span className="text-lg font-black font-mono text-[#f3c64c] mt-0.5 block">
              {jcbRecords.reduce((sum, j) => sum + j.totalHours, 0).toFixed(1)} Hours
            </span>
            <span className="text-[10px] text-gray-400">
              Total Billed: {formatCurrency(jcbRecords.reduce((sum, j) => sum + j.totalAmount, 0))}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Machine Rent Contracts
            </span>
            <span className="text-lg font-black font-mono text-sky-400 mt-0.5 block">
              Mujeeb ₹2,000/d • Ali ₹0
            </span>
            <span className="text-[10px] text-gray-400">
              Bal: {formatCurrency(rentContracts.reduce((sum, c) => sum + c.outstandingBalance, 0))}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Accounting Segregation
            </span>
            <span className="text-lg font-black font-mono text-rose-400 mt-0.5 block">
              Machine-Wise
            </span>
            <span className="text-[10px] text-gray-400">Never mixed with generic accounts</span>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#222736]">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as MachinerySubTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b89222] text-[#090a0d] shadow-md shadow-[#d4af37]/25 font-black'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#141722] bg-[#0d0f15] border border-[#1e2332]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-black/30 text-black' : 'bg-[#1b202e] text-gray-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MACHINERY MASTER OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-gray-100">
                Quarry Machinery Master & Equipment Fleet
              </h3>
              <p className="text-xs text-gray-400">
                Permanent Machine IDs • Full maintenance & expense history retention on replacement • Configurable
                rental terms
              </p>
            </div>
            <button
              onClick={() => setShowAddMachineModal(true)}
              className="gold-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Equipment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine) => {
              const isJcb = machine.machineType === 'JCB';
              const isRetired = machine.currentStatus === 'Retired' || machine.currentStatus === 'Inactive';
              return (
                <div
                  key={machine.id}
                  className={`p-4 rounded-2xl bg-[#12141a] border transition-all space-y-3 relative overflow-hidden ${
                    isRetired
                      ? 'border-gray-800 opacity-70 bg-[#0d0e12]'
                      : 'border-[#232736] hover:border-[#d4af37]/40'
                  }`}
                >
                  {/* Status & ID Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1e2332] text-gray-200 border border-[#2b3347]">
                      {machine.machineId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        machine.currentStatus === 'Active'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : machine.currentStatus === 'Retired'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {machine.currentStatus.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-100 text-sm">{machine.machineName}</h4>
                    <p className="text-xs text-gray-400">{machine.model || machine.machineType}</p>
                  </div>

                  {/* Core specifications */}
                  <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b] text-xs space-y-1.5">
                    <div className="flex justify-between text-gray-400">
                      <span>Ownership:</span>
                      <span className="font-semibold text-gray-200">
                        {machine.ownerType} ({machine.ownerName})
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-400">
                      <span>Assigned Operator:</span>
                      <span className="font-semibold text-[#f3c64c]">{machine.operator || 'Not assigned'}</span>
                    </div>

                    {machine.assistantOperator && (
                      <div className="flex justify-between text-gray-400">
                        <span>Asst. Operator:</span>
                        <span className="text-gray-300">{machine.assistantOperator}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-400 border-t border-[#181d28] pt-1">
                      <span>Cumulative Hours:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {machine.currentHourReading.toFixed(1)} hrs
                      </span>
                    </div>

                    {isJcb && (
                      <div className="flex justify-between text-gray-400">
                        <span>Standard JCB Rate:</span>
                        <span className="font-mono text-[#f3c64c] font-bold">₹1,400 / hour</span>
                      </div>
                    )}

                    {machine.dailyRentAmount !== undefined && (
                      <div className="flex justify-between text-gray-400">
                        <span>Contract Daily Rent:</span>
                        <span className="font-mono text-sky-400 font-bold">
                          {machine.dailyRentAmount === 0 ? '₹0 (NO RENT)' : formatCurrency(machine.dailyRentAmount) + '/day'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Replacement Tag if Retired */}
                  {machine.replacedByMachineId && (
                    <div className="p-2 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>
                        Replaced on {machine.replacementDate} by <b>{machine.replacedByMachineId}</b>. Historical expenses
                        preserved.
                      </span>
                    </div>
                  )}

                  {machine.notes && <p className="text-[11px] text-gray-400 italic line-clamp-2">{machine.notes}</p>}

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#202534]">
                    <button
                      onClick={() => {
                        setSelectedMachineIdForLedger(machine.machineId);
                        setActiveSubTab('ledger');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[#1a1e2b] hover:bg-[#252b3d] text-gray-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3 text-[#d4af37]" />
                      <span>Machine Ledger</span>
                    </button>

                    {!isRetired && (
                      <button
                        onClick={() => {
                          setMachineToReplace(machine);
                          setReplaceForm({
                            newMachineId: `MCH-${String(machines.length + 1).padStart(2, '0')}`,
                            newMachineName: `${machine.machineName} (Replacement)`,
                            model: machine.model || '',
                            operator: machine.operator || '',
                            assistantOperator: machine.assistantOperator || '',
                            startingHourReading: 0,
                            notes: `Direct replacement unit for decommissioned ${machine.machineId}`,
                          });
                          setShowReplaceModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 text-xs font-semibold transition-colors border border-purple-800/40 cursor-pointer"
                        title="Replace machine while preserving all historical expenses under the old ID"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: JCB DAILY RUNNING HOUR READINGS */}
      {activeSubTab === 'jcb' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-gray-100">
                JCB Daily Running Hours & Meter Gauge Log
              </h3>
              <p className="text-xs text-gray-400">
                Operator selects the active JCB • End Reading - Start Reading = Total Hours • ₹1,400/hr default • Owner
                fuel responsibility
              </p>
            </div>
            <button
              onClick={() => setShowJcbModal(true)}
              className="gold-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log JCB Running Session</span>
            </button>
          </div>

          {/* JCB Policy Callout */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <b>JCB OWNER FUEL RESPONSIBILITY MANDATE:</b> JCB diesel is strictly the JCB owner's responsibility.
                JCB fuel does NOT automatically become a Quarry expense unless an explicit reimbursed transaction is
                recorded.
              </div>
            </div>
            <span className="font-mono text-amber-400 font-bold shrink-0 text-sm">₹1,400 / HOUR STANDARD</span>
          </div>

          {/* JCB Records Table */}
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
            <h4 className="font-bold text-gray-200 text-sm flex items-center justify-between">
              <span>Historical JCB Operations Log ({jcbRecords.length} Sessions)</span>
              <span className="font-mono text-xs text-[#f3c64c]">
                Total Paid/Accrued: {formatCurrency(jcbRecords.reduce((s, j) => s + j.totalAmount, 0))}
              </span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#202534] text-gray-400 text-[11px] uppercase font-mono">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">JCB Machine</th>
                    <th className="py-2.5 px-3">Operator / Owner</th>
                    <th className="py-2.5 px-3">Start Gauge</th>
                    <th className="py-2.5 px-3">End Gauge</th>
                    <th className="py-2.5 px-3">Total Hours</th>
                    <th className="py-2.5 px-3">Rate</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Diesel Status</th>
                    <th className="py-2.5 px-3">Work Description</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b202e]">
                  {jcbRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#161a24] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-200">{rec.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-100">{rec.jcbName}</td>
                      <td className="py-2.5 px-3 text-gray-300">
                        {rec.operator} <span className="text-[10px] text-gray-500 block">{rec.owner}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-400">{rec.startHourReading.toFixed(1)}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-200">{rec.endHourReading.toFixed(1)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                        {rec.totalHours.toFixed(1)} hrs
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-400">₹{rec.ratePerHour}/hr</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#f3c64c]">
                        {formatCurrency(rec.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rec.dieselResponsibility === 'Owner'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {rec.dieselResponsibility === 'Owner'
                            ? 'Owner Fuel'
                            : `Reimbursed (${formatCurrency(rec.reimbursedDieselAmount || 0)})`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-400 max-w-xs truncate">{rec.workDescription}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm('Delete this JCB usage record?')) {
                              deleteJcbRecord(rec.id);
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 p-1 rounded"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MACHINE RENT CONTRACTS */}
      {activeSubTab === 'contracts' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-gray-100">
                Machine Rental Contracts & Agreements
              </h3>
              <p className="text-xs text-gray-400">
                Mujeeb: 2 Cutting Machines + 1 Rail = ₹2,000/working day • Ali's Rail: Strictly ₹0 (NO RENT)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rentContracts.map((contract) => (
              <div
                key={contract.id}
                className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] hover:border-[#d4af37]/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1e2332] text-gray-200">
                    {contract.contractId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      contract.paymentStatus === 'PAID'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {contract.paymentStatus}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-100 text-sm">Machine Owner: {contract.owner}</h4>
                  <p className="text-xs text-gray-400">
                    Daily Rate: <b>{contract.dailyRate === 0 ? '₹0 / day (No Rent Agreement)' : `₹${contract.dailyRate} / working day`}</b>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1b1f2b] text-xs space-y-1.5">
                  <div className="text-gray-400">
                    <span className="block text-[10px] uppercase font-bold text-gray-500">Covered Equipment:</span>
                    <span className="text-gray-200 font-semibold">{contract.machines.join(', ')}</span>
                  </div>

                  <div className="flex justify-between text-gray-400 border-t border-[#181d28] pt-1">
                    <span>Accrued Rent:</span>
                    <span className="font-mono text-gray-200 font-bold">{formatCurrency(contract.accruedRent)}</span>
                  </div>

                  <div className="flex justify-between text-gray-400">
                    <span>Paid Rent:</span>
                    <span className="font-mono text-emerald-400">{formatCurrency(contract.paidRent)}</span>
                  </div>

                  <div className="flex justify-between text-gray-300 font-bold border-t border-[#181d28] pt-1">
                    <span>Outstanding Payable:</span>
                    <span className="font-mono text-[#f3c64c]">{formatCurrency(contract.outstandingBalance)}</span>
                  </div>
                </div>

                {contract.notes && <p className="text-xs text-gray-400 italic">{contract.notes}</p>}

                {contract.outstandingBalance > 0 && (
                  <button
                    onClick={() => setShowSettleRentModal(contract)}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-[#1e2332] hover:bg-[#282f42] text-gray-200 border border-[#2f364c] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Settle Rent Payment</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MACHINE-SPECIFIC ACCOUNTING & LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-gray-100">
                Machine-Specific Operational Ledger
              </h3>
              <p className="text-xs text-gray-400">
                STRICT MANDATE: Never combine machine expenses. Each cutting machine, rail and JCB maintains its own
                isolated cost history.
              </p>
            </div>

            {/* Machine Picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold">Select Machine:</span>
              <select
                value={selectedMachineIdForLedger}
                onChange={(e) => setSelectedMachineIdForLedger(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#1b202e] border border-[#2d354b] text-gray-100 text-xs font-bold focus:outline-none focus:border-[#d4af37]"
              >
                {machines.map((m) => (
                  <option key={m.id} value={m.machineId}>
                    {m.machineId} — {m.machineName} ({m.ownerName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Machine Header Card */}
          {currentLedgerMachine && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#17140f] to-[#121319] border border-[#d4af37]/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#f3c64c] font-bold px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/40">
                    {currentLedgerMachine.machineId} • {currentLedgerMachine.ownerType}
                  </span>
                  <h2 className="text-xl font-black text-gray-100 mt-1 font-cinzel">
                    {currentLedgerMachine.machineName}
                  </h2>
                  <span className="text-xs text-gray-400">
                    Operator: <b>{currentLedgerMachine.operator || 'None'}</b> • Gauge: <b>{currentLedgerMachine.currentHourReading.toFixed(1)} hrs</b>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Total Machine Operational Cost</span>
                  <span className="text-2xl font-black font-mono text-[#f3c64c]">
                    {formatCurrency(machineTotalExpense)}
                  </span>
                </div>
              </div>

              {/* Sub-cost breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#262b3b]">
                <div className="p-2.5 rounded-xl bg-[#0d0f14] border border-[#1b1f2b]">
                  <span className="text-[10px] text-gray-400 block">Diesel Fuel</span>
                  <span className="font-mono font-bold text-gray-200">{formatCurrency(machineTotalDieselCost)}</span>
                  <span className="text-[10px] text-gray-500 block">{machineDieselHistory.length} refueling logs</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0d0f14] border border-[#1b1f2b]">
                  <span className="text-[10px] text-gray-400 block">Oil & Lubricants</span>
                  <span className="font-mono font-bold text-gray-200">{formatCurrency(machineTotalOilCost)}</span>
                  <span className="text-[10px] text-gray-500 block">{machineOilHistory.length} oil services</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0d0f14] border border-[#1b1f2b]">
                  <span className="text-[10px] text-gray-400 block">Spare Parts & Blades</span>
                  <span className="font-mono font-bold text-gray-200">{formatCurrency(machineTotalSparesCost)}</span>
                  <span className="text-[10px] text-gray-500 block">{machineSparesHistory.length} parts</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0d0f14] border border-[#1b1f2b]">
                  <span className="text-[10px] text-gray-400 block">Repairs & Maintenance</span>
                  <span className="font-mono font-bold text-gray-200">{formatCurrency(machineTotalMaintenanceCost)}</span>
                  <span className="text-[10px] text-gray-500 block">{machineMaintenanceHistory.length} jobs</span>
                </div>
              </div>
            </div>
          )}

          {/* Machine Expense Ledger Table */}
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
            <h4 className="font-bold text-gray-200 text-sm">
              Complete Expense Ledger for {currentLedgerMachine?.machineName} ({currentLedgerMachine?.machineId})
            </h4>

            {machineDieselHistory.length === 0 &&
            machineOilHistory.length === 0 &&
            machineSparesHistory.length === 0 &&
            machineMaintenanceHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                No individual expenses recorded yet for this machine. Log diesel, oil, spares, or repairs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#202534] text-gray-400 text-[11px] uppercase font-mono">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Expense Category</th>
                      <th className="py-2.5 px-3">Item / Description</th>
                      <th className="py-2.5 px-3">Supplier / Shop</th>
                      <th className="py-2.5 px-3">Bill Number</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1b202e]">
                    {machineDieselHistory.map((d) => (
                      <tr key={d.id} className="hover:bg-[#161a24]">
                        <td className="py-2.5 px-3 font-mono text-gray-300">{d.date}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                            Diesel Fuel
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-200">
                          {d.quantityLiters} Liters @ ₹{d.ratePerLiter}/L
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">{d.supplier}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-400">{d.billNumber || '—'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-gray-100">
                          {formatCurrency(d.amount)}
                        </td>
                      </tr>
                    ))}

                    {machineOilHistory.map((o) => (
                      <tr key={o.id} className="hover:bg-[#161a24]">
                        <td className="py-2.5 px-3 font-mono text-gray-300">{o.date}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                            {o.oilType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-200">{o.quantityLiters}L Oil top-up</td>
                        <td className="py-2.5 px-3 text-gray-400">{o.supplier}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-400">{o.billNumber || '—'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-gray-100">
                          {formatCurrency(o.amount)}
                        </td>
                      </tr>
                    ))}

                    {machineSparesHistory.map((s) => (
                      <tr key={s.id} className="hover:bg-[#161a24]">
                        <td className="py-2.5 px-3 font-mono text-gray-300">{s.date}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            Spare: {s.partCategory}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-200">
                          {s.partName} ({s.quantity} {s.unit})
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">{s.supplier}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-400">{s.billNumber || '—'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-gray-100">
                          {formatCurrency(s.amount)}
                        </td>
                      </tr>
                    ))}

                    {machineMaintenanceHistory.map((m) => (
                      <tr key={m.id} className="hover:bg-[#161a24]">
                        <td className="py-2.5 px-3 font-mono text-gray-300">{m.date}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">
                            Maintenance: {m.maintenanceType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-200">{m.description}</td>
                        <td className="py-2.5 px-3 text-gray-400">{m.technicianOrShop}</td>
                        <td className="py-2.5 px-3 font-mono text-gray-400">{m.billNumber || '—'}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-[#f3c64c]">
                          {formatCurrency(m.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DIESEL & OIL LEDGERS */}
      {activeSubTab === 'diesel_oil' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-gray-100">
                Diesel & Lubrication Ledgers
              </h3>
              <p className="text-xs text-gray-400">
                Separate ledgers for Cutting Machines, Adarth Rail, JCB Reimbursed, and Fleet Vehicles
              </p>
            </div>
            <button
              onClick={() => setShowAddDieselModal(true)}
              className="gold-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Diesel Refueling</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Diesel Entries */}
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
              <h4 className="font-bold text-gray-200 text-sm flex items-center justify-between">
                <span>Quarry Machine Diesel Log</span>
                <span className="font-mono text-xs text-amber-400">
                  Total: {formatCurrency(dieselEntries.reduce((s, d) => s + d.amount, 0))}
                </span>
              </h4>

              <div className="space-y-2">
                {dieselEntries.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-[#090b0e] border border-[#1d2232] text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-200">{d.machineName || d.targetType}</span>
                      <span className="font-mono font-bold text-[#f3c64c]">{formatCurrency(d.amount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-[11px]">
                      <span>
                        {d.quantityLiters}L @ ₹{d.ratePerLiter}/L • {d.date}
                      </span>
                      <span>Supplier: {d.supplier}</span>
                    </div>
                    {d.billNumber && (
                      <span className="text-[10px] font-mono text-gray-500 block">Bill #{d.billNumber}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Oil Entries */}
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
              <h4 className="font-bold text-gray-200 text-sm flex items-center justify-between">
                <span>Lubricating Oils (Engine / Hydraulic / Gear)</span>
                <span className="font-mono text-xs text-blue-400">
                  Total: {formatCurrency(oilEntries.reduce((s, o) => s + o.amount, 0))}
                </span>
              </h4>

              <div className="space-y-2">
                {oilEntries.map((o) => (
                  <div key={o.id} className="p-3 rounded-xl bg-[#090b0e] border border-[#1d2232] text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-200">
                        {o.oilType} — {o.machineName}
                      </span>
                      <span className="font-mono font-bold text-blue-400">{formatCurrency(o.amount)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-[11px]">
                      <span>
                        {o.quantityLiters}L @ ₹{o.ratePerLiter}/L • {o.date}
                      </span>
                      <span>{o.supplier}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: BLADES & SPARE PARTS */}
      {activeSubTab === 'spares_blades' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-gray-100">
                Diamond Blades & Quarry Spare Parts
              </h3>
              <p className="text-xs text-gray-400">
                Standard reference: Cutting Blade ₹14,000 • Adarth Blade ₹15,000 • Running hours and stone output wear
                monitoring
              </p>
            </div>
            <button
              onClick={() => {
                const bladeType = confirm('Add Cutting Blade (₹14,000) or Adarth Blade (₹15,000)? Click OK for Cutting Blade, Cancel for Adarth.')
                  ? 'Cutting Blade'
                  : 'Adarth Blade';
                const price = bladeType === 'Cutting Blade' ? 14000 : 15000;
                addBladeRecord({
                  bladeType,
                  machineId: bladeType === 'Cutting Blade' ? 'MCH-CM-01' : 'MCH-AD-01',
                  machineName: bladeType === 'Cutting Blade' ? 'Cutting Machine 01' : 'Adarth Rail',
                  purchaseDate: getTodayDateString(),
                  purchasePrice: price,
                  installedDate: getTodayDateString(),
                  runningHours: 0,
                  productionOutputStones: 0,
                  status: 'NEW',
                  supplier: 'Perinthalmanna Spare Parts & Engineering',
                  notes: `New ${bladeType} installed on ${getTodayDateString()}`,
                  quarryId: activeQuarry.id,
                });
              }}
              className="gold-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Diamond Blade</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bladeRecords.map((blade) => (
              <div
                key={blade.id}
                className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] hover:border-[#d4af37]/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1e2332] text-gray-200">
                    {blade.bladeId}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      blade.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {blade.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-100 text-sm">{blade.bladeType}</h4>
                  <p className="text-xs text-gray-400">Fitted on: <b>{blade.machineName}</b></p>
                </div>

                <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1b1f2b] text-xs space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span>Purchase Cost:</span>
                    <span className="font-mono text-gray-100 font-bold">{formatCurrency(blade.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Installed Date:</span>
                    <span className="font-mono text-gray-300">{blade.installedDate || '—'}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Running Hours:</span>
                    <span className="font-mono text-emerald-400 font-bold">{blade.runningHours.toFixed(1)} hrs</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Stones Cut:</span>
                    <span className="font-mono text-[#f3c64c] font-bold">
                      {blade.productionOutputStones?.toLocaleString() || 0} pcs
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 italic">{blade.notes}</p>
              </div>
            ))}
          </div>

          {/* Spare Parts Register */}
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
            <h4 className="font-bold text-gray-200 text-sm flex items-center justify-between">
              <span>Quarry Spare Parts Inventory & Replacement Log</span>
              <span className="font-mono text-xs text-emerald-400">
                Total Parts: {formatCurrency(sparePartEntries.reduce((s, p) => s + p.amount, 0))}
              </span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#202534] text-gray-400 text-[11px] uppercase font-mono">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Machine</th>
                    <th className="py-2 px-3">Part Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Quantity</th>
                    <th className="py-2 px-3">Supplier</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1b202e]">
                  {sparePartEntries.map((sp) => (
                    <tr key={sp.id} className="hover:bg-[#161a24]">
                      <td className="py-2 px-3 font-mono text-gray-300">{sp.date}</td>
                      <td className="py-2 px-3 font-semibold text-gray-200">{sp.machineName}</td>
                      <td className="py-2 px-3 text-gray-100">{sp.partName}</td>
                      <td className="py-2 px-3 text-gray-400">{sp.partCategory}</td>
                      <td className="py-2 px-3 font-mono text-gray-300">
                        {sp.quantity} {sp.unit}
                      </td>
                      <td className="py-2 px-3 text-gray-400">{sp.supplier}</td>
                      <td className="py-2 px-3 font-mono font-bold text-right text-[#f3c64c]">
                        {formatCurrency(sp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: MAINTENANCE & REPAIRS */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-gray-100">
                Machine Maintenance, Service & Breakdown Repairs
              </h3>
              <p className="text-xs text-gray-400">
                Track labour cost, parts cost, servicing shops, next service dates per machine
              </p>
            </div>
            <button
              onClick={() => {
                const desc = prompt('Enter maintenance job description:');
                if (!desc) return;
                const labour = Number(prompt('Enter labour cost (INR):', '1500')) || 0;
                const parts = Number(prompt('Enter parts cost (INR):', '2000')) || 0;
                addMaintenanceRecord({
                  date: getTodayDateString(),
                  machineId: machines[0].machineId,
                  machineName: machines[0].machineName,
                  maintenanceType: 'Service',
                  description: desc,
                  technicianOrShop: 'Ali & Sons Mechanical Works',
                  labourCost: labour,
                  partsCost: parts,
                  quarryId: activeQuarry.id,
                });
              }}
              className="gold-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Maintenance Job</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maintenanceRecords.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gray-300">{m.maintenanceId}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {m.maintenanceType.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-100 text-sm">{m.machineName}</h4>
                  <p className="text-xs text-gray-300 mt-0.5">{m.description}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1b1f2b] text-xs space-y-1">
                  <div className="flex justify-between text-gray-400">
                    <span>Shop / Technician:</span>
                    <span className="text-gray-200">{m.technicianOrShop}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Labour Cost:</span>
                    <span className="font-mono text-gray-200">{formatCurrency(m.labourCost)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Parts Cost:</span>
                    <span className="font-mono text-gray-200">{formatCurrency(m.partsCost)}</span>
                  </div>
                  <div className="flex justify-between text-gray-100 font-bold border-t border-[#1b1f2b] pt-1">
                    <span>Total Service Cost:</span>
                    <span className="font-mono text-[#f3c64c]">{formatCurrency(m.totalCost)}</span>
                  </div>
                </div>

                {m.nextServiceDate && (
                  <span className="text-[10px] text-gray-400 block font-mono">
                    Next Scheduled Service: <b>{m.nextServiceDate}</b>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: VENDORS, WORKER MESS & TOOLS ROOM RENT */}
      {activeSubTab === 'vendors_mess' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-gray-100">
                Vendors, Worker Welfare Provisions & Tools Room Rent
              </h3>
              <p className="text-xs text-gray-400">
                Shop accounts • Food purchases are strictly kept as worker welfare expenses • Tools Room Rent = ₹2,000/month
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tools Room Rent Card */}
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#d4af37]/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-bold text-gray-100 text-sm">Tools Room Rent</span>
                </div>
                <span className="font-mono text-xs text-[#f3c64c] font-bold">₹2,000 / month</span>
              </div>

              <p className="text-xs text-gray-400">
                Monthly tools storage and equipment shelter shed rent near pit boundary.
              </p>

              <div className="space-y-2">
                {toolsRoomRent.map((tr) => (
                  <div key={tr.id} className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b] text-xs space-y-1">
                    <div className="flex justify-between font-bold text-gray-200">
                      <span>{tr.month}</span>
                      <span className="font-mono text-emerald-400">{formatCurrency(tr.paid)} Paid</span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-[11px]">
                      <span>Due: {formatCurrency(tr.rentDue)}</span>
                      <span>Bal: {formatCurrency(tr.outstanding)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Food Purchases (Mess) Card */}
            <div className="p-4 rounded-2xl bg-[#12141a] border border-emerald-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-gray-100 text-sm">Worker Food Bills</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  Worker Welfare
                </span>
              </div>

              <p className="text-xs text-gray-400">
                Mess provisions, rice, tea and refreshments. Never combined with machine expenses.
              </p>

              <div className="space-y-2">
                {foodPurchases.map((fp) => (
                  <div key={fp.id} className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b] text-xs space-y-1">
                    <div className="flex justify-between font-bold text-gray-200">
                      <span>{fp.shopOrVendor}</span>
                      <span className="font-mono text-[#f3c64c]">{formatCurrency(fp.amount)}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{fp.items}</p>
                    <span className="text-[10px] text-gray-500 font-mono block">{fp.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendor Shops Master Card */}
            <div className="p-4 rounded-2xl bg-[#12141a] border border-blue-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-gray-100 text-sm">Vendor & Workshop Master</span>
                </div>
                <span className="font-mono text-xs text-blue-400">{vendors.length} Vendors</span>
              </div>

              <p className="text-xs text-gray-400">
                Fuel bunks, oil suppliers, lathe works and spare parts shops.
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {vendors.map((v) => (
                  <div key={v.id} className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b] text-xs space-y-1">
                    <div className="flex justify-between font-bold text-gray-200">
                      <span>{v.vendorName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c2233] text-gray-300">
                        {v.category}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400 text-[11px]">
                      <span>{v.phone}</span>
                      <span className="font-mono text-rose-400">Bal: {formatCurrency(v.outstandingBalance)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: QUARRY MACHINE STAFFING RULES & FORMULAS */}
      {activeSubTab === 'staffing_rules' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold font-cinzel text-gray-100">
                Quarry Machinery Staffing Rules & Operational Mandates
              </h3>
              <p className="text-xs text-gray-400">
                Official crew allocation rules, wage rates, and the 5:00 PM 1st-quality vehicle completion rule
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Staffing Allocation Formula */}
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
              <h4 className="font-bold text-gray-100 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[#d4af37]" />
                <span>Crew Allocation per Operating Setup</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1b1f2b] space-y-1">
                  <div className="flex justify-between font-bold text-gray-200">
                    <span>For 1 Cutting Machine:</span>
                    <span className="text-emerald-400 font-mono">2 Personnel</span>
                  </div>
                  <p className="text-gray-400 text-[11px]">1 Operator + 1 Assistant Operator</p>
                </div>

                <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1b1f2b] space-y-1">
                  <div className="flex justify-between font-bold text-gray-200">
                    <span>For 2 Cutting Machines (Current Setup):</span>
                    <span className="text-emerald-400 font-mono">5 Personnel</span>
                  </div>
                  <p className="text-gray-400 text-[11px]">2 Operators + 2 Assistant Operators + 1 Helper</p>
                </div>

                <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1b1f2b] space-y-1">
                  <div className="flex justify-between font-bold text-gray-200">
                    <span>For 4 Cutting Machines:</span>
                    <span className="text-emerald-400 font-mono">9 Personnel</span>
                  </div>
                  <p className="text-gray-400 text-[11px]">4 Operators + 4 Assistant Operators + 1 Helper</p>
                </div>

                <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1b1f2b] space-y-1">
                  <div className="flex justify-between font-bold text-gray-200">
                    <span>Adarth Splitting Rail Unit:</span>
                    <span className="text-sky-400 font-mono">5 Personnel</span>
                  </div>
                  <p className="text-gray-400 text-[11px]">1 Operator + 1 Assistant Operator + 3 Helpers</p>
                </div>
              </div>
            </div>

            {/* Standard Daily Staff Wage Rates */}
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
              <h4 className="font-bold text-gray-100 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Daily Wage Standards (Per Shift)</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b]">
                  <span className="text-gray-400 block">Operator</span>
                  <span className="font-mono font-bold text-[#f3c64c] text-sm">₹1,600 / day</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b]">
                  <span className="text-gray-400 block">Assistant Operator</span>
                  <span className="font-mono font-bold text-gray-200 text-sm">₹1,450 / day</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b]">
                  <span className="text-gray-400 block">Helper</span>
                  <span className="font-mono font-bold text-gray-200 text-sm">₹1,350 / day</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b]">
                  <span className="text-gray-400 block">Supervisor</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">₹1,500 / day</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b]">
                  <span className="text-gray-400 block">Asst. Supervisor</span>
                  <span className="font-mono font-bold text-gray-200 text-sm">₹1,000 / day</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b]">
                  <span className="text-gray-400 block">Cooking Staff</span>
                  <span className="font-mono font-bold text-gray-200 text-sm">₹800 / day</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b]">
                  <span className="text-gray-400 block">Kayyal (Rock Breaker)</span>
                  <span className="font-mono font-bold text-gray-200 text-sm">₹800 / day</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1b1f2b]">
                  <span className="text-gray-400 block">Ranger</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">₹1,000 + ₹200 food</span>
                </div>
              </div>

              {/* 5:00 PM Continuation Rule Callout */}
              <div className="p-3.5 rounded-xl bg-[#141722] border border-[#d4af37]/40 text-xs text-gray-300 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#f3c64c]">
                  <Clock className="w-4 h-4" />
                  <span>WORKING HOURS & 5:00 PM FIRST-QUALITY EXTENSION RULE:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-400">
                  Normal quarry production work is <b>7:00 AM – 5:00 PM</b>. At 5:00 PM, work continues <i>only until
                  the stopped 1st-quality vehicle becomes full</i>. This required extension is NOT treated as overtime.
                  Any work beyond that required completion becomes OT. 2nd-quality and Mury vehicles do NOT determine this
                  5:00 PM continuation rule.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: RECORD JCB READING (₹1,400/hr default, validation end >= start) */}
      {/* ==================================================================== */}
      {showJcbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12141a] border border-[#d4af37]/40 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-[#17140f] to-[#121319] border-b border-[#232736] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Gauge className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-cinzel font-bold text-gray-100 text-base">Record JCB Running Hours</h3>
              </div>
              <button onClick={() => setShowJcbModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJcbReading} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Select Active JCB</label>
                  <select
                    value={selectedJcbId}
                    onChange={(e) => setSelectedJcbId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-bold focus:border-[#d4af37]"
                  >
                    {machines
                      .filter((m) => m.machineType === 'JCB')
                      .map((j) => (
                        <option key={j.id} value={j.machineId}>
                          {j.machineName} ({j.ownerName})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Date of Work</label>
                  <input
                    type="date"
                    value={jcbDate}
                    onChange={(e) => setJcbDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-mono focus:border-[#d4af37]"
                  />
                </div>
              </div>

              {/* Start and End Meter Gauge with Validation */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#090b0e] border border-[#1b1f2b]">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Start Meter Reading</label>
                  <input
                    type="number"
                    step="0.1"
                    value={jcbStartReading}
                    onChange={(e) => setJcbStartReading(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#141722] border border-[#252b3d] text-gray-100 font-mono text-sm font-bold focus:border-[#d4af37]"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-bold">End Meter Reading</label>
                  <input
                    type="number"
                    step="0.1"
                    value={jcbEndReading}
                    onChange={(e) => setJcbEndReading(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl bg-[#141722] font-mono text-sm font-bold border focus:outline-none ${
                      isJcbReadingValid
                        ? 'border-[#252b3d] text-emerald-400 focus:border-[#d4af37]'
                        : 'border-rose-500 text-rose-400'
                    }`}
                    required
                  />
                </div>

                {!isJcbReadingValid && (
                  <div className="col-span-2 text-[11px] text-rose-400 flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>VALIDATION ERROR: End meter reading must be greater than or equal to start reading.</span>
                  </div>
                )}

                <div className="col-span-2 pt-2 border-t border-[#181d28] flex justify-between items-center text-xs">
                  <span className="text-gray-400">Total Calculated Hours:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {calculatedJcbHours.toFixed(1)} hrs
                  </span>
                </div>
              </div>

              {/* Rate and Total Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Hourly Rate (INR/hr)</label>
                  <input
                    type="number"
                    value={jcbRate}
                    onChange={(e) => setJcbRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-mono font-bold focus:border-[#d4af37]"
                    required
                  />
                  <span className="text-[10px] text-gray-500">Standard JCB Rate: ₹1,400/hr</span>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Calculated Amount</label>
                  <div className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-[#f3c64c] font-mono text-base font-black">
                    {formatCurrency(calculatedJcbAmount)}
                  </div>
                </div>
              </div>

              {/* Diesel Responsibility Toggle */}
              <div className="p-3.5 rounded-2xl bg-[#090b0e] border border-[#1b1f2b] space-y-2">
                <label className="text-gray-300 block font-bold">Diesel Supply Responsibility</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setJcbDieselResponsibility('Owner')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      jcbDieselResponsibility === 'Owner'
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500 font-black'
                        : 'bg-[#141722] text-gray-400 border-[#202534]'
                    }`}
                  >
                    Owner Responsibility (Normal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setJcbDieselResponsibility('Quarry Reimbursed')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      jcbDieselResponsibility === 'Quarry Reimbursed'
                        ? 'bg-amber-600/30 text-amber-300 border-amber-500 font-black'
                        : 'bg-[#141722] text-gray-400 border-[#202534]'
                    }`}
                  >
                    Quarry Reimbursed (Explicit Expense)
                  </button>
                </div>

                {jcbDieselResponsibility === 'Quarry Reimbursed' && (
                  <div className="pt-2">
                    <label className="text-gray-400 block mb-1 font-bold">Reimbursed Diesel Amount (INR)</label>
                    <input
                      type="number"
                      value={jcbReimbursedDieselAmount}
                      onChange={(e) => setJcbReimbursedDieselAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#141722] border border-[#252b3d] text-amber-400 font-mono font-bold"
                      placeholder="e.g. 3680"
                      required
                    />
                    <span className="text-[10px] text-gray-400">
                      Will create an explicit Quarry Expense transaction under 'Diesel'.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-gray-400 block mb-1 font-bold">Work Description</label>
                <input
                  type="text"
                  value={jcbDescription}
                  onChange={(e) => setJcbDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#232736]">
                <button
                  type="button"
                  onClick={() => setShowJcbModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1a1e2b] text-gray-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isJcbReadingValid}
                  className="flex-1 gold-btn py-2.5 rounded-xl text-black font-black flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Save JCB Reading</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD NEW MACHINE MASTER */}
      {/* ==================================================================== */}
      {showAddMachineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12141a] border border-[#232736] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#141722] border-b border-[#232736] flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-gray-100 text-base">Register New Quarry Equipment</h3>
              <button onClick={() => setShowAddMachineModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMachine} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Machine ID (Permanent)</label>
                  <input
                    type="text"
                    value={newMachineForm.machineId}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, machineId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-mono font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Machine Type</label>
                  <select
                    value={newMachineForm.machineType}
                    onChange={(e) =>
                      setNewMachineForm({ ...newMachineForm, machineType: e.target.value as MachineType })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-bold"
                  >
                    <option value="Cutting Machine">Cutting Machine</option>
                    <option value="Adarth Machine">Adarth Machine</option>
                    <option value="Rail">Rail</option>
                    <option value="JCB">JCB Excavator</option>
                    <option value="Other Quarry Equipment">Other Equipment</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1 font-bold">Machine Name</label>
                <input
                  type="text"
                  value={newMachineForm.machineName}
                  onChange={(e) => setNewMachineForm({ ...newMachineForm, machineName: e.target.value })}
                  placeholder="e.g. Cutting Machine 03 or CAT 320D"
                  className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Ownership Type</label>
                  <select
                    value={newMachineForm.ownerType}
                    onChange={(e) =>
                      setNewMachineForm({ ...newMachineForm, ownerType: e.target.value as MachineOwnerType })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-bold"
                  >
                    <option value="Quarry Owned">Quarry Owned</option>
                    <option value="Rented">Rented</option>
                    <option value="Contractor Owned">Contractor Owned</option>
                    <option value="Leased">Leased</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Owner Name</label>
                  <input
                    type="text"
                    value={newMachineForm.ownerName}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, ownerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Primary Operator</label>
                  <input
                    type="text"
                    value={newMachineForm.operator}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, operator: e.target.value })}
                    placeholder="e.g. Mujeeb Rahman"
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Assistant Operator</label>
                  <input
                    type="text"
                    value={newMachineForm.assistantOperator}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, assistantOperator: e.target.value })}
                    placeholder="e.g. Hamza V"
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Initial Hour Reading</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMachineForm.currentHourReading}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, currentHourReading: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Daily Rent Rate (₹/day)</label>
                  <input
                    type="number"
                    value={newMachineForm.dailyRentAmount}
                    onChange={(e) => setNewMachineForm({ ...newMachineForm, dailyRentAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-mono font-bold"
                    placeholder="0 if owned or Ali's rail"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#232736]">
                <button
                  type="button"
                  onClick={() => setShowAddMachineModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1a1e2b] text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 gold-btn py-2.5 rounded-xl text-black font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Register Machine</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: MACHINE REPLACEMENT (Preserving historical expenses under old ID) */}
      {/* ==================================================================== */}
      {showReplaceModal && machineToReplace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#12141a] border border-purple-800/60 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-purple-950/40 border-b border-purple-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-400" />
                <h3 className="font-cinzel font-bold text-gray-100 text-base">
                  Replace Machine {machineToReplace.machineId}
                </h3>
              </div>
              <button onClick={() => setShowReplaceModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReplacement} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#090b0e] border border-[#1b1f2b] text-xs text-purple-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-300">
                  <Shield className="w-4 h-4" />
                  <span>HISTORICAL AUDIT INTEGRITY MANDATE:</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  The old machine (<b>{machineToReplace.machineId} — {machineToReplace.machineName}</b>) will be marked as{' '}
                  <b>Retired</b>. All historical diesel, oil, spare parts and maintenance logs will permanently remain
                  linked to <b>{machineToReplace.machineId}</b>. They will NOT be transferred to the replacement machine.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">New Machine ID</label>
                  <input
                    type="text"
                    value={replaceForm.newMachineId}
                    onChange={(e) => setReplaceForm({ ...replaceForm, newMachineId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-mono font-bold uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Starting Hour Gauge</label>
                  <input
                    type="number"
                    step="0.1"
                    value={replaceForm.startingHourReading}
                    onChange={(e) => setReplaceForm({ ...replaceForm, startingHourReading: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1 font-bold">New Machine Name</label>
                <input
                  type="text"
                  value={replaceForm.newMachineName}
                  onChange={(e) => setReplaceForm({ ...replaceForm, newMachineName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Assigned Operator</label>
                  <input
                    type="text"
                    value={replaceForm.operator}
                    onChange={(e) => setReplaceForm({ ...replaceForm, operator: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Model / Serial</label>
                  <input
                    type="text"
                    value={replaceForm.model}
                    onChange={(e) => setReplaceForm({ ...replaceForm, model: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#232736]">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1a1e2b] text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-900/30"
                >
                  <Check className="w-4 h-4" />
                  <span>Execute Replacement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: LOG DIESEL REFUELING */}
      {/* ==================================================================== */}
      {showAddDieselModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12141a] border border-[#232736] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#141722] border-b border-[#232736] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" />
                <h3 className="font-cinzel font-bold text-gray-100 text-base">Log Machine Diesel Refueling</h3>
              </div>
              <button onClick={() => setShowAddDieselModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const targetMach = machines.find((m) => m.machineId === dieselForm.machineId);
                addDieselEntry({
                  date: getTodayDateString(),
                  targetType: dieselForm.targetType,
                  machineId: dieselForm.machineId,
                  machineName: targetMach?.machineName || 'Quarry Equipment',
                  supplier: dieselForm.supplier,
                  quantityLiters: Number(dieselForm.quantityLiters) || 0,
                  unit: 'L',
                  ratePerLiter: Number(dieselForm.ratePerLiter) || 92,
                  paymentMethod: 'Cash',
                  billNumber: dieselForm.billNumber.trim(),
                  notes: dieselForm.notes.trim(),
                  quarryId: activeQuarry.id,
                });
                setShowAddDieselModal(false);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="text-gray-400 block mb-1 font-bold">Select Target Machine</label>
                <select
                  value={dieselForm.machineId}
                  onChange={(e) => setDieselForm({ ...dieselForm, machineId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-bold"
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.machineId}>
                      {m.machineName} ({m.machineId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Fuel Quantity (Liters)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={dieselForm.quantityLiters}
                    onChange={(e) => setDieselForm({ ...dieselForm, quantityLiters: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-gray-400 block mb-1 font-bold">Rate (₹ / Liter)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dieselForm.ratePerLiter}
                    onChange={(e) => setDieselForm({ ...dieselForm, ratePerLiter: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1b1f2b] flex justify-between items-center">
                <span className="text-gray-400 font-bold">Total Diesel Amount:</span>
                <span className="font-mono text-base font-black text-amber-400">
                  {formatCurrency((dieselForm.quantityLiters || 0) * (dieselForm.ratePerLiter || 0))}
                </span>
              </div>

              <div>
                <label className="text-gray-400 block mb-1 font-bold">Supplier / Fuel Bunk</label>
                <input
                  type="text"
                  value={dieselForm.supplier}
                  onChange={(e) => setDieselForm({ ...dieselForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="text-gray-400 block mb-1 font-bold">Invoice / Bill Number</label>
                <input
                  type="text"
                  value={dieselForm.billNumber}
                  onChange={(e) => setDieselForm({ ...dieselForm, billNumber: e.target.value })}
                  placeholder="e.g. HP-9842"
                  className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-gray-100 font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#232736]">
                <button
                  type="button"
                  onClick={() => setShowAddDieselModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1a1e2b] text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 gold-btn py-2.5 rounded-xl text-black font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Record Diesel Fuel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: SETTLE MACHINE RENT CONTRACT */}
      {/* ==================================================================== */}
      {showSettleRentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12141a] border border-[#d4af37]/40 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#141722] border-b border-[#232736] flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-gray-100 text-base">
                Settle Rent: {showSettleRentModal.owner}
              </h3>
              <button onClick={() => setShowSettleRentModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amt = Number((e.currentTarget.elements.namedItem('settleAmount') as HTMLInputElement).value) || 0;
                settleRentContract(showSettleRentModal.id, amt);
                setShowSettleRentModal(null);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="p-3.5 rounded-2xl bg-[#090b0e] border border-[#1b1f2b] space-y-1.5">
                <div className="flex justify-between text-gray-400">
                  <span>Contract ID:</span>
                  <span className="font-mono text-gray-200 font-bold">{showSettleRentModal.contractId}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Accrued Rent:</span>
                  <span className="font-mono text-gray-200">{formatCurrency(showSettleRentModal.accruedRent)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Already Paid:</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(showSettleRentModal.paidRent)}</span>
                </div>
                <div className="flex justify-between text-gray-100 font-bold border-t border-[#181d28] pt-1">
                  <span>Outstanding Balance:</span>
                  <span className="font-mono text-[#f3c64c]">
                    {formatCurrency(showSettleRentModal.outstandingBalance)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1 font-bold">Payment Amount (INR)</label>
                <input
                  type="number"
                  name="settleAmount"
                  defaultValue={showSettleRentModal.outstandingBalance}
                  max={showSettleRentModal.outstandingBalance}
                  className="w-full px-3 py-2 rounded-xl bg-[#090b0e] border border-[#232736] text-[#f3c64c] font-mono text-base font-black"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-[#232736]">
                <button
                  type="button"
                  onClick={() => setShowSettleRentModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1a1e2b] text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 gold-btn py-2.5 rounded-xl text-black font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
