import React, { useState, useEffect } from 'react';
import { useQuarry } from '../../context/QuarryContext';
import { MaterialType, VehicleCategory, LoadOrder, RateCondition } from '../../types/quarry';
import { formatCurrency, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { X, Calculator, Truck, CheckCircle2, AlertCircle, Info, Layers } from 'lucide-react';

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
    createLoad,
    confirmAndGenerateGatePass,
    orders,
    dispatchOrder,
    activeQuarry,
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
  const [customQuarryRate, setCustomQuarryRate] = useState<number | null>(null);

  const [material, setMaterial] = useState<MaterialType>('Laterite Stone — 1st');
  const [quantity, setQuantity] = useState<number>(250);
  const [paymentReceived, setPaymentReceived] = useState<number>(0);
  const [remarks, setRemarks] = useState('');
  const [immediateGatePass, setImmediateGatePass] = useState(true);

  // Quarry Rate Condition & Load Formula (Prompt 2 Specifications)
  const [rateCondition, setRateCondition] = useState<RateCondition>('Standard Rock');
  const [physicalQuantity, setPhysicalQuantity] = useState<number>(260);
  const [freeQuantity, setFreeQuantity] = useState<number>(5);
  const [ratedQuantity, setRatedQuantity] = useState<number>(255);
  // Vehicle Received Quantity (stored completely independently from quarry rated quantity)
  const [vehicleReceivedQuantity, setVehicleReceivedQuantity] = useState<number>(260);

  // Master Prompt: Special 3rd-Trip Trading Load & Loading Charge Options
  const [isSpecialTradingLoad, setIsSpecialTradingLoad] = useState<boolean>(false);
  const [loadingPaidByQuarry, setLoadingPaidByQuarry] = useState<boolean>(false);

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
      if (ord.quantity) {
        setQuantity(ord.quantity);
        setVehicleReceivedQuantity(ord.quantity);
      }
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
        setPhysicalQuantity(initialData.physicalQuantity || 260);
        setFreeQuantity(initialData.freeQuantity || 5);
        setRatedQuantity(initialData.ratedQuantity || 255);
        setVehicleReceivedQuantity(initialData.vehicleReceivedQuantity || initialData.quantity || 260);
        setRateCondition(initialData.rateCondition || (activeQuarry?.id === 'quarry-001-b' ? 'Weaker Rock' : 'Standard Rock'));
        if (initialData.quarryRate) setCustomQuarryRate(initialData.quarryRate);
        else setCustomQuarryRate(null);
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
        setPhysicalQuantity(260);
        setFreeQuantity(5);
        setRatedQuantity(255);
        setVehicleReceivedQuantity(260);
        setRateCondition(activeQuarry?.id === 'quarry-001-b' ? 'Weaker Rock' : 'Standard Rock');
        setCustomQuarryRate(null);
        setPaymentReceived(0);
        setRemarks('');
        setImmediateGatePass(true);
      }
    }
  }, [isOpen, initialData, vehicles, customers, activeQuarry]);

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
      setRatedQuantity(1);
      setVehicleReceivedQuantity(1);
    } else {
      setQuantity(250);
      setPhysicalQuantity(260);
      setFreeQuantity(5);
      setRatedQuantity(255);
      setVehicleReceivedQuantity(260);
    }
  };

  if (!isOpen) return null;

  // Live Auto Calculations according to Rate Condition & Formula
  const is3rd = material === 'Laterite Stone — 3rd';

  // Quarry purchase rate based on Rate Condition (Standard Rock vs Weaker Rock)
  const activeQuarryRates =
    rateCondition === 'Weaker Rock' && rates.weakerRockRates
      ? rates.weakerRockRates
      : rates.quarryRates;

  const calculatedQuarryRate =
    activeQuarryRates[material]?.ratePerUnit ||
    (is3rd
      ? rates.muryLoadRate || 1000
      : material === 'Laterite Stone — 1st'
      ? rateCondition === 'Weaker Rock'
        ? 41
        : 43
      : rateCondition === 'Weaker Rock'
      ? 31
      : 33);

  // Master Prompt: Special 3rd-Trip Trading Load Rates (1st: ₹45, 2nd: ₹35, 3rd: ₹3,000, Latt: ₹1,200)
  const specialTradingRate = is3rd
    ? 3000
    : material === 'Laterite Stone — 1st'
    ? 45
    : material === 'Laterite Stone — 2nd'
    ? 35
    : 1200;

  const effectiveCalculatedQuarryRate = isSpecialTradingLoad
    ? specialTradingRate
    : calculatedQuarryRate;

  const quarryRate = customQuarryRate !== null ? customQuarryRate : effectiveCalculatedQuarryRate;

  // Quarry purchase bill uses Rated Quantity (255 pcs or load count)
  const effectiveQuarryBillQty = is3rd ? quantity : (ratedQuantity || 255);
  const quarryAmount = is3rd ? quarryRate * quantity : effectiveQuarryBillQty * quarryRate;

  // Customer sale rate
  const defaultRzRate = rates.rzCustomerRates[material]?.ratePerUnit || (is3rd ? 5000 : 65);
  const customerSaleRate =
    customRate !== null ? customRate : vehicleCategory === 'RZ Mining' ? defaultRzRate : quarryRate;

  // Vehicle side uses actual vehicle received quantity (e.g., 260 or 250)
  const effectiveVehicleSaleQty = is3rd ? quantity : (vehicleReceivedQuantity || quantity || 260);
  const customerSaleAmount = is3rd
    ? customerSaleRate * quantity
    : vehicleCategory === 'RZ Mining'
    ? effectiveVehicleSaleQty * customerSaleRate
    : quarryAmount;

  let driverBatta = 0;
  let vehicleTripRent = 0;
  let loadingCharge = 0;
  let diesel = 0;
  let orderCommission = 0;
  let totalExpense = 0;
  let netProfit = 0;

  if (vehicleCategory === 'RZ Mining') {
    const multiplier = is3rd ? quantity : effectiveVehicleSaleQty / 250;
    driverBatta = rates.loadExpenses.driverBatta * (multiplier || 1);
    vehicleTripRent = rates.loadExpenses.vehicleTripRent * (multiplier || 1);
    loadingCharge = rates.loadExpenses.loadingCharge * (multiplier || 1);
    diesel = rates.loadExpenses.diesel * (multiplier || 1);
    orderCommission = (rates.loadExpenses.commissions[material] || 250) * (multiplier || 1);

    // If loading is paid by Quarry, reduce trip rent accordingly
    if (loadingPaidByQuarry) {
      vehicleTripRent = Math.max(0, vehicleTripRent - loadingCharge);
    }
    // If it's a special 3rd trip trading load, vehicle acts as stone purchase/resale
    if (isSpecialTradingLoad) {
      vehicleTripRent = 0;
    }

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
        rateCondition,
        physicalQuantity: is3rd ? undefined : Number(physicalQuantity),
        freeQuantity: is3rd ? undefined : Number(freeQuantity),
        ratedQuantity: is3rd ? quantity : Number(ratedQuantity),
        vehicleReceivedQuantity: is3rd ? quantity : Number(vehicleReceivedQuantity),
        quarryRate,
        customerSaleRate,
        paymentReceived: Number(paymentReceived) || 0,
        agentName,
        paymentTerms,
        remarks,
        status: immediateGatePass ? 'Draft' : 'Loaded',
        isSpecialTradingLoad,
        loadType: isSpecialTradingLoad ? 'VEHICLE_STONE_PURCHASE' : 'QUARRY_SALE',
        loadingPaidByQuarry,
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
      <div className="bg-[#101218] border border-[#262c3e] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#141722] border-b border-[#262c3e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-cinzel font-bold text-base text-gray-100 tracking-wide">
                New Quarry Load / Order Dispatch
              </h3>
              <p className="text-[11px] text-[#d4af37]/80">
                Direct Pit Extraction • 260 + 5 Free = 255 Rated • Independent Vehicle Received Qty
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Top Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-[#0b0c10] border border-[#1f2433] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-300 font-semibold">DIRECT PIT EXTRACTION & DISPATCH</span>
            </div>
            <div className="text-gray-400">
              Date: <b className="text-white font-mono">{getTodayDateString()}</b> • Time: <b className="text-white font-mono">{getCurrentTimeString()}</b>
            </div>
          </div>

          {/* Connect Booked Customer Order */}
          <div className="p-3 bg-[#131622] rounded-xl border border-[#d4af37]/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#d4af37] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Dispatch From Booked Customer Order (Optional)</span>
              </label>
              {selectedOrderId && (
                <button
                  type="button"
                  onClick={() => handleOrderSelect('')}
                  className="text-[10px] text-gray-400 hover:text-white underline"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <select
              value={selectedOrderId}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="w-full bg-[#181d2a] border border-[#2e374d] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-[#d4af37]"
            >
              <option value="">-- Manual Direct Load (No Prior Booking) --</option>
              {orders
                .filter(
                  (o) =>
                    o.status === 'CONFIRMED' ||
                    o.status === 'ALLOCATED' ||
                    o.status === 'READY FOR LOADING' ||
                    o.status === 'NEW'
                )
                .map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderId} • {ord.customer} — {ord.quality} ({ord.quantity} pcs @ ₹{ord.rate}) • {ord.deliveryLocation}
                  </option>
                ))}
            </select>
          </div>

          {/* Vehicle Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Vehicle Number *
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

          {/* Rate Condition & Material Section */}
          <div className="p-3.5 bg-[#0b0d12] rounded-xl border border-[#202535] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Quarry Rate Condition * (Strict Rule: Never 'Medium')
                </label>
                <select
                  value={rateCondition}
                  onChange={(e) => setRateCondition(e.target.value as RateCondition)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-[#f3c64c] font-bold focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="Standard Rock">Standard Rock (Section A — 1st ₹43 / 2nd ₹33)</option>
                  <option value="Weaker Rock">Weaker Rock (Section B — 1st ₹41 / 2nd ₹31)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Stone Quality / Material *
                </label>
                <select
                  value={material}
                  onChange={(e) => handleMaterialChange(e.target.value as MaterialType)}
                  className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="Laterite Stone — 1st">Laterite Stone — 1st (8 corners intact)</option>
                  <option value="Laterite Stone — 2nd">Laterite Stone — 2nd (~3/4 corners intact)</option>
                  <option value="Laterite Stone — 3rd">Laterite Stone — 3rd / Mury (Load Unit)</option>
                </select>
              </div>
            </div>

            {/* Special Trading Load & Quarry Loading Paid Option */}
            <div className="p-3 rounded-xl bg-[#131622] border border-[#2b334a] space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpecialTradingLoad}
                    onChange={(e) => setIsSpecialTradingLoad(e.target.checked)}
                    className="w-4 h-4 rounded text-[#d4af37] accent-[#d4af37] cursor-pointer"
                  />
                  <span className="font-bold text-amber-300">
                    Special 3rd-Trip Trading Load (Stone Purchase: 1st ₹45, 2nd ₹35, 3rd ₹3,000, Latt ₹1,200)
                  </span>
                </label>
                <span className="text-[10px] font-mono text-gray-400">
                  {isSpecialTradingLoad ? 'STONE PURCHASE / TRADING LOAD' : 'QUARRY PRODUCTION SALE'}
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-[#1f2638]">
                <input
                  type="checkbox"
                  checked={loadingPaidByQuarry}
                  onChange={(e) => setLoadingPaidByQuarry(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-400 accent-sky-400 cursor-pointer"
                />
                <span className="text-gray-300">
                  Quarry Pays Loading (₹900) — <span className="text-gray-400">Reduces vehicle trip rent accordingly</span>
                </span>
              </label>
            </div>

            {/* Operational Load Formula: 260 + 5 Free = 255 Rated vs Vehicle Received Qty */}
            {!is3rd ? (
              <div className="p-3 rounded-xl bg-[#11141e] border border-sky-800/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Operational Load Formula: 260 + 5 Free = 255 Rated</span>
                  </span>
                  <span className="text-[10px] text-gray-400">Physical ≠ Overwritten</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Physical Qty (Pit)</label>
                    <input
                      type="number"
                      value={physicalQuantity}
                      onChange={(e) => setPhysicalQuantity(Number(e.target.value) || 0)}
                      className="w-full bg-[#161924] border border-[#2a3044] rounded-lg px-2.5 py-1.5 font-mono font-bold text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Free Buffer Qty</label>
                    <input
                      type="number"
                      value={freeQuantity}
                      onChange={(e) => setFreeQuantity(Number(e.target.value) || 0)}
                      className="w-full bg-[#161924] border border-[#2a3044] rounded-lg px-2.5 py-1.5 font-mono font-bold text-emerald-400 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Quarry Rated (Bill)</label>
                    <input
                      type="number"
                      value={ratedQuantity}
                      onChange={(e) => setRatedQuantity(Number(e.target.value) || 0)}
                      className="w-full bg-[#161924] border border-[#2a3044] rounded-lg px-2.5 py-1.5 font-mono font-bold text-[#f3c64c] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-amber-300 font-bold mb-0.5">Vehicle Received Qty *</label>
                    <input
                      type="number"
                      value={vehicleReceivedQuantity}
                      onChange={(e) => setVehicleReceivedQuantity(Number(e.target.value) || 0)}
                      className="w-full bg-[#161924] border border-amber-500/50 rounded-lg px-2.5 py-1.5 font-mono font-bold text-amber-300 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 leading-relaxed">
                  <span className="text-[#f3c64c] font-semibold">Vehicle-Side Rule:</span> Vehicle Received Quantity ({vehicleReceivedQuantity} pcs) is stored independently from Quarry Rated Quantity ({ratedQuantity} pcs). The vehicle ledger computes revenue using the actual quantity received/unloaded.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
                <span className="font-bold text-amber-400 block">Mury Load Accounting:</span>
                <p className="text-[11px] text-gray-300">
                  Mury does NOT have a quarry-level piece-count requirement. Recorded strictly as <b>{quantity} LOAD</b> at {formatCurrency(quarryRate)}/load.
                </p>
              </div>
            )}

            {/* Sale Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center justify-between">
                  <span>Customer Sale Rate (₹ / {is3rd ? 'load' : 'pc'})</span>
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-300">
                    Quarry Purchase Rate
                  </label>
                  {customQuarryRate !== null && (
                    <button
                      type="button"
                      onClick={() => setCustomQuarryRate(null)}
                      className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                    >
                      Reset ({formatCurrency(calculatedQuarryRate)})
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={quarryRate}
                    onChange={(e) => setCustomQuarryRate(Number(e.target.value) || 0)}
                    className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-sm text-gray-100 font-mono font-bold focus:outline-none focus:border-[#d4af37]"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-gray-400 uppercase font-sans pointer-events-none">
                    {customQuarryRate !== null ? 'Custom' : rateCondition}
                  </span>
                </div>
              </div>
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
                <option value="Direct Order">Direct Order (No Commission)</option>
                <option value="Siddique (Orderman)">Siddique (Orderman — ₹250/load)</option>
                <option value="Ashraf (Agent)">Ashraf (Agent — ₹250/load)</option>
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
                Quarry: {effectiveQuarryBillQty} {is3rd ? 'load' : 'pcs rated'} • Vehicle: {effectiveVehicleSaleQty} {is3rd ? 'load' : 'pcs'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
              {/* Quarry Purchase */}
              <div className="p-2.5 rounded-lg bg-[#0a0c10] border border-[#222736]">
                <div className="text-[10px] text-gray-400">Quarry Cost ({effectiveQuarryBillQty} {is3rd ? 'load' : 'rated'})</div>
                <div className="text-gray-300 font-mono">
                  {is3rd ? formatCurrency(quarryRate) : `${formatCurrency(quarryRate)}/pc`}
                </div>
                <div className="text-sm font-bold text-gray-100 font-mono mt-1">
                  {formatCurrency(quarryAmount)}
                </div>
              </div>

              {/* Customer Sale */}
              <div className="p-2.5 rounded-lg bg-[#0a0c10] border border-[#d4af37]/30">
                <div className="text-[10px] text-[#d4af37]">Customer Sale ({effectiveVehicleSaleQty} {is3rd ? 'load' : 'pcs'})</div>
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
              className="w-full bg-[#161924] border border-[#2a3044] rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Instant Gate Pass Generation */}
          <div className="flex items-center gap-2 p-3 bg-[#0d0f15] border border-[#1e2332] rounded-xl text-xs">
            <input
              type="checkbox"
              id="immediateGatePass"
              checked={immediateGatePass}
              onChange={(e) => setImmediateGatePass(e.target.checked)}
              className="w-4 h-4 rounded text-[#d4af37] focus:ring-0 bg-[#161924] border-[#2a3044]"
            />
            <label htmlFor="immediateGatePass" className="text-gray-300 select-none cursor-pointer">
              Automatically issue Outward Gate Pass immediately upon load creation
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#1f2434] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white bg-[#141722] border border-[#262c3e]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gold-btn px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Dispatch Load</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
