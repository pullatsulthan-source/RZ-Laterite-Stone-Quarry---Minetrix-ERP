import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppUser,
  Vehicle,
  Driver,
  Customer,
  Staff,
  StaffAttendance,
  StaffAdvance,
  StaffPayroll,
  RateConfig,
  LoadOrder,
  GatePass,
  ProductionEntry,
  StockAdjustment,
  QuarryIncome,
  QuarryExpense,
  CustomerPayment,
  MaterialType,
  PaymentMode,
  GoogleAuthUser,
  SavedStatement,
  DailyRotation,
  DailyRotationEntry,
  RotationTurnStatus,
  VehicleTransaction,
  VehicleOwnerType,
  StoneOrder,
  OrderStatus,
  OrderPaymentTerms,
} from '../types/quarry';
import {
  INITIAL_RATES,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_CUSTOMERS,
  INITIAL_STAFF,
  INITIAL_LOADS,
  INITIAL_GATE_PASSES,
  INITIAL_PRODUCTION,
  INITIAL_INCOME,
  INITIAL_EXPENSES,
  INITIAL_PAYMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_ADVANCES,
  INITIAL_STOCK,
  INITIAL_STATEMENTS,
  INITIAL_ROTATIONS,
  INITIAL_VEHICLE_TRANSACTIONS,
  INITIAL_ORDERS,
  generateNextRotationEngine,
} from '../data/seedData';
import { padGatePassNumber, padLoadNumber, getTodayDateString, getCurrentTimeString } from '../utils/formatters';

interface QuarryContextType {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  authUser: GoogleAuthUser | null;

  vehicles: Vehicle[];
  drivers: Driver[];
  customers: Customer[];
  staff: Staff[];
  attendance: StaffAttendance[];
  advances: StaffAdvance[];
  payrolls: StaffPayroll[];
  rates: RateConfig;
  loads: LoadOrder[];
  gatePasses: GatePass[];
  production: ProductionEntry[];
  stockAdjustments: StockAdjustment[];
  income: QuarryIncome[];
  expenses: QuarryExpense[];
  payments: CustomerPayment[];
  statements: SavedStatement[];
  rotations: DailyRotation[];
  vehicleTransactions: VehicleTransaction[];
  orders: StoneOrder[];

  // Computed Stock
  stock: Record<MaterialType, number>;
  isSyncing: boolean;

  // Actions
  createLoad: (loadData: Partial<LoadOrder>) => LoadOrder;
  updateLoad: (id: string, loadData: Partial<LoadOrder>) => void;
  deleteLoad: (id: string) => void;
  confirmAndGenerateGatePass: (loadId: string, paymentReceived?: number, remarks?: string) => GatePass;

  addProduction: (entry: Omit<ProductionEntry, 'id' | 'createdAt'>) => void;
  deleteProduction: (id: string) => void;

  adjustStock: (material: MaterialType, quantity: number, reason: string) => void;

  addQuarryExpense: (expense: Omit<QuarryExpense, 'id' | 'createdAt'>) => void;
  deleteQuarryExpense: (id: string) => void;

  addQuarryIncome: (income: Omit<QuarryIncome, 'id' | 'createdAt'>) => void;
  deleteQuarryIncome: (id: string) => void;

