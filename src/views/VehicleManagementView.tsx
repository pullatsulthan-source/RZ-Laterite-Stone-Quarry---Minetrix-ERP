import React, { useState } from 'react';
import { useQuarry } from '../context/QuarryContext';
import { Vehicle, VehicleCategory } from '../types/quarry';
import { Car, Plus, Search, Edit2, Trash2, CheckCircle2, X } from 'lucide-react';

export const VehicleManagementView: React.FC = () => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, loads } = useQuarry();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'All' | 'RZ Mining' | 'Outside'>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  // Form State
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [owner, setOwner] = useState('');
  const [driver, setDriver] = useState('');
  const [category, setCategory] = useState<VehicleCategory>('Outside');
  const [capacity, setCapacity] = useState(250);
  const [status, setStatus] = useState<Vehicle['status']>('Available');
  const [remarks, setRemarks] = useState('');

  const openAddModal = () => {
    setEditingVehicle(null);
    setVehicleNumber('');
    setOwner('');
    setDriver('');
    setCategory('Outside');
    setCapacity(250);
    setStatus('Available');
    setRemarks('');
    setModalOpen(true);
  };

  const openEditModal = (veh: Vehicle) => {
    setEditingVehicle(veh);
    setVehicleNumber(veh.vehicleNumber);
    setOwner(veh.owner);
    setDriver(veh.driver);
    setCategory(veh.category);
    setCapacity(veh.capacity);
    setStatus(veh.status);
    setRemarks(veh.remarks || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber || !owner || !driver) return;

    const ownerType = category === 'RZ Mining' ? 'COMPANY' : 'OUTSIDE';

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, {
        vehicleNumber,
        owner,
        driver,
        category,
        ownerType,
        capacity: Number(capacity),
        status,
        remarks,
      });
    } else {
      addVehicle({
        vehicleNumber,
        owner,
        driver,
        category,
        ownerType,
        capacity: Number(capacity),
        status,
        active: true,
        remarks,
      });
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, reg: string) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${reg}?`)) {
      deleteVehicle(id);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (filterCategory !== 'All' && v.category !== filterCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        v.vehicleNumber.toLowerCase().includes(term) ||
        v.owner.toLowerCase().includes(term) ||
        v.driver.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#12141a] border border-[#232736]">
        <div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-xl font-bold font-cinzel text-gray-100">
              Vehicle Master
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Fleet registry of RZ Minetrix internal vehicles and outside contractor tippers
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="gold-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3.5 bg-[#12141a] rounded-xl border border-[#232736]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vehicle number, owner, driver..."
            className="w-full bg-[#161924] border border-[#262c3e] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#161924] p-1 rounded-xl border border-[#262c3e] shrink-0">
          {(['All', 'RZ Mining', 'Outside'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
                filterCategory === cat
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Grid / Table */}
      <div className="bg-[#12141a] rounded-2xl border border-[#232736] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#161924] border-b border-[#232736] text-gray-400 text-[11px] font-semibold">
                <th className="p-3">Vehicle Number</th>
                <th className="p-3">Owner</th>
                <th className="p-3">Driver</th>
                <th className="p-3">Category</th>
                <th className="p-3">Capacity</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total Quarry Trips</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2230]">
              {filteredVehicles.map((veh) => {
                const tripCount = loads.filter((l) => l.vehicleNumber === veh.vehicleNumber).length;
                return (
                  <tr key={veh.id} className="hover:bg-[#161924]/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-gray-100">
                      {veh.vehicleNumber}
                    </td>
                    <td className="p-3 font-semibold text-gray-200">{veh.owner}</td>
                    <td className="p-3 text-gray-300">{veh.driver}</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            veh.category === 'RZ Mining'
                              ? 'bg-[#d4af37]/15 text-[#f3c64c] border border-[#d4af37]/30'
                              : 'bg-blue-900/20 text-blue-400 border border-blue-700/30'
                          }`}
                        >
                          {veh.category}
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                            (veh.ownerType || (veh.category === 'RZ Mining' ? 'COMPANY' : 'OUTSIDE')) === 'COMPANY'
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                              : 'bg-sky-950/70 text-sky-300 border border-sky-800/40'
                          }`}
                        >
                          {veh.ownerType || (veh.category === 'RZ Mining' ? 'COMPANY' : 'OUTSIDE')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-gray-300">{veh.capacity} pcs</td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {veh.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-gray-200">{tripCount} trips</td>
                    <td className="p-3 text-gray-400 text-[11px]">{veh.remarks || '—'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(veh)}
                          className="p-1 text-gray-400 hover:text-white rounded hover:bg-[#1f2434]"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(veh.id, veh.vehicleNumber)}
                          className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-[#1f2434]"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Vehicle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101218] border border-[#262c3e] w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#262c3e]">
              <h3 className="font-cinzel font-bold text-base text-gray-100">
                {editingVehicle ? 'Edit Vehicle Master' : 'Add New Vehicle'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Vehicle Reg Number *
                </label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. KL-55-RZ-01"
                  className="w-full bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-100 focus:outline-none focus:border-[#d4af37]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Owner"
                    className="w-full bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-[#d4af37]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Driver Assigned *
                  </label>
                  <input
                    type="text"
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                    placeholder="Driver"
                    className="w-full bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-[#d4af37]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                    className="w-full bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-[#d4af37]"
                  >
                    <option value="Outside">Outside</option>
                    <option value="RZ Mining">RZ Mining</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Capacity (pcs)
                  </label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value) || 250)}
                    className="w-full bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-gray-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Notes"
                  className="w-full bg-[#161924] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-gray-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="gold-btn px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingVehicle ? 'Update Vehicle' : 'Save Vehicle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
