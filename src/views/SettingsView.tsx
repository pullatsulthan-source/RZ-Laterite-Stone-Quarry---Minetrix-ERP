import React, { useState } from 'react';
import { useQuarry } from '../context/QuarryContext';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cloud,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { AppUser } from '../types/quarry';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    exportBackupJSON,
    importBackupJSON,
    resetAllData,
  } = useQuarry();

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rz_minetrix_quarry_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importBackupJSON(content);
      if (success) {
        setImportStatus('Backup data restored successfully!');
      } else {
        setImportStatus('Failed to import backup file. Invalid format.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    if (
      window.confirm(
        'WARNING: This will reset all current transactions, loads, ledgers, and attendance back to original factory test data. Proceed?'
      )
    ) {
      resetAllData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#12141a] border border-[#232736] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-xl font-bold font-cinzel text-gray-100">
              System Settings & Data Vault
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Single quarry operations configuration & persistent shared operations database
          </p>
        </div>
      </div>

      {/* Brand Identity Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#141722] via-[#0e1017] to-[#12141c] border border-[#d4af37]/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="lg" />
        <div className="text-right text-xs text-gray-400">
          <span className="font-mono font-bold text-[#f3c64c] block">DIRECT ACCESS MODE</span>
          <span>Internal Quarry Operations • Shared Persistent Database</span>
        </div>
      </div>

      {/* Internal Quarry Operators Section */}
      <div className="p-5 rounded-2xl bg-[#12141a] border border-[#232736] space-y-4">
        <div className="border-b border-[#232736] pb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#d4af37]" />
              <h3 className="font-cinzel font-bold text-sm text-gray-100">
                Internal Quarry Operators
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Direct access mode active without login screens. Shared between 2 internal operators.
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#d4af37]/20 text-[#f3c64c] border border-[#d4af37]/30">
            DIRECT ACCESS
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0d12] border border-[#1f2434] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-[#9c7816] text-[#090a0d] font-black flex items-center justify-center text-lg shadow">
              {currentUser[0]}
            </div>
            <div>
              <span className="font-bold text-sm text-gray-100 block">
                {currentUser === 'Nafid' ? 'Nafid Khan' : 'Aflah RZ'}
              </span>
              <span className="text-xs text-gray-400 font-mono block">
                {currentUser === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com'}
              </span>
              <span className="text-[10px] text-[#d4af37] font-semibold mt-0.5 block">
                Current Active Operator: <b>{currentUser}</b> (Records Loads & Gate Passes)
              </span>
            </div>
          </div>

          {/* Quick toggle operator */}
          <div className="flex items-center gap-2 bg-[#12141c] p-1.5 rounded-xl border border-[#262b3a]">
            {(['Nafid', 'Aflah'] as AppUser[]).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setCurrentUser(op)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentUser === op
                    ? 'bg-[#d4af37] text-black shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Switch to {op}
              </button>
            ))}
          </div>
        </div>

        {/* 2 Operators Info */}
        <div className="p-3 rounded-xl bg-[#0d0f14] border border-[#1b1f2b] text-xs space-y-2">
          <span className="text-gray-400 font-semibold block">Designated Internal Quarry Personnel:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className={`p-2.5 rounded-xl border transition-all ${currentUser === 'Nafid' ? 'bg-[#181a24] border-[#d4af37]/40' : 'bg-[#131620] border-[#222736]'}`}>
              <div className="flex items-center justify-between">
                <span className="text-gray-200 font-bold">Nafid Khan</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentUser === 'Nafid' ? 'bg-[#d4af37] text-black font-black' : 'text-gray-500'}`}>
                  {currentUser === 'Nafid' ? 'ACTIVE' : 'Operator 1'}
                </span>
              </div>
              <span className="text-gray-400 text-[10px] block mt-0.5">nafidkhan@racezoneventures.com</span>
            </div>

            <div className={`p-2.5 rounded-xl border transition-all ${currentUser === 'Aflah' ? 'bg-[#181a24] border-[#d4af37]/40' : 'bg-[#131620] border-[#222736]'}`}>
              <div className="flex items-center justify-between">
                <span className="text-gray-200 font-bold">Aflah RZ</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${currentUser === 'Aflah' ? 'bg-[#d4af37] text-black font-black' : 'text-gray-500'}`}>
                  {currentUser === 'Aflah' ? 'ACTIVE' : 'Operator 2'}
                </span>
              </div>
              <span className="text-gray-400 text-[10px] block mt-0.5">aflah@racezoneventures.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Device Database Status */}
      <div className="p-5 rounded-2xl bg-[#12141a] border border-[#232736] space-y-4">
        <div className="border-b border-[#232736] pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#d4af37]" />
            <h3 className="font-cinzel font-bold text-sm text-gray-100">
              Shared Persistent Backend Database
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Business data is continuously synchronized between Desktop Web, Android and iPhone devices.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#0d0f14] border border-[#202534]">
            <span className="text-gray-400 block text-[10px]">Database Architecture</span>
            <span className="font-bold text-gray-200 mt-1 block">Full-Stack Server</span>
            <span className="text-[10px] text-emerald-400">Atomic Disk Persistence</span>
          </div>
          <div className="p-3 rounded-xl bg-[#0d0f14] border border-[#202534]">
            <span className="text-gray-400 block text-[10px]">Multi-Device Live Sync</span>
            <span className="font-bold text-gray-200 mt-1 block">Active Polling (3.5s)</span>
            <span className="text-[10px] text-emerald-400">Real-time Cross-Device</span>
          </div>
          <div className="p-3 rounded-xl bg-[#0d0f14] border border-[#202534]">
            <span className="text-gray-400 block text-[10px]">Audit Integrity</span>
            <span className="font-bold text-gray-200 mt-1 block">Auto Creator Tagging</span>
            <span className="text-[10px] text-[#d4af37]">Tamper-Proof Audit</span>
          </div>
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="p-5 rounded-2xl bg-[#12141a] border border-[#232736] space-y-4">
        <div className="border-b border-[#232736] pb-3">
          <h3 className="font-cinzel font-bold text-sm text-gray-100">
            Data Backup & Restore Vault
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Download your full quarry ledger data as a secure JSON backup or restore from previous backup
          </p>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-[#1a251e] border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadBackup}
            className="gold-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Backup (JSON)</span>
          </button>

          <label className="cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1e2332] hover:bg-[#282f42] text-gray-200 border border-[#2f364c] flex items-center gap-2 transition-colors">
            <Upload className="w-4 h-4 text-[#d4af37]" />
            <span>Restore From Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone: Factory Reset */}
      <div className="p-5 rounded-2xl bg-[#181214] border border-rose-900/40 space-y-4">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Reset Application Data</span>
        </div>
        <p className="text-xs text-gray-400">
          Reverts all loads, stock, customers, vehicles and accounts to the initial factory seed state.
        </p>

        {resetSuccess && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold">
            Application reset to factory seed data!
          </div>
        )}

        <button
          onClick={handleFactoryReset}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-900/30 hover:bg-rose-900/50 text-rose-400 border border-rose-700/50 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Initial Seed State</span>
        </button>
      </div>
    </div>
  );
};