  addCustomerPayment: (payment: Omit<CustomerPayment, 'id' | 'createdAt'>) => void;
  deleteCustomerPayment: (id: string) => void;

  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  addDriver: (driver: Omit<Driver, 'id' | 'createdAt'>) => void;
  updateDriver: (id: string, driver: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addStaff: (staffMember: Omit<Staff, 'id'>) => void;
  updateStaff: (id: string, staffMember: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;

  markAttendance: (record: Omit<StaffAttendance, 'id'>) => void;
  bulkMarkAttendance: (date: string, records: { staffId: string; status: StaffAttendance['status']; remarks?: string }[]) => void;
  addStaffAdvance: (advance: Omit<StaffAdvance, 'id' | 'createdAt'>) => void;
  deleteStaffAdvance: (id: string) => void;
  generateMonthlyPayroll: (month: string) => void;

  updateRates: (newRates: RateConfig) => void;
  saveStatement: (stmt: Omit<SavedStatement, 'id' | 'createdAt'> & { id?: string }) => Promise<SavedStatement>;
  deleteStatement: (id: string) => Promise<void>;

  // Vehicle Rotation Engine Actions
  getRotationForDate: (date: string) => DailyRotation | null;
  saveRotation: (rotation: DailyRotation) => void;
  advanceRotation: (targetDate?: string) => DailyRotation;
  updateRotationItemStatus: (date: string, position: number, status: RotationTurnStatus, remarks?: string) => void;

  // Unified Vehicle Accounting Actions
  addVehicleTransaction: (txn: Omit<VehicleTransaction, 'id' | 'createdAt'> & { id?: string }) => Promise<VehicleTransaction>;
  updateVehicleTransaction: (id: string, updates: Partial<VehicleTransaction>) => Promise<void>;
  deleteVehicleTransaction: (id: string) => Promise<void>;
  updateVehicleOwnerType: (vehicleNumber: string, ownerType: VehicleOwnerType, newOwner?: string) => Promise<void>;

  // Complete Order Management Workflow Actions
  createOrder: (orderData: Partial<StoneOrder>) => StoneOrder;
  updateOrder: (id: string, updates: Partial<StoneOrder>) => void;
  deleteOrder: (id: string) => void;
  advanceOrderWorkflow: (orderId: string, nextStatus: OrderStatus, extraData?: Partial<StoneOrder>) => void;
  assignVehicleToOrder: (orderId: string, vehicleNumber: string, driverName?: string) => void;
  dispatchOrder: (orderId: string, paymentReceived?: number, remarks?: string) => GatePass;

  resetAllData: () => void;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => boolean;
  refreshBackendData: () => Promise<void>;
}

const QuarryContext = createContext<QuarryContextType | null>(null);

const STORAGE_KEY = 'rz_minetrix_quarry_cache_v2';

export const QuarryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Direct active operator between the 2 internal quarry operators (Nafid & Aflah)
  const [currentUser, setCurrentUserState] = useState<AppUser>(() => {
    const saved = localStorage.getItem('rz_active_operator');
    return saved === 'Aflah' ? 'Aflah' : 'Nafid';
  });

  const setCurrentUser = useCallback((user: AppUser) => {
    setCurrentUserState(user);
    localStorage.setItem('rz_active_operator', user);
  }, []);

  const authUser: GoogleAuthUser = useMemo(() => ({
    id: currentUser === 'Nafid' ? 'op_nafid_rz' : 'op_aflah_rz',
    name: currentUser === 'Nafid' ? 'Nafid Khan' : 'Aflah RZ',
    shortName: currentUser,
    email: currentUser === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com',
    picture:
      currentUser === 'Nafid'
        ? 'https://ui-avatars.com/api/?name=Nafid+Khan&background=d4af37&color=090a0d&bold=true'
        : 'https://ui-avatars.com/api/?name=Aflah+RZ&background=d4af37&color=090a0d&bold=true',
    verifiedAt: new Date().toISOString(),
  }), [currentUser]);

  const [isSyncing, setIsSyncing] = useState(false);

  // Initial local state initialized from localStorage cache or seed
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_vehicles`);
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_drivers`);
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_customers`);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_staff`);
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [attendance, setAttendance] = useState<StaffAttendance[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_attendance`);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [advances, setAdvances] = useState<StaffAdvance[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_advances`);
    return saved ? JSON.parse(saved) : INITIAL_ADVANCES;
  });

  const [payrolls, setPayrolls] = useState<StaffPayroll[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_payrolls`);
    return saved ? JSON.parse(saved) : [];
  });

  const [rates, setRates] = useState<RateConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_rates`);
    return saved ? JSON.parse(saved) : INITIAL_RATES;
  });

  const [loads, setLoads] = useState<LoadOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_loads`);
    return saved ? JSON.parse(saved) : INITIAL_LOADS;
  });

  const [gatePasses, setGatePasses] = useState<GatePass[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_gate_passes`);
    return saved ? JSON.parse(saved) : INITIAL_GATE_PASSES;
  });

  const [production, setProduction] = useState<ProductionEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_production`);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTION;
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_stock_adjustments`);
    return saved ? JSON.parse(saved) : [];
  });

  const [income, setIncome] = useState<QuarryIncome[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_income`);
    return saved ? JSON.parse(saved) : INITIAL_INCOME;
  });

  const [expenses, setExpenses] = useState<QuarryExpense[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_expenses`);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [payments, setPayments] = useState<CustomerPayment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_payments`);
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [statements, setStatements] = useState<SavedStatement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_statements`);
    return saved ? JSON.parse(saved) : (INITIAL_STATEMENTS || []);
  });

  const [rotations, setRotations] = useState<DailyRotation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_rotations`);
    return saved ? JSON.parse(saved) : INITIAL_ROTATIONS;
  });

  const [vehicleTransactions, setVehicleTransactions] = useState<VehicleTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_vehicle_transactions`);
    return saved ? JSON.parse(saved) : (INITIAL_VEHICLE_TRANSACTIONS || []);
  });

  const [orders, setOrders] = useState<StoneOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
    return saved ? JSON.parse(saved) : (INITIAL_ORDERS || []);
  });

  // Sync state to local cache for instant offline fallback
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_vehicles`, JSON.stringify(vehicles));
      localStorage.setItem(`${STORAGE_KEY}_drivers`, JSON.stringify(drivers));
      localStorage.setItem(`${STORAGE_KEY}_customers`, JSON.stringify(customers));
      localStorage.setItem(`${STORAGE_KEY}_staff`, JSON.stringify(staff));
      localStorage.setItem(`${STORAGE_KEY}_attendance`, JSON.stringify(attendance));
      localStorage.setItem(`${STORAGE_KEY}_advances`, JSON.stringify(advances));
      localStorage.setItem(`${STORAGE_KEY}_payrolls`, JSON.stringify(payrolls));
      localStorage.setItem(`${STORAGE_KEY}_rates`, JSON.stringify(rates));
      localStorage.setItem(`${STORAGE_KEY}_loads`, JSON.stringify(loads));
      localStorage.setItem(`${STORAGE_KEY}_gate_passes`, JSON.stringify(gatePasses));
      localStorage.setItem(`${STORAGE_KEY}_production`, JSON.stringify(production));
      localStorage.setItem(`${STORAGE_KEY}_stock_adjustments`, JSON.stringify(stockAdjustments));
      localStorage.setItem(`${STORAGE_KEY}_income`, JSON.stringify(income));
      localStorage.setItem(`${STORAGE_KEY}_expenses`, JSON.stringify(expenses));
      localStorage.setItem(`${STORAGE_KEY}_payments`, JSON.stringify(payments));
      localStorage.setItem(`${STORAGE_KEY}_statements`, JSON.stringify(statements));
      localStorage.setItem(`${STORAGE_KEY}_rotations`, JSON.stringify(rotations));
      localStorage.setItem(`${STORAGE_KEY}_vehicle_transactions`, JSON.stringify(vehicleTransactions));
      localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(orders));
    } catch (e) {
      console.warn('Cache error:', e);
    }
  }, [
    vehicles,
    drivers,
    customers,
    staff,
    attendance,
    advances,
    payrolls,
    rates,
    loads,
    gatePasses,
    production,
    stockAdjustments,
    income,
    expenses,
    payments,
    statements,
    rotations,
    vehicleTransactions,
    orders,
  ]);

  // Refresh data from shared backend database
  const refreshBackendData = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const backendDb = await res.json();
        if (backendDb.loads) setLoads(backendDb.loads);
        if (backendDb.gatePasses) setGatePasses(backendDb.gatePasses);
        if (backendDb.vehicles) setVehicles(backendDb.vehicles);
        if (backendDb.drivers) setDrivers(backendDb.drivers);
        if (backendDb.customers) setCustomers(backendDb.customers);
        if (backendDb.staff) setStaff(backendDb.staff);
        if (backendDb.attendance) setAttendance(backendDb.attendance);
        if (backendDb.advances) setAdvances(backendDb.advances);
        if (backendDb.payrolls) setPayrolls(backendDb.payrolls);
        if (backendDb.rates) setRates(backendDb.rates);
        if (backendDb.production) setProduction(backendDb.production);
        if (backendDb.stockAdjustments) setStockAdjustments(backendDb.stockAdjustments);
        if (backendDb.income) setIncome(backendDb.income);
        if (backendDb.expenses) setExpenses(backendDb.expenses);
        if (backendDb.payments) setPayments(backendDb.payments);
        if (backendDb.statements) setStatements(backendDb.statements);
        if (backendDb.rotations && Array.isArray(backendDb.rotations) && backendDb.rotations.length > 0) {
          setRotations(backendDb.rotations);
        }
        if (backendDb.vehicleTransactions && Array.isArray(backendDb.vehicleTransactions) && backendDb.vehicleTransactions.length > 0) {
          setVehicleTransactions(backendDb.vehicleTransactions);
        }
        if (backendDb.orders && Array.isArray(backendDb.orders) && backendDb.orders.length > 0) {
          setOrders(backendDb.orders);
        }
      }
    } catch (err) {
      // Backend polling error ignored in transient offline
    }
  }, []);

  // Multi-device synchronization polling (polls every 3 seconds)
  useEffect(() => {
    refreshBackendData();
    const interval = setInterval(refreshBackendData, 3500);
    return () => clearInterval(interval);
  }, [refreshBackendData]);

  // Helper to generate audit tracking fields
  const getAuditInfo = useCallback(() => {
    const creatorName = authUser?.shortName || currentUser;
    const creatorEmail =
      authUser?.email ||
      (creatorName === 'Nafid' ? 'nafidkhan@racezoneventures.com' : 'aflah@racezoneventures.com');
    const creatorId =
      authUser?.id || (creatorName === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz');

    return {
      created_by_user_id: creatorId,
      created_by_name: creatorName,
      created_by_email: creatorEmail,
      created_at: new Date().toISOString(),
      enteredBy: creatorName as AppUser,
    };
  }, [authUser, currentUser]);

  // Stock calculation formula:
  // Opening + Production + Adjustments - Confirmed Gate Pass/Dispatch = Closing Stock
  const stock = useMemo(() => {
    const result: Record<MaterialType, number> = {
      'Laterite Stone — 1st': INITIAL_STOCK['Laterite Stone — 1st'],
      'Laterite Stone — 2nd': INITIAL_STOCK['Laterite Stone — 2nd'],
      'Laterite Stone — 3rd': INITIAL_STOCK['Laterite Stone — 3rd'],
    };

    production.forEach((p) => {
      if (result[p.material] !== undefined) {
        result[p.material] += p.quantity;
      }
    });

    stockAdjustments.forEach((adj) => {
      if (result[adj.material] !== undefined) {
        result[adj.material] += adj.quantity;
      }
    });

    gatePasses.forEach((gp) => {
      if (result[gp.material] !== undefined) {
        result[gp.material] -= gp.quantity;
      }
    });

    return result;
  }, [production, stockAdjustments, gatePasses]);

  // Load calculations helper
  const calculateLoadDetails = (
    material: MaterialType,
    quantity: number,
    vehicleCategory: 'Outside' | 'RZ Mining',
    customRates?: { quarryRate?: number; customerSaleRate?: number }
  ) => {
    const is3rd = material === 'Laterite Stone — 3rd';
    let quarryRate = rates.quarryRates[material]?.ratePerUnit || (is3rd ? 1000 : 43);
    if (customRates?.quarryRate !== undefined) {
      quarryRate = customRates.quarryRate;
    }
    const quarryAmount = is3rd ? quarryRate * quantity : quantity * quarryRate;

    let customerSaleRate = rates.rzCustomerRates[material]?.ratePerUnit || (is3rd ? 5000 : 65);
    if (customRates?.customerSaleRate !== undefined) {
      customerSaleRate = customRates.customerSaleRate;
    }

    const customerSaleAmount =
      vehicleCategory === 'RZ Mining'
        ? (is3rd ? customerSaleRate * quantity : quantity * customerSaleRate)
        : quarryAmount;

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

    return {
      quarryRate,
      quarryAmount,
      customerSaleRate: vehicleCategory === 'RZ Mining' ? customerSaleRate : quarryRate,
      customerSaleAmount,
      driverBatta,
      vehicleTripRent,
      loadingCharge,
      diesel,
      orderCommission,
      totalExpense,
      netProfit,
    };
  };

  const createLoad = (data: Partial<LoadOrder>): LoadOrder => {
    const loadSeq = loads.length + 1001;
    const loadNumber = padLoadNumber(loadSeq);
    const material: MaterialType = data.material || 'Laterite Stone — 1st';
    const quantity = data.quantity ?? (material === 'Laterite Stone — 3rd' ? 1 : 250);
    const vehicleCategory = data.vehicleCategory || 'RZ Mining';

    const calculated = calculateLoadDetails(material, quantity, vehicleCategory, {
      quarryRate: data.quarryRate,
      customerSaleRate: data.customerSaleRate,
    });

    const paymentReceived = data.paymentReceived ?? 0;
    const balance = calculated.customerSaleAmount - paymentReceived;
    const audit = getAuditInfo();

    const newLoad: LoadOrder = {
      id: `load-${Date.now()}`,
      loadNumber,
      date: data.date || getTodayDateString(),
      time: data.time || getCurrentTimeString(),
      vehicleNumber: data.vehicleNumber || 'KL-55-RZ-01',
      owner: data.owner || 'RZ Mining',
      driver: data.driver || 'Pasha',
      vehicleCategory,
      customerId: data.customerId || '',
      customerName: data.customerName || 'General Client',
      destination: data.destination || 'Site Delivery',
      material,
      quantity,
      unit: material === 'Laterite Stone — 3rd' ? 'load' : 'pcs',
      ...calculated,
      paymentReceived,
      balance,
      otherExpense: data.otherExpense || 0,
      status: data.status || 'Draft',
      ...audit,
      remarks: data.remarks || '',
      createdAt: new Date().toISOString(),
    };

    setLoads((prev) => [newLoad, ...prev]);

    // Send to backend database for multi-device sync
    fetch('/api/loads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLoad),
    }).catch(console.error);

    if (data.status === 'Dispatched' || data.status === 'Gate Pass Generated') {
      confirmAndGenerateGatePass(newLoad.id, paymentReceived, newLoad.remarks);
    }

    return newLoad;
  };

  const updateLoad = (id: string, updateData: Partial<LoadOrder>) => {
    setLoads((prev) =>
      prev.map((ld) => {
        if (ld.id !== id) return ld;
        const merged = { ...ld, ...updateData };
        if (updateData.material || updateData.quantity || updateData.vehicleCategory) {
          const calc = calculateLoadDetails(merged.material, merged.quantity, merged.vehicleCategory, {
            quarryRate: merged.quarryRate,
            customerSaleRate: merged.customerSaleRate,
          });
          Object.assign(merged, calc);
        }
        if (updateData.paymentReceived !== undefined) {
          merged.balance = merged.customerSaleAmount - (updateData.paymentReceived || 0);
        }
        return merged;
      })
    );

    fetch(`/api/loads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    }).catch(console.error);
  };

  const deleteLoad = (id: string) => {
    setLoads((prev) => prev.filter((ld) => ld.id !== id));
    fetch(`/api/loads/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  // Central Gate Pass Confirmation Workflow
  const confirmAndGenerateGatePass = (
    loadId: string,
    collectedAmount?: number,
    remarks?: string
  ): GatePass => {
    const load = loads.find((l) => l.id === loadId);
    if (!load) {
      throw new Error(`Load ${loadId} not found`);
    }

    const gpNumber = padGatePassNumber(gatePasses.length + 1);
    const passId = `gp-${Date.now()}`;
    const nowTime = getCurrentTimeString();
    const nowDate = getTodayDateString();
    const audit = getAuditInfo();

    const actualCollected = collectedAmount !== undefined ? collectedAmount : load.paymentReceived;
    const paymentStatus: GatePass['paymentStatus'] =
      actualCollected >= load.customerSaleAmount
        ? 'Paid'
        : actualCollected > 0
        ? 'Partial'
        : 'Credit';

    const newGatePass: GatePass = {
      id: passId,
      gatePassNumber: gpNumber,
      date: nowDate,
      time: nowTime,
      loadId: load.id,
      loadNumber: load.loadNumber,
      vehicleNumber: load.vehicleNumber,
      owner: load.owner,
      driver: load.driver,
      vehicleCategory: load.vehicleCategory,
      material: load.material,
      quantity: load.quantity,
      unit: load.unit,
      customerName: load.customerName,
      destination: load.destination,
      paymentStatus,
      amountCollected: actualCollected,
      totalBillAmount: load.customerSaleAmount,
      ...audit,
      remarks: remarks || load.remarks || 'Gate Pass issued and vehicle cleared.',
      createdAt: new Date().toISOString(),
    };

    // 1. Update Load status and gate pass reference
    const updatedLoad = {
      ...load,
      status: 'Dispatched' as const,
      gatePassId: passId,
      gatePassNumber: gpNumber,
      gatePassConfirmedAt: `${nowDate} ${nowTime}`,
      paymentReceived: actualCollected,
      balance: load.customerSaleAmount - actualCollected,
    };
    setLoads((prev) => prev.map((ld) => (ld.id === load.id ? updatedLoad : ld)));
    fetch(`/api/loads/${load.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedLoad),
    }).catch(console.error);

    // 2. Add Gate Pass
    setGatePasses((prev) => [newGatePass, ...prev]);
    fetch('/api/gate-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGatePass),
    }).catch(console.error);

    // 3. Post Quarry Income (Quarry Sale recorded for all vehicles)
    const newIncome: QuarryIncome = {
      id: `inc-${Date.now()}`,
      date: nowDate,
      category: 'Material Sales',
      description: `Quarry sale for Load ${load.loadNumber} (${load.vehicleNumber})`,
      reference: gpNumber,
      amount: load.quarryAmount,
      paymentMode: 'Cash',
      loadId: load.id,
      customerId: load.customerId,
      customerName: load.customerName,
      ...audit,
      createdAt: new Date().toISOString(),
    };
    setIncome((prev) => [newIncome, ...prev]);
    fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIncome),
    }).catch(console.error);

    // 4. If RZ Mining vehicle:
    // Automatically post Load Expenses (Driver Batta, Vehicle Rent, Loading, Diesel, Commission)
    if (load.vehicleCategory === 'RZ Mining') {
      const autoExpenses: QuarryExpense[] = [
        {
          id: `exp-${Date.now()}-1`,
          date: nowDate,
          category: 'Driver Expense',
          description: `Driver Batta for Load ${load.loadNumber} (${load.driver})`,
          amount: load.driverBatta,
          paymentMode: 'Cash',
          driverName: load.driver,
          vehicleNumber: load.vehicleNumber,
          loadId: load.id,
          ...audit,
          createdAt: new Date().toISOString(),
        },
        {
          id: `exp-${Date.now()}-2`,
          date: nowDate,
          category: 'Vehicle Expense',
          description: `Vehicle Trip Rent for Load ${load.loadNumber} (${load.vehicleNumber})`,
          amount: load.vehicleTripRent,
          paymentMode: 'Cash',
          vehicleNumber: load.vehicleNumber,
          loadId: load.id,
          ...audit,
          createdAt: new Date().toISOString(),
        },
        {
          id: `exp-${Date.now()}-3`,
          date: nowDate,
          category: 'Loading',
          description: `Loading Charge for Load ${load.loadNumber} (${load.quantity} ${load.unit})`,
          amount: load.loadingCharge,
          paymentMode: 'Cash',
          loadId: load.id,
          ...audit,
          createdAt: new Date().toISOString(),
        },
        {
          id: `exp-${Date.now()}-4`,
          date: nowDate,
          category: 'Diesel',
          description: `Diesel allocation for Load ${load.loadNumber} (${load.vehicleNumber})`,
          amount: load.diesel,
          paymentMode: 'Cash',
          vehicleNumber: load.vehicleNumber,
          loadId: load.id,
          ...audit,
          createdAt: new Date().toISOString(),
        },
        {
          id: `exp-${Date.now()}-5`,
          date: nowDate,
          category: 'Transport',
          description: `Order Commission for Load ${load.loadNumber}`,
          amount: load.orderCommission,
          paymentMode: 'Cash',
          loadId: load.id,
          ...audit,
          createdAt: new Date().toISOString(),
        },
      ];

      setExpenses((prev) => [...autoExpenses, ...prev]);
      fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(autoExpenses),
      }).catch(console.error);
    }

    // 5. If payment collected at gate, record Customer Payment
    if (actualCollected > 0 && load.customerId) {
      const newPay: CustomerPayment = {
        id: `pay-${Date.now()}`,
        date: nowDate,
        customerId: load.customerId,
        customerName: load.customerName,
        loadId: load.id,
        amount: actualCollected,
        paymentMode: 'Cash',
        reference: gpNumber,
        remarks: `Collected at Gate for Load ${load.loadNumber} (${gpNumber})`,
        ...audit,
        createdAt: new Date().toISOString(),
      };
      setPayments((prev) => [newPay, ...prev]);
      fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPay),
      }).catch(console.error);
    }

    return newGatePass;
  };

  const addProduction = (entry: Omit<ProductionEntry, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newEntry: ProductionEntry = {
      ...entry,
      ...audit,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProduction((prev) => [newEntry, ...prev]);
    fetch('/api/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    }).catch(console.error);
  };

  const deleteProduction = (id: string) => {
    setProduction((prev) => prev.filter((p) => p.id !== id));
    fetch(`/api/production/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const adjustStock = (material: MaterialType, quantity: number, reason: string) => {
    const audit = getAuditInfo();
    const adj: StockAdjustment = {
      id: `adj-${Date.now()}`,
      date: getTodayDateString(),
      material,
      quantity,
      reason,
      ...audit,
      createdAt: new Date().toISOString(),
    };
    setStockAdjustments((prev) => [adj, ...prev]);
    fetch('/api/stock-adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adj),
    }).catch(console.error);
  };

  const addQuarryExpense = (expense: Omit<QuarryExpense, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newExp: QuarryExpense = {
      ...expense,
      ...audit,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExp),
    }).catch(console.error);
  };

  const deleteQuarryExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    fetch(`/api/expenses/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const addQuarryIncome = (inc: Omit<QuarryIncome, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newInc: QuarryIncome = {
      ...inc,
      ...audit,
      id: `inc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setIncome((prev) => [newInc, ...prev]);
    fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInc),
    }).catch(console.error);
  };

  const deleteQuarryIncome = (id: string) => {
    setIncome((prev) => prev.filter((i) => i.id !== id));
    fetch(`/api/income/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const addCustomerPayment = (payment: Omit<CustomerPayment, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newPay: CustomerPayment = {
      ...payment,
      ...audit,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPayments((prev) => [newPay, ...prev]);
    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPay),
    }).catch(console.error);
  };

  const deleteCustomerPayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    fetch(`/api/payments/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const addVehicle = (veh: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newVeh: Vehicle = {
      ...veh,
      ...audit,
      id: `veh-${Date.now()}`,
      createdAt: getTodayDateString(),
    };
    setVehicles((prev) => [...prev, newVeh]);
    fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVeh),
    }).catch(console.error);
  };

  const updateVehicle = (id: string, partial: Partial<Vehicle>) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...partial } : v)));
    fetch(`/api/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    }).catch(console.error);
  };

  const deleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    fetch(`/api/vehicles/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const addDriver = (drv: Omit<Driver, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newDrv: Driver = {
      ...drv,
      ...audit,
      id: `drv-${Date.now()}`,
      createdAt: getTodayDateString(),
    };
    setDrivers((prev) => [...prev, newDrv]);
    fetch('/api/drivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDrv),
    }).catch(console.error);
  };

  const updateDriver = (id: string, partial: Partial<Driver>) => {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...partial } : d)));
    fetch(`/api/drivers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    }).catch(console.error);
  };

  const deleteDriver = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    fetch(`/api/drivers/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const addCustomer = (cust: Omit<Customer, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newCust: Customer = {
      ...cust,
      ...audit,
      id: `cust-${Date.now()}`,
      createdAt: getTodayDateString(),
    };
    setCustomers((prev) => [...prev, newCust]);
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCust),
    }).catch(console.error);
  };

  const updateCustomer = (id: string, partial: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...partial } : c)));
    fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    }).catch(console.error);
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    fetch(`/api/customers/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const addStaff = (member: Omit<Staff, 'id'>) => {
    const audit = getAuditInfo();
    const newStaff: Staff = {
      ...member,
      ...audit,
      id: `stf-${Date.now()}`,
    };
    setStaff((prev) => [...prev, newStaff]);
    fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff),
    }).catch(console.error);
  };

  const updateStaff = (id: string, partial: Partial<Staff>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...partial } : s)));
    fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    }).catch(console.error);
  };

  const deleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    fetch(`/api/staff/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const markAttendance = (record: Omit<StaffAttendance, 'id'>) => {
    const audit = getAuditInfo();
    const newRecord: StaffAttendance = {
      ...record,
      ...audit,
      id: `att-${Date.now()}-${record.staffId}`,
    };
    setAttendance((prev) => {
      const filtered = prev.filter(
        (a) => !(a.staffId === record.staffId && a.date === record.date)
      );
      return [newRecord, ...filtered];
    });
    fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    }).catch(console.error);
  };

  const bulkMarkAttendance = (
    date: string,
    records: { staffId: string; status: StaffAttendance['status']; remarks?: string }[]
  ) => {
    const audit = getAuditInfo();
    const updatedIds = new Set(records.map((r) => r.staffId));
    const newItems: StaffAttendance[] = records.map((r) => {
      const staffMem = staff.find((s) => s.id === r.staffId);
      return {
        id: `att-${Date.now()}-${r.staffId}`,
        date,
        staffId: r.staffId,
        employeeName: staffMem?.name || 'Staff Member',
        status: r.status,
        overtimeHours: 0,
        remarks: r.remarks || '',
        ...audit,
      };
    });

    setAttendance((prev) => {
      const filtered = prev.filter((a) => !(a.date === date && updatedIds.has(a.staffId)));
      return [...newItems, ...filtered];
    });

    fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItems),
    }).catch(console.error);
  };

  const addStaffAdvance = (advance: Omit<StaffAdvance, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newAdv: StaffAdvance = {
      ...advance,
      ...audit,
      id: `adv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setAdvances((prev) => [newAdv, ...prev]);
    fetch('/api/advances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAdv),
    }).catch(console.error);

    // Also automatically log as Quarry Expense
    addQuarryExpense({
      date: advance.date,
      category: 'Staff Advance',
      description: `Advance paid to ${advance.employeeName} (${advance.reason || 'Requested'})`,
      amount: advance.amount,
      paymentMode: advance.paymentMode,
      staffName: advance.employeeName,
      enteredBy: audit.enteredBy,
    });
  };

  const deleteStaffAdvance = (id: string) => {
    setAdvances((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/advances/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const generateMonthlyPayroll = (month: string) => {
    const audit = getAuditInfo();
    const newPayrolls: StaffPayroll[] = staff
      .filter((s) => s.status === 'Active')
      .map((s) => {
        const monthAtt = attendance.filter((a) => a.staffId === s.id && a.date.startsWith(month));
        const presentDays = monthAtt.filter((a) => a.status === 'Present').length;
        const halfDays = monthAtt.filter((a) => a.status === 'Half Day').length;
        const absentDays = monthAtt.filter((a) => a.status === 'Absent').length;
        const overtimeHours = monthAtt.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

        const monthAdv = advances.filter(
          (adv) => adv.staffId === s.id && adv.deductionMonth === month
        );
        const totalAdvance = monthAdv.reduce((sum, a) => sum + a.amount, 0);

        let grossSalary = 0;
        let overtimePay = 0;

        if (s.salaryType === 'Monthly') {
          grossSalary = s.basicSalary;
          overtimePay = Math.round(overtimeHours * ((s.basicSalary / 30) / 8) * 1.5);
        } else {
          const effectiveDays = presentDays + halfDays * 0.5;
          grossSalary = Math.round(effectiveDays * s.dailyWage);
          overtimePay = Math.round(overtimeHours * (s.dailyWage / 8) * 1.5);
        }

        const netSalary = Math.max(0, grossSalary + overtimePay - totalAdvance);

        return {
          id: `payr-${month}-${s.id}`,
          month,
          staffId: s.id,
          employeeName: s.name,
          role: s.role,
          salaryType: s.salaryType,
          basicSalaryOrDailyRate: s.salaryType === 'Monthly' ? s.basicSalary : s.dailyWage,
          presentDays,
          absentDays,
          halfDays,
          overtimeHours,
          overtimePay,
          allowance: 0,
          bonus: 0,
          advanceDeduction: totalAdvance,
          otherDeductions: 0,
          grossSalary,
          netSalary,
          status: 'Draft',
          ...audit,
        };
      });

    setPayrolls((prev) => {
      const filtered = prev.filter((p) => p.month !== month);
      return [...newPayrolls, ...filtered];
    });

    fetch('/api/payrolls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, payrolls: newPayrolls }),
    }).catch(console.error);
  };

  const updateRates = (newRates: RateConfig) => {
    setRates(newRates);
    fetch('/api/rates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRates),
    }).catch(console.error);
  };

  const saveStatement = async (
    stmtData: Omit<SavedStatement, 'id' | 'createdAt'> & { id?: string }
  ): Promise<SavedStatement> => {
    const audit = getAuditInfo();
    const newStatement: SavedStatement = {
      ...stmtData,
      id: stmtData.id || `stmt-${Date.now()}`,
      created_by_user_id: audit.created_by_user_id,
      created_by_name: audit.created_by_name,
      created_by_email: audit.created_by_email,
      created_at: audit.created_at,
      generatedBy: (stmtData.generatedBy || audit.enteredBy) as AppUser,
      generatedAt: stmtData.generatedAt || new Date().toISOString(),
    };

    setStatements((prev) => [
      newStatement,
      ...prev.filter((s) => s.id !== newStatement.id && s.invoiceNumber !== newStatement.invoiceNumber),
    ]);

    try {
      await fetch('/api/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatement),
      });
    } catch (err) {
      console.warn('Failed to save statement to backend:', err);
    }

    return newStatement;
  };

  const deleteStatement = async (id: string): Promise<void> => {
    setStatements((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/statements/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Failed to delete statement from backend:', err);
    }
  };

  const resetAllData = () => {
    setVehicles(INITIAL_VEHICLES);
    setDrivers(INITIAL_DRIVERS);
    setCustomers(INITIAL_CUSTOMERS);
    setStaff(INITIAL_STAFF);
    setAttendance(INITIAL_ATTENDANCE);
    setAdvances(INITIAL_ADVANCES);
    setPayrolls([]);
    setRates(INITIAL_RATES);
    setLoads(INITIAL_LOADS);
    setGatePasses(INITIAL_GATE_PASSES);
    setProduction(INITIAL_PRODUCTION);
    setStockAdjustments([]);
    setIncome(INITIAL_INCOME);
    setExpenses(INITIAL_EXPENSES);
    setPayments(INITIAL_PAYMENTS);
    setStatements(INITIAL_STATEMENTS || []);
    localStorage.clear();

    setRotations(INITIAL_ROTATIONS);
    setVehicleTransactions(INITIAL_VEHICLE_TRANSACTIONS);
    setOrders(INITIAL_ORDERS);

    fetch('/api/reset', { method: 'POST' }).catch(console.error);
  };

  const exportBackupJSON = (): string => {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      vehicles,
      drivers,
      customers,
      staff,
      attendance,
      advances,
      payrolls,
      rates,
      loads,
      gatePasses,
      production,
      stockAdjustments,
      income,
      expenses,
      payments,
      statements,
      rotations,
      vehicleTransactions,
      orders,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.vehicles) setVehicles(data.vehicles);
      if (data.drivers) setDrivers(data.drivers);
      if (data.customers) setCustomers(data.customers);
      if (data.staff) setStaff(data.staff);
      if (data.attendance) setAttendance(data.attendance);
      if (data.advances) setAdvances(data.advances);
      if (data.payrolls) setPayrolls(data.payrolls);
      if (data.rates) setRates(data.rates);
      if (data.loads) setLoads(data.loads);
      if (data.gatePasses) setGatePasses(data.gatePasses);
      if (data.production) setProduction(data.production);
      if (data.stockAdjustments) setStockAdjustments(data.stockAdjustments);
      if (data.income) setIncome(data.income);
      if (data.expenses) setExpenses(data.expenses);
      if (data.payments) setPayments(data.payments);
      if (data.statements) setStatements(data.statements);
      if (data.rotations) setRotations(data.rotations);
      if (data.vehicleTransactions) setVehicleTransactions(data.vehicleTransactions);
      if (data.orders) setOrders(data.orders);

      fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
      }).catch(console.error);

      return true;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  };

  // Unified Vehicle Accounting Engine Actions
  const addVehicleTransaction = useCallback(
    async (
      txnData: Omit<VehicleTransaction, 'id' | 'createdAt'> & { id?: string }
    ): Promise<VehicleTransaction> => {
      const newTxn: VehicleTransaction = {
        ...txnData,
        id: txnData.id || `vtx-${Date.now()}`,
        createdAt: new Date().toISOString(),
        created_by_user_id:
          authUser?.id || (currentUser === 'Aflah' ? 'goog_aflah_rz' : 'goog_nafid_rz'),
        created_by_name: currentUser,
        created_by_email:
          authUser?.email ||
          (currentUser === 'Aflah'
            ? 'aflah@racezoneventures.com'
            : 'nafidkhan@racezoneventures.com'),
        created_at: new Date().toISOString(),
      };

      setVehicleTransactions((prev) => [newTxn, ...prev]);

      try {
        await fetch('/api/vehicle-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTxn),
        });
      } catch (err) {
        console.error('Failed to post vehicle transaction:', err);
      }

      return newTxn;
    },
    [authUser, currentUser]
  );

  const updateVehicleTransaction = useCallback(
    async (id: string, updates: Partial<VehicleTransaction>): Promise<void> => {
      setVehicleTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );

      try {
        await fetch(`/api/vehicle-transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.error('Failed to update vehicle transaction:', err);
      }
    },
    []
  );

  const deleteVehicleTransaction = useCallback(
    async (id: string): Promise<void> => {
      setVehicleTransactions((prev) => prev.filter((t) => t.id !== id));

      try {
        await fetch(`/api/vehicle-transactions/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete vehicle transaction:', err);
      }
    },
    []
  );

  const updateVehicleOwnerType = useCallback(
    async (
      vehicleNumber: string,
      newOwnerType: VehicleOwnerType,
      newOwner?: string
    ): Promise<void> => {
      // RULE: Historical transactions must NEVER change when vehicle owner type is changed!
      // This strictly modifies only current vehicle entity metadata.
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.vehicleNumber.trim().toUpperCase() === vehicleNumber.trim().toUpperCase()) {
            const updated: Vehicle = {
              ...v,
              ownerType: newOwnerType,
              category: newOwnerType === 'COMPANY' ? 'RZ Mining' : 'Outside',
              owner:
                newOwner !== undefined
                  ? newOwner
                  : newOwnerType === 'COMPANY'
                  ? 'RZ Mining'
                  : v.owner,
            };

            fetch(`/api/vehicles/${v.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated),
            }).catch(console.error);

            return updated;
          }
          return v;
        })
      );
    },
    []
  );

  // Vehicle Rotation Engine Actions
  const getRotationForDate = useCallback(
    (date: string): DailyRotation | null => {
      const found = rotations.find((r) => r.rotationDate === date);
      if (found) return found;
      return null;
    },
    [rotations]
  );

  const saveRotation = useCallback((rotation: DailyRotation) => {
    setRotations((prev) => {
      const idx = prev.findIndex(
        (r) => r.id === rotation.id || r.rotationDate === rotation.rotationDate
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = rotation;
        return next;
      }
      return [rotation, ...prev];
    });

    fetch('/api/rotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rotation),
    }).catch(console.error);
  }, []);

  const advanceRotation = useCallback(
    (targetDate?: string): DailyRotation => {
      const today = getTodayDateString();
      const dateToUse = targetDate || today;

      // Find the latest reference rotation:
      // Check if one exists for the target date, or the most recent prior rotation
      const existingForDate = rotations.find((r) => r.rotationDate === dateToUse);
      const referenceRotation =
        existingForDate ||
        rotations[0] ||
        INITIAL_ROTATIONS[0];

      const nextCycleNumber = (referenceRotation?.rotationNumber || 10) + 1;
      const nextRotation = generateNextRotationEngine(referenceRotation, dateToUse, nextCycleNumber);

      saveRotation(nextRotation);
      return nextRotation;
    },
    [rotations, saveRotation]
  );

  const updateRotationItemStatus = useCallback(
    (
      date: string,
      position: number,
      status: RotationTurnStatus,
      remarks?: string
    ) => {
      setRotations((prev) => {
        const target = prev.find((r) => r.rotationDate === date);
        if (!target) return prev;
        const updatedEntries = target.entries.map((entry) => {
          if (entry.position === position) {
            return {
              ...entry,
              status,
              remarks: remarks !== undefined ? remarks : entry.remarks,
            };
          }
          return entry;
        });
        const updatedRot = {
          ...target,
          entries: updatedEntries,
          updatedAt: new Date().toISOString(),
        };

        fetch(`/api/rotations/${target.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRot),
        }).catch(console.error);

        return prev.map((r) => (r.id === target.id ? updatedRot : r));
      });
    },
    []
  );

  // Complete Order Management Workflow Actions
  const createOrder = useCallback(
    (orderData: Partial<StoneOrder>): StoneOrder => {
      const year = new Date().getFullYear();
      const nextOrderNumber = `ORD-${year}-${100 + orders.length + 1}`;
      const rate =
        orderData.rate ||
        rates.rzCustomerRates[orderData.quality || 'Laterite Stone — 1st']?.ratePerUnit ||
        65;
      const quantity = orderData.quantity || 250;
      const grossAmount =
        orderData.grossAmount || (orderData.unit === 'load' ? rate : rate * quantity);
      const paymentReceived = orderData.paymentReceived || 0;
      const balance = grossAmount - paymentReceived;

      const newOrder: StoneOrder = {
        id: orderData.id || `ord-${Date.now()}`,
        orderId: orderData.orderId || nextOrderNumber,
        orderDate: orderData.orderDate || getTodayDateString(),
        customerId: orderData.customerId || '',
        customer: orderData.customer || '',
        customerPhone: orderData.customerPhone || '',
        deliveryLocation: orderData.deliveryLocation || '',
        agentName: orderData.agentName || 'Direct Order',
        quality: orderData.quality || 'Laterite Stone — 1st',
        quantity,
        unit: orderData.unit || 'pcs',
        rate,
        grossAmount,
        commission:
          orderData.commission !== undefined
            ? orderData.commission
            : orderData.unit === 'pcs'
            ? quantity * 1
            : 250,
        paymentTerms: orderData.paymentTerms || 'IMMEDIATE',
        assignedVehicle: orderData.assignedVehicle || undefined,
        driver: orderData.driver || undefined,
        requiredDate: orderData.requiredDate || getTodayDateString(),
        remarks: orderData.remarks || '',
        status: orderData.status || (orderData.assignedVehicle ? 'ALLOCATED' : 'NEW'),
        paymentReceived,
        balance,
        enteredBy: currentUser,
        createdAt: new Date().toISOString(),
        created_by_user_id:
          authUser?.id || (currentUser === 'Aflah' ? 'goog_aflah_rz' : 'goog_nafid_rz'),
        created_by_name: currentUser,
        created_by_email:
          authUser?.email ||
          (currentUser === 'Aflah'
            ? 'aflah@racezoneventures.com'
            : 'nafidkhan@racezoneventures.com'),
      };

      setOrders((prev) => [newOrder, ...prev]);

      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch(console.error);

      return newOrder;
    },
    [orders, rates, currentUser, authUser]
  );

  const updateOrder = useCallback((id: string, updates: Partial<StoneOrder>) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id || o.orderId === id) {
          const grossAmount =
            updates.grossAmount !== undefined
              ? updates.grossAmount
              : updates.rate && updates.quantity
              ? updates.rate * updates.quantity
              : o.grossAmount;
          const paymentReceived =
            updates.paymentReceived !== undefined ? updates.paymentReceived : o.paymentReceived;
          const balance = grossAmount - paymentReceived;
          const updated: StoneOrder = {
            ...o,
            ...updates,
            grossAmount,
            paymentReceived,
            balance,
            updatedAt: new Date().toISOString(),
          };

          fetch(`/api/orders/${o.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(console.error);

          return updated;
        }
        return o;
      })
    );
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id && o.orderId !== id));
    fetch(`/api/orders/${id}`, { method: 'DELETE' }).catch(console.error);
  }, []);

  const advanceOrderWorkflow = useCallback(
    (orderId: string, nextStatus: OrderStatus, extraData?: Partial<StoneOrder>) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id === orderId || o.orderId === orderId) {
            const timeNow = getCurrentTimeString();
            const timestamps: Partial<StoneOrder> = {};
            if (nextStatus === 'READY FOR LOADING') timestamps.gateEntryTime = timeNow;
            if (nextStatus === 'LOADING') timestamps.loadingStartTime = timeNow;
            if (nextStatus === 'DISPATCHED') {
              timestamps.loadingEndTime = o.loadingEndTime || timeNow;
              timestamps.dispatchTime = timeNow;
            }
            if (nextStatus === 'DELIVERED') timestamps.deliveryTime = timeNow;
            if (nextStatus === 'PAYMENT PENDING') {
              timestamps.billNumber =
                o.billNumber || `RZ-BILL-${Math.floor(1000 + Math.random() * 9000)}`;
              timestamps.billDate = getTodayDateString();
            }
            if (nextStatus === 'PAID') timestamps.settledDate = getTodayDateString();

            const updated: StoneOrder = {
              ...o,
              status: nextStatus,
              ...timestamps,
              ...(extraData || {}),
              updatedAt: new Date().toISOString(),
            };

            fetch(`/api/orders/${o.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated),
            }).catch(console.error);

            return updated;
          }
          return o;
        })
      );
    },
    []
  );

  const assignVehicleToOrder = useCallback(
    (orderId: string, vehicleNumber: string, driverName?: string) => {
      const veh = vehicles.find(
        (v) => v.vehicleNumber.trim().toUpperCase() === vehicleNumber.trim().toUpperCase()
      );
      const resolvedDriver = driverName || veh?.driver || '';
      advanceOrderWorkflow(orderId, 'ALLOCATED', {
        assignedVehicle: vehicleNumber,
        driver: resolvedDriver,
      });
    },
    [vehicles, advanceOrderWorkflow]
  );

  const dispatchOrder = useCallback(
    (orderId: string, paymentReceived?: number, remarks?: string): GatePass => {
      const order = orders.find((o) => o.id === orderId || o.orderId === orderId);
      if (!order) throw new Error(`Order ${orderId} not found`);

      const veh =
        vehicles.find(
          (v) =>
            v.vehicleNumber.trim().toUpperCase() ===
            (order.assignedVehicle || '').trim().toUpperCase()
        ) || vehicles[0];
      const driverName = order.driver || veh?.driver || 'Pasha';
      const ownerName = veh?.owner || 'RZ Mining';
      const vCategory = veh?.category || 'RZ Mining';

      // 1. Reuse existing linked LoadOrder or create new LoadOrder
      let loadRecord: LoadOrder;
      const existingLoad = loads.find((l) => l.id === order.loadId);
      if (existingLoad) {
        loadRecord = existingLoad;
      } else {
        const defaultQuarryRate = rates.quarryRates[order.quality]?.ratePerUnit || 43;
        const quarryAmount = order.unit === 'pcs' ? defaultQuarryRate * order.quantity : 5000;
        const customerSaleAmount = order.grossAmount || order.rate * order.quantity;
        const paid = paymentReceived !== undefined ? paymentReceived : order.paymentReceived || 0;

        loadRecord = createLoad({
          vehicleNumber: order.assignedVehicle || veh.vehicleNumber,
          owner: ownerName,
          driver: driverName,
          vehicleCategory: vCategory,
          customerId: order.customerId,
          customerName: order.customer,
          destination: order.deliveryLocation,
          material: order.quality,
          quantity: order.quantity,
          unit: order.unit,
          quarryRate: defaultQuarryRate,
          quarryAmount,
          customerSaleRate: order.rate,
          customerSaleAmount,
          paymentReceived: paid,
          balance: customerSaleAmount - paid,
          agentName: order.agentName,
          paymentTerms: order.paymentTerms,
          orderCommission: order.commission || 0,
          remarks: remarks || order.remarks,
        });
      }

      // 2. Generate Gate Pass
      const gp = confirmAndGenerateGatePass(loadRecord.id, paymentReceived, remarks);

      // 3. Update existing order to DISPATCHED with linked gate pass & load (NO duplicate data)
      const paid = paymentReceived !== undefined ? paymentReceived : order.paymentReceived;
      updateOrder(order.id, {
        status: 'DISPATCHED',
        loadId: loadRecord.id,
        gatePassId: gp.id,
        gatePassNumber: gp.gatePassNumber,
        dispatchTime: getCurrentTimeString(),
        paymentReceived: paid,
        balance: order.grossAmount - paid,
      });

      return gp;
    },
    [orders, vehicles, loads, rates, createLoad, confirmAndGenerateGatePass, updateOrder]
  );

  return (
    <QuarryContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authUser,
        vehicles,
        drivers,
        customers,
        staff,
        attendance,
        advances,
        payrolls,
        rates,
        loads,
        gatePasses,
        production,
        stockAdjustments,
        income,
        expenses,
        payments,
        statements,
        rotations,
        vehicleTransactions,
        orders,
        stock,
        isSyncing,
        createLoad,
        updateLoad,
        deleteLoad,
        confirmAndGenerateGatePass,
        addProduction,
        deleteProduction,
        adjustStock,
        addQuarryExpense,
        deleteQuarryExpense,
        addQuarryIncome,
        deleteQuarryIncome,
        addCustomerPayment,
        deleteCustomerPayment,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        addDriver,
        updateDriver,
        deleteDriver,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addStaff,
        updateStaff,
        deleteStaff,
        markAttendance,
        bulkMarkAttendance,
        addStaffAdvance,
        deleteStaffAdvance,
        generateMonthlyPayroll,
        updateRates,
        saveStatement,
        deleteStatement,
        getRotationForDate,
        saveRotation,
        advanceRotation,
        updateRotationItemStatus,
        addVehicleTransaction,
        updateVehicleTransaction,
        deleteVehicleTransaction,
        updateVehicleOwnerType,
        createOrder,
        updateOrder,
        deleteOrder,
        advanceOrderWorkflow,
        assignVehicleToOrder,
        dispatchOrder,
        resetAllData,
        exportBackupJSON,
        importBackupJSON,
        refreshBackendData,
      }}
    >
      {children}
    </QuarryContext.Provider>
  );
};

export const useQuarry = () => {
  const context = useContext(QuarryContext);
  if (!context) {
    throw new Error('useQuarry must be used within a QuarryProvider');
  }
  return context;
};
