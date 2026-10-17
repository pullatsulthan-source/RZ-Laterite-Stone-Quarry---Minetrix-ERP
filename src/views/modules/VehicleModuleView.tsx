import React, { useState, useMemo } from 'react';
import { useQuarry } from '../../context/QuarryContext';
import { VehicleCategory, Vehicle, Driver } from '../../types/quarry';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Existing Views
import { VehicleManagementView } from '../VehicleManagementView';
import { DriverManagementView } from '../DriverManagementView';
import { VehicleAccountsView } from '../VehicleAccountsView';
import { DriverAccountsView } from '../DriverAccountsView';
import { DriverCollectionsView } from '../DriverCollectionsView';
import { VehicleRotationView } from '../VehicleRotationView';
import { OrderManagementView } from '../OrderManagementView';
import { GatePassView } from '../GatePassView';

import {
  Truck,
  Car,
  Users,
  Repeat,
  Navigation,
  Wrench,
  DollarSign,
  Wallet,
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  FileSpreadsheet,
  Ticket,
} from 'lucide-react';

export type VehicleSubTab =
  | 'vehicles'
  | 'drivers'
  | 'rotation'
  | 'trips'
  | 'accounts'
  | 'orders'
  | 'dispatch'
  | 'expenses'
  | 'driver_collections'
  | 'ledger';

interface VehicleModuleViewProps {
  initialTab?: VehicleSubTab;
  onOpenNewLoad?: () => void;
  onSelectGatePass?: (gp: any) => void;
}

