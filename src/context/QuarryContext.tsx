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
  RateCondition,
  LoadOrder,
  GatePass,
  ProductionEntry,
  QuarryDailyProductionRecord,
  GapSlotNumber,
  GapVehicleQueueItem,
  GapOfferEvent,
  QuarryRoundLog,
  OperationalQuality,
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
  QuarryProfile,
  QuarrySection,
  LandOwnerAccount,
  LandPaymentEntry,
  BrandingConfig,
  BillingConfig,
  AppTheme,
  DriverCollection,
  DriverCollectionSettlementStatus,
  PaymentCollectionMode,
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
  INITIAL_DAILY_PRODUCTION_RECORDS,
  INITIAL_GAP_QUEUE,
  INITIAL_GAP_OFFER_EVENTS,
  INITIAL_ROUND_LOGS,
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
  INITIAL_QUARRIES,
  INITIAL_BRANDING,
  INITIAL_BILLING_CONFIG,
  INITIAL_DRIVER_COLLECTIONS,
  generateNextRotationEngine,
} from '../data/seedData';
import { padGatePassNumber, padLoadNumber, getTodayDateString, getCurrentTimeString } from '../utils/formatters';

interface QuarryContextType {
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  authUser: GoogleAuthUser | null;

  // Multi-Quarry & Business Profile
  quarries: QuarryProfile[];
  activeQuarryId: string;
  activeQuarry: QuarryProfile;
  setActiveQuarryId: (id: string) => void;
  addQuarry: (quarry: QuarryProfile) => void;
  updateQuarry: (id: string, updates: Partial<QuarryProfile>) => void;
  deleteQuarry: (id: string) => void;
  addQuarrySection: (quarryId: string, section: QuarrySection) => void;
  updateLandOwnerAccount: (quarryId: string, landAccount: Partial<LandOwnerAccount>) => void;
  addLandPayment: (quarryId: string, payment: Omit<LandPaymentEntry, 'id' | 'createdAt'>) => void;

  // Branding & Billing Config
  branding: BrandingConfig;
  updateBranding: (config: Partial<BrandingConfig>) => void;
  billingConfig: BillingConfig;
  updateBillingConfig: (config: Partial<BillingConfig>) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;

  // Driver Collections (UNSETTLED DRIVER COLLECTION → Company Settlement)
  driverCollections: DriverCollection[];
  addDriverCollection: (
    col: Omit<DriverCollection, 'id' | 'createdAt' | 'collectionId' | 'enteredBy'> & {
      id?: string;
      collectionId?: string;
      enteredBy?: AppUser;
    }
  ) => DriverCollection;
  settleDriverCollection: (id: string, settledAmount: number, notes?: string) => void;

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

  // Daily Production & Recovery Engine (Zero Warehouse Stock Model)
  dailyProductionRecords: QuarryDailyProductionRecord[];
  addDailyProductionRecord: (
    record: Omit<QuarryDailyProductionRecord, 'id' | 'createdAt'> & { id?: string }
  ) => QuarryDailyProductionRecord;
  updateDailyProductionRecord: (id: string, updates: Partial<QuarryDailyProductionRecord>) => void;
  deleteDailyProductionRecord: (id: string) => void;

  // Daily Gap System & Rotation Engine (4-Gap Queue, Cascading Offers, Round Return Order)
  gapQueue: GapVehicleQueueItem[];
  gapOfferEvents: GapOfferEvent[];
  roundLogs: QuarryRoundLog[];
  updateGapSlotVehicle: (gapNumber: GapSlotNumber, vehicleId: string) => void;
  offerGapLoad: (
    offeredQuality: '1ST QUALITY' | '2ND QUALITY' | 'LATT / 3RD' | 'MURY',
    currentGap: GapSlotNumber,
    accepted: boolean,
    rejectionReason?: string
  ) => { nextGap: GapSlotNumber | null; accepted: boolean };
  recordRoundEvent: (round: Omit<QuarryRoundLog, 'id'> & { id?: string }) => QuarryRoundLog;
  completeVehicleReturn: (vehicleNumber: string, returnTime?: string) => void;
  advanceGapRound: () => void;

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

