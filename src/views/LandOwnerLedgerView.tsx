import React, { useState, useMemo, useRef } from 'react';
import { useQuarry } from '../context/QuarryContext';
import { LandOwnerAccount, LandPaymentEntry, PaymentMode } from '../types/quarry';
import { formatCurrency, formatNumber, formatDate, getTodayDateString } from '../utils/formatters';
import html2canvas from 'html2canvas';
import {
  MapPin,
  Landmark,
  Receipt,
  Plus,
  Printer,
  Share2,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingDown,
  Layers,
  Calendar,
  X,
  CreditCard,
  Building,
} from 'lucide-react';

export const LandOwnerLedgerView: React.FC = () => {
  const { activeQuarry, updateLandOwnerAccount, addLandPayment, currentUser, branding } = useQuarry();

  const landAccount: LandOwnerAccount = useMemo(() => {
    return (
      activeQuarry.landOwnerAccount || {
        id: `land-${activeQuarry.id}`,
        quarryId: activeQuarry.id,
        landOwnerName: 'Hameed Haji',
        contactPhone: '+91 98471 23456',
        totalLandCent: 20,
        initialCuttingAgreementCent: 14,
        cuttingAreaCent: 14,
        agreementAreaCent: 14,
        referenceRatePerCent: 140000,
        referenceAgreementValue: 1960000,
        remainingCent: 6,
        undeterminedAreaCent: 6,
        paidAmount: 650000,
        balanceAmount: 1310000,
        outstandingAmount: 1310000,
        adjustments: 0,
        notes:
          '20 Cent total land. 14 cent taken for cutting at ₹1,40,000/cent. Remaining 6 cent rate not finalized; quarrying may continue through full 20 cent until stone exhausted. B-area stone rate: 1st=₹8/pc, 2nd=₹8/pc, 3rd=₹0.',
        documents: ['Land_Agreement_Signed.pdf', 'Pattayam_Survey_71_2.pdf'],
        payments: [
          {
            id: 'lp-01',
            date: '2026-08-10',
            amount: 300000,
            paymentMode: 'Bank Transfer',
            reference: 'IMPS-9812401',
            receiptNumber: 'LPR-1001',
            remarks: 'Initial agreement advance token payment',
            enteredBy: 'Nafid',
          },
          {
            id: 'lp-02',
            date: '2026-09-01',
            amount: 200000,
            paymentMode: 'Bank Transfer',
            reference: 'NEFT-883921',
            receiptNumber: 'LPR-1002',
            remarks: 'Second installment after pit face opening',
            enteredBy: 'Aflah',
          },
          {
            id: 'lp-03',
            date: '2026-09-25',
            amount: 150000,
            paymentMode: 'Cash',
            reference: 'VOUCHER-088',
            receiptNumber: 'LPR-1003',
            remarks: 'Mid-term cash settlement on site',
            enteredBy: 'Nafid',
          },
        ],
        surveyNumber: 'Survey 71/2B & 71/3',
        sectionRate1st: 8,
        sectionRate2nd: 8,
        sectionRate3rd: 0,
        stoneCuttingCount1st: 4200,
        stoneCuttingCount2nd: 2800,
        stoneCuttingRoyaltyPayable: 56000, // (4200+2800)*8
      }
    );
  }, [activeQuarry]);

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [isDownloadingJpg, setIsDownloadingJpg] = useState(false);

  // New Payment Form
  const [payDate, setPayDate] = useState(getTodayDateString());
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMode, setPayMode] = useState<PaymentMode>('Bank Transfer');
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');

  // Editable Land Settings
  const [isEditingLand, setIsEditingLand] = useState(false);
  const [editOwnerName, setEditOwnerName] = useState(landAccount.landOwnerName);
  const [editPhone, setEditPhone] = useState(landAccount.contactPhone || '');
  const [editTotalCent, setEditTotalCent] = useState(landAccount.totalLandCent || 20);
  const [editTakenCent, setEditTakenCent] = useState(landAccount.initialCuttingAgreementCent || 14);
  const [editRatePerCent, setEditRatePerCent] = useState(landAccount.referenceRatePerCent || 140000);
  const [editSurveyNo, setEditSurveyNo] = useState(landAccount.surveyNumber || 'Survey 71/2B');
  const [editNotes, setEditNotes] = useState(landAccount.notes || '');

  // Section B stone count inputs
  const [stoneCount1st, setStoneCount1st] = useState(landAccount.stoneCuttingCount1st || 0);
  const [stoneCount2nd, setStoneCount2nd] = useState(landAccount.stoneCuttingCount2nd || 0);

  // Printable Statement Ref for JPG generation
  const statementCardRef = useRef<HTMLDivElement>(null);

  // Calculations
  const agreedCuttingValue = editTakenCent * editRatePerCent;
  const remainingCent = Math.max(0, editTotalCent - editTakenCent);
  const totalPaid = (landAccount.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const sectionBRoyalty = (stoneCount1st + stoneCount2nd) * 8;
  const netPayable = agreedCuttingValue + sectionBRoyalty;
  const currentBalance = Math.max(0, netPayable - totalPaid);

  const handleSaveLandMaster = (e: React.FormEvent) => {
    e.preventDefault();
    updateLandOwnerAccount(activeQuarry.id, {
      landOwnerName: editOwnerName,
      contactPhone: editPhone,
      totalLandCent: Number(editTotalCent) || 20,
      initialCuttingAgreementCent: Number(editTakenCent) || 14,
      cuttingAreaCent: Number(editTakenCent) || 14,
      referenceRatePerCent: Number(editRatePerCent) || 140000,
      referenceAgreementValue: (Number(editTakenCent) || 14) * (Number(editRatePerCent) || 140000),
      remainingCent: Math.max(0, (Number(editTotalCent) || 20) - (Number(editTakenCent) || 14)),
      surveyNumber: editSurveyNo,
      notes: editNotes,
      stoneCuttingCount1st: Number(stoneCount1st) || 0,
      stoneCuttingCount2nd: Number(stoneCount2nd) || 0,
      stoneCuttingRoyaltyPayable: (Number(stoneCount1st) + Number(stoneCount2nd)) * 8,
    });
    setIsEditingLand(false);
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return;

    addLandPayment(activeQuarry.id, {
      date: payDate,
      amount: Number(payAmount),
      paymentMode: payMode,
      reference: payRef,
      receiptNumber: `LPR-${Date.now().toString().slice(-4)}`,
      remarks: payRemarks || 'Land owner agreement settlement',
      enteredBy: currentUser,
    });

    setPaymentModalOpen(false);
    setPayAmount('');
    setPayRef('');
    setPayRemarks('');
  };

  const handleDownloadJpg = async () => {
    if (!statementCardRef.current) return;
    setIsDownloadingJpg(true);
    try {
      const canvas = await html2canvas(statementCardRef.current, {
        scale: 2,
        backgroundColor: '#090a0d',
        useCORS: true,
      });
      const image = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = image;
      link.download = `LandOwner_Statement_${landAccount.landOwnerName.replace(/\s+/g, '_')}_${payDate}.jpg`;
      link.click();
    } catch (err) {
      console.error('Failed to export JPG statement:', err);
    } finally {
      setIsDownloadingJpg(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#17140f] via-[#121319] to-[#14120f] border border-[#d4af37]/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-[#d4af37]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#8f741c] text-black flex items-center justify-center shadow-lg font-black">
              <Landmark className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/40 font-bold">
                  QUARRY MANAGEMENT
                </span>
                <span className="text-xs text-gray-400">Cent-based Land & Section Royalty Ledger</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 mt-0.5 tracking-wide">
                LAND OWNER LEDGER & SETTLEMENTS
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditingLand((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1a1e2b] hover:bg-[#252b3d] text-gray-200 border border-[#2d354b] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{isEditingLand ? 'Cancel Editing' : 'Edit Land Agreement'}</span>
            </button>
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="gold-btn px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Land Payment</span>
            </button>
            <button
              onClick={() => setStatementModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#141720] hover:bg-[#1c2230] text-[#d4af37] border border-[#d4af37]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Shareable Statement (JPG/PDF)</span>
            </button>
          </div>
        </div>

        {/* Top Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#262b3b]">
          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Total Landed Cent
            </span>
            <span className="text-lg font-black font-mono text-gray-100 mt-0.5 block">
              {landAccount.totalLandCent} Cent
            </span>
            <span className="text-[10px] text-emerald-400">14 Taken · 6 Remaining</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Agreed Value (14 Cent)
            </span>
            <span className="text-lg font-black font-mono text-[#f3c64c] mt-0.5 block">
              {formatCurrency(agreedCuttingValue)}
            </span>
            <span className="text-[10px] text-gray-400">@ ₹1,40,000 / Cent</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Total Paid to Date
            </span>
            <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">
              {formatCurrency(totalPaid)}
            </span>
            <span className="text-[10px] text-gray-400">Bank & Cash Advances</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#090b0e]/70 border border-[#1e2332]">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Outstanding Balance
            </span>
            <span className="text-lg font-black font-mono text-rose-400 mt-0.5 block">
              {formatCurrency(currentBalance)}
            </span>
            <span className="text-[10px] text-gray-400">Pending Settlement</span>
          </div>
        </div>
      </div>

      {/* Edit Agreement Form (Inline) */}
      {isEditingLand && (
        <form
          onSubmit={handleSaveLandMaster}
          className="p-5 rounded-2xl bg-[#12141a] border border-[#d4af37]/40 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-[#232736]">
            <h3 className="font-cinzel font-bold text-sm text-[#f3c64c]">
              Update Land Owner Master Agreement & Section B Royalty
            </h3>
            <span className="text-xs text-gray-400">Quarry: {activeQuarry.quarryName}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Land Owner Name</label>
              <input
                type="text"
                value={editOwnerName}
                onChange={(e) => setEditOwnerName(e.target.value)}
                className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Contact Phone</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Survey / Land Reference</label>
              <input
                type="text"
                value={editSurveyNo}
                onChange={(e) => setEditSurveyNo(e.target.value)}
                className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1">Total Land Area (Cent)</label>
              <input
                type="number"
                step="0.1"
                value={editTotalCent}
                onChange={(e) => setEditTotalCent(Number(e.target.value) || 0)}
                className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Taken Area for Cutting (Cent)</label>
              <input
                type="number"
                step="0.1"
                value={editTakenCent}
                onChange={(e) => setEditTakenCent(Number(e.target.value) || 0)}
                className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Agreed Rate per Cent (₹)</label>
              <input
                type="number"
                value={editRatePerCent}
                onChange={(e) => setEditRatePerCent(Number(e.target.value) || 0)}
                className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white font-mono"
                required
              />
            </div>
          </div>

          {/* Section B Stone Rate Tracking */}
          <div className="p-3.5 rounded-xl bg-[#090b10] border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-300">
                RZ Quarry 001/B Stone Extraction Royalty (₹8 / piece for 1st & 2nd Quality, ₹0 for 3rd)
              </span>
              <span className="text-[10px] text-gray-400">Do NOT use 'Medium' label</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">1st Quality Cut from Section B (pcs)</label>
                <input
                  type="number"
                  value={stoneCount1st}
                  onChange={(e) => setStoneCount1st(Number(e.target.value) || 0)}
                  className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">2nd Quality Cut from Section B (pcs)</label>
                <input
                  type="number"
                  value={stoneCount2nd}
                  onChange={(e) => setStoneCount2nd(Number(e.target.value) || 0)}
                  className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Operational Agreement Notes</label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-xs text-gray-200"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditingLand(false)}
              className="px-4 py-2 rounded-xl text-xs bg-[#1a1f2e] text-gray-300"
            >
              Cancel
            </button>
            <button type="submit" className="gold-btn px-4 py-2 rounded-xl text-xs font-bold">
              Save Agreement Settings
            </button>
          </div>
        </form>
      )}

      {/* Main Ledger Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Payment History Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#12141a] rounded-2xl border border-[#232736] overflow-hidden shadow-sm">
            <div className="p-4 bg-[#161924] border-b border-[#232736] flex items-center justify-between">
              <div>
                <h3 className="font-cinzel font-bold text-sm text-gray-200">
                  Land Owner Payment & Advance Ledger
                </h3>
                <span className="text-[10px] text-gray-400">
                  Beneficiary: {landAccount.landOwnerName} • Survey {landAccount.surveyNumber || '71/2'}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-[#d4af37]/15 text-[#f3c64c] border border-[#d4af37]/30">
                {landAccount.payments?.length || 0} Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#141722] border-b border-[#232736] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Receipt #</th>
                    <th className="p-3.5">Payment Mode</th>
                    <th className="p-3.5">Reference / Transaction</th>
                    <th className="p-3.5">Remarks</th>
                    <th className="p-3.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2332]">
                  {(landAccount.payments || []).map((pay) => (
                    <tr key={pay.id} className="hover:bg-[#161a26] transition-colors">
                      <td className="p-3.5 font-mono text-gray-200">{formatDate(pay.date)}</td>
                      <td className="p-3.5 font-mono font-bold text-[#d4af37]">
                        {pay.receiptNumber || 'LPR-REF'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1b2130] text-gray-300 border border-[#29324a]">
                          {pay.paymentMode}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-gray-400">{pay.reference || '—'}</td>
                      <td className="p-3.5 text-gray-300">{pay.remarks}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatCurrency(pay.amount)}
                      </td>
                    </tr>
                  ))}
                  {(landAccount.payments || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No payments recorded yet for this land owner agreement.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-[#151926] border-t border-[#232736] font-bold">
                  <tr>
                    <td colSpan={5} className="p-3.5 text-right text-gray-300 uppercase text-[10px]">
                      Total Paid to Land Owner:
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-400 text-sm">
                      {formatCurrency(totalPaid)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Agreement Summary & Contingency Rule Card */}
        <div className="space-y-4">
          <div className="bg-[#12141a] rounded-2xl border border-[#232736] p-4 sm:p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-[#232736]">
              <FileText className="w-4 h-4 text-[#d4af37]" />
              <h3 className="font-cinzel font-bold text-sm text-gray-100">
                Land Agreement Architecture
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-[#090b10] border border-[#1e2332]">
                <span className="text-gray-400">Total Quarry Land Area:</span>
                <span className="font-mono font-bold text-gray-200">20.00 Cent</span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-[#090b10] border border-[#1e2332]">
                <span className="text-gray-400">Initially Taken for Cutting:</span>
                <span className="font-mono font-bold text-emerald-400">14.00 Cent</span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-[#090b10] border border-[#1e2332]">
                <span className="text-gray-400">Agreed Cent Valuation:</span>
                <span className="font-mono font-bold text-gray-200">₹1,40,000 / Cent</span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-[#090b10] border border-[#1e2332]">
                <span className="text-gray-400">Agreed Value (14 Cent):</span>
                <span className="font-mono font-bold text-[#f3c64c]">
                  {formatCurrency(agreedCuttingValue)}
                </span>
              </div>

              <div className="flex justify-between p-2 rounded-xl bg-[#090b10] border border-[#1e2332]">
                <span className="text-gray-400">Remaining Contingent Cent:</span>
                <span className="font-mono font-bold text-amber-300">6.00 Cent</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-600/30 text-[11px] space-y-1.5 text-gray-300">
                <span className="font-bold text-amber-400 block">
                  Ground Physics & Contingency Rule:
                </span>
                <p className="leading-relaxed">
                  Due to deep corner soil and natural laterite stone conditions, the full 20 Cent area can be worked until stone exhaustion. The remaining 6 Cent rate is NOT fixed in advance.
                </p>
                <span className="text-[10px] text-gray-400 block italic">
                  * System strictly enforces NOT calculating an unconfirmed price for the remaining 6 Cent.
                </span>
              </div>

              {/* Section B Stone Royalty Calculation */}
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] space-y-1.5">
                <span className="font-bold text-cyan-300 block">
                  RZ Quarry 001/B Stone Output Royalty:
                </span>
                <div className="flex justify-between text-gray-300">
                  <span>1st Quality ({stoneCount1st} pcs @ ₹8):</span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(stoneCount1st * 8)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>2nd Quality ({stoneCount2nd} pcs @ ₹8):</span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(stoneCount2nd * 8)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>3rd / Mury / Latt:</span>
                  <span className="font-mono font-bold text-gray-400">₹0 (No Price)</span>
                </div>
                <div className="pt-1.5 border-t border-cyan-800/40 flex justify-between font-bold text-cyan-200">
                  <span>Total Section B Royalty:</span>
                  <span className="font-mono">{formatCurrency(sectionBRoyalty)}</span>
                </div>
              </div>

              {/* Final Settlement Summary */}
              <div className="p-3.5 rounded-xl bg-[#0e1118] border border-[#232736] space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>Total Land + Royalty Payable:</span>
                  <span className="font-mono text-gray-100">{formatCurrency(netPayable)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Total Paid to Date:</span>
                  <span className="font-mono text-emerald-400">-{formatCurrency(totalPaid)}</span>
                </div>
                <div className="pt-2 border-t border-[#232736] flex justify-between font-black text-sm">
                  <span className="text-gray-100">Pending Balance:</span>
                  <span className="font-mono text-rose-400">{formatCurrency(currentBalance)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12141c] border border-[#2b334a] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#232736]">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-cinzel font-bold text-base text-gray-100">
                  Record Land Owner Payment
                </h3>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white bg-[#1a1f2e]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || '')}
                  className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white font-mono font-bold text-base focus:border-[#d4af37]"
                  placeholder="e.g. 100000"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                  className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white"
                >
                  <option value="Bank Transfer">Bank Transfer (IMPS / NEFT / RTGS)</option>
                  <option value="Cash">Cash Advance</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Bank / Transaction Reference</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="e.g. IMPS-12345678"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Remarks & Settlement Notes</label>
                <input
                  type="text"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  className="w-full bg-[#161924] border border-[#2b334a] rounded-xl px-3 py-2 text-white"
                  placeholder="e.g. Agreement stage 2 milestone payment"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#232736]">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-[#1a1f2e] text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="gold-btn px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shareable Statement Modal (WhatsApp JPG / Printable PDF) */}
      {statementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#10121a] border border-[#2d354b] rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#232736]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-cinzel font-bold text-base text-gray-100">
                  Land Owner Statement Preview (WhatsApp JPG & Print)
                </h3>
              </div>
              <button
                onClick={() => setStatementModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white bg-[#1a1f2e] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Container Designed for High-Resolution JPG capture */}
            <div
              ref={statementCardRef}
              className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#0c0e14] via-[#090b10] to-[#0c0e14] border border-[#d4af37]/40 shadow-xl space-y-5 text-gray-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#262b3b] pb-4">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[#d4af37] uppercase font-bold">
                    OFFICIAL QUARRY LAND STATEMENT
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-cinzel text-white mt-0.5">
                    {activeQuarry.quarryName}
                  </h2>
                  <p className="text-xs text-gray-400">{activeQuarry.location} • {activeQuarry.address}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-[#d4af37]/20 text-[#f3c64c] text-xs font-mono font-bold border border-[#d4af37]/40 block">
                    SETTLEMENT STATEMENT
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Date: {formatDate(getTodayDateString())}
                  </span>
                </div>
              </div>

              {/* Land Owner & Agreement Meta */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#121520] border border-[#22283a] text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Land Owner:</span>
                  <span className="font-bold text-white text-sm">{landAccount.landOwnerName}</span>
                  <span className="text-gray-400 block mt-0.5">{landAccount.contactPhone || '—'}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[10px] uppercase">Survey Reference:</span>
                  <span className="font-mono font-bold text-gray-200">{landAccount.surveyNumber || 'Survey 71/2B'}</span>
                  <span className="text-[10px] text-amber-300 block mt-0.5">20 Cent Total • 14 Cent Active</span>
                </div>
              </div>

              {/* Cent Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-[#141722] border border-[#232738]">
                  <span className="text-[10px] text-gray-400 uppercase block">Total Land</span>
                  <span className="font-mono font-bold text-white">20.00 Cent</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141722] border border-[#232738]">
                  <span className="text-[10px] text-gray-400 uppercase block">Taken for Cutting</span>
                  <span className="font-mono font-bold text-emerald-400">14.00 Cent</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141722] border border-[#232738]">
                  <span className="text-[10px] text-gray-400 uppercase block">Remaining Area</span>
                  <span className="font-mono font-bold text-amber-400">6.00 Cent (Rate Pending)</span>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="overflow-x-auto rounded-xl border border-[#232736]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141722] text-[10px] text-gray-400 uppercase">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Receipt #</th>
                      <th className="p-2.5">Payment Mode</th>
                      <th className="p-2.5">Remarks</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2332]">
                    {(landAccount.payments || []).map((p) => (
                      <tr key={p.id}>
                        <td className="p-2.5 font-mono">{formatDate(p.date)}</td>
                        <td className="p-2.5 font-mono font-bold text-[#d4af37]">{p.receiptNumber}</td>
                        <td className="p-2.5">{p.paymentMode}</td>
                        <td className="p-2.5 text-gray-300">{p.remarks}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(p.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Balance Summary */}
              <div className="p-4 rounded-xl bg-[#141824] border border-[#d4af37]/30 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="space-y-1 text-xs">
                  <div className="flex gap-4">
                    <span className="text-gray-400">Agreed Value (14 Cent):</span>
                    <span className="font-mono font-bold text-gray-200">{formatCurrency(agreedCuttingValue)}</span>
                  </div>
                  {sectionBRoyalty > 0 && (
                    <div className="flex gap-4">
                      <span className="text-gray-400">Section B Stone Royalty (₹8/pc):</span>
                      <span className="font-mono font-bold text-cyan-300">+{formatCurrency(sectionBRoyalty)}</span>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <span className="text-gray-400">Total Settled:</span>
                    <span className="font-mono font-bold text-emerald-400">-{formatCurrency(totalPaid)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">
                    Outstanding Payable Balance
                  </span>
                  <span className="text-2xl font-black font-mono text-rose-400">
                    {formatCurrency(currentBalance)}
                  </span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-[9px] text-gray-400 text-center pt-2 border-t border-[#1e2332]">
                RZ MINETRIX Quarry Management System • Verified Operational Record • For Accounts: +91 98471 23456
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-xs text-gray-400">
                Generate high-resolution JPG for WhatsApp sharing or send to thermal/A4 printer.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1a1f2e] text-gray-200 border border-[#2f374e] flex items-center gap-1.5 cursor-pointer hover:bg-[#252c3f]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJpg}
                  disabled={isDownloadingJpg}
                  className="gold-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingJpg ? 'Exporting JPG...' : 'Download Shareable JPG'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
