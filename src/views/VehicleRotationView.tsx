import React, { useState, useMemo } from 'react';
import {
  Repeat,
  Lock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Play,
  Flame,
} from 'lucide-react';
import { useQuarry } from '../context/QuarryContext';
import { DailyRotation, DailyRotationEntry, RotationTurnStatus } from '../types/quarry';
import {
  getTodayDateString,
  getPreviousDateString,
  getNextDateString,
  formatDate,
  formatDayName,
} from '../utils/formatters';

export const VehicleRotationView: React.FC = () => {
  const {
    vehicles,
    drivers,
    rotations,
    getRotationForDate,
    saveRotation,
    advanceRotation,
    updateRotationItemStatus,
  } = useQuarry();

  const todayStr = useMemo(() => getTodayDateString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [showNextPreview, setShowNextPreview] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedVehicleToAdd, setSelectedVehicleToAdd] = useState<string>('');

  // Get or compute the active rotation for the selected date
  const activeRotation: DailyRotation = useMemo(() => {
    const existing = getRotationForDate(selectedDate);
    if (existing) {
      return existing;
    }

    // If no rotation exists for this date yet, dynamically generate one:
    // 1. Position 1: RZ MINING vehicle (FIXED)
    // 2. Positions 2 onward: eligible vehicles
    const rzVehicle =
      vehicles.find((v) => v.category === 'RZ Mining') || {
        id: 'veh-5',
        vehicleNumber: 'KL-55-RZ-01',
        owner: 'RZ Mining',
        driver: 'Pasha',
        category: 'RZ Mining' as const,
        capacity: 250,
      };

    const rzDriver = drivers.find((d) => d.vehicle === rzVehicle.vehicleNumber || d.category === 'RZ Mining');

    const eligibleRotatingVehicles = vehicles.filter(
      (v) => v.id !== rzVehicle.id && v.active !== false
    );

    const generatedEntries: DailyRotationEntry[] = [
      {
        position: 1,
        vehicleId: rzVehicle.id,
        vehicleNumber: rzVehicle.vehicleNumber,
        owner: 'RZ Mining',
        driver: rzDriver ? rzDriver.name : rzVehicle.driver || 'Company Driver',
        category: 'RZ Mining',
        capacity: rzVehicle.capacity || 250,
        status: 'Waiting',
        isFixed: true,
        entryTime: '06:30 AM',
        remarks: 'RZ MINING — FIXED (Never Rotates)',
      },
      ...eligibleRotatingVehicles.map((v, idx) => {
        const vDriver = drivers.find((d) => d.vehicle === v.vehicleNumber || d.name === v.driver);
        return {
          position: idx + 2,
          vehicleId: v.id,
          vehicleNumber: v.vehicleNumber,
          owner: v.owner || 'Outside Owner',
          driver: vDriver ? vDriver.name : v.driver || 'Driver',
          category: v.category,
          capacity: v.capacity || 250,
          status: 'Waiting' as RotationTurnStatus,
          isFixed: false,
          entryTime: `0${7 + Math.floor(idx / 3)}:${((idx + 1) * 15) % 60 < 10 ? '0' : ''}${((idx + 1) * 15) % 60} AM`,
          remarks: idx === 0 ? 'Next Turn Leader' : `Turn #${idx + 1}`,
        };
      }),
    ];

    const cycleNumber = 10 + Math.max(1, rotations.length);

    return {
      id: `rot-${selectedDate}-c${cycleNumber}`,
      rotationDate: selectedDate,
      rotationNumber: cycleNumber,
      status: selectedDate < todayStr ? 'Completed' : 'Active',
      notes: `Daily rotation for ${selectedDate}. Position 1 is strictly locked to RZ MINING.`,
      entries: generatedEntries,
      createdAt: `${selectedDate}T06:00:00Z`,
    };
  }, [selectedDate, rotations, getRotationForDate, vehicles, drivers, todayStr]);

  // Compute the projected "Next Rotation" (Position 1 stays FIXED RZ MINING, Positions 2 onward rotate)
  const nextRotationPreview = useMemo(() => {
    if (!activeRotation || !activeRotation.entries || activeRotation.entries.length === 0) {
      return null;
    }

    const fixedPos1 = activeRotation.entries.find((e) => e.isFixed) || activeRotation.entries[0];
    const rotating = activeRotation.entries.filter((e) => !e.isFixed);

    let shifted = [...rotating];
    if (rotating.length > 1) {
      shifted = [...rotating.slice(1), rotating[0]];
    }

    return {
      cycleNumber: (activeRotation.rotationNumber || 10) + 1,
      fixedPosition: fixedPos1,
      nextTurnVehicle: shifted[0],
      shiftedOrder: shifted,
    };
  }, [activeRotation]);

  // Handlers for Navigation
  const handlePreviousDay = () => {
    const prev = getPreviousDateString(selectedDate);
    setSelectedDate(prev);
  };

  const handleToday = () => {
    setSelectedDate(todayStr);
  };

  const handleNextDay = () => {
    const next = getNextDateString(selectedDate);
    setSelectedDate(next);
  };

  // Advance Rotation Action
  const handleAdvanceRotation = () => {
    const confirmed = window.confirm(
      `Advance vehicle rotation to Cycle #${(activeRotation.rotationNumber || 10) + 1}?\n\nRules:\n• Position 1: RZ MINING remains FIXED.\n• Positions 2 onward: ${nextRotationPreview?.nextTurnVehicle?.vehicleNumber || 'Next vehicle'} moves to Turn 1, previous leader moves to end.`
    );
    if (!confirmed) return;

    advanceRotation(selectedDate);
  };

  // Change individual turn status
  const handleStatusChange = (position: number, newStatus: RotationTurnStatus) => {
    updateRotationItemStatus(selectedDate, position, newStatus);
  };

  // Add an unlisted vehicle to rotation
  const handleAddVehicleToRotation = () => {
    if (!selectedVehicleToAdd) return;
    const targetVeh = vehicles.find((v) => v.id === selectedVehicleToAdd);
    if (!targetVeh) return;

    // Check if already in active rotation
    if (activeRotation.entries.some((e) => e.vehicleId === targetVeh.id)) {
      alert(`Vehicle ${targetVeh.vehicleNumber} is already in the rotation queue.`);
      return;
    }

    const vDriver = drivers.find(
      (d) => d.vehicle === targetVeh.vehicleNumber || d.name === targetVeh.driver
    );

    const nextPos = activeRotation.entries.length + 1;
    const newEntry: DailyRotationEntry = {
      position: nextPos,
      vehicleId: targetVeh.id,
      vehicleNumber: targetVeh.vehicleNumber,
      owner: targetVeh.owner,
      driver: vDriver ? vDriver.name : targetVeh.driver,
      category: targetVeh.category,
      capacity: targetVeh.capacity || 250,
      status: 'Waiting',
      isFixed: false,
      entryTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      remarks: 'Added to daily rotation queue',
    };

    const updated = {
      ...activeRotation,
      entries: [...activeRotation.entries, newEntry],
      updatedAt: new Date().toISOString(),
    };

    saveRotation(updated);
    setShowAddModal(false);
    setSelectedVehicleToAdd('');
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    return activeRotation.entries.filter((entry) => {
      const matchSearch =
        entry.vehicleNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
        entry.owner.toLowerCase().includes(searchFilter.toLowerCase()) ||
        entry.driver.toLowerCase().includes(searchFilter.toLowerCase());

      const matchStatus = statusFilter === 'All' || entry.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [activeRotation, searchFilter, statusFilter]);

  const isToday = selectedDate === todayStr;
  const isPast = selectedDate < todayStr;
  const isFuture = selectedDate > todayStr;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#121620] via-[#151a27] to-[#11141e] border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-600/40 font-bold">
                CORE DISPATCH ENGINE
              </span>
              <span className="text-xs text-gray-400">Quarry Pit Turn & Queue Allocation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 mt-1 tracking-wide flex items-center gap-2.5">
              <Repeat className="w-6 h-6 text-amber-400" />
              VEHICLE ROTATION ENGINE
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl">
              Position 1 is <strong className="text-amber-300">FIXED to RZ MINING</strong> and never rotates.
              Positions 2 onward rotate sequentially across outside and company tippers with preserved daily history.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-[#090d14]/80 border border-[#1e2638] text-center">
              <span className="text-[10px] text-gray-400 block font-bold uppercase">Rotation Cycle</span>
              <span className="text-base font-black font-mono text-amber-400">
                #{activeRotation.rotationNumber || 11}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-[#090d14]/80 border border-[#1e2638] text-center">
              <span className="text-[10px] text-gray-400 block font-bold uppercase">Queue Size</span>
              <span className="text-base font-black font-mono text-white">
                {activeRotation.entries.length} Trucks
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-[#090d14]/80 border border-amber-600/30 text-center">
              <span className="text-[10px] text-amber-300/80 block font-bold uppercase">Position 1</span>
              <span className="text-xs font-black font-mono text-amber-300 flex items-center gap-1 justify-center">
                <Lock className="w-3 h-3 text-amber-400" /> FIXED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation & Rotation Action Controls */}
      <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Group: Previous Day / Today / Next Day */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePreviousDay}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#171a25] hover:bg-[#1f2434] text-gray-200 border border-[#2b3346] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Go to previous day rotation"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Day</span>
          </button>

          <button
            onClick={handleToday}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isToday
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                : 'bg-[#171a25] hover:bg-[#1f2434] text-amber-400 border border-amber-500/40'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Today</span>
          </button>

          <button
            onClick={handleNextDay}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#171a25] hover:bg-[#1f2434] text-gray-200 border border-[#2b3346] flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Go to next day rotation"
          >
            <span>Next Day</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Active Date Tag */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b0e14] border border-[#1e2434] ml-1">
            <span className="text-xs font-mono font-bold text-gray-100">
              {formatDate(selectedDate)} ({formatDayName(selectedDate)})
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isToday
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : isPast
                  ? 'bg-gray-800 text-gray-300 border border-gray-700'
                  : 'bg-blue-950 text-blue-300 border border-blue-800'
              }`}
            >
              {isToday ? 'Live Today' : isPast ? 'Past Record' : 'Future Plan'}
            </span>
          </div>
        </div>

        {/* Action Group: Next Rotation & Add Vehicle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#171a25] hover:bg-[#1f2434] text-gray-200 border border-[#2b3346] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Vehicle</span>
          </button>

          <button
            onClick={handleAdvanceRotation}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-black hover:brightness-110 shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all cursor-pointer font-black"
          >
            <RotateCw className="w-4 h-4 stroke-[2.5]" />
            <span>Next Rotation</span>
          </button>
        </div>
      </div>

      {/* FIXED POSITION 1 HIGHLIGHT CARD (RZ MINING) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#17130a] via-[#1e190e] to-[#14120a] border-2 border-amber-500/60 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-black flex items-center justify-center font-black shadow-lg shrink-0">
              <Lock className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black">
                  POSITION 1 — FIXED TURN
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> NEVER ROTATES
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-gray-100 font-cinzel mt-0.5">
                RZ MINING — PERMANENT PRIORITY 1
              </h2>

              <p className="text-xs text-gray-400 mt-0.5">
                Assigned Unit:{' '}
                <strong className="text-white font-mono">
                  {activeRotation.entries[0]?.vehicleNumber || 'KL-55-RZ-01'}
                </strong>{' '}
                • Owner: <span className="text-amber-300 font-semibold">{activeRotation.entries[0]?.owner || 'RZ Mining'}</span> • Driver:{' '}
                <span className="text-gray-200 font-semibold">{activeRotation.entries[0]?.driver || 'Pasha'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Pit Turn Status</span>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {activeRotation.entries[0]?.status || 'Waiting'}
              </span>
            </div>

            <select
              value={activeRotation.entries[0]?.status || 'Waiting'}
              onChange={(e) => handleStatusChange(1, e.target.value as RotationTurnStatus)}
              className="px-3 py-1.5 rounded-xl bg-[#0f0e0a] border border-amber-500/50 text-xs font-bold text-amber-300 focus:outline-none cursor-pointer"
            >
              <option value="Waiting">Waiting at Gate</option>
              <option value="In Pit">In Pit / Loading</option>
              <option value="Loading">Loading Stone</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="Returned">Returned to Gate</option>
              <option value="Standby">Standby</option>
            </select>
          </div>
        </div>
      </div>

      {/* Next Rotation Preview Banner */}
      {showNextPreview && nextRotationPreview && (
        <div className="p-4 rounded-2xl bg-[#0e121a] border border-[#20293d] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <RotateCw className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sky-300 block">
                Next Rotation Turn Preview (Cycle #{nextRotationPreview.cycleNumber}):
              </span>
              <span className="text-gray-400">
                Position 1 = <b className="text-amber-300">RZ MINING (FIXED)</b> • Position 2 (Next Leader) ={' '}
                <b className="text-white font-mono">{nextRotationPreview.nextTurnVehicle?.vehicleNumber}</b> (
                {nextRotationPreview.nextTurnVehicle?.driver})
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowNextPreview(false)}
            className="text-gray-500 hover:text-gray-300 text-[11px] self-end md:self-auto cursor-pointer"
          >
            Hide Preview
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Rotation Schedule for {formatDate(selectedDate)}:
          </span>
          <span className="text-xs font-mono font-bold text-amber-400">
            ({filteredEntries.length} Vehicles Listed)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search vehicle, owner, driver..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#12141a] border border-[#232736] text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-56"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#12141a] border border-[#232736] text-xs text-gray-300 focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Waiting">Waiting</option>
            <option value="In Pit">In Pit</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Main Rotation Queue Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#232736] bg-[#12141a]">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#161924] border-b border-[#232736] text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <tr>
              <th className="p-3.5">Position</th>
              <th className="p-3.5">Vehicle</th>
              <th className="p-3.5">Owner (Entity)</th>
              <th className="p-3.5">Driver (Entity)</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Capacity</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Arrival / Turn</th>
              <th className="p-3.5 text-right">Quick Turn Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2332]">
            {filteredEntries.map((item) => {
              const isFixed = item.isFixed;
              const isTurnLeader = item.position === 2;

              return (
                <tr
                  key={`${item.vehicleId}-${item.position}`}
                  className={`transition-colors ${
                    isFixed
                      ? 'bg-amber-950/20 hover:bg-amber-950/30'
                      : isTurnLeader
                      ? 'bg-blue-950/15 hover:bg-blue-950/25'
                      : 'hover:bg-[#161a26]'
                  }`}
                >
                  {/* Position Column */}
                  <td className="p-3.5">
                    {isFixed ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black font-mono bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-sm flex items-center gap-1">
                          <Lock className="w-3 h-3 stroke-[2.5]" />
                          #1 FIXED
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 font-mono">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isTurnLeader
                              ? 'bg-blue-600 text-white shadow-sm font-black'
                              : 'bg-[#1a1e2b] text-gray-300'
                          }`}
                        >
                          #{item.position}
                        </span>
                        {isTurnLeader && (
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">
                            Next
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Vehicle Column */}
                  <td className="p-3.5">
                    <div className="font-bold text-white font-mono flex items-center gap-1.5">
                      <Truck className={`w-3.5 h-3.5 ${isFixed ? 'text-amber-400' : 'text-gray-400'}`} />
                      <span>{item.vehicleNumber}</span>
                    </div>
                    {item.remarks && (
                      <span className="text-[10px] text-gray-500 block truncate max-w-[150px]">
                        {item.remarks}
                      </span>
                    )}
                  </td>

                  {/* Owner Column (Separate Entity) */}
                  <td className="p-3.5">
                    <span className="font-semibold text-gray-200 block">{item.owner}</span>
                    <span className="text-[10px] text-gray-500">Vehicle Owner</span>
                  </td>

                  {/* Driver Column (Separate Entity) */}
                  <td className="p-3.5">
                    <span className="font-semibold text-gray-200 block">{item.driver}</span>
                    <span className="text-[10px] text-gray-500">Assigned Driver</span>
                  </td>

                  {/* Category Column */}
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.category === 'RZ Mining'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-900/30 text-blue-300 border border-blue-800/40'
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>

                  {/* Capacity Column */}
                  <td className="p-3.5 font-mono text-gray-300">
                    {item.capacity || 250} pcs
                  </td>

                  {/* Status Column */}
                  <td className="p-3.5">
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(item.position, e.target.value as RotationTurnStatus)
                      }
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold focus:outline-none cursor-pointer border ${
                        item.status === 'In Pit' || item.status === 'Loading'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : item.status === 'Dispatched'
                          ? 'bg-sky-950 text-sky-300 border-sky-700'
                          : item.status === 'Delivered'
                          ? 'bg-purple-950 text-purple-300 border-purple-700'
                          : item.status === 'Returned'
                          ? 'bg-teal-950 text-teal-300 border-teal-700'
                          : item.status === 'Maintenance'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      <option value="Waiting">Waiting</option>
                      <option value="In Pit">In Pit</option>
                      <option value="Loading">Loading</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Returned">Returned</option>
                      <option value="Standby">Standby</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </td>

                  {/* Arrival / Turn Column */}
                  <td className="p-3.5 font-mono text-gray-400 text-[11px]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span>{item.entryTime || '07:00 AM'}</span>
                    </div>
                  </td>

                  {/* Quick Turn Action */}
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'Waiting' && (
                        <button
                          onClick={() => handleStatusChange(item.position, 'In Pit')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-700 hover:bg-emerald-600 text-white transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>Call Pit</span>
                        </button>
                      )}

                      {item.status === 'In Pit' && (
                        <button
                          onClick={() => handleStatusChange(item.position, 'Dispatched')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-700 hover:bg-sky-600 text-white transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <ArrowRight className="w-2.5 h-2.5" />
                          <span>Dispatch</span>
                        </button>
                      )}

                      {item.status === 'Dispatched' && (
                        <button
                          onClick={() => handleStatusChange(item.position, 'Returned')}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-700 hover:bg-purple-600 text-white transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Returned</span>
                        </button>
                      )}

                      {item.status === 'Returned' && (
                        <span className="text-[10px] text-gray-500 font-mono">Turn Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rules & Operational Guidance footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
        <div className="p-3.5 rounded-2xl bg-[#0e1118] border border-[#1d2436]">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Position 1 Fixed Rule</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            RZ MINING is permanently locked in Turn Position 1. It never rotates into lower slots, ensuring first extraction rights for company trucks.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1118] border border-[#1d2436]">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs mb-1">
            <RotateCw className="w-3.5 h-3.5" />
            <span>Sequential Queue Shifting</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Positions 2 onward shift sequentially: Position 2 rotates to the back of the queue, while Position 3 steps up to Position 2.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#0e1118] border border-[#1d2436]">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Date History Preservation</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Each day maintains its own immutable rotation record. Modifying today’s turn queue leaves historical dates completely untouched.
          </p>
        </div>
      </div>

      {/* Modal: Add Vehicle to Daily Rotation Queue */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#12151f] border border-[#2b3348] rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222838]">
              <h3 className="text-base font-bold text-white font-cinzel">Add Vehicle to Queue</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              <p className="text-gray-400">
                Select an active vehicle from the Vehicle Master to append to today’s rotation turn list:
              </p>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Select Registered Vehicle</label>
                <select
                  value={selectedVehicleToAdd}
                  onChange={(e) => setSelectedVehicleToAdd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0d14] border border-[#2b3348] text-gray-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose a Vehicle --</option>
                  {vehicles
                    .filter((v) => !activeRotation.entries.some((e) => e.vehicleId === v.id))
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.owner} • Driver: {v.driver})
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[#090c12] border border-[#1d2436] text-[11px] text-gray-400">
                Note: Newly added vehicles enter at the end of the rotating queue. Position 1 remains RZ MINING.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222838]">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVehicleToRotation}
                disabled={!selectedVehicleToAdd}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 cursor-pointer font-black"
              >
                Add to Rotation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