  // Multi-Quarry & Business Profile state
  const [quarries, setQuarries] = useState<QuarryProfile[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_quarries`);
    return saved ? JSON.parse(saved) : (INITIAL_QUARRIES || []);
  });

  const [activeQuarryId, setActiveQuarryIdState] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_active_quarry_id`);
    return saved || 'quarry-001';
  });

  const activeQuarry = useMemo(() => {
    return quarries.find((q) => q.id === activeQuarryId) || quarries[0] || INITIAL_QUARRIES[0];
  }, [quarries, activeQuarryId]);

  // Branding & Asset Config state
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_branding`);
    return saved ? JSON.parse(saved) : INITIAL_BRANDING;
  });

  // Billing Config state
  const [billingConfig, setBillingConfig] = useState<BillingConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_billing_config`);
    return saved ? JSON.parse(saved) : INITIAL_BILLING_CONFIG;
  });

  // Theme state
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_theme`);
    return (saved as AppTheme) || 'rz_gold';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Driver Collections (UNSETTLED DRIVER COLLECTION → Company Settlement)
  const [driverCollections, setDriverCollections] = useState<DriverCollection[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_driver_collections`);
    return saved ? JSON.parse(saved) : (INITIAL_DRIVER_COLLECTIONS || []);
  });

  // Daily Production Records (Zero Warehouse Stock Model)
  const [dailyProductionRecords, setDailyProductionRecords] = useState<QuarryDailyProductionRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_daily_production_records`);
    return saved ? JSON.parse(saved) : (INITIAL_DAILY_PRODUCTION_RECORDS || []);
  });

  // Daily Gap System (4-Gap queue)
  const [gapQueue, setGapQueue] = useState<GapVehicleQueueItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_gap_queue`);
    return saved ? JSON.parse(saved) : (INITIAL_GAP_QUEUE || []);
  });

  // Gap Offer Events (Cascading Offers)
  const [gapOfferEvents, setGapOfferEvents] = useState<GapOfferEvent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_gap_offer_events`);
    return saved ? JSON.parse(saved) : (INITIAL_GAP_OFFER_EVENTS || []);
  });

  // Quarry Round Logs
  const [roundLogs, setRoundLogs] = useState<QuarryRoundLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_round_logs`);
    return saved ? JSON.parse(saved) : (INITIAL_ROUND_LOGS || []);
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
      localStorage.setItem(`${STORAGE_KEY}_quarries`, JSON.stringify(quarries));
      localStorage.setItem(`${STORAGE_KEY}_active_quarry_id`, activeQuarryId);
      localStorage.setItem(`${STORAGE_KEY}_branding`, JSON.stringify(branding));
      localStorage.setItem(`${STORAGE_KEY}_billing_config`, JSON.stringify(billingConfig));
      localStorage.setItem(`${STORAGE_KEY}_theme`, theme);
      localStorage.setItem(`${STORAGE_KEY}_driver_collections`, JSON.stringify(driverCollections));
      localStorage.setItem(`${STORAGE_KEY}_daily_production_records`, JSON.stringify(dailyProductionRecords));
      localStorage.setItem(`${STORAGE_KEY}_gap_queue`, JSON.stringify(gapQueue));
      localStorage.setItem(`${STORAGE_KEY}_gap_offer_events`, JSON.stringify(gapOfferEvents));
      localStorage.setItem(`${STORAGE_KEY}_round_logs`, JSON.stringify(roundLogs));
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
    quarries,
    activeQuarryId,
    branding,
    billingConfig,
    theme,
    driverCollections,
    dailyProductionRecords,
    gapQueue,
    gapOfferEvents,
    roundLogs,
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
        if (backendDb.quarries && Array.isArray(backendDb.quarries) && backendDb.quarries.length > 0) {
          setQuarries(backendDb.quarries);
        }
        if (backendDb.activeQuarryId) {
          setActiveQuarryIdState(backendDb.activeQuarryId);
        }
        if (backendDb.branding) {
          setBranding(backendDb.branding);
        }
        if (backendDb.billingConfig) {
          setBillingConfig(backendDb.billingConfig);
        }
        if (backendDb.theme) {
          setThemeState(backendDb.theme);
        }
        if (backendDb.driverCollections && Array.isArray(backendDb.driverCollections) && backendDb.driverCollections.length > 0) {
          setDriverCollections(backendDb.driverCollections);
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
    customRates?: {
      quarryRate?: number;
      customerSaleRate?: number;
      rateCondition?: RateCondition;
      ratedQuantity?: number;
      vehicleReceivedQuantity?: number;
    }
  ) => {
    const is3rd = material === 'Laterite Stone — 3rd';
    const rateCondition = customRates?.rateCondition || 'Standard Rock';
    const activeQuarryRates =
      rateCondition === 'Weaker Rock' && rates.weakerRockRates
        ? rates.weakerRockRates
        : rates.quarryRates;

    let quarryRate =
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

    if (customRates?.quarryRate !== undefined) {
      quarryRate = customRates.quarryRate;
    }

    // Quarry rated quantity (default 255 for pieces, or load count for Mury)
    const ratedQty = is3rd
      ? quantity
      : customRates?.ratedQuantity !== undefined
      ? customRates.ratedQuantity
      : rates.loadFormula?.ratedQuantity || 255;

    const quarryAmount = is3rd ? quarryRate * quantity : ratedQty * quarryRate;

    let customerSaleRate = rates.rzCustomerRates[material]?.ratePerUnit || (is3rd ? 5000 : 65);
    if (customRates?.customerSaleRate !== undefined) {
      customerSaleRate = customRates.customerSaleRate;
    }

    // Vehicle received quantity is stored independently from quarry rated quantity
    const vehReceivedQty = is3rd
      ? quantity
      : customRates?.vehicleReceivedQuantity !== undefined
      ? customRates.vehicleReceivedQuantity
      : quantity;

    const customerSaleAmount =
      vehicleCategory === 'RZ Mining'
        ? (is3rd ? customerSaleRate * quantity : vehReceivedQty * customerSaleRate)
        : quarryAmount;

    let driverBatta = 0;
    let vehicleTripRent = 0;
    let loadingCharge = 0;
    let diesel = 0;
    let orderCommission = 0;
    let totalExpense = 0;
    let netProfit = 0;

    if (vehicleCategory === 'RZ Mining') {
      const multiplier = is3rd ? quantity : vehReceivedQty / 250;
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
    const is3rd = material === 'Laterite Stone — 3rd';
    const quantity = data.quantity ?? (is3rd ? 1 : 250);
    const vehicleCategory = data.vehicleCategory || 'RZ Mining';
    const rateCondition: RateCondition = data.rateCondition || 'Standard Rock';
    const physicalQuantity = is3rd ? undefined : (data.physicalQuantity ?? 260);
    const freeQuantity = is3rd ? undefined : (data.freeQuantity ?? 5);
    const ratedQuantity = is3rd ? quantity : (data.ratedQuantity ?? 255);
    const vehicleReceivedQuantity = is3rd ? quantity : (data.vehicleReceivedQuantity ?? data.quantity ?? 260);

    const calculated = calculateLoadDetails(material, quantity, vehicleCategory, {
      quarryRate: data.quarryRate,
      customerSaleRate: data.customerSaleRate,
      rateCondition,
      ratedQuantity,
      vehicleReceivedQuantity,
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
      unit: is3rd ? 'load' : 'pcs',
      rateCondition,
      physicalQuantity,
      freeQuantity,
      ratedQuantity,
      vehicleReceivedQuantity,
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
    setQuarries(INITIAL_QUARRIES);
    setActiveQuarryIdState('quarry-001');
    setBranding(INITIAL_BRANDING);
    setBillingConfig(INITIAL_BILLING_CONFIG);
    setThemeState('rz_gold');
    setDriverCollections(INITIAL_DRIVER_COLLECTIONS);
    setDailyProductionRecords(INITIAL_DAILY_PRODUCTION_RECORDS);
    setGapQueue(INITIAL_GAP_QUEUE);
    setGapOfferEvents(INITIAL_GAP_OFFER_EVENTS);
    setRoundLogs(INITIAL_ROUND_LOGS);

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
      quarries,
      activeQuarryId,
      branding,
      billingConfig,
      theme,
      driverCollections,
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
      if (data.quarries) setQuarries(data.quarries);
      if (data.activeQuarryId) setActiveQuarryIdState(data.activeQuarryId);
      if (data.branding) setBranding(data.branding);
      if (data.billingConfig) setBillingConfig(data.billingConfig);
      if (data.theme) setThemeState(data.theme);
      if (data.driverCollections) setDriverCollections(data.driverCollections);

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

  // Multi-Quarry & Land Owner Actions
  const setActiveQuarryId = useCallback((id: string) => {
    setActiveQuarryIdState(id);
    localStorage.setItem(`${STORAGE_KEY}_active_quarry_id`, id);
    fetch('/api/active-quarry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeQuarryId: id }),
    }).catch(console.error);
  }, []);

  const addQuarry = useCallback((quarry: QuarryProfile) => {
    setQuarries((prev) => [...prev, quarry]);
    fetch('/api/quarries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quarry),
    }).catch(console.error);
  }, []);

  const updateQuarry = useCallback((id: string, updates: Partial<QuarryProfile>) => {
    setQuarries((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
    fetch(`/api/quarries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(console.error);
  }, []);

  const deleteQuarry = useCallback((id: string) => {
    setQuarries((prev) => prev.filter((q) => q.id !== id));
    fetch(`/api/quarries/${id}`, { method: 'DELETE' }).catch(console.error);
  }, []);

  const addQuarrySection = useCallback((quarryId: string, section: QuarrySection) => {
    setQuarries((prev) =>
      prev.map((q) => {
        if (q.id === quarryId) {
          const sections = [...(q.sections || []).filter((s) => s.id !== section.id), section];
          const updated = { ...q, sections };
          fetch(`/api/quarries/${quarryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(console.error);
          return updated;
        }
        return q;
      })
    );
  }, []);

  const updateLandOwnerAccount = useCallback(
    (quarryId: string, landAccount: Partial<LandOwnerAccount>) => {
      setQuarries((prev) =>
        prev.map((q) => {
          if (q.id === quarryId) {
            const existing: LandOwnerAccount = q.landOwnerAccount || {
              id: `land-${quarryId}`,
              quarryId,
              landOwnerName: 'Hameed Haji',
              totalLandCent: 20,
              initialCuttingAgreementCent: 14,
              referenceRatePerCent: 140000,
              referenceAgreementValue: 1960000,
              remainingCent: 6,
              paidAmount: 0,
              balanceAmount: 1960000,
              outstandingAmount: 1960000,
              adjustments: 0,
              notes: '',
              documents: [],
              payments: [],
            };
            const merged = { ...existing, ...landAccount };
            merged.balanceAmount = Math.max(
              0,
              (merged.referenceAgreementValue || 0) - (merged.paidAmount || 0)
            );
            merged.outstandingAmount = merged.balanceAmount;
            const updated = { ...q, landOwnerAccount: merged };
            fetch(`/api/quarries/${quarryId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated),
            }).catch(console.error);
            return updated;
          }
          return q;
        })
      );
    },
    []
  );

  const addLandPayment = useCallback(
    (quarryId: string, paymentData: Omit<LandPaymentEntry, 'id' | 'createdAt'>) => {
      const payment: LandPaymentEntry = {
        ...paymentData,
        id: `lp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setQuarries((prev) =>
        prev.map((q) => {
          if (q.id === quarryId && q.landOwnerAccount) {
            const payments = [payment, ...(q.landOwnerAccount.payments || [])];
            const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
            const balanceAmount = Math.max(
              0,
              q.landOwnerAccount.referenceAgreementValue - paidAmount
            );
            const updatedLand = {
              ...q.landOwnerAccount,
              payments,
              paidAmount,
              balanceAmount,
              outstandingAmount: balanceAmount,
            };
            const updated = { ...q, landOwnerAccount: updatedLand };
            fetch(`/api/quarries/${quarryId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated),
            }).catch(console.error);
            return updated;
          }
          return q;
        })
      );
    },
    []
  );

  // Branding & Billing Actions
  const updateBranding = useCallback((config: Partial<BrandingConfig>) => {
    setBranding((prev) => {
      const updated = { ...prev, ...config };
      fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(console.error);
      return updated;
    });
  }, []);

  const updateBillingConfig = useCallback((config: Partial<BillingConfig>) => {
    setBillingConfig((prev) => {
      const updated = { ...prev, ...config };
      fetch('/api/billing-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(console.error);
      return updated;
    });
  }, []);

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(`${STORAGE_KEY}_theme`, newTheme);
  }, []);

  // Driver Collection Actions (UNSETTLED DRIVER COLLECTION → Company Settlement)
  const addDriverCollection = useCallback(
    (
      colData: Omit<DriverCollection, 'id' | 'createdAt' | 'collectionId' | 'enteredBy'> & {
        id?: string;
        collectionId?: string;
        enteredBy?: AppUser;
      }
    ): DriverCollection => {
      const year = new Date().getFullYear();
      const newCol: DriverCollection = {
        ...colData,
        id: colData.id || `dc-${Date.now()}`,
        collectionId:
          colData.collectionId ||
          `DC-${year}-${Math.floor(100 + Math.random() * 900)}`,
        settlementStatus: colData.settlementStatus || 'UNSETTLED',
        unsettledAmount:
          colData.unsettledAmount !== undefined ? colData.unsettledAmount : colData.amount,
        settledAmount: colData.settledAmount || 0,
        createdAt: new Date().toISOString(),
        enteredBy: currentUser,
        quarryId: activeQuarryId,
      };

      setDriverCollections((prev) => [newCol, ...prev]);

      fetch('/api/driver-collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCol),
      }).catch(console.error);

      return newCol;
    },
    [currentUser, activeQuarryId]
  );

  const settleDriverCollection = useCallback(
    (id: string, settledAmount: number, notes?: string) => {
      setDriverCollections((prev) =>
        prev.map((col) => {
          if (col.id === id || col.collectionId === id) {
            const totalAmt = col.amount;
            const alreadySettled = col.settledAmount || 0;
            const newSettled = Math.min(totalAmt, alreadySettled + settledAmount);
            const unsettled = Math.max(0, totalAmt - newSettled);
            const status: DriverCollectionSettlementStatus =
              unsettled === 0 ? 'SETTLED' : 'PARTIALLY SETTLED';

            const updated: DriverCollection = {
              ...col,
              settlementStatus: status,
              settledAmount: newSettled,
              unsettledAmount: unsettled,
              settlementDate: getTodayDateString(),
              settledBy: currentUser,
              settlementNotes: notes || col.settlementNotes,
              updatedAt: new Date().toISOString(),
            };

            fetch(`/api/driver-collections/${col.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated),
            }).catch(console.error);

            // Record settled company cash in QuarryIncome
            addQuarryIncome({
              date: getTodayDateString(),
              category: 'Customer Collections',
              description: `Driver Collection Settlement from ${col.driver} (${col.customer} — ${col.vehicle})`,
              amount: settledAmount,
              paymentMode: (col.paymentMode as PaymentMode) || 'Cash',
              customerName: col.customer,
              customerId: col.customerId,
              enteredBy: currentUser,
            });

            return updated;
          }
          return col;
        })
      );
    },
    [currentUser, addQuarryIncome]
  );

  // Daily Production Record actions
  const addDailyProductionRecord = useCallback(
    (recordData: Omit<QuarryDailyProductionRecord, 'id' | 'createdAt'> & { id?: string }): QuarryDailyProductionRecord => {
      const id = recordData.id || `prd-${Date.now()}`;
      const cut = Number(recordData.totalCutQuantity) || 0;
      const finished = Number(recordData.finishedQuantity) || 0;
      const first = Number(recordData.firstQualityQuantity) || 0;
      const second = Number(recordData.secondQualityQuantity) || 0;
      const latt = Number(recordData.lattQuantity) || 0;
      const mury = Number(recordData.muryQuantity) || 0;

      const record: QuarryDailyProductionRecord = {
        ...recordData,
        id,
        productionId: recordData.productionId || `PRD-2026-${String(dailyProductionRecords.length + 101).padStart(3, '0')}`,
        totalCutQuantity: cut,
        finishedQuantity: finished,
        firstQualityQuantity: first,
        secondQualityQuantity: second,
        lattQuantity: latt,
        muryQuantity: mury,
        recoveryRate: cut > 0 ? Number(((finished / cut) * 100).toFixed(2)) : null,
        firstQualityRate: finished > 0 ? Number(((first / finished) * 100).toFixed(2)) : null,
        secondQualityRate: finished > 0 ? Number(((second / finished) * 100).toFixed(2)) : null,
        lattRate: finished > 0 ? Number(((latt / finished) * 100).toFixed(2)) : null,
        muryRate: cut > 0 ? Number(((mury / cut) * 100).toFixed(2)) : null,
        enteredBy: recordData.enteredBy || currentUser,
        createdAt: new Date().toISOString(),
      };

      setDailyProductionRecords((prev) => [record, ...prev]);

      fetch('/api/daily-production-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      }).catch(console.error);

      return record;
    },
    [currentUser, dailyProductionRecords.length]
  );

  const updateDailyProductionRecord = useCallback(
    (id: string, updates: Partial<QuarryDailyProductionRecord>) => {
      setDailyProductionRecords((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            const updated = { ...r, ...updates, updatedAt: new Date().toISOString() };
            const cut = updated.totalCutQuantity || 0;
            const finished = updated.finishedQuantity || 0;
            updated.recoveryRate = cut > 0 ? Number(((finished / cut) * 100).toFixed(2)) : null;
            updated.firstQualityRate = finished > 0 ? Number((((updated.firstQualityQuantity || 0) / finished) * 100).toFixed(2)) : null;
            updated.secondQualityRate = finished > 0 ? Number((((updated.secondQualityQuantity || 0) / finished) * 100).toFixed(2)) : null;
            updated.lattRate = finished > 0 ? Number((((updated.lattQuantity || 0) / finished) * 100).toFixed(2)) : null;
            updated.muryRate = cut > 0 ? Number((((updated.muryQuantity || 0) / cut) * 100).toFixed(2)) : null;
            return updated;
          }
          return r;
        })
      );
    },
    []
  );

  const deleteDailyProductionRecord = useCallback((id: string) => {
    setDailyProductionRecords((prev) => prev.filter((r) => r.id !== id));
    fetch(`/api/daily-production-records/${id}`, { method: 'DELETE' }).catch(console.error);
  }, []);

  // Daily Gap System Actions
  const updateGapSlotVehicle = useCallback(
    (gapNumber: GapSlotNumber, vehicleId: string) => {
      const veh = vehicles.find((v) => v.id === vehicleId);
      if (!veh) return;

      const driverObj = drivers.find((d) => d.vehicle === veh.vehicleNumber || d.name === veh.driver);

      setGapQueue((prev) =>
        prev.map((slot) => {
          if (slot.gapNumber === gapNumber) {
            return {
              ...slot,
              vehicleId: veh.id,
              vehicleNumber: veh.vehicleNumber,
              driver: driverObj ? driverObj.name : veh.driver,
              owner: veh.owner,
              category: veh.category,
              isFixedCompanyVehicle: veh.category === 'RZ Mining' || veh.vehicleNumber === 'KL-55-RZ-01',
              currentStatus: 'Waiting',
              entryTime: getCurrentTimeString(),
            };
          }
          return slot;
        })
      );
    },
    [vehicles, drivers]
  );

  const offerGapLoad = useCallback(
    (
      offeredQuality: '1ST QUALITY' | '2ND QUALITY' | 'LATT / 3RD' | 'MURY',
      currentGap: GapSlotNumber,
      accepted: boolean,
      rejectionReason?: string
    ) => {
      const targetSlot = gapQueue.find((s) => s.gapNumber === currentGap) || gapQueue[0];
      const nextGap: GapSlotNumber | null = accepted ? null : (currentGap < 4 ? ((currentGap + 1) as GapSlotNumber) : null);

      const newEvent: GapOfferEvent = {
        id: `gop-${Date.now()}`,
        timestamp: `${getTodayDateString()} ${getCurrentTimeString()}`,
        roundNumber: targetSlot.roundNumber || 1,
        offeredQuality,
        offeredToGap: currentGap,
        vehicleNumber: targetSlot.vehicleNumber,
        driver: targetSlot.driver,
        action: accepted ? 'Accepted' : 'Rejected',
        rejectionReason: accepted ? undefined : (rejectionReason || 'Declined load; remains in queue for next turn'),
        nextOfferedGap: nextGap,
        recordedBy: currentUser,
      };

      setGapOfferEvents((prev) => [newEvent, ...prev]);

      if (accepted) {
        setGapQueue((prev) =>
          prev.map((s) => (s.gapNumber === currentGap ? { ...s, currentStatus: 'Loading' } : s))
        );
      } else {
        // Vehicle remains at quarry queue rather than being forced to leave
        setGapQueue((prev) =>
          prev.map((s) => (s.gapNumber === currentGap ? { ...s, currentStatus: 'Waiting' } : s))
        );
      }

      return { nextGap, accepted };
    },
    [gapQueue, currentUser]
  );

  const recordRoundEvent = useCallback(
    (roundData: Omit<QuarryRoundLog, 'id'> & { id?: string }): QuarryRoundLog => {
      const newRound: QuarryRoundLog = {
        ...roundData,
        id: roundData.id || `rnd-${Date.now()}`,
        status: roundData.status || 'Loading',
      };
      setRoundLogs((prev) => [newRound, ...prev]);
      return newRound;
    },
    []
  );

  const completeVehicleReturn = useCallback(
    (vehicleNumber: string, returnTime?: string) => {
      const time = returnTime || getCurrentTimeString();
      setRoundLogs((prev) => {
        const matchingIdx = prev.findIndex((r) => r.vehicleNumber === vehicleNumber && !r.returnTime);
        if (matchingIdx >= 0) {
          const updated = [...prev];
          const currRound = updated[matchingIdx].roundNumber;
          const returnedCount = updated.filter((r) => r.roundNumber === currRound && r.returnTime).length;
          const isRz = vehicleNumber === 'KL-55-RZ-01';
          updated[matchingIdx] = {
            ...updated[matchingIdx],
            returnTime: time,
            status: 'Returned',
            nextEligiblePosition: isRz ? 1 : Math.max(2, returnedCount + 2),
          };
          return updated;
        }
        return prev;
      });

      setGapQueue((prev) =>
        prev.map((slot) => {
          if (slot.vehicleNumber === vehicleNumber) {
            return {
              ...slot,
              currentStatus: 'Returned',
              notes: `Returned to quarry at ${time}. Queued for next round.`,
            };
          }
          return slot;
        })
      );
    },
    []
  );

  const advanceGapRound = useCallback(() => {
    setGapQueue((prev) => {
      const rzSlot = prev.find((s) => s.isFixedCompanyVehicle || s.vehicleNumber === 'KL-55-RZ-01') || prev[0];
      const outsideSlots = prev.filter((s) => s.id !== rzSlot.id);

      const rotatedOutside = outsideSlots.length > 1
        ? [...outsideSlots.slice(1), outsideSlots[0]]
        : outsideSlots;

      const currentRound = (rzSlot.roundNumber || 1) + 1;

      return [
        {
          ...rzSlot,
          gapNumber: 1 as GapSlotNumber,
          roundNumber: currentRound,
          currentStatus: 'Waiting',
          isFixedCompanyVehicle: true,
          notes: 'RZ MINING — Fixed Position 1 (Dedicated Company Turn)',
        },
        ...rotatedOutside.map((slot, idx) => ({
          ...slot,
          gapNumber: ((idx + 2) as GapSlotNumber),
          roundNumber: currentRound,
          currentStatus: 'Waiting' as const,
          notes: `Round #${currentRound} Turn #${idx + 2}`,
        })),
      ];
    });
  }, []);

  return (
    <QuarryContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authUser,
        quarries,
        activeQuarryId,
        activeQuarry,
        setActiveQuarryId,
        addQuarry,
        updateQuarry,
        deleteQuarry,
        addQuarrySection,
        updateLandOwnerAccount,
        addLandPayment,
        branding,
        updateBranding,
        billingConfig,
        updateBillingConfig,
        theme,
        setTheme,
        driverCollections,
        addDriverCollection,
        settleDriverCollection,
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
        dailyProductionRecords,
        addDailyProductionRecord,
        updateDailyProductionRecord,
        deleteDailyProductionRecord,
        gapQueue,
        gapOfferEvents,
        roundLogs,
        updateGapSlotVehicle,
        offerGapLoad,
        recordRoundEvent,
        completeVehicleReturn,
        advanceGapRound,
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
