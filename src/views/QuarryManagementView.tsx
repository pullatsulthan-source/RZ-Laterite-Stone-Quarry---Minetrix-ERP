import React, { useState } from 'react';
import { useQuarry } from '../context/QuarryContext';
import { formatNumber, formatCurrency, getTodayDateString } from '../utils/formatters';
import {
  Mountain,
  CheckCircle2,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Compass,
  Layers,
  Wrench,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Info,
  DollarSign,
  MapPin,
  Phone,
  Landmark,
} from 'lucide-react';
import { QuarryProfile, QuarrySection, LandOwnerAccount } from '../types/quarry';

export const QuarryManagementView: React.FC = () => {
  const {
    quarries,
    activeQuarryId,
    setActiveQuarryId,
    addQuarry,
    updateQuarry,
    addQuarrySection,
    updateLandOwnerAccount,
    dailyProductionRecords,
  } = useQuarry();

  const selectedQuarry = quarries.find((q) => q.id === activeQuarryId) || quarries[0];
  const isQ001 = selectedQuarry.id === 'quarry-001' || selectedQuarry.quarryCode === 'RZ-Q001';

  // Land Context Editing State
  const [editingLand, setEditingLand] = useState(false);
  const landAccount = selectedQuarry.landOwnerAccount || {
    id: `land-${selectedQuarry.id}`,
    quarryId: selectedQuarry.id,
    landOwnerName: 'Hameed Haji',
    contactPhone: '+91 98470 54321',
    totalLandCent: 20,
    initialCuttingAgreementCent: 14,
    cuttingAreaCent: 14,
    agreementAreaCent: 14,
    referenceRatePerCent: 140000,
    referenceAgreementValue: 1960000,
    remainingCent: 6,
    undeterminedAreaCent: 6,
    paidAmount: 400000,
    balanceAmount: 1560000,
    outstandingAmount: 1560000,
    adjustments: 0,
    notes: 'Initial cutting agreement for 14 cent at ₹1,40,000/cent. Remaining 6 cent price is currently NOT fixed. Stone count is NOT the basis for determining land-owner entitlement.',
    documents: [],
    payments: [],
  };

  const [landForm, setLandForm] = useState<Partial<LandOwnerAccount>>(landAccount);

  // New Section State
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionCode, setNewSectionCode] = useState('B');
  const [newSectionName, setNewSectionName] = useState('Section B');
  const [newSectionDescription, setNewSectionDescription] = useState('Comparatively weaker rock area and includes the currently worked portion that was partly cleared/cut previously.');

  // New Quarry Modal State
  const [showAddQuarryModal, setShowAddQuarryModal] = useState(false);
  const [newQuarryCode, setNewQuarryCode] = useState('RZ-Q003');
  const [newQuarryName, setNewQuarryName] = useState('RZ Quarry 003');
  const [newQuarryLocation, setNewQuarryLocation] = useState('Alanallur South Hills');
  const [newQuarryNotes, setNewQuarryNotes] = useState('New laterite extraction site');

  // Today extraction stats
  const today = getTodayDateString();
  const todayCut = dailyProductionRecords
    .filter((p) => p.date === today && p.quarryId === selectedQuarry.id)
    .reduce((sum, p) => sum + p.totalCutQuantity, 0);

  const target = 2500;
  const progressPercent = Math.min(100, Math.round((todayCut / target) * 100));

  const handleSaveLandContext = (e: React.FormEvent) => {
    e.preventDefault();
    const totalLand = Number(landForm.totalLandCent) || 20;
    const cuttingArea = Number(landForm.cuttingAreaCent || landForm.initialCuttingAgreementCent) || 14;
    const agreementArea = Number(landForm.agreementAreaCent || cuttingArea) || 14;
    const rate = Number(landForm.referenceRatePerCent) || 140000;
    const agreementVal = agreementArea * rate;
    const undeterminedArea = Math.max(0, totalLand - cuttingArea);
    const paid = Number(landForm.paidAmount) || 0;
    const balance = agreementVal - paid;

    updateLandOwnerAccount(selectedQuarry.id, {
      ...landForm,
      totalLandCent: totalLand,
      initialCuttingAgreementCent: cuttingArea,
      cuttingAreaCent: cuttingArea,
      agreementAreaCent: agreementArea,
      referenceRatePerCent: rate,
      referenceAgreementValue: agreementVal,
      remainingCent: undeterminedArea,
      undeterminedAreaCent: undeterminedArea,
      paidAmount: paid,
      balanceAmount: balance,
      outstandingAmount: balance,
      notes: landForm.notes || 'Remaining 6 cent price is currently NOT fixed. Stone count is NOT the basis for determining land-owner entitlement.',
    });
    setEditingLand(false);
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newSectionCode.trim().toUpperCase();
    if (code === 'MEDIUM' || newSectionName.toLowerCase().includes('medium')) {
      alert("STRICT SYSTEM MANDATE: 'Medium' must NOT be used as a quarry section or category name in the master data. Please use 'Section A', 'Section B', etc.");
      return;
    }

    addQuarrySection(selectedQuarry.id, {
      sectionCode: code,
      name: newSectionName,
      description: newSectionDescription,
      active: true,
    });
    setShowAddSectionModal(false);
  };

  const handleCreateQuarry = (e: React.FormEvent) => {
    e.preventDefault();
    addQuarry({
      quarryCode: newQuarryCode,
      quarryName: newQuarryName,
      businessName: 'RZ Mining Ventures LLP',
      address: `${newQuarryLocation}, Malappuram, Kerala`,
      location: newQuarryLocation,
      phone: '+91 90484 23530',
      email: 'operations@racezoneventures.com',
      owner: 'RZ Ventures',
      active: true,
      notes: newQuarryNotes,
      sections: [
        {
          id: `sec-${Date.now()}-a`,
          sectionCode: 'A',
          name: 'Section A',
          description: 'Initial site preparation and top rock cutting face',
          active: true,
        },
      ],
    });
    setShowAddQuarryModal(false);
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
                <Mountain className="w-5 h-5 stroke-[2.5]" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 tracking-wide">
                Quarry Master & Land Context
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40">
                {selectedQuarry.quarryCode}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2 max-w-3xl leading-relaxed">
              <span className="text-[#f3c64c] font-semibold">Master Architecture:</span> Configure RZ Quarry 001 (Section A & Section B), newly starting RZ Quarry 002, geological rock strength rules, and land-owner agreement boundaries without physical stock accumulation.
            </p>
          </div>

          {/* Quarry Selector & New Quarry */}
          <div className="flex items-center gap-2 bg-[#090b0e] border border-[#232736] p-1.5 rounded-2xl">
            {quarries.map((q) => (
              <button
                key={q.id}
                onClick={() => setActiveQuarryId(q.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  q.id === selectedQuarry.id
                    ? 'bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40 shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {q.quarryName}
              </button>
            ))}
            <button
              onClick={() => setShowAddQuarryModal(true)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-[#d4af37] transition-colors"
              title="Add New Quarry"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div className="mt-5 pt-4 border-t border-[#262b3b] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-300 uppercase tracking-wider">
              {selectedQuarry.quarryName} Today Cut: {formatNumber(todayCut)} / {formatNumber(target)} pcs
            </span>
            <span className="font-mono font-bold text-[#f3c64c]">{progressPercent}% of Daily Target</span>
          </div>
          <div className="w-full bg-[#1c202e] h-2.5 rounded-full overflow-hidden">
            <div
              className="gold-btn h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: QUARRY 001 LAND CONTEXT */}
      {isQ001 && (
        <div className="bg-[#12141a] rounded-2xl border border-[#232736] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232736] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#d4af37]" />
                <h3 className="font-cinzel font-bold text-sm text-[#d4af37]">
                  RZ Quarry 001 — Land & Agreement Context
                </h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Total Land 20 cent, initial agreement 14 cent at ₹1,40,000/cent. Remaining 6 cent is undetermined.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Stone Count ≠ Land Entitlement
              </span>
              <button
                onClick={() => {
                  setLandForm(landAccount);
                  setEditingLand(!editingLand);
                }}
                className="px-3 py-1 rounded-xl text-xs font-bold bg-[#1a1e2b] hover:bg-[#252b3d] text-gray-200 border border-[#2d354b] flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{editingLand ? 'Close Editor' : 'Edit Land Context'}</span>
              </button>
            </div>
          </div>

          {editingLand ? (
            <form onSubmit={handleSaveLandContext} className="p-4 bg-[#090b0e] rounded-xl border border-[#22283a] space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Total Land (Cent)</label>
                  <input
                    type="number"
                    value={landForm.totalLandCent}
                    onChange={(e) => setLandForm({ ...landForm, totalLandCent: Number(e.target.value) || 0 })}
                    className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 font-mono text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Cutting / Agreement Area (Cent)</label>
                  <input
                    type="number"
                    value={landForm.cuttingAreaCent || landForm.initialCuttingAgreementCent}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setLandForm({
                        ...landForm,
                        cuttingAreaCent: val,
                        initialCuttingAgreementCent: val,
                        agreementAreaCent: val,
                        referenceAgreementValue: val * (landForm.referenceRatePerCent || 140000),
                        balanceAmount: val * (landForm.referenceRatePerCent || 140000) - (landForm.paidAmount || 0),
                      });
                    }}
                    className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 font-mono text-emerald-400 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Rate (₹ / Cent)</label>
                  <input
                    type="number"
                    value={landForm.referenceRatePerCent}
                    onChange={(e) => {
                      const rate = Number(e.target.value) || 0;
                      const area = landForm.cuttingAreaCent || 14;
                      setLandForm({
                        ...landForm,
                        referenceRatePerCent: rate,
                        referenceAgreementValue: area * rate,
                        balanceAmount: area * rate - (landForm.paidAmount || 0),
                      });
                    }}
                    className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 font-mono text-gray-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Agreement Value (₹)</label>
                  <input
                    type="number"
                    value={(landForm.cuttingAreaCent || 14) * (landForm.referenceRatePerCent || 140000)}
                    disabled
                    className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 font-mono text-[#f3c64c] font-bold opacity-80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Undetermined Area (Cent)</label>
                  <input
                    type="number"
                    value={Math.max(0, (landForm.totalLandCent || 20) - (landForm.cuttingAreaCent || 14))}
                    disabled
                    className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 font-mono text-amber-400 font-bold opacity-80"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={landForm.paidAmount}
                    onChange={(e) => {
                      const paid = Number(e.target.value) || 0;
                      const agreementVal = (landForm.cuttingAreaCent || 14) * (landForm.referenceRatePerCent || 140000);
                      setLandForm({
                        ...landForm,
                        paidAmount: paid,
                        balanceAmount: agreementVal - paid,
                      });
                    }}
                    className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 font-mono text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Current Balance (₹)</label>
                  <input
                    type="number"
                    value={(landForm.cuttingAreaCent || 14) * (landForm.referenceRatePerCent || 140000) - (landForm.paidAmount || 0)}
                    disabled
                    className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 font-mono text-rose-400 font-bold opacity-80"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-semibold mb-1">Land Owner Name</label>
                  <input
                    type="text"
                    value={landForm.landOwnerName}
                    onChange={(e) => setLandForm({ ...landForm, landOwnerName: e.target.value })}
                    className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1">Operational & Financial Notes</label>
                <input
                  type="text"
                  value={landForm.notes}
                  onChange={(e) => setLandForm({ ...landForm, notes: e.target.value })}
                  className="w-full bg-[#161924] border border-[#282f42] rounded-lg px-2.5 py-1.5 text-gray-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLand(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-btn px-5 py-2 rounded-xl font-bold"
                >
                  Save Land Context
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#1f2434]">
                <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase">
                  Total Land
                </span>
                <span className="text-base font-bold text-gray-100 block mt-0.5">
                  {landAccount.totalLandCent} Cent
                </span>
                <span className="text-[10px] text-gray-500 font-sans">Full surveyed plot</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0c10] border border-emerald-900/30">
                <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase">
                  Cutting Area
                </span>
                <span className="text-base font-bold text-emerald-400 block mt-0.5">
                  {landAccount.cuttingAreaCent || landAccount.initialCuttingAgreementCent} Cent
                </span>
                <span className="text-[10px] text-gray-500 font-sans">Initial agreed cut</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#1f2434]">
                <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase">
                  Agreement Area
                </span>
                <span className="text-base font-bold text-gray-200 block mt-0.5">
                  {landAccount.agreementAreaCent || 14} Cent
                </span>
                <span className="text-[10px] text-gray-500 font-sans">Formal deed terms</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#1f2434]">
                <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase">
                  Rate / Cent
                </span>
                <span className="text-sm font-bold text-[#f3c64c] block mt-0.5">
                  {formatCurrency(landAccount.referenceRatePerCent)}
                </span>
                <span className="text-[10px] text-gray-500 font-sans">Reference unit rate</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#d4af37]/30">
                <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase">
                  Agreement Value
                </span>
                <span className="text-sm font-bold text-[#f3c64c] block mt-0.5">
                  {formatCurrency(landAccount.referenceAgreementValue)}
                </span>
                <span className="text-[10px] text-gray-500 font-sans">14 Cent × ₹1.4L</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0c10] border border-amber-900/40">
                <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase">
                  Undetermined Area
                </span>
                <span className="text-base font-bold text-amber-400 block mt-0.5">
                  {landAccount.undeterminedAreaCent || landAccount.remainingCent} Cent
                </span>
                <span className="text-[10px] text-amber-300 font-sans">Price NOT fixed</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0c10] border border-emerald-900/30">
                <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase">
                  Total Paid
                </span>
                <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                  {formatCurrency(landAccount.paidAmount)}
                </span>
                <span className="text-[10px] text-gray-500 font-sans">Token bank advance</span>
              </div>

              <div className="p-3 rounded-xl bg-[#0b0c10] border border-rose-900/30">
                <span className="text-gray-500 block text-[10px] font-sans font-bold uppercase">
                  Balance Due
                </span>
                <span className="text-sm font-bold text-rose-400 block mt-0.5">
                  {formatCurrency(landAccount.balanceAmount)}
                </span>
                <span className="text-[10px] text-gray-500 font-sans">Agreement balance</span>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#090b0e] border border-[#1d2232] text-xs text-gray-300 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <b className="text-[#f3c64c]">Quarry 001 Operational Land Note:</b> The system does NOT automatically calculate or mark the entire 20 cent as financially settled. The price for the remaining 6 cent is currently not fixed. Stone count is NOT the basis for determining the land-owner entitlement.
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: QUARRY SECTIONS (Section A & Section B) */}
      <div className="bg-[#12141a] rounded-2xl border border-[#232736] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232736] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d4af37]" />
              <h3 className="font-cinzel font-bold text-sm text-[#d4af37]">
                {selectedQuarry.quarryName} — Section Master
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Section A (stronger/top-rock area) and Section B (weaker rock area / worked portion)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              Rule: Never Label Section B as 'Medium'
            </span>
            <button
              onClick={() => setShowAddSectionModal(true)}
              className="gold-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedQuarry.sections.map((sec) => {
            const isSecA = sec.sectionCode === 'A';
            return (
              <div
                key={sec.id}
                className={`p-4 rounded-xl bg-[#090b0e] border ${
                  isSecA ? 'border-emerald-500/30' : 'border-amber-500/30'
                } space-y-2`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black font-cinzel ${
                        isSecA
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      SECTION {sec.sectionCode}
                    </span>
                    <h4 className="font-bold text-sm text-gray-100">{sec.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    Active Operational
                  </span>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  {sec.description}
                </p>

                <div className="pt-2 border-t border-[#1d2232] flex items-center justify-between text-xs text-gray-400 font-mono">
                  <span>
                    Applicable Sale Rate:{' '}
                    <b className="text-gray-200">
                      {isSecA ? '₹43 (1st) / ₹33 (2nd)' : '₹41 (1st) / ₹31 (2nd)'}
                    </b>
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {isSecA ? 'Standard Top-Rock' : 'Weaker-Rock Rate Condition'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: MACHINERY & OPERATIONAL BENCHES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
          <div className="flex items-center gap-2 text-gray-200 font-bold text-sm">
            <Wrench className="w-4 h-4 text-[#d4af37]" />
            <span>Heavy Machinery Deployment ({selectedQuarry.quarryName})</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#0d0f14] flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-200 block">Double-Blade Track Cutter #1</span>
                <span className="text-[10px] text-gray-400">Operator: Mujeeb Rahman • Section A</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                Operating
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0d0f14] flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-200 block">Single-Blade Bench Cutter #2</span>
                <span className="text-[10px] text-gray-400">Operator: Razak • Section B (Weaker Rock)</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                Operating
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0d0f14] flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-200 block">JCB 215 Heavy Excavator</span>
                <span className="text-[10px] text-gray-400">Bench overburden & rock clearing</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] space-y-3">
          <div className="flex items-center gap-2 text-gray-200 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Lease & Mining Statutory Clearances</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-[#0d0f14] flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-200 block">Mining & Geology Permit</span>
                <span className="text-[10px] text-gray-400">{selectedQuarry.taxDetails || 'KL-MPM-Q001'}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                Valid 2029
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0d0f14] flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-200 block">Pollution Control Board Consent</span>
                <span className="text-[10px] text-gray-400">Consent to Operate (CTO) Validated</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                Compliant
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0d0f14] flex justify-between items-center">
              <div>
                <span className="font-bold text-gray-200 block">GST Mining Royalty Registration</span>
                <span className="text-[10px] text-gray-400">{selectedQuarry.gstNumber || '32AAAFR1234A1Z5'}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                Registered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ADD SECTION MODAL */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101218] border border-[#262c3e] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-[#141722] border-b border-[#262c3e] flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-sm text-gray-100">
                Add Section to {selectedQuarry.quarryName}
              </h3>
              <button
                onClick={() => setShowAddSectionModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-[11px] leading-relaxed">
                <b className="text-white">Strict System Rule:</b> DO NOT create "Medium" as a quarry section or master name. Use Section A, Section B, Section C, etc.
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Section Identifier Code *
                </label>
                <input
                  type="text"
                  value={newSectionCode}
                  onChange={(e) => setNewSectionCode(e.target.value)}
                  placeholder="e.g. B, C"
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-sm font-mono font-bold text-[#f3c64c]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g. Section B"
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Geological Description & Operating Conditions
                </label>
                <textarea
                  rows={3}
                  value={newSectionDescription}
                  onChange={(e) => setNewSectionDescription(e.target.value)}
                  placeholder="e.g. Comparatively weaker rock area and includes the currently worked portion that was partly cleared previously."
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-btn px-5 py-2 rounded-xl font-bold"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD QUARRY MODAL */}
      {showAddQuarryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101218] border border-[#262c3e] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 bg-[#141722] border-b border-[#262c3e] flex items-center justify-between">
              <h3 className="font-cinzel font-bold text-sm text-gray-100">
                Configure New Quarry in Master
              </h3>
              <button
                onClick={() => setShowAddQuarryModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuarry} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Quarry Code *</label>
                <input
                  type="text"
                  value={newQuarryCode}
                  onChange={(e) => setNewQuarryCode(e.target.value)}
                  placeholder="e.g. RZ-Q002"
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 font-mono font-bold text-[#f3c64c]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Quarry Name *</label>
                <input
                  type="text"
                  value={newQuarryName}
                  onChange={(e) => setNewQuarryName(e.target.value)}
                  placeholder="e.g. RZ Quarry 002"
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 font-bold text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Location *</label>
                <input
                  type="text"
                  value={newQuarryLocation}
                  onChange={(e) => setNewQuarryLocation(e.target.value)}
                  placeholder="e.g. Vettathur Hills Extension"
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Operational Notes</label>
                <input
                  type="text"
                  value={newQuarryNotes}
                  onChange={(e) => setNewQuarryNotes(e.target.value)}
                  placeholder="Newly starting quarry"
                  className="w-full bg-[#161924] border border-[#282f42] rounded-xl px-3 py-2 text-gray-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuarryModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-btn px-5 py-2 rounded-xl font-bold"
                >
                  Create Quarry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
