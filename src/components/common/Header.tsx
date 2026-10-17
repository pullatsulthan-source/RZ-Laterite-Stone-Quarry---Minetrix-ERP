import React, { useState, useEffect } from 'react';
import { useQuarry } from '../../context/QuarryContext';
import { Logo } from './Logo';
import { Plus, Menu, Clock, Calendar, UserCheck, Mountain, Truck, FileText, LayoutDashboard } from 'lucide-react';
import { AppUser } from '../../types/quarry';

export type ActiveModuleType = 'quarry' | 'vehicle' | 'order' | 'dashboard';

interface HeaderProps {
  onOpenNewLoad: () => void;
  onToggleSidebar: () => void;
  activeModule?: ActiveModuleType;
  onSelectModule?: (module: ActiveModuleType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewLoad,
  onToggleSidebar,
  activeModule = 'dashboard',
  onSelectModule,
}) => {
  const { currentUser, setCurrentUser, quarries, activeQuarryId, setActiveQuarryId } =
    useQuarry();

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="no-print sticky top-0 z-40 bg-[#090a0d]/90 backdrop-blur-md border-b border-[#222633] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-[#141722] hover:bg-[#1e2330] text-[#d4af37] border border-[#262b3a] transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Logo size="md" className="hidden sm:flex" />
        <Logo size="sm" variant="icon" className="sm:hidden" />
        
        <div className="sm:hidden flex flex-col leading-tight">
          <span className="font-cinzel font-black text-sm gold-gradient-text tracking-wider">
            RZ MINETRIX
          </span>
          <span className="text-[9px] uppercase tracking-widest text-[#d4af37]/80">
            Quarry ERP
          </span>
        </div>
      </div>

      {/* Center: Exactly 3 Primary Operational Modules Navigation Switcher */}
      <div className="hidden md:flex items-center bg-[#10131c] border border-[#232736] rounded-xl p-1 gap-1 shadow-inner">
        <button
          type="button"
          onClick={() => onSelectModule?.('dashboard')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeModule === 'dashboard'
              ? 'bg-[#1e2332] text-white shadow-sm border border-[#2f374e]'
              : 'text-gray-400 hover:text-gray-200'
          }`}
          title="Executive Pipeline Dashboard"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Pipeline</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectModule?.('quarry')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeModule === 'quarry'
              ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/25 font-black'
              : 'text-gray-300 hover:text-white hover:bg-[#171b26]'
          }`}
          title="Module 1: Quarry Master, Production, Machinery, JCB, Quality, Direct Loading, Gate, Staff, Land Owner, Bills"
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>1. QUARRY</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectModule?.('vehicle')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeModule === 'vehicle'
              ? 'bg-sky-500 text-black shadow-md shadow-sky-500/25 font-black'
              : 'text-gray-300 hover:text-white hover:bg-[#171b26]'
          }`}
          title="Module 2: Vehicle Master, Drivers, Pos 1 Fixed Rotation, Trips, Vehicle Ledger, Partnerships"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>2. VEHICLES</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectModule?.('order')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeModule === 'order'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/25 font-black'
              : 'text-gray-300 hover:text-white hover:bg-[#171b26]'
          }`}
          title="Module 3: Order Workflow, Vehicle Assignment, Gate-Out, Loading, Delivery, Invoicing, Settlements"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>3. ORDERS</span>
        </button>
      </div>

      {/* Right: Quarry Switcher, Operator Switcher (2 Internal Users: Nafid / Aflah) & Quick New Load */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Quarry Profile Switcher */}
        <div className="hidden sm:flex items-center bg-[#13151c] border border-[#262b3a] rounded-xl px-2.5 py-1 gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <select
            value={activeQuarryId}
            onChange={(e) => setActiveQuarryId(e.target.value)}
            className="bg-transparent text-gray-200 font-bold focus:outline-none cursor-pointer text-xs"
            title="Switch Active Quarry Profile"
          >
            {quarries.map((q) => (
              <option key={q.id} value={q.id} className="bg-[#13151c] text-white">
                {q.quarryName} {q.sections.length > 0 ? `(${q.sections.map((s) => s.sectionCode).join('/')})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Direct Active Operator Switcher */}
        <div className="flex items-center bg-[#13151c] border border-[#262b3a] rounded-xl p-1 gap-1">
          <div className="hidden lg:flex items-center gap-1.5 px-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Operator:</span>
          </div>

          {(['Nafid', 'Aflah'] as AppUser[]).map((op) => {
            const isActive = currentUser === op;
            return (
              <button
                key={op}
                type="button"
                onClick={() => setCurrentUser(op)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b89222] text-[#090a0d] shadow-md shadow-[#d4af37]/20 font-black'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1e2b]'
                }`}
                title={`Switch active recording operator to ${op}`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#090a0d]" />}
                <span>{op}</span>
              </button>
            );
          })}
        </div>

        {/* Quick New Load Button */}
        <button
          onClick={onOpenNewLoad}
          className="gold-btn px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden xs:inline">New Load</span>
        </button>
      </div>
    </header>
  );
};
