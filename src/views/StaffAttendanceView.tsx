import React, { useState } from 'react';
import { useQuarry } from '../context/QuarryContext';
import { AttendanceStatus } from '../types/quarry';
import { getTodayDateString, formatDate } from '../utils/formatters';
import { CalendarCheck, Check, Clock, UserCheck } from 'lucide-react';

export const StaffAttendanceView: React.FC = () => {
  const { staff, attendance, markAttendance, bulkMarkAttendance, currentUser } = useQuarry();

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  // Current day attendance map
  const todayAttendance = attendance.filter((a) => a.date === selectedDate);
  const statusMap = new Map(todayAttendance.map((a) => [a.staffId, a.status]));

  const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
    const member = staff.find((s) => s.id === staffId);
    if (!member) return;

    const existing = todayAttendance.find((a) => a.staffId === staffId);
    markAttendance({
      date: selectedDate,
      staffId,
      employeeName: member.name,
      status,
      inTime: status === 'Present' ? (existing?.inTime || '07:00 AM') : undefined,
      outTime: status === 'Present' ? (existing?.outTime || '05:00 PM') : undefined,
      overtimeHours: existing?.overtimeHours || 0,
      remarks: existing?.remarks || '',
      enteredBy: currentUser,
    });
  };

  const handleOvertimeChange = (staffId: string, hours: number) => {
    const member = staff.find((s) => s.id === staffId);
    if (!member) return;
    const existing = todayAttendance.find((a) => a.staffId === staffId);
    markAttendance({
      date: selectedDate,
      staffId,
      employeeName: member.name,
      status: existing?.status || 'Present',
      inTime: existing?.inTime || '07:00 AM',
      outTime: hours > 0 ? `05:00 PM + ${hours}h OT` : '05:00 PM',
      overtimeHours: Math.max(0, hours),
      remarks: existing?.remarks || '',
      enteredBy: currentUser,
    });
  };

  const handleToggle5PmClearance = (staffId: string) => {
    const member = staff.find((s) => s.id === staffId);
    if (!member) return;
    const existing = todayAttendance.find((a) => a.staffId === staffId);
    const has5pm = existing?.remarks?.includes('5PM 1st-Quality Clearance');
    const newRemarks = has5pm
      ? (existing?.remarks || '').replace('5PM 1st-Quality Clearance (Standard Hours)', '').trim()
      : `${existing?.remarks || ''} 5PM 1st-Quality Clearance (Standard Hours)`.trim();

    markAttendance({
      date: selectedDate,
      staffId,
      employeeName: member.name,
      status: existing?.status || 'Present',
      inTime: existing?.inTime || '07:00 AM',
      outTime: existing?.outTime || '05:00 PM',
      overtimeHours: existing?.overtimeHours || 0,
      remarks: newRemarks,
      enteredBy: currentUser,
    });
  };

  const handleMarkAllPresent = () => {
    const activeStaff = staff.filter((s) => s.status === 'Active');
    bulkMarkAttendance(
      selectedDate,
      activeStaff.map((s) => ({
        staffId: s.id,
        status: 'Present',
        remarks: 'Bulk marked present (07:00 AM - 05:00 PM)',
      }))
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-xl font-bold font-cinzel text-gray-100">
              Quarry Staff Daily Attendance & Shift OT
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Shift: <span className="text-gray-200 font-mono">07:00 AM – 05:00 PM</span> • 5:00 PM completion for 1st-quality vehicle is logged as standard hours; excess work is OT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-1.5 text-xs text-gray-100 font-mono"
          />

          <button
            onClick={handleMarkAllPresent}
            className="gold-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Mark All Present</span>
          </button>
        </div>
      </div>

      {/* 5 PM Vehicle Rule Notice Banner */}
      <div className="p-3.5 rounded-xl bg-[#0e1118] border border-cyan-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-gray-300">
            <strong className="text-cyan-300">5:00 PM Continuation Rule:</strong> At 5:00 PM, work continues only until the stopped 1st-quality vehicle becomes full (standard shift, no OT). Only work extending past that completion constitutes Overtime.
          </span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 shrink-0">
          Auto Standard + OT excess
        </span>
      </div>

      {/* Attendance Grid */}
      <div className="bg-[#12141a] rounded-2xl border border-[#232736] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#161924] border-b border-[#232736] text-gray-400 text-[11px]">
                <th className="p-3">Emp ID</th>
                <th className="p-3">Staff Name</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Daily Rate</th>
                <th className="p-3 text-center">Status ({formatDate(selectedDate)})</th>
                <th className="p-3 text-center">5 PM 1st-Quality Fill</th>
                <th className="p-3 text-center">Overtime (Hours)</th>
                <th className="p-3 text-center">Action / Quick Mark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2230]">
              {staff
                .filter((s) => s.status === 'Active')
                .map((member) => {
                  const record = todayAttendance.find((a) => a.staffId === member.id);
                  const currentStatus = record?.status || 'Absent';
                  const is5pmActive = record?.remarks?.includes('5PM 1st-Quality Clearance');
                  const currentOt = record?.overtimeHours || 0;

                  return (
                    <tr key={member.id} className="hover:bg-[#161924]">
                      <td className="p-3 font-mono font-bold text-[#d4af37]">
                        {member.employeeId}
                      </td>
                      <td className="p-3 font-bold text-gray-100">{member.name}</td>
                      <td className="p-3 text-gray-300">{member.role}</td>
                      <td className="p-3 text-gray-400 font-mono">₹{member.dailyWage || member.basicSalary || 0}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : currentStatus === 'Half Day'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : currentStatus === 'Leave'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>
                      {/* 5 PM 1st-Quality Clearance */}
                      <td className="p-3 text-center">
                        {currentStatus === 'Present' ? (
                          <button
                            type="button"
                            onClick={() => handleToggle5PmClearance(member.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              is5pmActive
                                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/60'
                                : 'bg-[#181b24] text-gray-400 border-[#2a3044] hover:text-gray-200'
                            }`}
                            title="Work continued past 5:00 PM to finish filling the 1st-quality vehicle (standard pay)"
                          >
                            {is5pmActive ? '✓ 5 PM 1st-Q Fill' : 'Standard 5 PM'}
                          </button>
                        ) : (
                          <span className="text-gray-600 text-[10px]">—</span>
                        )}
                      </td>
                      {/* Overtime (Excess beyond vehicle fill) */}
                      <td className="p-3 text-center">
                        {currentStatus === 'Present' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="8"
                              step="0.5"
                              value={currentOt}
                              onChange={(e) =>
                                handleOvertimeChange(member.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-14 bg-[#141720] border border-[#2a3044] rounded px-1.5 py-1 text-center font-mono text-amber-400 text-xs focus:outline-none focus:border-[#d4af37]"
                            />
                            <span className="text-[10px] text-gray-400">hrs</span>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {(['Present', 'Half Day', 'Absent', 'Leave'] as AttendanceStatus[]).map(
                            (st) => (
                              <button
                                key={st}
                                onClick={() => handleStatusChange(member.id, st)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  currentStatus === st
                                    ? 'bg-[#d4af37] text-black shadow-sm font-black'
                                    : 'bg-[#181b24] text-gray-400 hover:text-white'
                                }`}
                              >
                                {st}
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
