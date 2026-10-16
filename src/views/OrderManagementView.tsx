import React, { useState, useMemo } from 'react';
import { useQuarry } from '../context/QuarryContext';
import {
  StoneOrder,
  OrderStatus,
  OrderPaymentTerms,
  MaterialType,
  PaymentMode,
} from '../types/quarry';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  getTodayDateString,
  getCurrentTimeString,
} from '../utils/formatters';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Truck,
  Car,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Eye,
  Trash2,
  Edit2,
  Ticket,
  DollarSign,
  Receipt,
  X,
  CreditCard,
  Building2,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface OrderManagementViewProps {
  onOpenNewLoad?: (initialData?: any) => void;
  onViewGatePass?: (gatePassNumber: string) => void;
  onViewCustomerLedger?: (customerId: string) => void;
}

const WORKFLOW_STAGES: {
  id: string;
  label: string;
  statuses: OrderStatus[];
  description: string;
}[] = [
  { id: '1', label: '1. Order', statuses: ['NEW', 'CONFIRMED'], description: 'Booked & confirmed' },
  { id: '2', label: '2. Vehicle Assignment', statuses: ['ALLOCATED'], description: 'Fleet tipper assigned' },
  { id: '3', label: '3. Gate Entry', statuses: ['READY FOR LOADING'], description: 'At quarry gate queue' },
  { id: '4', label: '4. Loading', statuses: ['LOADING'], description: 'Excavator pit loading' },
  { id: '5', label: '5. Dispatch', statuses: ['DISPATCHED'], description: 'Gate pass verified on road' },
  { id: '6', label: '6. Delivery', statuses: ['DELIVERED'], description: 'Arrived & unloaded at site' },
  { id: '7', label: '7. Bill', statuses: ['PAYMENT PENDING'], description: 'Statement billed' },
  { id: '8', label: '8. Payment', statuses: ['PARTIALLY PAID'], description: 'Payment collected' },
  { id: '9', label: '9. Settlement', statuses: ['PAID'], description: 'Fully settled' },
];

