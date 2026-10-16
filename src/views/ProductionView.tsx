import React, { useState, useMemo } from 'react';
import { useQuarry } from '../context/QuarryContext';
import { QuarryDailyProductionRecord, OperationalQuality } from '../types/quarry';
import { formatNumber, formatDate, getTodayDateString, getCurrentTimeString } from '../utils/formatters';
import {
  PackageCheck,
  Plus,
  Search,
  Trash2,
  Layers,
  Thermometer,
  Droplets,
  Wrench,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  Info,
  Calendar,
  Truck,
} from 'lucide-react';

interface ProductionViewProps {
  onOpenProductionModal?: () => void;
}

export const ProductionView: React.FC<ProductionViewProps> = () => {
  const {
    dailyProductionRecords,
    addDailyProductionRecord,
    deleteDailyProductionRecord,
    quarries,
    vehicles,
    currentUser,
  } = useQuarry();

  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | 'Section A' | 'Section B'>('ALL');
  const [showLogModal, setShowLogModal] = useState(false);

  // Modal form state
  const [date, setDate] = useState(getTodayDateString());
  const [quarryId, setQuarryId] = useState('quarry-001');
  const [section, setSection] = useState<'Section A' | 'Section B'>('Section A');
  const [cuttingMachine, setCuttingMachine] = useState('Double-Blade Track Cutter #1');
  const [operator, setOperator] = useState('Mujeeb Rahman');
  const [assistantOperator, setAssistantOperator] = useState('Hamza V');
  const [helpers, setHelpers] = useState('Suresh, Binu, Maniyan (3 Splitters)');
  const [startTime, setStartTime] = useState('07:30 AM');
  const [endTime, setEndTime] = useState('12:00 PM');
  const [workingHours, setWorkingHours] = useState(4.5);

  // Geological & Environmental conditions
  const [soilCondition, setSoilCondition] = useState('Dry / Compact Top Stratum');
  const [rockStrength, setRockStrength] = useState('Hard Top-Rock (Section A)');
  const [moisture, setMoisture] = useState('Low');
  const [heat, setHeat] = useState('Moderate (29°C Morning)');
  const [cuttingCondition, setCuttingCondition] = useState('Smooth continuous cut, blade wear normal');
  const [splittingCondition, setSplittingCondition] = useState('Clean natural grain splitting, sharp 8-corner blocks');
  const [cuttingNotes, setCuttingNotes] = useState('');

  // Actual quantities (recorded AFTER stone is split)
  const [totalCutQuantity, setTotalCutQuantity] = useState<number>(750);
  const [firstQualityQuantity, setFirstQualityQuantity] = useState<number>(600);
  const [secondQualityQuantity, setSecondQualityQuantity] = useState<number>(100);
  const [lattQuantity, setLattQuantity] = useState<number>(25);
  const [muryQuantity, setMuryQuantity] = useState<number>(25);
  const [allocatedVehicle, setAllocatedVehicle] = useState('KL-55-RZ-01');
  const [gapPosition, setGapPosition] = useState<number>(1);
  const [remarks, setRemarks] = useState('');

  // Auto-calculated finished stones & recovery rates
  const finishedQuantity = firstQualityQuantity + secondQualityQuantity + lattQuantity;
  const recoveryPercent = totalCutQuantity > 0 ? ((finishedQuantity / totalCutQuantity) * 100).toFixed(1) : 'N/A';
  const firstPercent = finishedQuantity > 0 ? ((firstQualityQuantity / finishedQuantity) * 100).toFixed(1) : 'N/A';
  const secondPercent = finishedQuantity > 0 ? ((secondQualityQuantity / finishedQuantity) * 100).toFixed(1) : 'N/A';
  const lattPercent = finishedQuantity > 0 ? ((lattQuantity / finishedQuantity) * 100).toFixed(1) : 'N/A';
  const muryPercent = totalCutQuantity > 0 ? ((muryQuantity / totalCutQuantity) * 100).toFixed(1) : 'N/A';

  // Overall KPI aggregations
  const totalCutAggregate = useMemo(() => {
    return dailyProductionRecords.reduce((sum, p) => sum + (p.totalCutQuantity || 0), 0);
  }, [dailyProductionRecords]);

  const totalFinishedAggregate = useMemo(() => {
    return dailyProductionRecords.reduce((sum, p) => sum + (p.finishedQuantity || 0), 0);
  }, [dailyProductionRecords]);

  const total1stAggregate = useMemo(() => {
    return dailyProductionRecords.reduce((sum, p) => sum + (p.firstQualityQuantity || 0), 0);
  }, [dailyProductionRecords]);

  const total2ndAggregate = useMemo(() => {
    return dailyProductionRecords.reduce((sum, p) => sum + (p.secondQualityQuantity || 0), 0);
  }, [dailyProductionRecords]);

  const totalLattAggregate = useMemo(() => {
    return dailyProductionRecords.reduce((sum, p) => sum + (p.lattQuantity || 0), 0);
  }, [dailyProductionRecords]);

  const totalMuryAggregate = useMemo(() => {
    return dailyProductionRecords.reduce((sum, p) => sum + (p.muryQuantity || 0), 0);
  }, [dailyProductionRecords]);

  const aggregateRecoveryPercent =
    totalCutAggregate > 0 ? `${((totalFinishedAggregate / totalCutAggregate) * 100).toFixed(1)}%` : 'N/A';

  const aggregate1stPercent =
    totalFinishedAggregate > 0 ? `${((total1stAggregate / totalFinishedAggregate) * 100).toFixed(1)}%` : 'N/A';

  const aggregate2ndPercent =
    totalFinishedAggregate > 0 ? `${((total2ndAggregate / totalFinishedAggregate) * 100).toFixed(1)}%` : 'N/A';

  const aggregateLattPercent =
    totalFinishedAggregate > 0 ? `${((totalLattAggregate / totalFinishedAggregate) * 100).toFixed(1)}%` : 'N/A';

  const aggregateMuryPercent =
    totalCutAggregate > 0 ? `${((totalMuryAggregate / totalCutAggregate) * 100).toFixed(1)}%` : 'N/A';

  // Filtered production logs
  const filteredRecords = dailyProductionRecords.filter((rec) => {
    if (sectionFilter !== 'ALL' && rec.section !== sectionFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      rec.productionId.toLowerCase().includes(term) ||
      rec.operator.toLowerCase().includes(term) ||
      rec.cuttingMachine.toLowerCase().includes(term) ||
      rec.section.toLowerCase().includes(term) ||
      (rec.cuttingNotes && rec.cuttingNotes.toLowerCase().includes(term)) ||
      (rec.allocatedVehicle && rec.allocatedVehicle.toLowerCase().includes(term))
    );
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this production record permanently?')) {
      deleteDailyProductionRecord(id);
    }
  };

  const handleSaveProductionRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalCutQuantity) return;

    const selectedQuarryObj = quarries.find((q) => q.id === quarryId) || quarries[0];

    addDailyProductionRecord({
      productionId: `PRD-2026-${String(dailyProductionRecords.length + 101).padStart(3, '0')}`,
      date,
      quarryId,
      quarryName: selectedQuarryObj.quarryName,
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
      totalCutQuantity: Number(totalCutQuantity) || 0,
      finishedQuantity: Number(finishedQuantity) || 0,
      firstQualityQuantity: Number(firstQualityQuantity) || 0,
      secondQualityQuantity: Number(secondQualityQuantity) || 0,
      lattQuantity: Number(lattQuantity) || 0,
      muryQuantity: Number(muryQuantity) || 0,
      unit: 'pcs',
      allocatedVehicle,
      gapPosition: Number(gapPosition) || 1,
      remarks: remarks || `Direct loaded to ${allocatedVehicle} (Gap #${gapPosition})`,
      enteredBy: currentUser,
    });

    setShowLogModal(false);
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
                <PackageCheck className="w-5 h-5 stroke-[2.5]" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 tracking-wide">
                Quarry Production & Recovery Engine
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40">
                Zero Physical Stock Architecture
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2 max-w-3xl leading-relaxed">
              <span className="text-[#f3c64c] font-semibold">Quarry Production Model:</span>{' '}
              CUTTING → SPLITTING → QUALITY IDENTIFICATION → DIRECT VEHICLE LOADING → OUTWARD GATE PASS → DISPATCH. No physical warehouse stock is maintained. All records remain permanently available for daily, quality, recovery, machine, and labour analysis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogModal(true)}
              className="gold-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Log Daily Production Run</span>
            </button>
          </div>
        </div>

        {/* 6-Stage Operational Flow Line */}
        <div className="mt-5 pt-4 border-t border-[#262b3b]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2434]">
              <span className="text-[10px] font-mono font-bold text-gray-400 block">STAGE 1</span>
              <span className="font-bold text-gray-200 block mt-0.5">CUTTING</span>
              <span className="text-[10px] text-gray-500">13.5×8.5×9" cut</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2434]">
              <span className="text-[10px] font-mono font-bold text-gray-400 block">STAGE 2</span>
              <span className="font-bold text-gray-200 block mt-0.5">SPLITTING</span>
              <span className="text-[10px] text-gray-500">Manual wedge split</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2434]">
              <span className="text-[10px] font-mono font-bold text-gray-400 block">STAGE 3</span>
              <span className="font-bold text-[#f3c64c] block mt-0.5">QUALITY ID</span>
              <span className="text-[10px] text-gray-500">1st, 2nd, Latt, Mury</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2434]">
              <span className="text-[10px] font-mono font-bold text-gray-400 block">STAGE 4</span>
              <span className="font-bold text-emerald-400 block mt-0.5">DIRECT LOADING</span>
              <span className="text-[10px] text-gray-500">Straight into tipper</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2434]">
              <span className="text-[10px] font-mono font-bold text-gray-400 block">STAGE 5</span>
              <span className="font-bold text-sky-400 block mt-0.5">GATE PASS</span>
              <span className="text-[10px] text-gray-500">Outward pass verified</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2434]">
              <span className="text-[10px] font-mono font-bold text-gray-400 block">STAGE 6</span>
              <span className="font-bold text-purple-400 block mt-0.5">DISPATCH</span>
              <span className="text-[10px] text-gray-500">Transit to customer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production & Recovery KPI Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#12141a] border border-[#232736]">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
            Total Cut Qty
          </span>
          <span className="text-lg font-black font-mono text-gray-100 mt-1 block">
            {formatNumber(totalCutAggregate)} pcs
          </span>
          <span className="text-[10px] text-gray-500">Raw quarry excavation</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#12141a] border border-emerald-900/30">
          <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
            Overall Recovery %
          </span>
          <span className="text-lg font-black font-mono text-emerald-400 mt-1 block">
            {aggregateRecoveryPercent}
          </span>
          <span className="text-[10px] text-gray-400">
            {formatNumber(totalFinishedAggregate)} finished stones
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#12141a] border border-[#d4af37]/30">
          <span className="text-[10px] text-[#f3c64c] uppercase font-bold tracking-wider block">
            1st Quality (8 Corners)
          </span>
          <span className="text-lg font-black font-mono text-[#f3c64c] mt-1 block">
            {formatNumber(total1stAggregate)} pcs
          </span>
          <span className="text-[10px] text-emerald-400">{aggregate1stPercent} yield</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#12141a] border border-blue-900/30">
          <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider block">
            2nd Quality (~3/4 Corners)
          </span>
          <span className="text-lg font-black font-mono text-blue-400 mt-1 block">
            {formatNumber(total2ndAggregate)} pcs
          </span>
          <span className="text-[10px] text-blue-300">{aggregate2ndPercent} yield</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#12141a] border border-orange-900/30">
          <span className="text-[10px] text-orange-400 uppercase font-bold tracking-wider block">
            Latt / 3rd Number
          </span>
          <span className="text-lg font-black font-mono text-orange-400 mt-1 block">
            {formatNumber(totalLattAggregate)} pcs
          </span>
          <span className="text-[10px] text-orange-300">{aggregateLattPercent} yield</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#12141a] border border-amber-900/30">
          <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider block">
            Mury (Rubble / Loads)
          </span>
          <span className="text-lg font-black font-mono text-amber-400 mt-1 block">
            {formatNumber(totalMuryAggregate)} pcs/loads
          </span>
          <span className="text-[10px] text-amber-300">{aggregateMuryPercent} loss</span>
        </div>
      </div>

      {/* Operational Cutting Dimensions & Geological Rules Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#d4af37]" />
            <h3 className="font-bold text-sm text-gray-100 font-cinzel">
              Operational Cutting Dimensions (Reference Only)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1e2332]">
              <span className="text-gray-400 block text-[10px] font-sans font-bold uppercase">
                Original Cutting Dimension
              </span>
              <span className="text-sm font-bold text-[#f3c64c] block mt-1">
                13.5" L × 8.5" W × 9" H
              </span>
              <span className="text-[10px] text-gray-500 font-sans">
                Excavator saw guide setting
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1e2332]">
              <span className="text-gray-400 block text-[10px] font-sans font-bold uppercase">
                Finished Stone Dimension
              </span>
              <span className="text-sm font-bold text-emerald-400 block mt-1">
                ~13" L × 8" W × 8" H
              </span>
              <span className="text-[10px] text-gray-500 font-sans">
                Post-splitting actual block
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed italic">
            <b className="text-gray-300">Operational Rule:</b> These dimensions are operational reference standards only. The system does NOT automatically predict production quantities from dimensions. Actual yield depends on geological conditions, rock strength, and moisture.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-gray-100 font-cinzel">
              Quarry Quality Classification Rules
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#090b0e] border border-emerald-900/30">
              <span className="font-bold text-emerald-400 block text-xs">1ST QUALITY</span>
              <p className="text-[11px] text-gray-400 mt-0.5">
                All 8 corners are obtained and fully intact. High-compaction laterite rock.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#090b0e] border border-blue-900/30">
              <span className="font-bold text-blue-400 block text-xs">2ND QUALITY</span>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Approximately 3/4 corners are remaining/lost. Standard residential block.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#090b0e] border border-orange-900/30">
              <span className="font-bold text-orange-400 block text-xs">LATT / 3RD NUMBER</span>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Material with damage/defect that does not qualify as 2nd quality.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#090b0e] border border-amber-900/30">
              <span className="font-bold text-amber-400 block text-xs">MURY (RUBBLE)</span>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Stone that breaks/splits into rubble during cutting. Sold strictly by the load.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Log Controls & Table */}
      <div className="bg-[#12141a] rounded-2xl border border-[#232736] overflow-hidden shadow-sm">
        <div className="p-4 bg-[#161924] border-b border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold font-cinzel text-gray-100">
              Daily Production Records ({filteredRecords.length})
            </h3>
            <div className="flex items-center gap-1 bg-[#0b0c10] border border-[#242938] rounded-xl p-1 text-xs">
              <button
                onClick={() => setSectionFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  sectionFilter === 'ALL'
                    ? 'bg-[#d4af37]/20 text-[#f3c64c]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                All Sections
              </button>
              <button
                onClick={() => setSectionFilter('Section A')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  sectionFilter === 'Section A'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Section A (Top-Rock)
              </button>
              <button
                onClick={() => setSectionFilter('Section B')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  sectionFilter === 'Section B'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Section B (Weaker-Rock)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search run ID, operator, vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0b0c10] border border-[#262c3e] rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#141722] border-b border-[#232736] text-gray-400 text-[11px]">
                <th className="p-3">Run ID & Date</th>
                <th className="p-3">Quarry / Section</th>
                <th className="p-3">Machine & Operator</th>
                <th className="p-3 text-right">Cut Qty</th>
                <th className="p-3 text-right">Finished Qty</th>
                <th className="p-3 text-center">Recovery %</th>
                <th className="p-3 text-right">1st Quality</th>
                <th className="p-3 text-right">2nd Quality</th>
                <th className="p-3 text-right">Latt / Mury</th>
                <th className="p-3">Geological Conditions</th>
                <th className="p-3">Direct Loading</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2230]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-gray-500">
                    No production records matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isSecA = item.section === 'Section A';
                  const recPct = item.recoveryRate !== null && item.recoveryRate !== undefined ? `${item.recoveryRate}%` : 'N/A';
                  const fPct = item.firstQualityRate !== null && item.firstQualityRate !== undefined ? `${item.firstQualityRate}%` : 'N/A';
                  const sPct = item.secondQualityRate !== null && item.secondQualityRate !== undefined ? `${item.secondQualityRate}%` : 'N/A';

                  return (
                    <tr key={item.id} className="hover:bg-[#161924]">
                      <td className="p-3">
                        <span className="font-mono font-bold text-[#f3c64c] block">
                          {item.productionId}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {formatDate(item.date)}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="text-gray-200 font-bold block">{item.quarryName}</span>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                            isSecA
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {item.section}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="text-gray-100 font-bold block">{item.operator}</span>
                        <span className="text-[10px] text-gray-400 block">{item.cuttingMachine}</span>
                        {item.helpers && (
                          <span className="text-[9px] text-gray-500 block truncate max-w-[130px]">
                            {item.helpers}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-gray-200">
                        {formatNumber(item.totalCutQuantity)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatNumber(item.finishedQuantity)}
                      </td>

                      <td className="p-3 text-center font-mono font-bold text-emerald-400">
                        {recPct}
                      </td>

                      <td className="p-3 text-right font-mono">
                        <span className="text-[#f3c64c] font-bold block">
                          {formatNumber(item.firstQualityQuantity)} pcs
                        </span>
                        <span className="text-[10px] text-gray-500">{fPct}</span>
                      </td>

                      <td className="p-3 text-right font-mono">
                        <span className="text-blue-400 font-bold block">
                          {formatNumber(item.secondQualityQuantity)} pcs
                        </span>
                        <span className="text-[10px] text-gray-500">{sPct}</span>
                      </td>

                      <td className="p-3 text-right font-mono text-[11px]">
                        <span className="text-orange-400 block font-bold">
                          Latt: {item.lattQuantity}
                        </span>
                        <span className="text-amber-400 block font-bold">
                          Mury: {item.muryQuantity}
                        </span>
                      </td>

                      <td className="p-3 text-[11px] text-gray-400 max-w-[180px]">
                        <span className="text-gray-300 block font-semibold truncate">
                          {item.rockStrength}
                        </span>
                        <span className="text-[10px] text-gray-500 block truncate">
                          Soil: {item.soilCondition} • Heat: {item.heat}
                        </span>
                        {item.cuttingNotes && (
                          <span className="text-[9px] text-gray-500 italic block truncate">
                            {item.cuttingNotes}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        {item.allocatedVehicle ? (
                          <div>
                            <span className="font-mono font-bold text-gray-200 block">
                              {item.allocatedVehicle}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Gap #{item.gapPosition || 1}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-[11px]">Direct Queue</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-rose-400 hover:text-rose-300 rounded cursor-pointer"
                          title="Delete Run"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG PRODUCTION RUN MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#101218] border border-[#262c3e] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto">
            <div className="px-5 py-3.5 bg-[#141722] border-b border-[#262c3e] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-cinzel font-bold text-sm text-gray-100">
                  Log Quarry Daily Production Run (Direct Loading Model)
                </h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductionRun} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                <b className="text-[#f3c64c]">Quarry Geological Mandate:</b> The actual number and quality of stones cannot be predicted before splitting. Record geological working conditions below and enter stone quantities observed <b>after</b> the rock is split.
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Quarry Master *</label>
                  <select
                    value={quarryId}
                    onChange={(e) => setQuarryId(e.target.value)}
                    className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100 font-bold"
                  >
                    {quarries.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quarryName} ({q.quarryCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Section Identifier *</label>
                  <select
                    value={section}
                    onChange={(e) => {
                      const sec = e.target.value as 'Section A' | 'Section B';
                      setSection(sec);
                      if (sec === 'Section A') {
                        setRockStrength('Hard Top-Rock (Section A)');
                        setSoilCondition('Dry / Compact Top Stratum');
                      } else {
                        setRockStrength('Comparatively Weaker Rock (Section B)');
                        setSoilCondition('Partially Cleared Soil & Fractured Overburden');
                      }
                    }}
                    className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-[#f3c64c] font-bold"
                  >
                    <option value="Section A">Section A (Stronger / Top-Rock)</option>
                    <option value="Section B">Section B (Weaker Rock Area)</option>
                  </select>
                </div>
              </div>

              {/* Machine & Crew */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Cutting Machine *</label>
                  <input
                    type="text"
                    value={cuttingMachine}
                    onChange={(e) => setCuttingMachine(e.target.value)}
                    placeholder="Machine name / code"
                    className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Chief Machine Operator *</label>
                  <input
                    type="text"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    placeholder="Operator name"
                    className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Assistant Operator</label>
                  <input
                    type="text"
                    value={assistantOperator}
                    onChange={(e) => setAssistantOperator(e.target.value)}
                    placeholder="Assistant name"
                    className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Helpers / Splitters</label>
                <input
                  type="text"
                  value={helpers}
                  onChange={(e) => setHelpers(e.target.value)}
                  placeholder="e.g. Suresh, Binu, Maniyan (3 Splitters)"
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100"
                />
              </div>

              {/* Geological & Environmental Working Conditions */}
              <div className="p-3.5 rounded-xl bg-[#090b0e] border border-[#1e2332] space-y-3">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  Geological & Environmental Working Conditions
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">Soil Condition</label>
                    <input
                      type="text"
                      value={soilCondition}
                      onChange={(e) => setSoilCondition(e.target.value)}
                      placeholder="e.g. Dry, Damp, Muddy, Loose"
                      className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 text-xs text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">Rock Strength</label>
                    <input
                      type="text"
                      value={rockStrength}
                      onChange={(e) => setRockStrength(e.target.value)}
                      placeholder="e.g. Hard Top-Rock, Weaker Rock"
                      className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 text-xs text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">Moisture & Heat</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={moisture}
                        onChange={(e) => setMoisture(e.target.value)}
                        placeholder="Moisture"
                        className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2 py-1.5 text-xs text-gray-100"
                      />
                      <input
                        type="text"
                        value={heat}
                        onChange={(e) => setHeat(e.target.value)}
                        placeholder="Heat"
                        className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2 py-1.5 text-xs text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">Cutting Condition</label>
                    <input
                      type="text"
                      value={cuttingCondition}
                      onChange={(e) => setCuttingCondition(e.target.value)}
                      placeholder="Smooth, Blade wear high, Normal"
                      className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 text-xs text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-[11px] mb-1">Splitting Condition</label>
                    <input
                      type="text"
                      value={splittingCondition}
                      onChange={(e) => setSplittingCondition(e.target.value)}
                      placeholder="Clean split, Chipping, Uneven breakage"
                      className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 text-xs text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Stone Quantities Observed Post-Split */}
              <div className="p-3.5 rounded-xl bg-[#090b0e] border border-[#d4af37]/40 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-[#f3c64c] tracking-wider">
                    Actual Quantities Observed Post-Split
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    Recovery: {recoveryPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1 font-bold">Total Cut (Raw)</label>
                    <input
                      type="number"
                      min="1"
                      value={totalCutQuantity}
                      onChange={(e) => setTotalCutQuantity(Number(e.target.value) || 0)}
                      className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2 py-1.5 font-mono font-bold text-gray-100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[#f3c64c] mb-1 font-bold">1st Quality (8 Corn)</label>
                    <input
                      type="number"
                      min="0"
                      value={firstQualityQuantity}
                      onChange={(e) => setFirstQualityQuantity(Number(e.target.value) || 0)}
                      className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2 py-1.5 font-mono font-bold text-[#f3c64c]"
                    />
                    <span className="text-[10px] text-gray-500 font-mono">{firstPercent}%</span>
                  </div>

                  <div>
                    <label className="block text-blue-400 mb-1 font-bold">2nd Quality (~3/4)</label>
                    <input
                      type="number"
                      min="0"
                      value={secondQualityQuantity}
                      onChange={(e) => setSecondQualityQuantity(Number(e.target.value) || 0)}
                      className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2 py-1.5 font-mono font-bold text-blue-400"
                    />
                    <span className="text-[10px] text-gray-500 font-mono">{secondPercent}%</span>
                  </div>

                  <div>
                    <label className="block text-orange-400 mb-1 font-bold">Latt / 3rd No.</label>
                    <input
                      type="number"
                      min="0"
                      value={lattQuantity}
                      onChange={(e) => setLattQuantity(Number(e.target.value) || 0)}
                      className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2 py-1.5 font-mono font-bold text-orange-400"
                    />
                    <span className="text-[10px] text-gray-500 font-mono">{lattPercent}%</span>
                  </div>

                  <div>
                    <label className="block text-amber-400 mb-1 font-bold">Mury (Rubble)</label>
                    <input
                      type="number"
                      min="0"
                      value={muryQuantity}
                      onChange={(e) => setMuryQuantity(Number(e.target.value) || 0)}
                      className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2 py-1.5 font-mono font-bold text-amber-400"
                    />
                    <span className="text-[10px] text-gray-500 font-mono">{muryPercent}%</span>
                  </div>
                </div>
              </div>

              {/* Direct Vehicle Loading Allocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">
                    Direct Loading Vehicle (Pit Face)
                  </label>
                  <select
                    value={allocatedVehicle}
                    onChange={(e) => setAllocatedVehicle(e.target.value)}
                    className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100 font-mono"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.vehicleNumber}>
                        {v.vehicleNumber} ({v.driver} - {v.owner})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">
                    Quarry Loading Gap
                  </label>
                  <select
                    value={gapPosition}
                    onChange={(e) => setGapPosition(Number(e.target.value) || 1)}
                    className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-[#f3c64c] font-bold"
                  >
                    <option value={1}>1st Gap (1st Quality Queue)</option>
                    <option value={2}>2nd Gap (2nd Quality Queue)</option>
                    <option value={3}>3rd Gap (Mury Load Queue)</option>
                    <option value={4}>4th Gap (Flexible Quality Queue)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Remarks & Operational Notes</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Fine grained red stone cutting, zero water ingress"
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-btn px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Production Run</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
