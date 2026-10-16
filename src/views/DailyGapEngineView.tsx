import React, { useState, useMemo } from 'react';
import { useQuarry } from '../context/QuarryContext';
import {
  GapSlotNumber,
  GapVehicleQueueItem,
  GapOfferEvent,
  QuarryRoundLog,
  OperationalQuality,
} from '../types/quarry';
import {
  formatDate,
  formatNumber,
  getTodayDateString,
  getCurrentTimeString,
} from '../utils/formatters';
import {
  Truck,
  Repeat,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Layers,
  Award,
  AlertTriangle,
  Play,
  RotateCw,
  Info,
} from 'lucide-react';

export const DailyGapEngineView: React.FC = () => {
  const {
    gapQueue,
    gapOfferEvents,
    roundLogs,
    vehicles,
    drivers,
    currentUser,
    offerGapLoad,
    recordRoundEvent,
    completeVehicleReturn,
    advanceGapRound,
    updateGapSlotVehicle,
  } = useQuarry();

  // Active filter & modal states
  const [activeTab, setActiveTab] = useState<'queue' | 'cascading' | 'rounds'>('queue');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<OperationalQuality>('1ST QUALITY');
  const [currentOfferGap, setCurrentOfferGap] = useState<GapSlotNumber>(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [offerStatusMessage, setOfferStatusMessage] = useState<string | null>(null);

  // Return recording modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnVehicleNumber, setReturnVehicleNumber] = useState('');
  const [returnTimeInput, setReturnTimeInput] = useState(getCurrentTimeString());

  // Slot vehicle change modal state
  const [editingSlotGap, setEditingSlotGap] = useState<GapSlotNumber | null>(null);
  const [selectedVehicleForSlot, setSelectedVehicleForSlot] = useState('');

  // Active Round number
  const currentRound = useMemo(() => {
    return gapQueue[0]?.roundNumber || 1;
  }, [gapQueue]);

  // Handle Offer Load to current gap vehicle
  const handleOfferDecision = (accepted: boolean) => {
    const res = offerGapLoad(selectedQuality, currentOfferGap, accepted, rejectionReason);
    if (accepted) {
      const slot = gapQueue.find((s) => s.gapNumber === currentOfferGap);
      setOfferStatusMessage(
        `✓ ${selectedQuality} ACCEPTED by Gap #${currentOfferGap} (${slot?.vehicleNumber} - ${slot?.driver}). Loading initiated.`
      );
      // Automatically log the round entry
      recordRoundEvent({
        roundNumber: currentRound,
        date: getTodayDateString(),
        vehicleNumber: slot?.vehicleNumber || 'Unknown',
        driver: slot?.driver || 'Driver',
        originalGap: currentOfferGap,
        actualGapUsed: currentOfferGap,
        offeredQuality: selectedQuality,
        acceptedQuality: selectedQuality,
        physicalQty: 260,
        freeQty: 5,
        ratedQty: 255,
        vehicleReceivedQty: 260,
        loadingStart: getCurrentTimeString(),
        loadingCompletion: '',
        departureTime: '',
        status: 'Loading',
        remarks: `Load accepted via Gap #${currentOfferGap} offer engine`,
      });
      setTimeout(() => {
        setShowOfferModal(false);
        setOfferStatusMessage(null);
        setRejectionReason('');
      }, 1800);
    } else {
      if (res.nextGap) {
        setOfferStatusMessage(
          `Notice: Gap #${currentOfferGap} declined (${rejectionReason || 'No reason specified'}). Cascading offer automatically to Gap #${res.nextGap}... Vehicle remains in quarry queue.`
        );
        setCurrentOfferGap(res.nextGap);
        setRejectionReason('');
      } else {
        setOfferStatusMessage(
          `All 4 Gaps declined this ${selectedQuality} load. Material may be routed to open dispatch or next arriving vehicle. All vehicles remain in queue.`
        );
      }
    }
  };

  // Handle vehicle return
  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnVehicleNumber) return;
    completeVehicleReturn(returnVehicleNumber, returnTimeInput);
    setShowReturnModal(false);
    setReturnVehicleNumber('');
  };

  // Handle assigning a new vehicle to gap slot
  const handleSaveSlotVehicle = () => {
    if (editingSlotGap && selectedVehicleForSlot) {
      updateGapSlotVehicle(editingSlotGap, selectedVehicleForSlot);
      setEditingSlotGap(null);
      setSelectedVehicleForSlot('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#17140f] via-[#121319] to-[#14120f] border border-[#d4af37]/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-[#d4af37]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f3c64c]">
                <Repeat className="w-5 h-5 stroke-[2.5]" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 tracking-wide">
                Daily Loading Gap & Rotation Engine
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40">
                Round #{currentRound}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2 max-w-3xl leading-relaxed">
              <span className="text-[#f3c64c] font-semibold">RZ MINETRIX Gap Rule:</span> Gap is a physical vehicle loading queue at the quarry pit, not a separate ownership category. RZ MINING vehicle is <b className="text-emerald-400">FIXED at Position 1</b>. Subsequent positions are determined by actual return times after each round.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setCurrentOfferGap(1);
                setRejectionReason('');
                setOfferStatusMessage(null);
                setShowOfferModal(true);
              }}
              className="gold-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Offer Stone Load (Cascading)</span>
            </button>
            <button
              onClick={() => {
                setReturnTimeInput(getCurrentTimeString());
                setShowReturnModal(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1a1e2b] hover:bg-[#252b3d] text-gray-200 border border-[#2d354b] flex items-center gap-1.5 transition-colors"
            >
              <Clock className="w-4 h-4 text-[#d4af37]" />
              <span>Record Vehicle Return</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Advance to Round #${currentRound + 1}? Position 1 remains FIXED to RZ MINING, and outside vehicles will rotate based on arrival sequence.`)) {
                  advanceGapRound();
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#141824] hover:bg-[#1e2336] text-gray-300 border border-[#2b334a] flex items-center gap-1.5"
              title="Advance to next round"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Next Round</span>
            </button>
          </div>
        </div>

        {/* 4 Default Gap Slots Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#262b3b]">
          <div className="p-3.5 rounded-2xl bg-[#090b0e]/80 border border-[#d4af37]/30">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400">
              <span className="text-[#f3c64c]">1ST GAP</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono">FIXED POS 1</span>
            </div>
            <div className="text-sm font-bold text-gray-100 mt-1">
              Normally waits for 1st Quality
            </div>
            <div className="text-xs font-mono text-[#f3c64c] mt-0.5">
              {gapQueue[0]?.vehicleNumber || 'KL-55-RZ-01'} ({gapQueue[0]?.driver || 'Pasha'})
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">
              RZ MINING — Fixed Company Vehicle
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#090b0e]/80 border border-blue-900/30">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400">
              <span className="text-blue-400">2ND GAP</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 font-mono">ROTATING</span>
            </div>
            <div className="text-sm font-bold text-gray-100 mt-1">
              Normally waits for 2nd Quality
            </div>
            <div className="text-xs font-mono text-blue-300 mt-0.5">
              {gapQueue[1]?.vehicleNumber || 'KL-55-A-1021'} ({gapQueue[1]?.driver || 'Kabeer'})
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">
              Outside Tipper — Eligible turn
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#090b0e]/80 border border-amber-900/30">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400">
              <span className="text-amber-400">3RD GAP</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono">MURY LOAD</span>
            </div>
            <div className="text-sm font-bold text-gray-100 mt-1">
              Normally waits for Mury
            </div>
            <div className="text-xs font-mono text-amber-300 mt-0.5">
              {gapQueue[2]?.vehicleNumber || 'KL-55-B-3344'} ({gapQueue[2]?.driver || 'Faizal'})
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">
              Sold strictly by Load (No piece count)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#090b0e]/80 border border-purple-900/30">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400">
              <span className="text-purple-400">4TH GAP</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 font-mono">FLEXIBLE</span>
            </div>
            <div className="text-sm font-bold text-gray-100 mt-1">
              Receives applicable quality
            </div>
            <div className="text-xs font-mono text-purple-300 mt-0.5">
              {gapQueue[3]?.vehicleNumber || 'KL 01 CB 5165'} ({gapQueue[3]?.driver || 'Salam'})
            </div>
            <span className="text-[10px] text-gray-400 block mt-1">
              Takes any available cascade load
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#202534] pb-3 text-xs font-bold">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'queue'
              ? 'bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Active 4-Gap Queue (Round #{currentRound})
        </button>
        <button
          onClick={() => setActiveTab('cascading')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'cascading'
              ? 'bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Cascading Offer Audit Log ({gapOfferEvents.length})
        </button>
        <button
          onClick={() => setActiveTab('rounds')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'rounds'
              ? 'bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Round Cycle History ({roundLogs.length})
        </button>
      </div>

      {/* TAB 1: ACTIVE 4-GAP QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gapQueue.map((slot) => {
              const isPos1 = slot.gapNumber === 1;
              return (
                <div
                  key={slot.id}
                  className={`p-5 rounded-2xl bg-[#12141a] border transition-all ${
                    isPos1
                      ? 'border-[#d4af37]/50 shadow-md shadow-[#d4af37]/5'
                      : 'border-[#232736]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-cinzel text-base ${
                          isPos1
                            ? 'bg-gradient-to-br from-[#d4af37] to-[#8f741c] text-black shadow'
                            : 'bg-[#181c28] text-gray-200 border border-[#2b334a]'
                        }`}
                      >
                        G{slot.gapNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-100 text-sm">
                            {slot.gapNumber === 1
                              ? '1st Gap (1st Quality)'
                              : slot.gapNumber === 2
                              ? '2nd Gap (2nd Quality)'
                              : slot.gapNumber === 3
                              ? '3rd Gap (Mury Load)'
                              : '4th Gap (Flexible Quality)'}
                          </h4>
                          {isPos1 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40">
                              LOCKED POS 1
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Expected Quality:{' '}
                          <span className="text-[#f3c64c] font-semibold">
                            {slot.defaultExpectedQuality}
                          </span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        slot.currentStatus === 'Loading'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                          : slot.currentStatus === 'Returned'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {slot.currentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#1e2332] text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">
                        Assigned Vehicle
                      </span>
                      <span className="font-mono font-bold text-gray-100">
                        {slot.vehicleNumber}
                      </span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        Driver: {slot.driver} • Owner: {slot.owner}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase font-bold">
                        Queue Entry Time
                      </span>
                      <span className="font-mono text-gray-200">{slot.entryTime}</span>
                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        Round Sequence: #{slot.roundNumber}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e2332] flex items-center justify-between text-xs">
                    <p className="text-[11px] text-gray-400 italic">
                      {slot.notes || 'Waiting at pit for production split'}
                    </p>

                    {!isPos1 && (
                      <button
                        onClick={() => {
                          setEditingSlotGap(slot.gapNumber);
                          setSelectedVehicleForSlot(slot.vehicleId);
                        }}
                        className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold underline cursor-pointer"
                      >
                        Change Vehicle
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>
                <b className="text-gray-200">Quality Flexibility Rule:</b> If a vehicle rejects an offered stone quality, it cascades down (Gap 1 → 2 → 3 → 4). The vehicle stays at the quarry and does not leave.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CASCADING OFFER AUDIT LOG */}
      {activeTab === 'cascading' && (
        <div className="bg-[#12141a] rounded-2xl border border-[#232736] overflow-hidden">
          <div className="p-4 bg-[#161924] border-b border-[#232736] flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold font-cinzel text-gray-100">
                Cascading Quality Offer Event Log
              </h3>
              <p className="text-xs text-gray-400">
                Audits every quality offer, vehicle acceptance, and rejection with reason
              </p>
            </div>
            <button
              onClick={() => setShowOfferModal(true)}
              className="gold-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Load Offer</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#141722] border-b border-[#232736] text-gray-400 text-[11px]">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Round</th>
                  <th className="p-3">Offered Quality</th>
                  <th className="p-3">Offered To Gap</th>
                  <th className="p-3">Vehicle & Driver</th>
                  <th className="p-3 text-center">Decision</th>
                  <th className="p-3">Rejection Reason / Notes</th>
                  <th className="p-3">Next Offered Gap</th>
                  <th className="p-3 text-center">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2230]">
                {gapOfferEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      No quality offer events recorded yet.
                    </td>
                  </tr>
                ) : (
                  gapOfferEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#161924]">
                      <td className="p-3 font-mono text-gray-300">{evt.timestamp}</td>
                      <td className="p-3 font-mono font-bold text-gray-200">#{evt.roundNumber}</td>
                      <td className="p-3 font-bold text-[#f3c64c]">{evt.offeredQuality}</td>
                      <td className="p-3 font-bold text-gray-200">Gap #{evt.offeredToGap}</td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-gray-100 block">
                          {evt.vehicleNumber}
                        </span>
                        <span className="text-[10px] text-gray-400">{evt.driver}</span>
                      </td>
                      <td className="p-3 text-center">
                        {evt.action === 'Accepted' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Accepted</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center gap-1">
                            <XCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-400 text-[11px]">
                        {evt.rejectionReason || '—'}
                      </td>
                      <td className="p-3 font-mono text-sky-400">
                        {evt.nextOfferedGap ? `Cascaded to Gap #${evt.nextOfferedGap}` : '—'}
                      </td>
                      <td className="p-3 text-center font-bold text-gray-300">{evt.recordedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROUND CYCLE HISTORY */}
      {activeTab === 'rounds' && (
        <div className="bg-[#12141a] rounded-2xl border border-[#232736] overflow-hidden">
          <div className="p-4 bg-[#161924] border-b border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold font-cinzel text-gray-100">
                Quarry Round Cycle & Return Order
              </h3>
              <p className="text-xs text-gray-400">
                After a round, the vehicle that returns first becomes the next eligible vehicle. Order is strictly based on return time.
              </p>
            </div>
            <button
              onClick={() => {
                setReturnTimeInput(getCurrentTimeString());
                setShowReturnModal(true);
              }}
              className="gold-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Record Return Time</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#141722] border-b border-[#232736] text-gray-400 text-[11px]">
                  <th className="p-3">Round</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Gap Used</th>
                  <th className="p-3">Quality Loaded</th>
                  <th className="p-3 text-right">Physical / Free / Rated</th>
                  <th className="p-3 text-right">Vehicle Received</th>
                  <th className="p-3">Loading Start</th>
                  <th className="p-3">Departure</th>
                  <th className="p-3">Return Time</th>
                  <th className="p-3 text-center">Next Eligible Pos</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2230]">
                {roundLogs.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-500">
                      No completed round logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  roundLogs.map((rnd) => (
                    <tr key={rnd.id} className="hover:bg-[#161924]">
                      <td className="p-3 font-mono font-bold text-[#f3c64c]">#{rnd.roundNumber}</td>
                      <td className="p-3">
                        <span className="font-mono font-bold text-gray-100 block">
                          {rnd.vehicleNumber}
                        </span>
                        <span className="text-[10px] text-gray-400">{rnd.driver}</span>
                      </td>
                      <td className="p-3 text-gray-300">
                        Gap #{rnd.actualGapUsed} (Orig #{rnd.originalGap})
                      </td>
                      <td className="p-3 font-bold text-gray-200">{rnd.acceptedQuality}</td>
                      <td className="p-3 text-right font-mono text-xs">
                        <span className="text-white font-bold">{rnd.physicalQty}</span> +{' '}
                        <span className="text-emerald-400 font-bold">{rnd.freeQty}F</span> ={' '}
                        <span className="text-[#f3c64c] font-bold">{rnd.ratedQty}R</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sky-400 text-xs">
                        {rnd.vehicleReceivedQty} pcs
                      </td>
                      <td className="p-3 font-mono text-gray-400">{rnd.loadingStart || '—'}</td>
                      <td className="p-3 font-mono text-gray-400">{rnd.departureTime || '—'}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {rnd.returnTime || 'On Road'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-[#f3c64c]">
                        {rnd.nextEligiblePosition
                          ? `Pos ${rnd.nextEligiblePosition}`
                          : 'Pending Return'}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rnd.status === 'Returned'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {rnd.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASCADING OFFER MODAL */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101218] border border-[#262c3e] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-[#141722] border-b border-[#262c3e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-cinzel font-bold text-sm text-gray-100">
                  Offer Stone Load — Cascading Quality Engine
                </h3>
              </div>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {offerStatusMessage && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 leading-relaxed font-semibold">
                  {offerStatusMessage}
                </div>
              )}

              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  Material Quality Being Cut / Available *
                </label>
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value as OperationalQuality)}
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 font-bold text-[#f3c64c]"
                >
                  <option value="1ST QUALITY">1ST QUALITY (All 8 corners intact)</option>
                  <option value="2ND QUALITY">2ND QUALITY (~3/4 corners intact)</option>
                  <option value="3RD / LATT">3RD / LATT (Damage / defect stone)</option>
                  <option value="MURY">MURY (Split into rubble / load)</option>
                </select>
              </div>

              {/* Target Gap Vehicle Card */}
              {(() => {
                const targetSlot = gapQueue.find((s) => s.gapNumber === currentOfferGap) || gapQueue[0];
                return (
                  <div className="p-4 rounded-xl bg-[#090b0e] border border-[#d4af37]/40 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-[#f3c64c]">
                        Current Target: Gap #{currentOfferGap}
                      </span>
                      <span className="font-mono text-gray-400 text-[11px]">
                        Entry: {targetSlot.entryTime}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-gray-100">
                      <span>{targetSlot.vehicleNumber}</span>
                      <span className="text-gray-300 font-normal text-xs">
                        Driver: {targetSlot.driver}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Default Preference: {targetSlot.defaultExpectedQuality} • Owner: {targetSlot.owner}
                    </p>
                  </div>
                );
              })()}

              <div>
                <label className="block text-gray-400 font-semibold mb-1">
                  Rejection Reason (if driver declines load)
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Waiting for 1st grade; or client requested 2nd only"
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-200"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0d1017] border border-[#1e2332] text-gray-400 leading-relaxed text-[11px]">
                <b>Operational Rule:</b> If Gap #{currentOfferGap} declines, the vehicle remains safely parked at the quarry queue. The load cascades to Gap #{currentOfferGap < 4 ? currentOfferGap + 1 : 'none'}.
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleOfferDecision(false)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline & Cascade to Next Gap</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOfferDecision(true)}
                  className="gold-btn px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Load & Start Loading</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECORD RETURN MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101218] border border-[#262c3e] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-[#141722] border-b border-[#262c3e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-cinzel font-bold text-sm text-gray-100">
                  Record Vehicle Return Time
                </h3>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReturn} className="p-5 space-y-4 text-xs">
              <p className="text-gray-400 leading-relaxed">
                The vehicle that returns first becomes the next eligible vehicle in the sequence. Next available position is determined from actual return time.
              </p>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Select Returning Vehicle *
                </label>
                <select
                  value={returnVehicleNumber}
                  onChange={(e) => setReturnVehicleNumber(e.target.value)}
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-sm font-mono font-bold text-gray-100"
                  required
                >
                  <option value="">-- Choose Returning Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.vehicleNumber}>
                      {v.vehicleNumber} ({v.driver} - {v.owner})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Actual Return Time at Quarry Gate *
                </label>
                <input
                  type="text"
                  value={returnTimeInput}
                  onChange={(e) => setReturnTimeInput(e.target.value)}
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-btn px-5 py-2 rounded-xl font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Return Sequence</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE VEHICLE IN SLOT MODAL */}
      {editingSlotGap !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101218] border border-[#262c3e] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-[#141722] border-b border-[#262c3e] flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-sm text-gray-100">
                Assign Vehicle to Gap #{editingSlotGap}
              </h3>
              <button
                onClick={() => setEditingSlotGap(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Select Vehicle *
                </label>
                <select
                  value={selectedVehicleForSlot}
                  onChange={(e) => setSelectedVehicleForSlot(e.target.value)}
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 font-mono text-gray-100"
                >
                  <option value="">-- Select Available Vehicle --</option>
                  {vehicles
                    .filter((v) => v.vehicleNumber !== 'KL-55-RZ-01')
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.driver} - {v.owner})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSlotGap(null)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlotVehicle}
                  className="gold-btn px-5 py-2 rounded-xl font-bold"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
