import React, { useState, useEffect } from 'react';
import { useQuarry } from '../../context/QuarryContext';
import { MaterialType, VehicleCategory, LoadOrder } from '../../types/quarry';
import { formatCurrency, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { X, Calculator, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

interface NewLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<LoadOrder>;
}

export const NewLoadModal: React.FC<NewLoadModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const {
    vehicles,
    drivers,
    customers,
    rates,
    currentUser,
    stock,
    createLoad,
    confirmAndGenerateGatePass,
    orders,
    dispatchOrder,
  } = useQuarry();

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [owner, setOwner] = useState('');
  const [driver, setDriver] = useState('');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('RZ Mining');

  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [destination, setDestination] = useState('');

  const [agentName, setAgentName] = useState('Direct Order');
  const [paymentTerms, setPaymentTerms] = useState('Cash on Delivery');
  const [customRate, setCustomRate] = useState<number | null>(null);

  const [material, setMaterial] = useState<MaterialType>('Laterite Stone — 1st');
  const [quantity, setQuantity] = useState<number>(250);
  const [paymentReceived, setPaymentReceived] = useState<number>(0);
  const [remarks, setRemarks] = useState('');
  const [immediateGatePass, setImmediateGatePass] = useState(true);

  // When order is selected: Auto-populate Customer, Quality, Quantity, Rate, Delivery Location & Payment Terms
  const handleOrderSelect = (ordId: string) => {
    setSelectedOrderId(ordId);
    if (!ordId) {
      setCustomRate(null);
      return;
    }

    const ord = orders.find((o) => o.id === ordId || o.orderId === ordId);
    if (ord) {
      if (ord.customerId) setCustomerId(ord.customerId);
      if (ord.customer) setCustomerName(ord.customer);
      if (ord.deliveryLocation) setDestination(ord.deliveryLocation);
      if (ord.quality) handleMaterialChange(ord.quality);
      if (ord.quantity) setQuantity(ord.quantity);
      if (ord.rate) setCustomRate(ord.rate);
      if (ord.agentName) setAgentName(ord.agentName);
      if (ord.paymentTerms) setPaymentTerms(ord.paymentTerms);
      if (ord.remarks) setRemarks(ord.remarks);

      if (ord.assignedVehicle) {
        const matchingVeh = vehicles.find(
          (v) => v.vehicleNumber.trim().toUpperCase() === ord.assignedVehicle!.trim().toUpperCase()
        );
        if (matchingVeh) {
          handleVehicleSelect(matchingVeh.id);
        } else {
          setVehicleNumber(ord.assignedVehicle);
          if (ord.driver) setDriver(ord.driver);
        }
      }
    }
  };

  // Set defaults when opening
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setVehicleNumber(initialData.vehicleNumber || '');
        setOwner(initialData.owner || '');
        setDriver(initialData.driver || '');
        setVehicleCategory(initialData.vehicleCategory || 'RZ Mining');
        setCustomerId(initialData.customerId || '');
        setCustomerName(initialData.customerName || '');
        setDestination(initialData.destination || '');
        setMaterial(initialData.material || 'Laterite Stone — 1st');
        setQuantity(initialData.quantity || 250);
        setPaymentReceived(initialData.paymentReceived || 0);
        setRemarks(initialData.remarks || '');
      } else {
        // Default to first RZ Mining vehicle
        const rzVeh = vehicles.find((v) => v.category === 'RZ Mining') || vehicles[0];
        if (rzVeh) {
          setVehicleId(rzVeh.id);
          setVehicleNumber(rzVeh.vehicleNumber);
          setOwner(rzVeh.owner);
          setDriver(rzVeh.driver);
          setVehicleCategory(rzVeh.category);
        }
        if (customers.length > 0) {
          setCustomerId(customers[0].id);
          setCustomerName(customers[0].name);
          setDestination(customers[0].destination);
        }
        setMaterial('Laterite Stone — 1st');
        setQuantity(250);
        setPaymentReceived(0);
        setRemarks('');
        setImmediateGatePass(true);
      }
    }
  }, [isOpen, initialData, vehicles, customers]);

  // When vehicle selected from dropdown
  const handleVehicleSelect = (id: string) => {
    setVehicleId(id);
    const veh = vehicles.find((v) => v.id === id);
    if (veh) {
      setVehicleNumber(veh.vehicleNumber);
      setOwner(veh.owner);
      setDriver(veh.driver);
      setVehicleCategory(veh.category);
    }
  };

  // When customer selected
  const handleCustomerSelect = (id: string) => {
    setCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      setCustomerName(cust.name);
      setDestination(cust.destination);
    }
  };

  // Handle material change (auto-adjust standard quantity)
  const handleMaterialChange = (mat: MaterialType) => {
    setMaterial(mat);
    if (mat === 'Laterite Stone — 3rd') {
      setQuantity(1);
    } else {
      setQuantity(250);
    }
  };

  if (!isOpen) return null;

  // Live Auto Calculations
  const is3rd = material === 'Laterite Stone — 3rd';
  const quarryRate = rates.quarryRates[material]?.ratePerUnit || (is3rd ? 1000 : 43);
  const quarryAmount = is3rd ? quarryRate * quantity : quantity * quarryRate;

  const defaultRzRate = rates.rzCustomerRates[material]?.ratePerUnit || (is3rd ? 5000 : 65);
  const customerSaleRate =
    customRate !== null ? customRate : vehicleCategory === 'RZ Mining' ? defaultRzRate : quarryRate;
  const customerSaleAmount = is3rd ? customerSaleRate * quantity : quantity * customerSaleRate;

  let driverBatta = 0;
  let vehicleTripRent = 0;
  let loadingCharge = 0;
  let diesel = 0;
  let orderCommission = 0;
  let totalExpense = 0;
  let netProfit = 0;

  if (vehicleCategory === 'RZ Mining') {
    const multiplier = is3rd ? quantity : quantity / 250;
    driverBatta = rates.loadExpenses.driverBatta * (multiplier || 1);
    vehicleTripRent = rates.loadExpenses.vehicleTripRent * (multiplier || 1);
    loadingCharge = rates.loadExpenses.loadingCharge * (multiplier || 1);
    diesel = rates.loadExpenses.diesel * (multiplier || 1);
    orderCommission = (rates.loadExpenses.commissions[material] || 250) * (multiplier || 1);
    totalExpense = driverBatta + vehicleTripRent + loadingCharge + diesel + orderCommission;
    netProfit = customerSaleAmount - quarryAmount - totalExpense;
  }

  const balance = customerSaleAmount - (paymentReceived || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedOrderId) {
      // Direct integration: Dispatches the existing booked order (NO duplicate data)
      dispatchOrder(
        selectedOrderId,
        Number(paymentReceived) || 0,
        remarks || 'Gate Pass issued at dispatch'
      );
    } else {
      const created = createLoad({
        vehicleNumber,
        owner,
        driver,
        vehicleCategory,
        customerId,
        customerName,
        destination,
        material,
        quantity,
        customerSaleRate,
        paymentReceived: Number(paymentReceived) || 0,
        agentName,
        paymentTerms,
        remarks,
        status: immediateGatePass ? 'Draft' : 'Loaded',
      });

      if (immediateGatePass) {
        confirmAndGenerateGatePass(
          created.id,
          Number(paymentReceived) || 0,
          remarks || 'Gate Pass issued at load creation'
        );
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101218] border border-[#262c3e] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#141722] border-b border-[#262c3e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-base text-gray-100 tracking-wide">
                New Quarry Load / Order Dispatch
              </h3>
              <p className="text-[11px] text-[#d4af37]/80">
                Auto-calculates Quarry Purchase, Customer Sale, Fleet Expenses & Gate Pass
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white bg-[#1a1e2b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2433] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Date:</span>
              <span className="font-semibold text-gray-200">{getTodayDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Time:</span>
              <span className="font-semibold text-gray-200">{getCurrentTimeString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Entered By:</span>
              <span className="px-2.5 py-0.5 rounded font-bold text-[#d4af37] bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {currentUser}
                <span className="text-[10px] text-gray-400 font-normal">(Verified)</span>
              </span>
            </div>
          </div>

          {/* Link to Existing Booked Order */}
          <div className="p-3.5 rounded-xl bg-[#141824] border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>Select Booked Order (Auto-populates all details — Zero duplicate data)</span>
              </label>
              {selectedOrderId && (
                <button
                  type="button"
                  onClick={() => setSelectedOrderId('')}
                  className="text-[11px] text-gray-400 hover:text-rose-400 underline"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <select
              value={selectedOrderId}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="w-full bg-[#1b2030] border border-[#2e374f] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            >
              <option value="">-- No Linked Order (Direct Walk-in / Ad-hoc Dispatch) --</option>
              {orders
                .filter(
                  (o) =>
                    o.status !== 'DISPATCHED' &&
                    o.status !== 'DELIVERED' &&
                    o.status !== 'PAID' &&
                    o.status !== 'CANCELLED'
                )
                .map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderId} • {ord.customer} ({ord.quality} — {ord.quantity} pcs) • Status: {ord.status} • {ord.paymentTerms}
                  </option>
                ))}
            </select>
            {selectedOrderId && (
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Order linked. Selecting this order auto-populates customer, quality, quantity, rate, location & payment terms without creating duplicate data.
                </span>
              </div>
            )}
          </div>

          {/* Vehicle & Driver Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Select Vehicle *
              </label>
              <select
                value={vehicleId}
                onChange={(e) => handleVehicleSelect(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#d4af37]"
                required
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} ({v.owner} • {v.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                placeholder="Driver"
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#d4af37]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Category
              </label>
              <div className="flex gap-2">
                <span
                  className={`flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold border ${
                    vehicleCategory === 'RZ Mining'
                      ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#f3c64c]'
                      : 'bg-blue-900/20 border-blue-600/40 text-blue-400'
                  }`}
                >
                  {vehicleCategory}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Destination Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Customer / Project *
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#d4af37]"
              >
                <option value="">-- Select or enter custom customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Site / Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Delivery Destination"
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Material, Quantity & Sale Rate with Live Quarry Stock Check */}
          <div className="space-y-2 p-3.5 bg-[#0b0d12] rounded-xl border border-[#202535]">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Stone Material / Quality *
                </label>
                <select
                  value={material}
                  onChange={(e) => handleMaterialChange(e.target.value as MaterialType)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-[#f3c64c] font-bold focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="Laterite Stone — 1st">
                    Laterite Stone — 1st (Std 250 pcs)
                  </option>
                  <option value="Laterite Stone — 2nd">
                    Laterite Stone — 2nd (Std 250 pcs)
                  </option>
                  <option value="Laterite Stone — 3rd">
                    Laterite Stone — 3rd (1 Load)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Quantity ({is3rd ? 'load' : 'pcs'}) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-gray-100 font-mono font-bold focus:outline-none focus:border-[#d4af37]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                  <span>Sale Rate (₹)</span>
                  {selectedOrderId && (
                    <span className="text-[9px] text-amber-400 font-normal">From Order</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={customerSaleRate}
                  onChange={(e) => setCustomRate(Number(e.target.value) || 0)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-[#d4af37]"
                  required
                />
              </div>
            </div>

            {/* Quarry Stock Allocation Pipeline Status */}
            <div className="pt-2 border-t border-[#1a1e2b] flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Current Quarry Stock: <b className="text-white font-mono">{stock[material]} {is3rd ? 'loads' : 'pcs'}</b>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                stock[material] >= quantity
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                  : 'bg-amber-950/60 text-amber-400 border border-amber-800/50'
              }`}>
                {stock[material] >= quantity
                  ? '✓ Quarry Stock Allocation Ready'
                  : '⚡ Allocating from Ongoing Pit Production'}
              </span>
            </div>
          </div>

          {/* Orderman / Agent & Payment Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Orderman / Sales Agent
              </label>
              <select
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#d4af37]"
              >
                <option value="Direct Order">Direct Order (No Agent)</option>
                <option value="Shafi (Agent)">Shafi (Agent — ₹250/load)</option>
                <option value="Latheef (Agent)">Latheef (Agent — ₹250/load)</option>
                <option value="Rasheed (Orderman)">Rasheed (Orderman — ₹250/load)</option>
                <option value="Babu (Orderman)">Babu (Orderman — ₹250/load)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Payment Terms & Conditions
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#d4af37]"
              >
                <option value="Cash on Delivery">Cash on Delivery (COD by Driver)</option>
                <option value="Immediate UPI / Bank">Immediate UPI / Bank Transfer</option>
                <option value="Credit - 7 Days">Credit Terms: 7 Days</option>
                <option value="Credit - 15 Days">Credit Terms: 15 Days</option>
                <option value="Advance Paid in Full">Advance Paid in Full</option>
              </select>
            </div>
          </div>

          {/* LIVE DYNAMIC FINANCIAL BREAKDOWN CARD */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#131620] to-[#0d0f15] border border-[#d4af37]/35 shadow-lg">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#222736]">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#d4af37]" />
                <span className="font-bold text-xs uppercase tracking-wider text-[#d4af37]">
                  Automatic Load Financials
                </span>
              </div>
              <span className="text-[11px] font-mono text-gray-400">
                {material} × {quantity} {is3rd ? 'load' : 'pcs'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
              {/* Quarry Purchase */}
              <div className="p-2.5 rounded-lg bg-[#0a0c10] border border-[#222736]">
                <div className="text-[10px] text-gray-400">Quarry Rate</div>
                <div className="text-gray-300 font-mono">
                  {is3rd ? formatCurrency(quarryRate) : `${formatCurrency(quarryRate)}/pc`}
                </div>
                <div className="text-sm font-bold text-gray-100 font-mono mt-1">
                  {formatCurrency(quarryAmount)}
                </div>
              </div>

              {/* Customer Sale */}
              <div className="p-2.5 rounded-lg bg-[#0a0c10] border border-[#d4af37]/30">
                <div className="text-[10px] text-[#d4af37]">Customer Sale Rate</div>
                <div className="text-[#d4af37]/90 font-mono">
                  {is3rd ? formatCurrency(customerSaleRate) : `${formatCurrency(customerSaleRate)}/pc`}
                </div>
                <div className="text-sm font-bold text-[#f3c64c] font-mono mt-1">
                  {formatCurrency(customerSaleAmount)}
                </div>
              </div>

              {/* Fleet Expenses */}
              <div className="p-2.5 rounded-lg bg-[#0a0c10] border border-[#222736]">
                <div className="text-[10px] text-gray-400">
                  {vehicleCategory === 'RZ Mining' ? 'Fleet Expenses' : 'Outside Vehicle'}
                </div>
                <div className="text-[11px] text-gray-400">
                  {vehicleCategory === 'RZ Mining'
                    ? 'Batta+Rent+Load+Diesel+Comm'
                    : 'Direct outside tipper'}
                </div>
                <div className="text-sm font-bold text-rose-400 font-mono mt-1">
                  {vehicleCategory === 'RZ Mining' ? formatCurrency(totalExpense) : '₹0'}
                </div>
              </div>

              {/* Net RZ Profit */}
              <div className="p-2.5 rounded-lg bg-[#0a0c10] border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400">Net RZ Profit</div>
                <div className="text-[11px] text-gray-400">Customer - Quarry - Exp</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                  {vehicleCategory === 'RZ Mining' ? formatCurrency(netProfit) : '₹0'}
                </div>
              </div>
            </div>

            {/* Expenses breakdown pills for RZ Mining */}
            {vehicleCategory === 'RZ Mining' && (
              <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-400 bg-[#090a0d] p-2 rounded-lg border border-[#1b1f2b]">
                <span className="text-gray-500 font-semibold">Breakdown:</span>
                <span>Driver Batta: <b className="text-gray-300 font-mono">{formatCurrency(driverBatta)}</b></span>
                <span>•</span>
                <span>Trip Rent: <b className="text-gray-300 font-mono">{formatCurrency(vehicleTripRent)}</b></span>
                <span>•</span>
                <span>Loading: <b className="text-gray-300 font-mono">{formatCurrency(loadingCharge)}</b></span>
                <span>•</span>
                <span>Diesel: <b className="text-gray-300 font-mono">{formatCurrency(diesel)}</b></span>
                <span>•</span>
                <span>Commission: <b className="text-gray-300 font-mono">{formatCurrency(orderCommission)}</b></span>
              </div>
            )}
          </div>

          {/* Payment & Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#0b0c10] rounded-xl border border-[#202535]">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Payment Collected Now (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={paymentReceived}
                  onChange={(e) => setPaymentReceived(Number(e.target.value) || 0)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-[#d4af37]"
                />
                <button
                  type="button"
                  onClick={() => setPaymentReceived(customerSaleAmount)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                >
                  Full Paid
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Outstanding Balance on Ledger
              </label>
              <div
                className={`px-3 py-2 rounded-xl text-sm font-mono font-bold border ${
                  balance > 0
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-400'
                    : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-400'
                }`}
              >
                {formatCurrency(balance)}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Remarks / Site Instructions
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Dispatched to Site Bench #2, customer will pay remaining on site"
              className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Gate Pass Generation Checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141824] border border-[#282f44]">
            <input
              type="checkbox"
              id="gatePassCheck"
              checked={immediateGatePass}
              onChange={(e) => setImmediateGatePass(e.target.checked)}
              className="w-4 h-4 accent-[#d4af37] rounded cursor-pointer"
            />
            <label htmlFor="gatePassCheck" className="text-xs text-gray-200 cursor-pointer">
              <span className="font-bold text-[#d4af37]">
                Generate Gate Pass & Dispatch Vehicle Immediately
              </span>{' '}
              (Auto-reduces stock & records quarry ledger)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#222736]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white bg-[#171a25] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gold-btn px-6 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{immediateGatePass ? 'Confirm & Issue Gate Pass' : 'Save Load Draft'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