export const OrderManagementView: React.FC<OrderManagementViewProps> = ({
  onOpenNewLoad,
  onViewGatePass,
  onViewCustomerLedger,
}) => {
  const {
    orders,
    customers,
    vehicles,
    rates,
    createOrder,
    updateOrder,
    deleteOrder,
    advanceOrderWorkflow,
    assignVehicleToOrder,
    dispatchOrder,
  } = useQuarry();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [termsFilter, setTermsFilter] = useState<string>('ALL');
  const [qualityFilter, setQualityFilter] = useState<string>('ALL');
  const [selectedWorkflowStage, setSelectedWorkflowStage] = useState<string>('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Selected Order for Modal
  const [activeOrder, setActiveOrder] = useState<StoneOrder | null>(null);

  // Form State for Create / Edit Order
  const [formOrderId, setFormOrderId] = useState('');
  const [formOrderDate, setFormOrderDate] = useState(getTodayDateString());
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formDeliveryLocation, setFormDeliveryLocation] = useState('');
  const [formAgentName, setFormAgentName] = useState('Direct Order');
  const [formQuality, setFormQuality] = useState<MaterialType>('Laterite Stone — 1st');
  const [formQuantity, setFormQuantity] = useState<number>(250);
  const [formUnit, setFormUnit] = useState<'pcs' | 'load'>('pcs');
  const [formRate, setFormRate] = useState<number>(65);
  const [formCommission, setFormCommission] = useState<number>(250);
  const [formPaymentTerms, setFormPaymentTerms] = useState<OrderPaymentTerms>('IMMEDIATE');
  const [formAssignedVehicle, setFormAssignedVehicle] = useState('');
  const [formDriver, setFormDriver] = useState('');
  const [formRequiredDate, setFormRequiredDate] = useState(getTodayDateString());
  const [formRemarks, setFormRemarks] = useState('');
  const [formStatus, setFormStatus] = useState<OrderStatus>('NEW');

  // Assign Vehicle Modal Form State
  const [assignVehicleNum, setAssignVehicleNum] = useState('');
  const [assignDriverName, setAssignDriverName] = useState('');

  // Payment Recording Form State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paymentRef, setPaymentRef] = useState('');

  // Handle open create order modal
  const handleOpenCreate = () => {
    const year = new Date().getFullYear();
    const nextId = `ORD-${year}-${Math.floor(100 + Math.random() * 900)}`;
    setFormOrderId(nextId);
    setFormOrderDate(getTodayDateString());
    if (customers.length > 0) {
      setFormCustomerId(customers[0].id);
      setFormCustomerName(customers[0].name);
      setFormCustomerPhone(customers[0].phone);
      setFormDeliveryLocation(customers[0].destination);
    } else {
      setFormCustomerId('');
      setFormCustomerName('');
      setFormCustomerPhone('');
      setFormDeliveryLocation('');
    }
    setFormAgentName('Direct Order');
    setFormQuality('Laterite Stone — 1st');
    setFormQuantity(250);
    setFormUnit('pcs');
    setFormRate(rates.rzCustomerRates['Laterite Stone — 1st']?.ratePerUnit || 65);
    setFormCommission(250);
    setFormPaymentTerms('IMMEDIATE');
    setFormAssignedVehicle('');
    setFormDriver('');
    setFormRequiredDate(getTodayDateString());
    setFormRemarks('');
    setFormStatus('NEW');
    setShowCreateModal(true);
  };

  // When customer is selected from dropdown
  const handleCustomerChange = (id: string) => {
    setFormCustomerId(id);
    const c = customers.find((cust) => cust.id === id);
    if (c) {
      setFormCustomerName(c.name);
      setFormCustomerPhone(c.phone);
      setFormDeliveryLocation(c.destination);
    }
  };

  // When quality changes
  const handleQualityChange = (q: MaterialType) => {
    setFormQuality(q);
    const is3rd = q === 'Laterite Stone — 3rd';
    if (is3rd) {
      setFormUnit('load');
      setFormQuantity(1);
      setFormRate(rates.rzCustomerRates[q]?.ratePerUnit || 5000);
      setFormCommission(300);
    } else {
      setFormUnit('pcs');
      setFormQuantity(250);
      setFormRate(rates.rzCustomerRates[q]?.ratePerUnit || 65);
      setFormCommission(250);
    }
  };

  // Save new order
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomerName.trim() || !formDeliveryLocation.trim() || formQuantity <= 0) {
      alert('Please fill in Customer, Delivery Location, and valid Quantity.');
      return;
    }

    const grossAmount = formUnit === 'load' ? formRate * formQuantity : formRate * formQuantity;

    createOrder({
      orderId: formOrderId,
      orderDate: formOrderDate,
      customerId: formCustomerId,
      customer: formCustomerName,
      customerPhone: formCustomerPhone,
      deliveryLocation: formDeliveryLocation,
      agentName: formAgentName,
      quality: formQuality,
      quantity: Number(formQuantity),
      unit: formUnit,
      rate: Number(formRate),
      grossAmount,
      commission: Number(formCommission),
      paymentTerms: formPaymentTerms,
      assignedVehicle: formAssignedVehicle || undefined,
      driver: formDriver || undefined,
      requiredDate: formRequiredDate,
      remarks: formRemarks,
      status: formAssignedVehicle ? 'ALLOCATED' : formStatus,
    });

    setShowCreateModal(false);
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (termsFilter !== 'ALL' && o.paymentTerms !== termsFilter) return false;
      if (qualityFilter !== 'ALL' && o.quality !== qualityFilter) return false;

      if (selectedWorkflowStage !== 'ALL') {
        const stage = WORKFLOW_STAGES.find((s) => s.id === selectedWorkflowStage);
        if (stage && !stage.statuses.includes(o.status)) return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches =
          o.orderId.toLowerCase().includes(term) ||
          o.customer.toLowerCase().includes(term) ||
          o.customerPhone.toLowerCase().includes(term) ||
          o.deliveryLocation.toLowerCase().includes(term) ||
          (o.assignedVehicle && o.assignedVehicle.toLowerCase().includes(term)) ||
          (o.driver && o.driver.toLowerCase().includes(term)) ||
          o.agentName.toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [orders, statusFilter, termsFilter, qualityFilter, selectedWorkflowStage, searchTerm]);

  // Stage order counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    WORKFLOW_STAGES.forEach((stage) => {
      counts[stage.id] = orders.filter((o) => stage.statuses.includes(o.status)).length;
    });
    return counts;
  }, [orders]);

  // Overall KPI stats
  const kpiStats = useMemo(() => {
    const activePipeline = orders.filter(
      (o) =>
        o.status === 'ALLOCATED' ||
        o.status === 'READY FOR LOADING' ||
        o.status === 'LOADING' ||
        o.status === 'DISPATCHED'
    ).length;

    const totalGross = orders.reduce((sum, o) => sum + (o.grossAmount || 0), 0);
    const totalCollected = orders.reduce((sum, o) => sum + (o.paymentReceived || 0), 0);
    const totalPending = orders.reduce((sum, o) => sum + (o.balance || 0), 0);

    return {
      totalOrders: orders.length,
      activePipeline,
      totalGross,
      totalCollected,
      totalPending,
    };
  }, [orders]);

  // Open vehicle assignment modal
  const handleOpenAssignVehicle = (order: StoneOrder) => {
    setActiveOrder(order);
    const rzVeh = vehicles.find((v) => v.status === 'Available') || vehicles[0];
    setAssignVehicleNum(order.assignedVehicle || rzVeh?.vehicleNumber || '');
    setAssignDriverName(order.driver || rzVeh?.driver || '');
    setShowAssignModal(true);
  };

  // Submit vehicle assignment
  const handleSaveVehicleAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !assignVehicleNum) return;

    assignVehicleToOrder(activeOrder.id, assignVehicleNum, assignDriverName);
    setShowAssignModal(false);
  };

  // Open Payment modal
  const handleOpenPayment = (order: StoneOrder) => {
    setActiveOrder(order);
    setPaymentAmount(String(order.balance || order.grossAmount));
    setPaymentMode('Cash');
    setPaymentRef('');
    setShowPaymentModal(true);
  };

  // Submit Payment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !paymentAmount || Number(paymentAmount) <= 0) return;

    const amt = Number(paymentAmount);
    const newPaid = (activeOrder.paymentReceived || 0) + amt;
    const newBal = Math.max(0, activeOrder.grossAmount - newPaid);
    const newStatus: OrderStatus = newBal <= 0 ? 'PAID' : 'PARTIALLY PAID';

    advanceOrderWorkflow(activeOrder.id, newStatus, {
      paymentReceived: newPaid,
      balance: newBal,
    });

    setShowPaymentModal(false);
  };

  // Direct Dispatch helper
  const handleDirectDispatch = (order: StoneOrder) => {
    try {
      const gp = dispatchOrder(order.id, order.paymentReceived || 0, order.remarks);
      if (onViewGatePass) {
        onViewGatePass(gp.gatePassNumber);
      }
    } catch (err) {
      alert(String(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#10141f] border border-[#232a3e] relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black shadow">
                <FileSpreadsheet className="w-5 h-5 stroke-[2.5]" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-cinzel text-gray-100 tracking-wide">
                Laterite Stone Order Management
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/70 text-amber-300 border border-amber-700/50">
                End-to-End Workflow Engine
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 max-w-2xl leading-relaxed">
              Order booking, automated vehicle allocation, gate entry, pit loading, dispatch with gate pass, delivery, billing and payment settlement. Integrated with Vehicle Fleet with{' '}
              <span className="text-amber-400 font-semibold">zero duplicate data</span>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Book New Order</span>
            </button>
          </div>
        </div>

        {/* 2. Interactive 9-Stage Workflow Pipeline Track */}
        <div className="mt-5 pt-4 border-t border-[#1e2436]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2 flex items-center justify-between">
            <span>Official Quarry Workflow Progression</span>
            <span className="text-gray-500">Click any stage to filter orders</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 overflow-x-auto pb-1">
            {WORKFLOW_STAGES.map((stage) => {
              const isSelected = selectedWorkflowStage === stage.id;
              const count = stageCounts[stage.id] || 0;
              return (
                <button
                  key={stage.id}
                  onClick={() =>
                    setSelectedWorkflowStage(isSelected ? 'ALL' : stage.id)
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-500/20 to-amber-700/10 border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-[#141824] border-[#22283a] hover:bg-[#1a2030]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                      Step {stage.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        count > 0
                          ? 'bg-amber-400 text-black'
                          : 'bg-[#1e2436] text-gray-500'
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-bold mt-1 truncate ${
                      isSelected ? 'text-amber-300' : 'text-gray-200'
                    }`}
                  >
                    {stage.label.split('. ')[1]}
                  </div>
                  <div className="text-[9px] text-gray-500 truncate mt-0.5">
                    {stage.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. KPI Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-[#121520] border border-[#23293e]">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">Total Orders Booked</div>
          <div className="text-2xl font-black font-mono text-gray-100 mt-1">
            {kpiStats.totalOrders}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">All workflow stages</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121520] border border-[#23293e]">
          <div className="text-[10px] text-sky-400 uppercase font-semibold">Active Fleet Pipeline</div>
          <div className="text-2xl font-black font-mono text-sky-400 mt-1">
            {kpiStats.activePipeline}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Allocated, Loading or Dispatched</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121520] border border-[#23293e]">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Total Gross Order Value</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {formatCurrency(kpiStats.totalGross)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Collected: {formatCurrency(kpiStats.totalCollected)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#121520] border border-[#23293e]">
          <div className="text-[10px] text-amber-400 uppercase font-semibold">Pending Receivables</div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {formatCurrency(kpiStats.totalPending)}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Awaiting customer collection</div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="p-4 rounded-2xl bg-[#121520] border border-[#23293e] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Order ID, Customer, Phone, Vehicle, Agent, Location..."
              className="w-full bg-[#161a26] border border-[#262c3e] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-400 font-medium"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#161a26] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-400 font-medium"
            >
              <option value="ALL">All Order Statuses ({orders.length})</option>
              <option value="NEW">NEW</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="ALLOCATED">ALLOCATED</option>
              <option value="READY FOR LOADING">READY FOR LOADING</option>
              <option value="LOADING">LOADING</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="PAYMENT PENDING">PAYMENT PENDING</option>
              <option value="PARTIALLY PAID">PARTIALLY PAID</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Payment Terms Filter */}
          <div>
            <select
              value={termsFilter}
              onChange={(e) => setTermsFilter(e.target.value)}
              className="w-full bg-[#161a26] border border-[#262c3e] rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-400 font-medium"
            >
              <option value="ALL">All Payment Terms</option>
              <option value="IMMEDIATE">IMMEDIATE</option>
              <option value="DAILY">DAILY</option>
              <option value="WEEKLY">WEEKLY</option>
              <option value="CUSTOM">CUSTOM</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e2334] text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-gray-400 mr-1 font-semibold">Terms:</span>
            {(['ALL', 'IMMEDIATE', 'DAILY', 'WEEKLY', 'CUSTOM'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTermsFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  termsFilter === t
                    ? 'bg-amber-400 text-black shadow font-black'
                    : 'bg-[#181c28] text-gray-400 hover:text-gray-200 border border-[#252b3e]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-gray-400">
            Showing <span className="text-white font-bold">{filteredOrders.length}</span> orders
          </div>
        </div>
      </div>

      {/* 5. Orders Master Table & Ledger */}
      <div className="bg-[#121520] rounded-2xl border border-[#23293e] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#161a26] border-b border-[#232736] text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="p-3.5">Order ID & Date</th>
                <th className="p-3.5">Customer & Phone</th>
                <th className="p-3.5">Destination / Location</th>
                <th className="p-3.5">Quality & Quantity</th>
                <th className="p-3.5">Rate & Gross (₹)</th>
                <th className="p-3.5">Orderman / Agent</th>
                <th className="p-3.5">Payment Terms</th>
                <th className="p-3.5">Assigned Vehicle</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Workflow Action</th>
                <th className="p-3.5 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2332]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-gray-500 text-xs">
                    No orders found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-[#151926] transition-colors group"
                    >
                      {/* Order ID & Date */}
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-amber-400 text-sm">
                          {ord.orderId}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {formatDate(ord.orderDate)}
                        </div>
                        {ord.gatePassNumber && (
                          <div className="text-[9px] font-mono text-sky-400 mt-0.5">
                            Pass: {ord.gatePassNumber}
                          </div>
                        )}
                      </td>

                      {/* Customer & Phone */}
                      <td className="p-3.5">
                        <div className="font-bold text-gray-100">{ord.customer}</div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-gray-500 shrink-0" />
                          <span>{ord.customerPhone || '—'}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="p-3.5 max-w-xs">
                        <div className="text-gray-200 text-xs truncate flex items-center gap-1" title={ord.deliveryLocation}>
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{ord.deliveryLocation}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Req: {formatDate(ord.requiredDate)}
                        </div>
                      </td>

                      {/* Quality & Qty */}
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-200">{ord.quality}</div>
                        <div className="font-mono text-gray-400 text-[11px] mt-0.5">
                          {formatNumber(ord.quantity)} {ord.unit}
                        </div>
                      </td>

                      {/* Rate & Gross Amount */}
                      <td className="p-3.5 font-mono">
                        <div className="font-black text-emerald-400 text-sm">
                          {formatCurrency(ord.grossAmount)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          ₹{ord.rate} / {ord.unit === 'load' ? 'load' : 'pc'}
                        </div>
                        {ord.balance > 0 ? (
                          <div className="text-[9px] text-amber-400">
                            Due: {formatCurrency(ord.balance)}
                          </div>
                        ) : (
                          <div className="text-[9px] text-emerald-400 font-bold">Cleared</div>
                        )}
                      </td>

                      {/* Orderman / Agent */}
                      <td className="p-3.5">
                        <div className="text-gray-200 font-medium">{ord.agentName}</div>
                        {ord.commission > 0 && (
                          <div className="text-[10px] text-gray-500 font-mono">
                            Comm: {formatCurrency(ord.commission)}
                          </div>
                        )}
                      </td>

                      {/* Payment Terms */}
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                            ord.paymentTerms === 'IMMEDIATE'
                              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40'
                              : ord.paymentTerms === 'DAILY'
                              ? 'bg-amber-950/70 text-amber-400 border border-amber-800/40'
                              : ord.paymentTerms === 'WEEKLY'
                              ? 'bg-sky-950/70 text-sky-400 border border-sky-800/40'
                              : 'bg-purple-950/70 text-purple-400 border border-purple-800/40'
                          }`}
                        >
                          {ord.paymentTerms}
                        </span>
                      </td>

                      {/* Assigned Vehicle */}
                      <td className="p-3.5">
                        {ord.assignedVehicle ? (
                          <div>
                            <div className="font-mono font-bold text-white flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-amber-400" />
                              <span>{ord.assignedVehicle}</span>
                            </div>
                            <div className="text-[10px] text-gray-400">{ord.driver}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenAssignVehicle(ord)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#1b2030] text-amber-400 hover:bg-amber-400 hover:text-black border border-amber-500/30 transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Assign Fleet</span>
                          </button>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider inline-block ${
                            ord.status === 'NEW'
                              ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                              : ord.status === 'CONFIRMED'
                              ? 'bg-sky-950/60 text-sky-300 border border-sky-800/40'
                              : ord.status === 'ALLOCATED'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                              : ord.status === 'READY FOR LOADING'
                              ? 'bg-yellow-950/60 text-yellow-300 border border-yellow-800/40'
                              : ord.status === 'LOADING'
                              ? 'bg-orange-950/60 text-orange-300 border border-orange-800/40 animate-pulse'
                              : ord.status === 'DISPATCHED'
                              ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                              : ord.status === 'DELIVERED'
                              ? 'bg-teal-950/60 text-teal-300 border border-teal-800/40'
                              : ord.status === 'PAYMENT PENDING'
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                              : ord.status === 'PARTIALLY PAID'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                              : ord.status === 'PAID'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>

                      {/* Workflow Progression Action */}
                      <td className="p-3.5 text-center">
                        {ord.status === 'NEW' && (
                          <button
                            onClick={() => advanceOrderWorkflow(ord.id, 'CONFIRMED')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-black border border-sky-500/30 transition-all"
                          >
                            Confirm Order
                          </button>
                        )}
                        {ord.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleOpenAssignVehicle(ord)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-400 hover:text-black border border-amber-500/30 transition-all"
                          >
                            Assign Vehicle
                          </button>
                        )}
                        {ord.status === 'ALLOCATED' && (
                          <button
                            onClick={() => advanceOrderWorkflow(ord.id, 'READY FOR LOADING')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-400 hover:text-black border border-yellow-500/30 transition-all"
                          >
                            Gate Entry
                          </button>
                        )}
                        {ord.status === 'READY FOR LOADING' && (
                          <button
                            onClick={() => advanceOrderWorkflow(ord.id, 'LOADING')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500/20 text-orange-400 hover:bg-orange-400 hover:text-black border border-orange-500/30 transition-all"
                          >
                            Start Loading
                          </button>
                        )}
                        {ord.status === 'LOADING' && (
                          <button
                            onClick={() => handleDirectDispatch(ord)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white border border-purple-500/30 transition-all flex items-center gap-1 mx-auto"
                          >
                            <Ticket className="w-3 h-3" />
                            <span>Dispatch Pass</span>
                          </button>
                        )}
                        {ord.status === 'DISPATCHED' && (
                          <button
                            onClick={() => advanceOrderWorkflow(ord.id, 'DELIVERED')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-black border border-teal-500/30 transition-all"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {ord.status === 'DELIVERED' && (
                          <button
                            onClick={() => advanceOrderWorkflow(ord.id, 'PAYMENT PENDING')}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-all flex items-center gap-1 mx-auto"
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Generate Bill</span>
                          </button>
                        )}
                        {(ord.status === 'PAYMENT PENDING' || ord.status === 'PARTIALLY PAID') && (
                          <button
                            onClick={() => handleOpenPayment(ord)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 transition-all flex items-center gap-1 mx-auto"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Collect Payment</span>
                          </button>
                        )}
                        {ord.status === 'PAID' && (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Settled</span>
                          </span>
                        )}
                        {ord.status === 'CANCELLED' && (
                          <span className="text-[10px] text-gray-500">Cancelled</span>
                        )}
                      </td>

                      {/* Manage Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setActiveOrder(ord);
                              setShowOrderDetailsModal(true);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1f2537]"
                            title="View Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete order ${ord.orderId}?`)) {
                                deleteOrder(ord.id);
                              }
                            }}
                            className="p-1 rounded text-gray-500 hover:text-rose-400 hover:bg-[#1f2537]"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MODAL: Create New Stone Order */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
          <div className="bg-[#121520] border border-[#2b334a] rounded-2xl w-full max-w-2xl p-5 shadow-2xl my-auto space-y-4">
            <div className="flex items-center justify-between border-b border-[#23293e] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-cinzel font-bold text-base text-gray-100">
                    Book Laterite Stone Order
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    All required fields for live production, fleet dispatch & settlement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
              {/* Order ID & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Order ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formOrderDate}
                    onChange={(e) => setFormOrderDate(e.target.value)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Required Delivery Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formRequiredDate}
                    onChange={(e) => setFormRequiredDate(e.target.value)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Customer Selection & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Customer Name *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formCustomerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      className="w-1/3 bg-[#161a26] border border-[#283045] rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="">-- Master --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      placeholder="Type customer or developer name"
                      className="flex-1 bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Customer Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomerPhone}
                    onChange={(e) => setFormCustomerPhone(e.target.value)}
                    placeholder="+91 94470 ..."
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Delivery Location & Orderman / Agent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Delivery Location / Site Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formDeliveryLocation}
                    onChange={(e) => setFormDeliveryLocation(e.target.value)}
                    placeholder="e.g. Perinthalmanna Bypass Site #2"
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Orderman / Agent
                  </label>
                  <select
                    value={formAgentName}
                    onChange={(e) => setFormAgentName(e.target.value)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Direct Order">Direct Order (No Commission)</option>
                    <option value="Shafi (Agent)">Shafi (Agent)</option>
                    <option value="Latheef (Agent)">Latheef (Agent)</option>
                    <option value="Rasheed (Orderman)">Rasheed (Orderman)</option>
                    <option value="Babu (Orderman)">Babu (Orderman)</option>
                  </select>
                </div>
              </div>

              {/* Quality, Quantity, Unit, Rate */}
              <div className="p-3 rounded-xl bg-[#0b0c10] border border-[#1f2537] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Quality *
                    </label>
                    <select
                      value={formQuality}
                      onChange={(e) => handleQualityChange(e.target.value as MaterialType)}
                      className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Laterite Stone — 1st">Laterite Stone — 1st</option>
                      <option value="Laterite Stone — 2nd">Laterite Stone — 2nd</option>
                      <option value="Laterite Stone — 3rd">Laterite Stone — 3rd</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(Number(e.target.value))}
                      className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Unit
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formUnit}
                      className="w-full bg-[#121520] border border-[#22283a] rounded-xl px-3 py-2 text-xs text-gray-400 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Rate (₹) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formRate}
                      onChange={(e) => setFormRate(Number(e.target.value))}
                      className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1a1f2e] text-xs">
                  <div className="text-gray-400">
                    Gross Calculation: <span className="font-mono text-gray-200">{formQuantity} × ₹{formRate}</span>
                  </div>
                  <div className="text-sm font-black font-mono text-emerald-400">
                    Gross: {formatCurrency(formRate * formQuantity)}
                  </div>
                </div>
              </div>

              {/* Commission, Payment Terms, Vehicle Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Commission (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCommission}
                    onChange={(e) => setFormCommission(Number(e.target.value))}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Payment Terms *
                  </label>
                  <select
                    value={formPaymentTerms}
                    onChange={(e) => setFormPaymentTerms(e.target.value as OrderPaymentTerms)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="IMMEDIATE">IMMEDIATE</option>
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Assign Fleet Tipper (Optional)
                  </label>
                  <select
                    value={formAssignedVehicle}
                    onChange={(e) => {
                      const vNum = e.target.value;
                      setFormAssignedVehicle(vNum);
                      const veh = vehicles.find((v) => v.vehicleNumber === vNum);
                      if (veh) setFormDriver(veh.driver);
                    }}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Allocate Later in Queue --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.vehicleNumber}>
                        {v.vehicleNumber} ({v.driver} • {v.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Remarks / Special Site Instructions
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="e.g. Unload near east boundary, call driver prior to arrival"
                  className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#23293e]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 font-black shadow-lg shadow-amber-400/20 cursor-pointer"
                >
                  Confirm & Book Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: Assign Vehicle & Driver */}
      {showAssignModal && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121520] border border-[#2b334a] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#23293e] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="font-cinzel font-bold text-base text-gray-100">
                  Allocate Fleet Vehicle — {activeOrder.orderId}
                </h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicleAssignment} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#202638] text-xs space-y-1">
                <div>
                  <span className="text-gray-400">Customer: </span>
                  <span className="font-bold text-white">{activeOrder.customer}</span>
                </div>
                <div>
                  <span className="text-gray-400">Site: </span>
                  <span className="text-gray-300">{activeOrder.deliveryLocation}</span>
                </div>
                <div>
                  <span className="text-gray-400">Material: </span>
                  <span className="font-mono text-amber-400 font-bold">
                    {activeOrder.quality} ({activeOrder.quantity} {activeOrder.unit})
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Choose Available Fleet Vehicle *
                </label>
                <select
                  required
                  value={assignVehicleNum}
                  onChange={(e) => {
                    const num = e.target.value;
                    setAssignVehicleNum(num);
                    const v = vehicles.find((veh) => veh.vehicleNumber === num);
                    if (v) setAssignDriverName(v.driver);
                  }}
                  className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Choose Tipper --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.vehicleNumber}>
                      {v.vehicleNumber} ({v.driver} • {v.category} • {v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Driver Name
                </label>
                <input
                  type="text"
                  required
                  value={assignDriverName}
                  onChange={(e) => setAssignDriverName(e.target.value)}
                  className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23293e]">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-black hover:bg-amber-300 font-black shadow-md shadow-amber-400/20 cursor-pointer"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: Record Payment */}
      {showPaymentModal && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121520] border border-[#2b334a] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#23293e] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="font-cinzel font-bold text-base text-gray-100">
                  Record Order Collection — {activeOrder.orderId}
                </h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#202638] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Gross:</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(activeOrder.grossAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Already Received:</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(activeOrder.paymentReceived)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#1a1f2e]">
                  <span className="text-amber-400 font-bold">Pending Due:</span>
                  <span className="font-mono font-black text-amber-400">{formatCurrency(activeOrder.balance)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Collection Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={activeOrder.balance || activeOrder.grossAmount}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Reference / Receipt #
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. UPI-9921"
                    className="w-full bg-[#161a26] border border-[#283045] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#23293e]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-400 text-black hover:bg-emerald-300 font-black shadow-md shadow-emerald-400/20 cursor-pointer"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: Order Full Details & Audit Slideover */}
      {showOrderDetailsModal && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121520] border border-[#2b334a] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#23293e] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h3 className="font-cinzel font-bold text-base text-gray-100">
                  Order Details — {activeOrder.orderId}
                </h3>
              </div>
              <button
                onClick={() => setShowOrderDetailsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto">
              <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2537] grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500 block">Status</span>
                  <span className="font-mono font-bold text-amber-400">{activeOrder.status}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Payment Terms</span>
                  <span className="font-mono font-bold text-emerald-400">{activeOrder.paymentTerms}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Order Date</span>
                  <span className="text-gray-200">{formatDate(activeOrder.orderDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Required Date</span>
                  <span className="text-gray-200">{formatDate(activeOrder.requiredDate)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2537] space-y-1.5">
                <div>
                  <span className="text-gray-500 block">Customer</span>
                  <span className="font-bold text-white text-sm">{activeOrder.customer}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Phone</span>
                  <span className="font-mono text-gray-300">{activeOrder.customerPhone || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Destination</span>
                  <span className="text-gray-300">{activeOrder.deliveryLocation}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2537] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Quality & Qty:</span>
                  <span className="font-bold text-white">{activeOrder.quality} ({activeOrder.quantity} {activeOrder.unit})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Rate:</span>
                  <span className="font-mono text-gray-200">₹{activeOrder.rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Gross Amount:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(activeOrder.grossAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Orderman / Agent:</span>
                  <span className="text-gray-200">{activeOrder.agentName} (₹{activeOrder.commission})</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2537] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">Assigned Fleet Vehicle:</span>
                  <span className="font-mono font-bold text-amber-400">{activeOrder.assignedVehicle || 'Not Allocated Yet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Driver:</span>
                  <span className="text-gray-200">{activeOrder.driver || '—'}</span>
                </div>
                {activeOrder.gatePassNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gate Pass Dispatched:</span>
                    <span className="font-mono text-sky-400 font-bold">{activeOrder.gatePassNumber}</span>
                  </div>
                )}
                {activeOrder.billNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Invoice Bill #:</span>
                    <span className="font-mono text-emerald-400 font-bold">{activeOrder.billNumber}</span>
                  </div>
                )}
              </div>

              {activeOrder.remarks && (
                <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2537]">
                  <span className="text-gray-500 block mb-0.5">Remarks</span>
                  <p className="text-gray-300 italic">{activeOrder.remarks}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#23293e]">
              <button
                type="button"
                onClick={() => setShowOrderDetailsModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1a1e2b] text-gray-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
