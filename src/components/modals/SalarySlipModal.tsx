import React from 'react';
import { StaffPayroll, Staff } from '../../types/quarry';
import { formatCurrency } from '../../utils/formatters';
import { numberToWords } from '../../utils/numberToWords';
import { X, Printer, CheckCircle, Wallet, Calendar } from 'lucide-react';

interface SalarySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payroll: StaffPayroll | null;
  staff?: Staff;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({
  isOpen,
  onClose,
  payroll,
  staff,
}) => {
  if (!isOpen || !payroll) return null;

  const handlePrint = () => {
    window.print();
  };

  const netPayWords = numberToWords(Math.round(payroll.netSalary));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#12141a] border border-[#2a2f42] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print p-4 border-b border-[#222736] flex items-center justify-between bg-[#151822]">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#d4af37]" />
            <span className="font-bold font-cinzel text-gray-100 text-sm">
              Staff Salary Payslip — {payroll.month}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="gold-btn px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#202534] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Document */}
        <div className="p-6 sm:p-8 bg-white text-[#111827] print:p-0 print:m-0 font-sans">
          {/* Company Banner */}
          <div className="border-b-2 border-[#111827] pb-4 mb-4 text-center">
            <h1 className="font-serif font-black text-xl text-black tracking-wider uppercase">
              RZ LATERITE STONE QUARRY
            </h1>
            <p className="text-xs text-gray-600 font-semibold tracking-wide">
              MINING OPERATIONS & ENTERPRISE FLEET • KAVALAPPARA / SHORANUR
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-bold uppercase tracking-wider text-black">
              Salary Payslip for the Month of {payroll.month}
            </div>
          </div>

          {/* Employee & Pay Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 border border-gray-200 rounded-lg p-3 bg-gray-50/50">
            <div>
              <div className="text-gray-500 font-medium">Employee Name:</div>
              <div className="font-bold text-sm text-black">{payroll.employeeName}</div>
              <div className="text-gray-500 mt-1">Designation / Role:</div>
              <div className="font-semibold text-black">{payroll.role}</div>
            </div>

            <div className="text-right">
              <div className="text-gray-500 font-medium">Salary Type:</div>
              <div className="font-bold text-black">{payroll.salaryType} Wage</div>
              <div className="text-gray-500 mt-1">Pay Date / Status:</div>
              <div className="font-bold text-emerald-700">
                {payroll.status === 'Paid' ? `PAID (${payroll.paidDate || 'Settled'})` : 'DRAFT / PENDING'}
              </div>
            </div>
          </div>

          {/* Attendance Breakdown */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 border-b pb-1">
              Attendance Record
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 bg-gray-100 rounded">
              <div>
                <span className="text-gray-500 block text-[10px]">Present Days</span>
                <span className="font-bold text-black">{payroll.presentDays}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Half Days</span>
                <span className="font-bold text-black">{payroll.halfDays}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Absent Days</span>
                <span className="font-bold text-black">{payroll.absentDays}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">Overtime Hours</span>
                <span className="font-bold text-black">{payroll.overtimeHours} hrs</span>
              </div>
            </div>
          </div>

          {/* Earnings vs Deductions Table */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-6">
            {/* Earnings */}
            <div className="border border-gray-200 rounded p-3">
              <div className="font-bold text-gray-700 border-b pb-1 mb-2 uppercase text-[11px]">
                Earnings (A)
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-600">Basic / Base Rate:</span>
                  <span className="font-mono font-semibold">{formatCurrency(payroll.basicSalaryOrDailyRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overtime Pay:</span>
                  <span className="font-mono font-semibold">{formatCurrency(payroll.overtimePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Allowance:</span>
                  <span className="font-mono font-semibold">{formatCurrency(payroll.allowance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bonus:</span>
                  <span className="font-mono font-semibold">{formatCurrency(payroll.bonus)}</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-bold text-black">
                  <span>Gross Earnings:</span>
                  <span className="font-mono">{formatCurrency(payroll.grossSalary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-gray-200 rounded p-3">
              <div className="font-bold text-gray-700 border-b pb-1 mb-2 uppercase text-[11px]">
                Deductions (B)
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-600">Advance Recovered:</span>
                  <span className="font-mono font-semibold text-rose-700">
                    {formatCurrency(payroll.advanceDeduction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Other Deductions:</span>
                  <span className="font-mono font-semibold text-rose-700">
                    {formatCurrency(payroll.otherDeductions)}
                  </span>
                </div>
                <div className="border-t pt-1 flex justify-between font-bold text-black">
                  <span>Total Deductions:</span>
                  <span className="font-mono text-rose-700">
                    {formatCurrency(payroll.advanceDeduction + payroll.otherDeductions)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay Callout */}
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-between mb-8">
            <div>
              <span className="text-xs uppercase font-bold text-gray-600 block">
                Net Salary Payable (A - B):
              </span>
              <span className="text-xs text-gray-500 italic mt-0.5 block">
                Amount in Words: <b>{netPayWords}</b>
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-mono font-black text-black">
                {formatCurrency(payroll.netSalary)}
              </span>
            </div>
          </div>

          {/* Signature Blocks */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-gray-300 text-center text-xs">
            <div>
              <div className="h-12 border-b border-gray-400 mx-auto w-3/4 mb-1" />
              <span className="font-bold text-gray-800">Employee Signature</span>
              <p className="text-[10px] text-gray-500">I acknowledge receipt of full salary.</p>
            </div>

            <div>
              <div className="h-12 border-b border-gray-400 mx-auto w-3/4 mb-1 flex items-end justify-center pb-1">
                <span className="font-bold text-xs text-black">For RZ Laterite Stone Quarry</span>
              </div>
              <span className="font-bold text-gray-800">Authorized Manager Signature</span>
              <p className="text-[10px] text-gray-500">Seal & Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
