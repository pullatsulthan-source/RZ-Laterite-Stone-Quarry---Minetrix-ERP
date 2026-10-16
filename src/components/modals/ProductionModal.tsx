import React, { useState } from 'react';
import { useQuarry } from '../../context/QuarryContext';
import { getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { X, PackageCheck, CheckCircle2, Mountain, Layers, Thermometer, Droplets, Truck } from 'lucide-react';

interface ProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductionModal: React.FC<ProductionModalProps> = ({ isOpen, onClose }) => {
  const { quarries, vehicles, currentUser, addDailyProductionRecord } = useQuarry();

  // Basic Details
  const [date, setDate] = useState(getTodayDateString());
  const [quarryId, setQuarryId] = useState('quarry-001');
  const [section, setSection] = useState<'Section A' | 'Section B'>('Section A');
  const [cuttingMachine, setCuttingMachine] = useState('Double-Blade Track Cutter #1');
  const [operator, setOperator] = useState('Mujeeb Rahman');
  const [assistantOperator, setAssistantOperator] = useState('Hamza V');
  const [helpers, setHelpers] = useState('Suresh, Binu, Maniyan (3 Splitters)');
  const [startTime, setStartTime] = useState('07:30 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [workingHours, setWorkingHours] = useState<number>(4.5);

  // Geological / Environmental Conditions (Recorded during cut)
  const [soilCondition, setSoilCondition] = useState('Dry / Compact Top Stratum');
  const [rockStrength, setRockStrength] = useState('Hard Top-Rock (Section A)');
  const [moisture, setMoisture] = useState('Low');
  const [heat, setHeat] = useState('Moderate (29°C Morning)');
  const [cuttingCondition, setCuttingCondition] = useState('Smooth continuous cut, blade wear normal');
  const [splittingCondition, setSplittingCondition] = useState('Clean natural grain splitting, sharp 8-corner blocks');
  const [cuttingNotes, setCuttingNotes] = useState('');

  // Actual Quantities (Recorded AFTER rock is split - Never predicted)
  const [totalCutQuantity, setTotalCutQuantity] = useState<number>(780);
  const [firstQualityQuantity, setFirstQualityQuantity] = useState<number>(620); // 8 corners intact
  const [secondQualityQuantity, setSecondQualityQuantity] = useState<number>(110); // ~3/4 corners intact
  const [lattQuantity, setLattQuantity] = useState<number>(25); // Defect blocks
  const [muryQuantity, setMuryQuantity] = useState<number>(25); // Rubble

  // Direct Pit Loading Vehicle Assignment (Zero Warehouse Stock)
  const [allocatedVehicle, setAllocatedVehicle] = useState('KL-55-RZ-01');
  const [gapPosition, setGapPosition] = useState<number>(1);
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  // Real-time Recovery & Quality Percentage Preview
  const finishedQuantity = firstQualityQuantity + secondQualityQuantity + lattQuantity;
  const recoveryPercent = totalCutQuantity > 0 ? ((finishedQuantity / totalCutQuantity) * 100).toFixed(1) : 'N/A';
  const firstPercent = finishedQuantity > 0 ? ((firstQualityQuantity / finishedQuantity) * 100).toFixed(1) : 'N/A';
  const secondPercent = finishedQuantity > 0 ? ((secondQualityQuantity / finishedQuantity) * 100).toFixed(1) : 'N/A';
  const lattPercent = finishedQuantity > 0 ? ((lattQuantity / finishedQuantity) * 100).toFixed(1) : 'N/A';
  const muryPercent = totalCutQuantity > 0 ? ((muryQuantity / totalCutQuantity) * 100).toFixed(1) : 'N/A';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalCutQuantity) return;

    const selectedQuarry = quarries.find((q) => q.id === quarryId) || quarries[0];

    addDailyProductionRecord({
      date,
      quarryId,
      quarryName: selectedQuarry.quarryName,
      section,
      cuttingMachine,
      operator,
      assistantOperator,
      helpers,
      startTime,
      endTime,
      workingHours: Number(workingHours) || 0,
      soilCondition,
      rockStrength,
      moisture,
      heat,
      cuttingCondition,
      splittingCondition,
      cuttingNotes,
      cuttingDimensions: '13.5 x 8.5 x 9 inch',
      finishedDimensions: '13 x 8 x 8 inch',
      totalCutQuantity: Number(totalCutQuantity),
      finishedQuantity,
      firstQualityQuantity: Number(firstQualityQuantity),
      secondQualityQuantity: Number(secondQualityQuantity),
      lattQuantity: Number(lattQuantity),
      muryQuantity: Number(muryQuantity),
      unit: 'pcs',
      allocatedVehicle,
      gapPosition: Number(gapPosition) || 1,
      remarks: remarks || `Direct pit loading into vehicle ${allocatedVehicle} (Gap #${gapPosition}). Zero physical warehouse stock.`,
      enteredBy: currentUser,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101218] border border-[#262c3e] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#141722] border-b border-[#262c3e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#f3c64c]">
              <PackageCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-base text-gray-100">
                Log Daily Quarry Production & Direct Loading
              </h3>
              <p className="text-[11px] text-[#f3c64c]/80">
                Direct pit extraction model • No physical warehouse stock • Analysis & recovery engine
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white bg-[#1a1e2b] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Operational Flow Notice */}
        <div className="px-5 py-2 bg-[#090b0f] border-b border-[#1c2130] text-[11px] text-gray-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[#f3c64c]">FLOW:</span>
            <span>CUTTING → SPLITTING → QUALITY IDENTIFICATION → DIRECT VEHICLE LOADING → DISPATCH</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 font-bold">
            Zero Warehouse Stock
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Quarry, Date, Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                Quarry Master *
              </label>
              <select
                value={quarryId}
                onChange={(e) => setQuarryId(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#d4af37]"
              >
                {quarries.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.quarryName} ({q.quarryCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                Quarry Section * (Never 'Medium')
              </label>
              <select
                value={section}
                onChange={(e) => {
                  const s = e.target.value as 'Section A' | 'Section B';
                  setSection(s);
                  if (s === 'Section A') {
                    setRockStrength('Hard Top-Rock (Section A)');
                  } else {
                    setRockStrength('Comparatively Weaker Rock (Section B)');
                  }
                }}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-[#f3c64c] font-bold focus:outline-none focus:border-[#d4af37]"
              >
                <option value="Section A">Section A (Stronger / Top-Rock)</option>
                <option value="Section B">Section B (Weaker Rock / Worked Portion)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                Extraction Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                required
              />
            </div>
          </div>

          {/* Machine, Operator, Assistants */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                Cutting Machine *
              </label>
              <input
                type="text"
                value={cuttingMachine}
                onChange={(e) => setCuttingMachine(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                Lead Operator *
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                Assistant Operator & Helpers
              </label>
              <input
                type="text"
                value={assistantOperator}
                onChange={(e) => setAssistantOperator(e.target.value)}
                placeholder="Assistant & splitters"
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Timing & Operational Dimensions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Start Time</label>
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">End Time</label>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Working Hours</label>
              <input
                type="number"
                step="0.5"
                value={workingHours}
                onChange={(e) => setWorkingHours(Number(e.target.value) || 0)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div className="p-2 rounded-xl bg-[#090b0e] border border-[#1e2332] text-[10px] text-gray-400 flex flex-col justify-center">
              <span className="text-[#f3c64c] font-bold">Cutting Dimension:</span>
              <span>13.5 x 8.5 x 9 inch (Cut)</span>
              <span>13 x 8 x 8 inch (Finished)</span>
            </div>
          </div>

          {/* Geological & Working Conditions (Recorded during cut) */}
          <div className="p-3.5 rounded-xl bg-[#0b0d13] border border-[#1f2434] space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#f3c64c] font-bold block">
              GEOLOGICAL & WORKING CONDITIONS (Recorded During Process)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Soil Condition</label>
                <input
                  type="text"
                  value={soilCondition}
                  onChange={(e) => setSoilCondition(e.target.value)}
                  className="w-full bg-[#141722] border border-[#262c3e] rounded-lg px-2.5 py-1.5 text-xs text-gray-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Rock Strength</label>
                <input
                  type="text"
                  value={rockStrength}
                  onChange={(e) => setRockStrength(e.target.value)}
                  className="w-full bg-[#141722] border border-[#262c3e] rounded-lg px-2.5 py-1.5 text-xs text-gray-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Moisture & Heat</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={moisture}
                    onChange={(e) => setMoisture(e.target.value)}
                    placeholder="Moisture"
                    className="w-full bg-[#141722] border border-[#262c3e] rounded-lg px-2 py-1.5 text-xs text-gray-200"
                  />
                  <input
                    type="text"
                    value={heat}
                    onChange={(e) => setHeat(e.target.value)}
                    placeholder="Heat"
                    className="w-full bg-[#141722] border border-[#262c3e] rounded-lg px-2 py-1.5 text-xs text-gray-200"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Cutting Condition Notes</label>
                <input
                  type="text"
                  value={cuttingCondition}
                  onChange={(e) => setCuttingCondition(e.target.value)}
                  className="w-full bg-[#141722] border border-[#262c3e] rounded-lg px-2.5 py-1.5 text-xs text-gray-200"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-0.5">Splitting Condition Notes</label>
                <input
                  type="text"
                  value={splittingCondition}
                  onChange={(e) => setSplittingCondition(e.target.value)}
                  className="w-full bg-[#141722] border border-[#262c3e] rounded-lg px-2.5 py-1.5 text-xs text-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Actual Quality Quantities (Recorded AFTER Stone Is Observed) */}
          <div className="p-4 rounded-xl bg-[#0e111a] border border-[#d4af37]/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-xs font-black text-[#f3c64c] uppercase tracking-wider block font-cinzel">
                  ACTUAL SPLITTING & QUALITY RESULTS (Observed Post-Split)
                </span>
                <span className="text-[10px] text-gray-400">
                  Do NOT force predicted counts. Record actual verified stone quantities.
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-gray-400">Recovery:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {recoveryPercent !== 'N/A' ? `${recoveryPercent}%` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#1f2434]">
                <label className="block text-[10px] font-bold text-gray-300 mb-1">TOTAL CUT</label>
                <input
                  type="number"
                  value={totalCutQuantity}
                  onChange={(e) => setTotalCutQuantity(Number(e.target.value) || 0)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-lg px-2 py-1.5 text-sm font-mono font-bold text-white"
                  required
                />
                <span className="text-[10px] text-gray-500 mt-1 block">Blocks excavated</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#090b0e] border border-[#d4af37]/40">
                <label className="block text-[10px] font-bold text-[#f3c64c] mb-1">1ST QUALITY</label>
                <input
                  type="number"
                  value={firstQualityQuantity}
                  onChange={(e) => setFirstQualityQuantity(Number(e.target.value) || 0)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-lg px-2 py-1.5 text-sm font-mono font-bold text-[#f3c64c]"
                  required
                />
                <span className="text-[10px] text-gray-400 mt-1 block">8 corners intact ({firstPercent}%)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#090b0e] border border-blue-500/40">
                <label className="block text-[10px] font-bold text-blue-400 mb-1">2ND QUALITY</label>
                <input
                  type="number"
                  value={secondQualityQuantity}
                  onChange={(e) => setSecondQualityQuantity(Number(e.target.value) || 0)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-lg px-2 py-1.5 text-sm font-mono font-bold text-blue-400"
                  required
                />
                <span className="text-[10px] text-gray-400 mt-1 block">~3/4 corners ({secondPercent}%)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#090b0e] border border-orange-500/40">
                <label className="block text-[10px] font-bold text-orange-400 mb-1">LATT / 3RD NUM</label>
                <input
                  type="number"
                  value={lattQuantity}
                  onChange={(e) => setLattQuantity(Number(e.target.value) || 0)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-lg px-2 py-1.5 text-sm font-mono font-bold text-orange-400"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Defective blocks ({lattPercent}%)</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#090b0e] border border-amber-500/40">
                <label className="block text-[10px] font-bold text-amber-400 mb-1">MURY (RUBBLE)</label>
                <input
                  type="number"
                  value={muryQuantity}
                  onChange={(e) => setMuryQuantity(Number(e.target.value) || 0)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-lg px-2 py-1.5 text-sm font-mono font-bold text-amber-400"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Broken rubble ({muryPercent}%)</span>
              </div>
            </div>
          </div>

          {/* Direct Vehicle Loading Association (Gap Position) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#0b0c10] rounded-xl border border-[#1f2434]">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                Direct Pit-Loaded Vehicle *
              </label>
              <select
                value={allocatedVehicle}
                onChange={(e) => setAllocatedVehicle(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#d4af37]"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.vehicleNumber}>
                    {v.vehicleNumber} ({v.owner} • {v.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-300 mb-1">
                Associated Gap Slot Queue
              </label>
              <select
                value={gapPosition}
                onChange={(e) => setGapPosition(Number(e.target.value) || 1)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-[#f3c64c] font-bold focus:outline-none focus:border-[#d4af37]"
              >
                <option value={1}>1st Gap (Normally 1st Quality • RZ Mining Fixed)</option>
                <option value={2}>2nd Gap (Normally 2nd Quality)</option>
                <option value={3}>3rd Gap (Normally Mury Rubble Load)</option>
                <option value={4}>4th Gap (Any Available Quality)</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
              Operational Notes & Geological Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Smooth top-rock cut; sharp 8-corner blocks loaded directly into 1st Gap tipper"
              className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-gray-200"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white bg-[#141722] border border-[#262c3e]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gold-btn px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Production Run (Direct Load)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