export const VehicleModuleView: React.FC<VehicleModuleViewProps> = ({
  initialTab = 'vehicles',
  onOpenNewLoad,
  onSelectGatePass,
}) => {
  const { vehicles, drivers, loads, gatePasses, expenses } = useQuarry();

  const [activeTab, setActiveTab] = useState<VehicleSubTab>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Rotation queue state (in-memory persistent across session)
  const [rotationQueue, setRotationQueue] = useState<
    Array<{
      id: string;
      vehicleNumber: string;
      driver: string;
      owner: string;
      category: VehicleCategory;
      queueStatus: 'Waiting' | 'In Pit / Loading' | 'Dispatched' | 'Returned';
      entryTime: string;
    }>
  >(() => {
    return vehicles.map((v, idx) => ({
      id: v.id,
      vehicleNumber: v.vehicleNumber,
      driver: v.driver,
      owner: v.owner,
      category: v.category,
      queueStatus:
        idx % 4 === 0
          ? 'In Pit / Loading'
          : idx % 3 === 0
          ? 'Dispatched'
          : 'Waiting',
      entryTime: `0${7 + (idx % 4)}:${(idx * 12) % 60 < 10 ? '0' : ''}${(idx * 12) % 60} AM`,
    }));
  });

  const [ledgerVehicleNumber, setLedgerVehicleNumber] = useState<string>(
    vehicles[0]?.vehicleNumber || ''
  );
  const [driverModuleTab, setDriverModuleTab] = useState<'collections' | 'batta_accounts'>('collections');

  // Deriving trips dynamically from loads & gatePasses without duplicate manual entry
  const trips = useMemo(() => {
    return loads.map((l, index) => {
      const isRZ = l.vehicleCategory === 'RZ Mining';
      const tripFreight = isRZ ? l.vehicleTripRent || 700 : 0;
      const batta = l.driverBatta || 600;
      const fuel = isRZ ? l.diesel || 300 : 0;
      return {
        id: `trip-${l.id || index}`,
        loadNumber: l.loadNumber,
        date: l.date,
        time: l.time,
        vehicleNumber: l.vehicleNumber,
        category: l.vehicleCategory,
        driver: l.driver,
        owner: l.owner,
        customerName: l.customerName,
        destination: l.destination,
        material: l.material,
        quantity: l.quantity,
        status: l.status,
        gatePassNumber: l.gatePassNumber,
        tripFreight,
        batta,
        fuel,
        netVehicleEarning: tripFreight,
      };
    });
  }, [loads]);

  // Vehicle expenses filtered from quarry expenses
  const vehicleExpenses = useMemo(() => {
    return expenses.filter(
      (e) =>
        e.category === 'Vehicle Expense' ||
        e.category === 'Driver Expense' ||
        e.category === 'Transport' ||
        Boolean(e.vehicleNumber)
    );
  }, [expenses]);

  // Rotation status counts
  const waitingCount = rotationQueue.filter((q) => q.queueStatus === 'Waiting').length;
  const inPitCount = rotationQueue.filter((q) => q.queueStatus === 'In Pit / Loading').length;
  const dispatchedCount = rotationQueue.filter((q) => q.queueStatus === 'Dispatched').length;

  const handleUpdateQueueStatus = (
    id: string,
    newStatus: 'Waiting' | 'In Pit / Loading' | 'Dispatched' | 'Returned'
  ) => {
    setRotationQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, queueStatus: newStatus } : item))
    );
  };

  const subTabs = [
    { id: 'vehicles', label: 'Vehicle Master', icon: Car, badge: `${vehicles.length}` },
    { id: 'drivers', label: 'Driver Master', icon: Users, badge: `${drivers.length}` },
    { id: 'rotation', label: 'Daily Rotation Engine', icon: Repeat, badge: 'Pos 1 Fixed' },
    { id: 'trips', label: 'Trips & Freight Log', icon: Navigation, badge: `${trips.length}` },
    { id: 'accounts', label: 'Vehicle Accounts Engine', icon: DollarSign, badge: 'Unified' },
    { id: 'orders', label: 'Order Management', icon: FileSpreadsheet, badge: `${loads.length}` },
    { id: 'dispatch', label: 'Outward Dispatch', icon: Ticket, badge: `${gatePasses.length}` },
    { id: 'driver_collections', label: 'Driver Collections', icon: Wallet },
    { id: 'expenses', label: 'Vehicle Expenses', icon: Wrench },
    { id: 'ledger', label: 'Vehicle Ledger', icon: BookOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Module Master Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0c131d] via-[#10141f] to-[#0c121b] border border-sky-500/35 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-sky-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-black flex items-center justify-center shadow-lg font-black">
              <Truck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-700/50 font-bold">
                  MODULE 2
                </span>
                <span className="text-xs text-gray-400">Fleet, Drivers & Transport Logistics</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 mt-0.5 tracking-wide">
                VEHICLE MANAGEMENT
              </h1>
            </div>
          </div>

          {/* Module Action Shortcuts */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              Active Fleet: <b className="text-white font-mono">{vehicles.length} Trucks</b> ({vehicles.filter(v => v.category === 'RZ Mining').length} RZ Mining, {vehicles.filter(v => v.category === 'Outside').length} Outside)
            </span>
          </div>
        </div>

        {/* Real-time Vehicle Module Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1d2639]">
          <div className="p-3 rounded-2xl bg-[#090d14]/70 border border-[#1b2538]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Waiting in Queue
            </span>
            <span className="text-lg font-black font-mono text-amber-400 mt-0.5 block">
              {waitingCount} Trucks
            </span>
            <span className="text-[10px] text-gray-400">Quarry Gate Line</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090d14]/70 border border-[#1b2538]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Loading in Pit
            </span>
            <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">
              {inPitCount} Trucks
            </span>
            <span className="text-[10px] text-gray-400">Active Loading Turn</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090d14]/70 border border-[#1b2538]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              On Road / Dispatched
            </span>
            <span className="text-lg font-black font-mono text-sky-400 mt-0.5 block">
              {dispatchedCount} Trips
            </span>
            <span className="text-[10px] text-gray-400">Delivering Stone</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090d14]/70 border border-[#1b2538]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Total Logged Trips
            </span>
            <span className="text-lg font-black font-mono text-[#f3c64c] mt-0.5 block">
              {trips.length} Deliveries
            </span>
            <span className="text-[10px] text-gray-400">Auto-Linked from Orders</span>
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
              onClick={() => setActiveTab(tab.id as VehicleSubTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-[#090a0d] shadow-md shadow-sky-500/25 font-black'
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
        {activeTab === 'vehicles' && <VehicleManagementView />}

        {activeTab === 'drivers' && <DriverManagementView />}

        {activeTab === 'rotation' && <VehicleRotationView />}

        {activeTab === 'trips' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-cinzel text-gray-100">
                  Vehicle Trips & Freight Register
                </h3>
                <p className="text-xs text-gray-400">
                  Every trip logged here is automatically linked from Order Management and Gate Pass Dispatches — zero duplicate manual entry
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/50 px-3 py-1 rounded-xl border border-sky-800/40">
                {trips.length} Total Registered Trips
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#232736] bg-[#12141a]">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#161924] border-b border-[#232736] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Load / Pass #</th>
                    <th className="p-3.5">Vehicle</th>
                    <th className="p-3.5">Driver</th>
                    <th className="p-3.5">Customer & Site</th>
                    <th className="p-3.5">Material & Qty</th>
                    <th className="p-3.5">Trip Freight</th>
                    <th className="p-3.5">Driver Batta</th>
                    <th className="p-3.5">Diesel</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2332]">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-[#161a26] transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{formatDate(trip.date)}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{trip.time}</div>
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="text-gray-200 font-bold block">{trip.loadNumber}</span>
                        {trip.gatePassNumber && (
                          <span className="text-[10px] text-[#f3c64c] block">{trip.gatePassNumber}</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold font-mono text-white">{trip.vehicleNumber}</div>
                        <div className="text-[10px] text-gray-400">{trip.category}</div>
                      </td>
                      <td className="p-3.5 text-gray-200">{trip.driver}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-gray-100">{trip.customerName}</div>
                        <div className="text-[10px] text-gray-400">{trip.destination}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-200">{trip.material}</div>
                        <div className="text-[10px] font-mono text-gray-400">{trip.quantity} pcs</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-400">
                        {trip.tripFreight ? formatCurrency(trip.tripFreight) : '—'}
                      </td>
                      <td className="p-3.5 font-mono text-amber-400">
                        {trip.batta ? formatCurrency(trip.batta) : '—'}
                      </td>
                      <td className="p-3.5 font-mono text-rose-400">
                        {trip.fuel ? formatCurrency(trip.fuel) : '—'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1d2230] text-gray-300 border border-[#2b334a]">
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-cinzel text-gray-100">
                  Vehicle Maintenance & Transport Expenses
                </h3>
                <p className="text-xs text-gray-400">
                  Fuel, tyres, oils, mechanical repairs, and RTO/fitness expenses recorded per vehicle
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-800/40">
                Total: {formatCurrency(vehicleExpenses.reduce((sum, e) => sum + e.amount, 0))}
              </span>
            </div>

            {vehicleExpenses.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#12141a] border border-[#232736] text-gray-400 text-xs">
                No specific vehicle expenses logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#232736] bg-[#12141a]">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#161924] border-b border-[#232736] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Vehicle #</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Description</th>
                      <th className="p-3.5">Payment Mode</th>
                      <th className="p-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2332]">
                    {vehicleExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#161a26] transition-colors">
                        <td className="p-3.5 font-mono">{formatDate(exp.date)}</td>
                        <td className="p-3.5 font-mono font-bold text-white">{exp.vehicleNumber || 'Fleet General'}</td>
                        <td className="p-3.5 text-gray-300">{exp.category}</td>
                        <td className="p-3.5 text-gray-400">{exp.description}</td>
                        <td className="p-3.5 text-gray-300">{exp.paymentMode}</td>
                        <td className="p-3.5 text-right font-mono font-bold text-rose-400">
                          {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'accounts' && <VehicleAccountsView />}

        {activeTab === 'orders' && (
          <OrderManagementView
            onOpenNewLoad={onOpenNewLoad || (() => {})}
          />
        )}

        {activeTab === 'dispatch' && (
          <GatePassView
            onSelectGatePass={onSelectGatePass || (() => {})}
            onOpenNewLoad={onOpenNewLoad || (() => {})}
          />
        )}

        {activeTab === 'driver_collections' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-[#12141a] p-2 rounded-2xl border border-[#232736]">
              <button
                onClick={() => setDriverModuleTab('collections')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  driverModuleTab === 'collections'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black font-black shadow'
                    : 'text-gray-400 hover:text-white bg-[#161924]'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>On-Site Driver Collections & Handover</span>
              </button>
              <button
                onClick={() => setDriverModuleTab('batta_accounts')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  driverModuleTab === 'batta_accounts'
                    ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-black font-black shadow'
                    : 'text-gray-400 hover:text-white bg-[#161924]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Driver Trip Batta & Allowance Ledger</span>
              </button>
            </div>

            {driverModuleTab === 'collections' ? (
              <DriverCollectionsView />
            ) : (
              <DriverAccountsView />
            )}
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-cinzel text-gray-100">
                  Individual Vehicle & Owner Statement Ledger
                </h3>
                <p className="text-xs text-gray-400">
                  Comprehensive audit statement of trips, hire rent earned, and expense payouts
                </p>
              </div>

              {/* Vehicle selector */}
              <select
                value={ledgerVehicleNumber}
                onChange={(e) => setLedgerVehicleNumber(e.target.value)}
                className="bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-sky-400"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.vehicleNumber}>
                    {v.vehicleNumber} ({v.owner} • {v.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtered Trips for this vehicle */}
            <div className="overflow-x-auto rounded-2xl border border-[#232736] bg-[#12141a]">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#161924] border-b border-[#232736] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Load #</th>
                    <th className="p-3.5">Driver</th>
                    <th className="p-3.5">Destination</th>
                    <th className="p-3.5">Material & Quantity</th>
                    <th className="p-3.5 text-right">Trip Rent / Freight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2332]">
                  {trips
                    .filter((t) => t.vehicleNumber === ledgerVehicleNumber)
                    .map((trip) => (
                      <tr key={trip.id} className="hover:bg-[#161a26] transition-colors">
                        <td className="p-3.5 font-mono">{formatDate(trip.date)}</td>
                        <td className="p-3.5 font-mono font-bold text-white">{trip.loadNumber}</td>
                        <td className="p-3.5 text-gray-200">{trip.driver}</td>
                        <td className="p-3.5 text-gray-300">{trip.destination}</td>
                        <td className="p-3.5 font-mono text-gray-300">{trip.quantity} pcs ({trip.material})</td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(trip.tripFreight || 700)}
                        </td>
                      </tr>
                    ))}
                  {trips.filter((t) => t.vehicleNumber === ledgerVehicleNumber).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-500">
                        No trips recorded for vehicle {ledgerVehicleNumber} yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
