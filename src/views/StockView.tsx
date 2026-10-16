import React from 'react';
import { useQuarry } from '../context/QuarryContext';
import { MaterialType } from '../types/quarry';
import { formatNumber, getTodayDateString } from '../utils/formatters';
import {
  Boxes,
  ArrowRight,
  PackageCheck,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Award,
  Layers,
  Repeat,
  Info,
} from 'lucide-react';

export const StockView: React.FC = () => {
  const { production, gatePasses, loads, activeQuarry } = useQuarry();

  const today = getTodayDateString();

  const materials: MaterialType[] = [
    'Laterite Stone — 1st',
    'Laterite Stone — 2nd',
    'Laterite Stone — 3rd',
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#141824] via-[#10131c] to-[#121520] border border-[#d4af37]/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-[#d4af37]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#f3c64c]">
                <Truck className="w-5 h-5 stroke-[2.5]" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 tracking-wide">
                Direct Pit Loading & Throughput Flow
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/70 text-amber-300 border border-amber-700/50">
                Zero Physical Closing Stock
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2 max-w-3xl leading-relaxed">
              <span className="text-[#f3c64c] font-semibold">RZ MINETRIX Operational Rule:</span>{' '}
              There is NO physical closing stock or warehouse in the quarry. Production is cut directly from pit faces and loaded immediately onto assigned vehicles.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#090b10] border border-[#22283a] px-3.5 py-2 rounded-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <div className="text-xs">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Active Site</span>
              <span className="text-gray-200 font-bold">{activeQuarry.quarryName}</span>
            </div>
          </div>
        </div>

        {/* 4-Stage Quarry Operational Flow Visualizer */}
        <div className="mt-5 pt-4 border-t border-[#1e2436]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2.5 flex items-center gap-2">
            <Repeat className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Official Quarry Extraction Pipeline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-[#0b0d13] border border-[#202535] flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-950/70 border border-emerald-700/50 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <span className="text-xs font-bold text-gray-200 block">PRODUCTION</span>
                <span className="text-[10px] text-gray-400">Excavator cutting bench extraction</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b0d13] border border-[#202535] flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-sky-950/70 border border-sky-700/50 text-sky-400 font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <span className="text-xs font-bold text-gray-200 block">QUALITY IDENTIFICATION</span>
                <span className="text-[10px] text-gray-400">1st Grade, 2nd Grade, Rubble Load</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b0d13] border border-[#202535] flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-amber-950/70 border border-amber-700/50 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <span className="text-xs font-bold text-gray-200 block">DIRECT VEHICLE LOADING</span>
                <span className="text-[10px] text-gray-400">Straight into tipper body (250 pcs)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0b0d13] border border-[#202535] flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-purple-950/70 border border-purple-700/50 text-purple-400 font-black text-xs flex items-center justify-center shrink-0">
                4
              </span>
              <div>
                <span className="text-xs font-bold text-gray-200 block">OUTWARD GATE PASS</span>
                <span className="text-[10px] text-gray-400">Verified & dispatched on road</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production vs Direct Dispatch Cards per Quality Grade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {materials.map((mat) => {
          const is3rd = mat === 'Laterite Stone — 3rd';
          const unit = is3rd ? 'loads' : 'pcs';

          // Historical production preserved for analysis
          const totalProd = production
            .filter((p) => p.material === mat)
            .reduce((sum, p) => sum + p.quantity, 0);

          // Today's cut
          const todayProd = production
            .filter((p) => p.material === mat && p.date === today)
            .reduce((sum, p) => sum + p.quantity, 0);

          // Total Dispatched via Gate Passes
          const totalDispatched = gatePasses
            .filter((g) => g.material === mat)
            .reduce((sum, g) => sum + g.quantity, 0);

          // Today's Dispatched
          const todayDispatched = gatePasses
            .filter((g) => g.material === mat && g.date === today)
            .reduce((sum, g) => sum + g.quantity, 0);

          // Vehicles currently loading this stone
          const loadingLoads = loads.filter(
            (l) => l.material === mat && (l.status === 'Draft' || l.status === 'Loaded')
          );
          const currentInLoading = loadingLoads.reduce((sum, l) => sum + l.quantity, 0);

          return (
            <div
              key={mat}
              className="p-5 rounded-2xl bg-[#12141a] border border-[#232736] hover:border-[#d4af37]/40 transition-all space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-cinzel font-bold text-base text-gray-100">{mat}</h3>
                  <span className="text-[10px] text-[#d4af37] font-semibold uppercase tracking-wider">
                    {is3rd ? 'Rubble Load Material' : 'Standard 250 pcs / Tipper'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Live Extraction
                </span>
              </div>

              {/* Active Pit Loading Status */}
              <div className="p-3.5 rounded-xl bg-[#0b0c10] border border-[#1f2434] text-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  Today's Pit Loading & Dispatch
                </div>
                <div className="text-2xl font-black font-mono text-[#f3c64c] my-1">
                  {formatNumber(todayDispatched)}{' '}
                  <span className="text-xs font-normal text-gray-400">{unit} dispatched</span>
                </div>
                <div className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>
                    Currently in Pit Loading:{' '}
                    <b className="text-white font-mono">{formatNumber(currentInLoading)} {unit}</b> ({loadingLoads.length} tippers)
                  </span>
                </div>
              </div>

              {/* Operational Ledger Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#1c202d] text-gray-400">
                  <span>Today Pit Extraction:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    +{formatNumber(todayProd)} {unit}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1c202d] text-gray-400">
                  <span>Today Gate Pass Dispatches:</span>
                  <span className="font-mono text-rose-400 font-bold">
                    -{formatNumber(todayDispatched)} {unit}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1c202d] text-gray-400">
                  <span>All-Time Production History:</span>
                  <span className="font-mono text-gray-200 font-semibold">
                    {formatNumber(totalProd)} {unit}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-gray-400">
                  <span>All-Time Dispatched Volume:</span>
                  <span className="font-mono text-gray-200 font-semibold">
                    {formatNumber(totalDispatched)} {unit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Direct Pit Operations Notice */}
      <div className="p-4 rounded-2xl bg-[#0d1017] border border-[#232736] flex items-center gap-3 text-xs text-gray-400">
        <Info className="w-5 h-5 text-[#d4af37] shrink-0" />
        <span>
          <b className="text-gray-200">Zero-Warehousing Principle:</b> Quarry blocks are cut to order and direct-loaded into vehicles. No carry-forward warehouse stock is maintained. All records represent live excavation throughput and outward gate passes.
        </span>
      </div>
    </div>
  );
};
