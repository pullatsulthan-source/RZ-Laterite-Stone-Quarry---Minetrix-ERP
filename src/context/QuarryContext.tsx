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
  GoogleAuthUser,
  SavedStatement,
  DailyRotation,
  DailyRotationEntry,
  RotationTurnStatus,
  VehicleTransaction,
  VehicleOwnerType,
  StoneOrder,
  OrderStatus,
  QuarryProfile,
  QuarrySection,
  LandOwnerAccount,
  LandPaymentEntry,
  BrandingConfig,
  BillingConfig,
  AppTheme,
  DriverCollection,
  DriverCollectionSettlementStatus,
  QuarryMachine,
  JcbUsageRecord,
  MachineRentContract,
  DieselEntry,
  OilEntry,
  SparePartEntry,
  BladeRecord,
  MachineMaintenanceRecord,
  VendorShop,
  FoodPurchaseBill,
  ToolsRoomRentRecord,
  DailyMachineWorkLog,
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
  INITIAL_MACHINES,
  INITIAL_JCB_RECORDS,
  INITIAL_RENT_CONTRACTS,
  INITIAL_VENDORS,
  INITIAL_DIESEL_ENTRIES,
  INITIAL_OIL_ENTRIES,
  INITIAL_SPARE_ENTRIES,
  INITIAL_BLADES,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_FOOD_PURCHASES,
  INITIAL_TOOLS_RENT,
  INITIAL_MACHINE_WORK_LOGS,
} from '../data/seedData';
import {
  padGatePassNumber,
  padLoadNumber,
  getTodayDateString,
  getCurrentTimeString,
} from '../utils/formatters';

// Storage Encryption Helpers
export const BILLING_CONFIG_ENC_PREFIX = 'enc:v1:';

export const getCrypto = () => {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not available in this environment.');
  }
  return cryptoObj;
};

export const deriveAesKey = async (secret: string): Promise<CryptoKey> => {
  const cryptoObj = getCrypto();
  const encoded = new TextEncoder().encode(secret);
  const hash = await cryptoObj.subtle.digest('SHA-256', encoded);
  return cryptoObj.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

export const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const encryptForStorage = async (plaintext: string, secret: string): Promise<string> => {
  const cryptoObj = getCrypto();
  const key = await deriveAesKey(secret);
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await cryptoObj.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encoded as unknown as BufferSource
  );
  const cipherBytes = new Uint8Array(cipherBuffer);
  return `${BILLING_CONFIG_ENC_PREFIX}${bytesToBase64(iv)}:${bytesToBase64(cipherBytes)}`;
};

export const decryptFromStorage = async (payload: string, secret: string): Promise<string> => {
  if (!payload.startsWith(BILLING_CONFIG_ENC_PREFIX)) {
    return payload;
  }
  const cryptoObj = getCrypto();
  const body = payload.slice(BILLING_CONFIG_ENC_PREFIX.length);
  const [ivB64, cipherB64] = body.split(':');
  if (!ivB64 || !cipherB64) {
    throw new Error('Invalid encrypted payload format.');
  }
  const iv = base64ToBytes(ivB64);
  const cipherBytes = base64ToBytes(cipherB64);
  const buffer = cipherBytes.buffer.slice(
    cipherBytes.byteOffset,
    cipherBytes.byteOffset + cipherBytes.byteLength
  ) as ArrayBuffer;
  const key = await deriveAesKey(secret);
  const plainBuffer = await cryptoObj.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    buffer
  );
  return new TextDecoder().decode(plainBuffer);
};

export interface QuarryContextType {
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
  saveStatement: (stmt: Omit<SavedStatement, 'id'> & { id?: string }) => Promise<SavedStatement>;
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
    record: Omit<QuarryDailyProductionRecord, 'id' | 'createdAt' | 'productionId'> & {
      id?: string;
      productionId?: string;
    }
  ) => QuarryDailyProductionRecord;
  updateDailyProductionRecord: (id: string, updates: Partial<QuarryDailyProductionRecord>) => void;
  deleteDailyProductionRecord: (id: string) => void;

  // Daily Gap System & Rotation Engine (4-Gap Queue, Cascading Offers, Round Return Order)
  gapQueue: GapVehicleQueueItem[];
  gapOfferEvents: GapOfferEvent[];
  roundLogs: QuarryRoundLog[];
  updateGapSlotVehicle: (gapNumber: GapSlotNumber, vehicleId: string) => void;
  offerGapLoad: (
    offeredQuality: OperationalQuality,
    currentGap: GapSlotNumber,
    accepted: boolean,
    rejectionReason?: string
  ) => { nextGap: GapSlotNumber | null; accepted: boolean };
  recordRoundEvent: (round: Omit<QuarryRoundLog, 'id'> & { id?: string }) => QuarryRoundLog;
  completeVehicleReturn: (vehicleNumber: string, returnTime?: string) => void;
  advanceGapRound: () => void;

  // PROMPT 3: Quarry Machinery, JCB, Spares & Rent Management
  machines: QuarryMachine[];
  addMachine: (machine: Omit<QuarryMachine, 'id' | 'createdAt'> & { id?: string }) => QuarryMachine;
  updateMachine: (id: string, updates: Partial<QuarryMachine>) => void;
  replaceMachine: (
    oldMachineId: string,
    newMachine: Omit<QuarryMachine, 'id' | 'createdAt'> & { id?: string }
  ) => { oldMachine: QuarryMachine; newMachine: QuarryMachine };
  deactivateMachine: (id: string, reason?: string) => void;

  jcbRecords: JcbUsageRecord[];
  addJcbRecord: (
    record: Omit<JcbUsageRecord, 'id' | 'createdAt' | 'totalHours' | 'totalAmount'> & {
      id?: string;
      totalHours?: number;
      totalAmount?: number;
    }
  ) => JcbUsageRecord;
  updateJcbRecord: (id: string, updates: Partial<JcbUsageRecord>) => void;
  deleteJcbRecord: (id: string) => void;

  rentContracts: MachineRentContract[];
  addRentContract: (contract: Omit<MachineRentContract, 'id' | 'createdAt'> & { id?: string }) => MachineRentContract;
  updateRentContract: (id: string, updates: Partial<MachineRentContract>) => void;
  settleRentContract: (id: string, amount: number) => void;

  dieselEntries: DieselEntry[];
  addDieselEntry: (entry: Omit<DieselEntry, 'id' | 'createdAt' | 'amount'> & { id?: string; amount?: number }) => DieselEntry;
  deleteDieselEntry: (id: string) => void;

  oilEntries: OilEntry[];
  addOilEntry: (entry: Omit<OilEntry, 'id' | 'createdAt' | 'amount'> & { id?: string; amount?: number }) => OilEntry;
  deleteOilEntry: (id: string) => void;

  sparePartEntries: SparePartEntry[];
  addSparePartEntry: (entry: Omit<SparePartEntry, 'id' | 'createdAt' | 'amount'> & { id?: string; amount?: number }) => SparePartEntry;
  deleteSparePartEntry: (id: string) => void;

  bladeRecords: BladeRecord[];
  addBladeRecord: (
    blade: Omit<BladeRecord, 'id' | 'createdAt' | 'bladeId'> & {
      id?: string;
      bladeId?: string;
    }
  ) => BladeRecord;
  updateBladeRecord: (id: string, updates: Partial<BladeRecord>) => void;

  maintenanceRecords: MachineMaintenanceRecord[];
  addMaintenanceRecord: (
    record: Omit<MachineMaintenanceRecord, 'id' | 'createdAt' | 'maintenanceId' | 'totalCost'> & {
      id?: string;
      maintenanceId?: string;
      totalCost?: number;
    }
  ) => MachineMaintenanceRecord;
  deleteMaintenanceRecord: (id: string) => void;

  vendors: VendorShop[];
  addVendor: (vendor: Omit<VendorShop, 'id' | 'createdAt'> & { id?: string }) => VendorShop;
  updateVendor: (id: string, updates: Partial<VendorShop>) => void;

  foodPurchases: FoodPurchaseBill[];
  addFoodPurchase: (bill: Omit<FoodPurchaseBill, 'id' | 'createdAt'> & { id?: string }) => FoodPurchaseBill;
  deleteFoodPurchase: (id: string) => void;

  toolsRoomRent: ToolsRoomRentRecord[];
  addToolsRoomRent: (rent: Omit<ToolsRoomRentRecord, 'id' | 'createdAt'> & { id?: string }) => ToolsRoomRentRecord;
  settleToolsRoomRent: (id: string, paidAmount: number) => void;

  machineWorkLogs: DailyMachineWorkLog[];
  addMachineWorkLog: (log: Omit<DailyMachineWorkLog, 'id' | 'createdAt'> & { id?: string }) => DailyMachineWorkLog;

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

  const authUser: GoogleAuthUser = useMemo(
    () => ({
      id: currentUser === 'Nafid' ? 'op_nafid_rz' : 'op_aflah_rz',
      name: currentUser === 'Nafid' ? 'Nafid Khan' : 'Aflah RZ',
      shortName: currentUser,
      email:
        currentUser === 'Nafid'
          ? 'nafidkhan@racezoneventures.com'
          : 'aflah@racezoneventures.com',
      picture:
        currentUser === 'Nafid'
          ? 'https://ui-avatars.com/api/?name=Nafid+Khan&background=d4af37&color=090a0d&bold=true'
          : 'https://ui-avatars.com/api/?name=Aflah+RZ&background=d4af37&color=090a0d&bold=true',
      verifiedAt: new Date().toISOString(),
    }),
    [currentUser]
  );

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
    return saved ? JSON.parse(saved) : INITIAL_STATEMENTS || [];
  });

  const [rotations, setRotations] = useState<DailyRotation[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_rotations`);
    return saved ? JSON.parse(saved) : INITIAL_ROTATIONS;
  });

  const [vehicleTransactions, setVehicleTransactions] = useState<VehicleTransaction[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_vehicle_transactions`);
    return saved ? JSON.parse(saved) : INITIAL_VEHICLE_TRANSACTIONS || [];
  });

  const [orders, setOrders] = useState<StoneOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS || [];
  });

  // Multi-Quarry & Business Profile state
  const [quarries, setQuarries] = useState<QuarryProfile[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_quarries`);
    return saved ? JSON.parse(saved) : INITIAL_QUARRIES || [];
  });

  const [activeQuarryId, setActiveQuarryIdState] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_active_quarry_id`);
    return saved || 'quarry-001';
  });

  const activeQuarry = useMemo(() => {
    return (
      quarries.find((q) => q.id === activeQuarryId) ||
      quarries[0] ||
      INITIAL_QUARRIES[0]
    );
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
    return saved ? JSON.parse(saved) : INITIAL_DRIVER_COLLECTIONS || [];
  });

  // Daily Production Records (Zero Warehouse Stock Model)
  const [dailyProductionRecords, setDailyProductionRecords] = useState<
    QuarryDailyProductionRecord[]
  >(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_daily_production_records`);
    return saved ? JSON.parse(saved) : INITIAL_DAILY_PRODUCTION_RECORDS || [];
  });

  // Daily Gap System (4-Gap queue)
  const [gapQueue, setGapQueue] = useState<GapVehicleQueueItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_gap_queue`);
    return saved ? JSON.parse(saved) : INITIAL_GAP_QUEUE || [];
  });

  // Gap Offer Events (Cascading Offers)
  const [gapOfferEvents, setGapOfferEvents] = useState<GapOfferEvent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_gap_offer_events`);
    return saved ? JSON.parse(saved) : INITIAL_GAP_OFFER_EVENTS || [];
  });

  // Quarry Round Logs
  const [roundLogs, setRoundLogs] = useState<QuarryRoundLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_round_logs`);
    return saved ? JSON.parse(saved) : INITIAL_ROUND_LOGS || [];
  });

  // Machinery Master State
  const [machines, setMachines] = useState<QuarryMachine[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_machines`);
    return saved ? JSON.parse(saved) : INITIAL_MACHINES || [];
  });

  // JCB Usage & Hour Readings State
  const [jcbRecords, setJcbRecords] = useState<JcbUsageRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_jcb_records`);
    return saved ? JSON.parse(saved) : INITIAL_JCB_RECORDS || [];
  });

  // Machine Rent Contracts State
  const [rentContracts, setRentContracts] = useState<MachineRentContract[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_rent_contracts`);
    return saved ? JSON.parse(saved) : INITIAL_RENT_CONTRACTS || [];
  });

  // Vendor / Shop Master State
  const [vendors, setVendors] = useState<VendorShop[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_vendors`);
    return saved ? JSON.parse(saved) : INITIAL_VENDORS || [];
  });

  // Diesel Entries State (Machine vs Vehicle vs JCB Reimbursed)
  const [dieselEntries, setDieselEntries] = useState<DieselEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_diesel_entries`);
    return saved ? JSON.parse(saved) : INITIAL_DIESEL_ENTRIES || [];
  });

  // Oil Entries State
  const [oilEntries, setOilEntries] = useState<OilEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_oil_entries`);
    return saved ? JSON.parse(saved) : INITIAL_OIL_ENTRIES || [];
  });

  // Spare Parts Entries State
  const [sparePartEntries, setSparePartEntries] = useState<SparePartEntry[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_spare_entries`);
    return saved ? JSON.parse(saved) : INITIAL_SPARE_ENTRIES || [];
  });

  // Blade Master & Life Tracking State
  const [bladeRecords, setBladeRecords] = useState<BladeRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_blade_records`);
    return saved ? JSON.parse(saved) : INITIAL_BLADES || [];
  });

  // Machine Maintenance Records State
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MachineMaintenanceRecord[]
  >(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_maintenance_records`);
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE_RECORDS || [];
  });

  // Food Purchases (Worker Welfare) State
  const [foodPurchases, setFoodPurchases] = useState<FoodPurchaseBill[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_food_purchases`);
    return saved ? JSON.parse(saved) : INITIAL_FOOD_PURCHASES || [];
  });

  // Tools Room Rent State
  const [toolsRoomRent, setToolsRoomRent] = useState<ToolsRoomRentRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tools_rent`);
    return saved ? JSON.parse(saved) : INITIAL_TOOLS_RENT || [];
  });

  // Daily Machine Work Logs State
  const [machineWorkLogs, setMachineWorkLogs] = useState<DailyMachineWorkLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_machine_work_logs`);
    return saved ? JSON.parse(saved) : INITIAL_MACHINE_WORK_LOGS || [];
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
      localStorage.setItem(`${STORAGE_KEY}_machines`, JSON.stringify(machines));
      localStorage.setItem(`${STORAGE_KEY}_jcb_records`, JSON.stringify(jcbRecords));
      localStorage.setItem(`${STORAGE_KEY}_rent_contracts`, JSON.stringify(rentContracts));
      localStorage.setItem(`${STORAGE_KEY}_vendors`, JSON.stringify(vendors));
      localStorage.setItem(`${STORAGE_KEY}_diesel_entries`, JSON.stringify(dieselEntries));
      localStorage.setItem(`${STORAGE_KEY}_oil_entries`, JSON.stringify(oilEntries));
      localStorage.setItem(`${STORAGE_KEY}_spare_entries`, JSON.stringify(sparePartEntries));
      localStorage.setItem(`${STORAGE_KEY}_blade_records`, JSON.stringify(bladeRecords));
      localStorage.setItem(`${STORAGE_KEY}_maintenance_records`, JSON.stringify(maintenanceRecords));
      localStorage.setItem(`${STORAGE_KEY}_food_purchases`, JSON.stringify(foodPurchases));
      localStorage.setItem(`${STORAGE_KEY}_tools_rent`, JSON.stringify(toolsRoomRent));
      localStorage.setItem(`${STORAGE_KEY}_machine_work_logs`, JSON.stringify(machineWorkLogs));
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
    machines,
    jcbRecords,
    rentContracts,
    vendors,
    dieselEntries,
    oilEntries,
    sparePartEntries,
    bladeRecords,
    maintenanceRecords,
    foodPurchases,
    toolsRoomRent,
    machineWorkLogs,
  ]);

  // Refresh data from shared backend database
  const refreshBackendData = useCallback(async () => {
    try {
      setIsSyncing(true);
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
        if (
          backendDb.rotations &&
          Array.isArray(backendDb.rotations) &&
          backendDb.rotations.length > 0
        ) {
          setRotations(backendDb.rotations);
        }
        if (
          backendDb.vehicleTransactions &&
          Array.isArray(backendDb.vehicleTransactions) &&
          backendDb.vehicleTransactions.length > 0
        ) {
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
        if (
          backendDb.driverCollections &&
          Array.isArray(backendDb.driverCollections) &&
          backendDb.driverCollections.length > 0
        ) {
          setDriverCollections(backendDb.driverCollections);
        }
      }
    } catch {
      // Backend polling error ignored in transient offline
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Multi-device synchronization polling
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
      (creatorName === 'Nafid'
        ? 'nafidkhan@racezoneventures.com'
        : 'aflah@racezoneventures.com');
    const creatorId =
      authUser?.id || (creatorName === 'Nafid' ? 'goog_nafid_rz' : 'goog_aflah_rz');

    return {
      quarryId: activeQuarryId,
      created_by_user_id: creatorId,
      created_by_name: creatorName,
      created_by_email: creatorEmail,
      created_at: new Date().toISOString(),
      enteredBy: creatorName as AppUser,
    };
  }, [authUser, currentUser, activeQuarryId]);

  // Stock calculation formula (Zero Warehouse Stock Model)
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

    const vehReceivedQty = is3rd
      ? quantity
      : customRates?.vehicleReceivedQuantity !== undefined
      ? customRates.vehicleReceivedQuantity
      : quantity;

    const customerSaleAmount =
      vehicleCategory === 'RZ Mining'
        ? is3rd
          ? customerSaleRate * quantity
          : vehReceivedQty * customerSaleRate
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
    const physicalQuantity = is3rd ? undefined : data.physicalQuantity ?? 260;
    const freeQuantity = is3rd ? undefined : data.freeQuantity ?? 5;
    const ratedQuantity = is3rd ? quantity : data.ratedQuantity ?? 255;
    const vehicleReceivedQuantity = is3rd ? quantity : data.vehicleReceivedQuantity ?? data.quantity ?? 260;

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

    setGatePasses((prev) => [newGatePass, ...prev]);
    fetch('/api/gate-passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGatePass),
    }).catch(console.error);

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
      enteredBy: currentUser,
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

  const addVehicle = (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newVeh: Vehicle = {
      ...vehicle,
      ...audit,
      id: `veh-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setVehicles((prev) => [newVeh, ...prev]);
    fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVeh),
    }).catch(console.error);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    fetch(`/api/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  const deleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    fetch(`/api/vehicles/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const addDriver = (driver: Omit<Driver, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newDriver: Driver = {
      ...driver,
      ...audit,
      id: `drv-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDrivers((prev) => [newDriver, ...prev]);
    fetch('/api/drivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDriver),
    }).catch(console.error);
  };

  const updateDriver = (id: string, updates: Partial<Driver>) => {
    setDrivers((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    fetch(`/api/drivers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  const deleteDriver = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    fetch(`/api/drivers/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const audit = getAuditInfo();
    const newCust: Customer = {
      ...customer,
      ...audit,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCust),
    }).catch(console.error);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    fetch(`/api/customers/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const addStaff = (staffMember: Omit<Staff, 'id'>) => {
    const newStaff: Staff = {
      ...staffMember,
      id: `staff-${Date.now()}`,
    };
    setStaff((prev) => [newStaff, ...prev]);
    fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStaff),
    }).catch(console.error);
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    fetch(`/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  const deleteStaff = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    fetch(`/api/staff/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const markAttendance = (record: Omit<StaffAttendance, 'id'>) => {
    const existing = attendance.find(
      (a) => a.date === record.date && a.staffId === record.staffId
    );
    if (existing) {
      setAttendance((prev) =>
        prev.map((a) => (a.id === existing.id ? { ...a, ...record } : a))
      );
    } else {
      const newRec: StaffAttendance = {
        ...record,
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      };
      setAttendance((prev) => [newRec, ...prev]);
      fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRec),
      }).catch(console.error);
    }
  };

  const bulkMarkAttendance = (
    date: string,
    records: { staffId: string; status: StaffAttendance['status']; remarks?: string }[]
  ) => {
    records.forEach((rec) => {
      const member = staff.find((s) => s.id === rec.staffId);
      markAttendance({
        staffId: rec.staffId,
        employeeName: member?.name || 'Staff',
        date,
        status: rec.status,
        overtimeHours: 0,
        enteredBy: currentUser,
        remarks: rec.remarks || '',
      });
    });
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
  };

  const deleteStaffAdvance = (id: string) => {
    setAdvances((prev) => prev.filter((a) => a.id !== id));
    fetch(`/api/advances/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const generateMonthlyPayroll = (month: string) => {
    const generated: StaffPayroll[] = staff.map((s) => {
      const staffAtt = attendance.filter(
        (a) => a.staffId === s.id && a.date.startsWith(month) && a.status === 'Present'
      );
      const halfDaysList = attendance.filter(
        (a) => a.staffId === s.id && a.date.startsWith(month) && a.status === 'Half Day'
      );
      const absentDaysList = attendance.filter(
        (a) => a.staffId === s.id && a.date.startsWith(month) && a.status === 'Absent'
      );
      const daysWorked = staffAtt.length + halfDaysList.length * 0.5;
      const dailyWage = s.dailyWage || 1000;
      const gross = daysWorked * dailyWage;

      const staffAdv = advances.filter(
        (adv) => adv.staffId === s.id && adv.date.startsWith(month)
      );
      const totalAdvance = staffAdv.reduce((sum, a) => sum + a.amount, 0);
      const netPayable = Math.max(0, gross - totalAdvance);

      return {
        id: `pay-${s.id}-${month}`,
        month,
        staffId: s.id,
        employeeName: s.name,
        role: s.role,
        salaryType: 'Daily Wage' as const,
        basicSalaryOrDailyRate: dailyWage,
        presentDays: staffAtt.length,
        halfDays: halfDaysList.length,
        absentDays: absentDaysList.length,
        overtimeHours: 0,
        overtimePay: 0,
        allowance: 0,
        bonus: 0,
        advanceDeduction: totalAdvance,
        otherDeductions: 0,
        grossSalary: gross,
        netSalary: netPayable,
        status: 'Draft' as const,
        enteredBy: currentUser,
        created_at: new Date().toISOString(),
      };
    });

    setPayrolls((prev) => {
      const filtered = prev.filter((p) => p.month !== month);
      return [...generated, ...filtered];
    });

    fetch('/api/payrolls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(generated),
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
    stmt: Omit<SavedStatement, 'id'> & { id?: string }
  ): Promise<SavedStatement> => {
    const savedStmt: SavedStatement = {
      ...stmt,
      id: stmt.id || `stmt-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setStatements((prev) => {
      const exists = prev.some((s) => s.id === savedStmt.id);
      if (exists) return prev.map((s) => (s.id === savedStmt.id ? savedStmt : s));
      return [savedStmt, ...prev];
    });

    try {
      await fetch('/api/statements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedStmt),
      });
    } catch (e) {
      console.warn('Backend statement save error:', e);
    }
    return savedStmt;
  };

  const deleteStatement = async (id: string): Promise<void> => {
    setStatements((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/statements/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend statement delete error:', e);
    }
  };

  // Multi-quarry profile management
  const setActiveQuarryId = (id: string) => {
    setActiveQuarryIdState(id);
    localStorage.setItem(`${STORAGE_KEY}_active_quarry_id`, id);
    fetch('/api/active-quarry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeQuarryId: id }),
    }).catch(console.error);
  };

  const addQuarry = (quarry: QuarryProfile) => {
    setQuarries((prev) => [...prev, quarry]);
    fetch('/api/quarries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quarry),
    }).catch(console.error);
  };

  const updateQuarry = (id: string, updates: Partial<QuarryProfile>) => {
    setQuarries((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
    fetch(`/api/quarries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  const deleteQuarry = (id: string) => {
    setQuarries((prev) => prev.filter((q) => q.id !== id));
    fetch(`/api/quarries/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const addQuarrySection = (quarryId: string, section: QuarrySection) => {
    setQuarries((prev) =>
      prev.map((q) => {
        if (q.id !== quarryId) return q;
        const sections = q.sections ? [...q.sections, section] : [section];
        return { ...q, sections };
      })
    );
  };

  const updateLandOwnerAccount = (
    quarryId: string,
    landAccount: Partial<LandOwnerAccount>
  ) => {
    setQuarries((prev: QuarryProfile[]) =>
      prev.map((q) => {
        if (q.id !== quarryId) return q;
        const currentAccount: LandOwnerAccount = q.landOwnerAccount || {
          id: `land-${quarryId}`,
          quarryId,
          landOwnerName: '',
          totalLandCent: 20,
          initialCuttingAgreementCent: 14,
          cuttingAreaCent: 14,
          referenceRatePerCent: 140000,
          referenceAgreementValue: 1960000,
          remainingCent: 6,
          paidAmount: 0,
          balanceAmount: 1960000,
          outstandingAmount: 1960000,
          documents: [],
          payments: [],
        };
        const updated: LandOwnerAccount = {
          ...currentAccount,
          ...landAccount,
          documents: landAccount.documents || currentAccount.documents || [],
          payments: landAccount.payments || currentAccount.payments || [],
        };
        return { ...q, landOwnerAccount: updated };
      })
    );
  };

  const addLandPayment = (
    quarryId: string,
    payment: Omit<LandPaymentEntry, 'id' | 'createdAt'>
  ) => {
    const newEntry: LandPaymentEntry = {
      ...payment,
      id: `lp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setQuarries((prev: QuarryProfile[]) =>
      prev.map((q) => {
        if (q.id !== quarryId) return q;
        const currentAccount: LandOwnerAccount = q.landOwnerAccount || {
          id: `land-${quarryId}`,
          quarryId,
          landOwnerName: 'Land Owner',
          totalLandCent: 20,
          initialCuttingAgreementCent: 14,
          cuttingAreaCent: 14,
          referenceRatePerCent: 140000,
          referenceAgreementValue: 1960000,
          remainingCent: 6,
          paidAmount: 0,
          balanceAmount: 1960000,
          outstandingAmount: 1960000,
          documents: [],
          payments: [],
        };
        const currentPayments = currentAccount.payments || [];
        const updatedPayments = [newEntry, ...currentPayments];
        const newPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const refValue = currentAccount.referenceAgreementValue || 1960000;
        const newBalance = Math.max(0, refValue - newPaid);

        const updatedLand: LandOwnerAccount = {
          ...currentAccount,
          paidAmount: newPaid,
          balanceAmount: newBalance,
          outstandingAmount: newBalance,
          documents: currentAccount.documents || [],
          payments: updatedPayments,
        };

        return {
          ...q,
          landOwnerAccount: updatedLand,
        };
      })
    );
  };

  // Branding & Billing
  const updateBranding = (config: Partial<BrandingConfig>) => {
    setBranding((prev) => ({ ...prev, ...config }));
    fetch('/api/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(console.error);
  };

  const updateBillingConfig = (config: Partial<BillingConfig>) => {
    setBillingConfig((prev) => ({ ...prev, ...config }));
    fetch('/api/billing-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(console.error);
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(`${STORAGE_KEY}_theme`, newTheme);
  };

  // Driver Collections
  const addDriverCollection = (
    col: Omit<DriverCollection, 'id' | 'createdAt' | 'collectionId' | 'enteredBy'> & {
      id?: string;
      collectionId?: string;
      enteredBy?: AppUser;
    }
  ): DriverCollection => {
    const audit = getAuditInfo();
    const newCol: DriverCollection = {
      ...col,
      ...audit,
      id: col.id || `dc-${Date.now()}`,
      collectionId: col.collectionId || `DC-${Date.now().toString().slice(-4)}`,
      enteredBy: col.enteredBy || currentUser,
      createdAt: new Date().toISOString(),
    };
    setDriverCollections((prev) => [newCol, ...prev]);
    fetch('/api/driver-collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCol),
    }).catch(console.error);
    return newCol;
  };

  const settleDriverCollection = (
    id: string,
    settledAmount: number,
    notes?: string
  ) => {
    setDriverCollections((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newSettled = (c.settledAmount || 0) + settledAmount;
        const remainingUnsettled = Math.max(0, c.amount - newSettled);
        const settlementStatus: DriverCollectionSettlementStatus =
          remainingUnsettled <= 0 ? 'SETTLED' : 'PARTIALLY SETTLED';
        const updated: DriverCollection = {
          ...c,
          settledAmount: newSettled,
          unsettledAmount: remainingUnsettled,
          settlementStatus,
          settlementDate: getTodayDateString(),
          remarks: notes ? `${c.remarks || ''} | Settle: ${notes}` : c.remarks,
        };
        fetch(`/api/driver-collections/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch(console.error);
        return updated;
      })
    );
  };

  // Vehicle Rotation Engine Actions
  const getRotationForDate = useCallback(
    (date: string): DailyRotation | null => {
      const match = rotations.find((r) => r.rotationDate === date);
      return match || null;
    },
    [rotations]
  );

  const saveRotation = (rotation: DailyRotation) => {
    setRotations((prev) => {
      const filtered = prev.filter((r) => r.rotationDate !== rotation.rotationDate);
      return [...filtered, rotation];
    });
    fetch('/api/rotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rotation),
    }).catch(console.error);
  };

  const advanceRotation = (targetDate?: string): DailyRotation => {
    const today = targetDate || getTodayDateString();
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const prevRot = getRotationForDate(yesterdayDate) || rotations[rotations.length - 1] || INITIAL_ROTATIONS[0];
    const nextCycle = (prevRot.rotationNumber || 1) + 1;
    const nextRot = generateNextRotationEngine(prevRot, today, nextCycle);
    saveRotation(nextRot);
    return nextRot;
  };

  const updateRotationItemStatus = (
    date: string,
    position: number,
    status: RotationTurnStatus,
    remarks?: string
  ) => {
    setRotations((prev) =>
      prev.map((r) => {
        if (r.rotationDate !== date) return r;
        const updatedEntries = r.entries.map((e) => {
          if (e.position !== position) return e;
          return {
            ...e,
            status,
            remarks: remarks !== undefined ? remarks : e.remarks,
          };
        });
        const updatedRotation: DailyRotation = { ...r, entries: updatedEntries };
        fetch('/api/rotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRotation),
        }).catch(console.error);
        return updatedRotation;
      })
    );
  };

  // Unified Vehicle Accounting Actions
  const addVehicleTransaction = async (
    txn: Omit<VehicleTransaction, 'id' | 'createdAt'> & { id?: string }
  ): Promise<VehicleTransaction> => {
    const audit = getAuditInfo();
    const newTxn: VehicleTransaction = {
      ...txn,
      ...audit,
      id: txn.id || `vtx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setVehicleTransactions((prev) => [newTxn, ...prev]);
    try {
      await fetch('/api/vehicle-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTxn),
      });
    } catch (e) {
      console.warn('Backend vtx save error:', e);
    }
    return newTxn;
  };

  const updateVehicleTransaction = async (
    id: string,
    updates: Partial<VehicleTransaction>
  ): Promise<void> => {
    setVehicleTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    try {
      await fetch(`/api/vehicle-transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.warn('Backend vtx update error:', e);
    }
  };

  const deleteVehicleTransaction = async (id: string): Promise<void> => {
    setVehicleTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await fetch(`/api/vehicle-transactions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend vtx delete error:', e);
    }
  };

  const updateVehicleOwnerType = async (
    vehicleNumber: string,
    ownerType: VehicleOwnerType,
    newOwner?: string
  ): Promise<void> => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.vehicleNumber !== vehicleNumber) return v;
        return {
          ...v,
          ownerType,
          owner: newOwner || v.owner,
        };
      })
    );
    const target = vehicles.find((v) => v.vehicleNumber === vehicleNumber);
    if (target) {
      fetch(`/api/vehicles/${target.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerType, owner: newOwner || target.owner }),
      }).catch(console.error);
    }
  };

  // Complete Order Management Workflow Actions
  const createOrder = (orderData: Partial<StoneOrder>): StoneOrder => {
    const orderSeq = orders.length + 1001;
    const orderId = orderData.orderId || `ORD-${orderSeq}`;
    const qty = orderData.quantity || 250;
    const rate = orderData.rate || 65;
    const grossAmount = orderData.grossAmount || qty * rate;
    const paymentReceived = orderData.paymentReceived || 0;
    const balance = orderData.balance !== undefined ? orderData.balance : grossAmount - paymentReceived;
    const audit = getAuditInfo();

    const newOrder: StoneOrder = {
      id: `ord-${Date.now()}`,
      orderId,
      orderDate: orderData.orderDate || getTodayDateString(),
      customer: orderData.customer || 'General Client',
      customerPhone: orderData.customerPhone || '',
      customerId: orderData.customerId || '',
      deliveryLocation: orderData.deliveryLocation || 'Site',
      agentName: orderData.agentName || 'Direct Quarry',
      quality: orderData.quality || 'Laterite Stone — 1st',
      quantity: qty,
      unit: orderData.unit || 'pcs',
      rate,
      grossAmount,
      commission: orderData.commission || 0,
      paymentTerms: orderData.paymentTerms || 'IMMEDIATE',
      assignedVehicle: orderData.assignedVehicle,
      driver: orderData.driver,
      requiredDate: orderData.requiredDate || getTodayDateString(),
      status: orderData.status || 'NEW',
      paymentReceived,
      balance,
      remarks: orderData.remarks || '',
      ...audit,
      createdAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch(console.error);

    return newOrder;
  };

  const updateOrder = (id: string, updates: Partial<StoneOrder>) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const merged = { ...o, ...updates };
        if (updates.quantity !== undefined || updates.rate !== undefined) {
          const qty = updates.quantity !== undefined ? updates.quantity : merged.quantity;
          const rate = updates.rate !== undefined ? updates.rate : merged.rate;
          merged.grossAmount = qty * rate;
          merged.balance = merged.grossAmount - (merged.paymentReceived || 0);
        }
        return merged;
      })
    );
    fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    fetch(`/api/orders/${id}`, { method: 'DELETE' }).catch(console.error);
  };

  const advanceOrderWorkflow = (
    orderId: string,
    nextStatus: OrderStatus,
    extraData?: Partial<StoneOrder>
  ) => {
    updateOrder(orderId, { status: nextStatus, ...extraData });
  };

  const assignVehicleToOrder = (
    orderId: string,
    vehicleNumber: string,
    driverName?: string
  ) => {
    const veh = vehicles.find((v) => v.vehicleNumber === vehicleNumber);
    const drv = drivers.find((d) => d.vehicle === vehicleNumber || d.name === driverName);
    updateOrder(orderId, {
      assignedVehicle: vehicleNumber,
      driver: driverName || drv?.name || veh?.driver || 'Driver',
      status: 'ALLOCATED',
    });
  };

  const dispatchOrder = (
    orderId: string,
    paymentReceived?: number,
    remarks?: string
  ): GatePass => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const veh = vehicles.find((v) => v.vehicleNumber === order.assignedVehicle);
    const load = createLoad({
      vehicleNumber: order.assignedVehicle || 'KL-55-RZ-01',
      vehicleCategory: veh?.category || 'RZ Mining',
      owner: veh?.owner || 'RZ Mining',
      driver: order.driver || veh?.driver || 'Driver',
      customerName: order.customer,
      customerId: order.customerId,
      destination: order.deliveryLocation,
      material: order.quality,
      quantity: order.quantity,
      customerSaleRate: order.rate,
      paymentReceived: paymentReceived ?? order.paymentReceived ?? 0,
      status: 'Dispatched',
      remarks: remarks || order.remarks || `Dispatched from Order ${order.orderId}`,
    });

    const gp = confirmAndGenerateGatePass(load.id, paymentReceived, remarks);

    advanceOrderWorkflow(order.id, 'DISPATCHED', {
      gatePassNumber: gp.gatePassNumber,
      paymentReceived: (order.paymentReceived || 0) + (paymentReceived || 0),
      balance: Math.max(0, order.grossAmount - ((order.paymentReceived || 0) + (paymentReceived || 0))),
    });

    return gp;
  };

  // Daily Production Records (Zero Warehouse Stock Model)
  const addDailyProductionRecord = (
    record: Omit<QuarryDailyProductionRecord, 'id' | 'createdAt' | 'productionId'> & {
      id?: string;
      productionId?: string;
    }
  ): QuarryDailyProductionRecord => {
    const audit = getAuditInfo();
    const newRecord: QuarryDailyProductionRecord = {
      ...record,
      ...audit,
      id: record.id || `dpr-${Date.now()}`,
      productionId: record.productionId || `PRD-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    setDailyProductionRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const updateDailyProductionRecord = (
    id: string,
    updates: Partial<QuarryDailyProductionRecord>
  ) => {
    setDailyProductionRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteDailyProductionRecord = (id: string) => {
    setDailyProductionRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Daily Gap System & Rotation Engine
  const updateGapSlotVehicle = (gapNumber: GapSlotNumber, vehicleId: string) => {
    const veh = vehicles.find((v) => v.id === vehicleId);
    setGapQueue((prev) =>
      prev.map((item) => {
        if (item.gapNumber !== gapNumber) return item;
        return {
          ...item,
          vehicleId,
          vehicleNumber: veh?.vehicleNumber || 'Vehicle',
          driver: veh?.driver || 'Driver',
          status: 'Occupied',
        };
      })
    );
  };

  const offerGapLoad = (
    offeredQuality: OperationalQuality,
    currentGap: GapSlotNumber,
    accepted: boolean,
    rejectionReason?: string
  ): { nextGap: GapSlotNumber | null; accepted: boolean } => {
    const queueItem = gapQueue.find((q) => q.gapNumber === currentGap);
    const nextGapNum: GapSlotNumber | null = currentGap < 4 ? ((currentGap + 1) as GapSlotNumber) : null;
    const event: GapOfferEvent = {
      id: `goe-${Date.now()}`,
      timestamp: getCurrentTimeString(),
      roundNumber: roundLogs.length + 1,
      offeredQuality,
      offeredToGap: currentGap,
      vehicleNumber: queueItem?.vehicleNumber || `Slot ${currentGap}`,
      driver: queueItem?.driver || 'Driver',
      action: accepted ? 'Accepted' : 'Rejected',
      rejectionReason: accepted ? undefined : rejectionReason || 'Offered to next in queue',
      nextOfferedGap: accepted ? null : nextGapNum,
      recordedBy: currentUser,
    };
    setGapOfferEvents((prev) => [event, ...prev]);

    if (accepted) {
      return { nextGap: null, accepted: true };
    }
    return { nextGap: nextGapNum, accepted: false };
  };

  const recordRoundEvent = (
    round: Omit<QuarryRoundLog, 'id'> & { id?: string }
  ): QuarryRoundLog => {
    const newLog: QuarryRoundLog = {
      ...round,
      id: round.id || `rl-${Date.now()}`,
    };
    setRoundLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  const completeVehicleReturn = (vehicleNumber: string, returnTime?: string) => {
    const nowTime = returnTime || getCurrentTimeString();
    recordRoundEvent({
      roundNumber: roundLogs.length + 1,
      date: getTodayDateString(),
      vehicleNumber,
      driver: vehicles.find((v) => v.vehicleNumber === vehicleNumber)?.driver || 'Driver',
      originalGap: 1,
      actualGapUsed: 1,
      offeredQuality: '1ST QUALITY',
      acceptedQuality: '1ST QUALITY',
      physicalQty: 260,
      freeQty: 5,
      ratedQty: 255,
      vehicleReceivedQty: 260,
      loadingStart: '07:00 AM',
      loadingCompletion: '07:30 AM',
      departureTime: '07:35 AM',
      returnTime: nowTime,
      status: 'Returned',
      remarks: `Vehicle ${vehicleNumber} returned to quarry queue at ${nowTime}`,
    });
  };

  const advanceGapRound = () => {
    recordRoundEvent({
      roundNumber: roundLogs.length + 1,
      date: getTodayDateString(),
      vehicleNumber: 'All Fleet',
      driver: 'All Drivers',
      originalGap: 1,
      actualGapUsed: 1,
      offeredQuality: '1ST QUALITY',
      acceptedQuality: '1ST QUALITY',
      physicalQty: 0,
      freeQty: 0,
      ratedQty: 0,
      vehicleReceivedQty: 0,
      loadingStart: getCurrentTimeString(),
      loadingCompletion: getCurrentTimeString(),
      departureTime: getCurrentTimeString(),
      status: 'Loading',
      remarks: `Advanced to Round ${roundLogs.length + 1}`,
    });
  };

  // Machinery Master
  const addMachine = (
    machine: Omit<QuarryMachine, 'id' | 'createdAt'> & { id?: string }
  ): QuarryMachine => {
    const audit = getAuditInfo();
    const newMachine: QuarryMachine = {
      ...machine,
      ...audit,
      id: machine.id || `mch-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMachines((prev) => [newMachine, ...prev]);
    return newMachine;
  };

  const updateMachine = (id: string, updates: Partial<QuarryMachine>) => {
    setMachines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const replaceMachine = (
    oldMachineId: string,
    newMachineData: Omit<QuarryMachine, 'id' | 'createdAt'> & { id?: string }
  ): { oldMachine: QuarryMachine; newMachine: QuarryMachine } => {
    const oldMachine = machines.find((m) => m.id === oldMachineId) || machines[0];
    const updatedOld: QuarryMachine = {
      ...oldMachine,
      currentStatus: 'Maintenance',
      active: false,
      notes: `Replaced by ${newMachineData.machineName} on ${getTodayDateString()}`,
    };
    const createdNew = addMachine(newMachineData);
    setMachines((prev) =>
      prev.map((m) => (m.id === oldMachineId ? updatedOld : m))
    );
    return { oldMachine: updatedOld, newMachine: createdNew };
  };

  const deactivateMachine = (id: string, reason?: string) => {
    setMachines((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              currentStatus: 'Maintenance',
              active: false,
              notes: reason || 'Deactivated',
            }
          : m
      )
    );
  };

  // JCB Usage & Hour Readings
  const addJcbRecord = (
    record: Omit<JcbUsageRecord, 'id' | 'createdAt' | 'totalHours' | 'totalAmount'> & {
      id?: string;
      totalHours?: number;
      totalAmount?: number;
    }
  ): JcbUsageRecord => {
    const audit = getAuditInfo();
    const totalHours =
      record.totalHours !== undefined
        ? record.totalHours
        : Math.max(0, record.endHourReading - record.startHourReading);
    const ratePerHour = record.ratePerHour || 1400;
    const totalAmount =
      record.totalAmount !== undefined ? record.totalAmount : totalHours * ratePerHour;

    const newRec: JcbUsageRecord = {
      ...record,
      ...audit,
      totalHours,
      ratePerHour,
      totalAmount,
      id: record.id || `jcb-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setJcbRecords((prev) => [newRec, ...prev]);
    return newRec;
  };

  const updateJcbRecord = (id: string, updates: Partial<JcbUsageRecord>) => {
    setJcbRecords((prev) =>
      prev.map((j) => {
        if (j.id !== id) return j;
        const merged = { ...j, ...updates };
        if (
          updates.startHourReading !== undefined ||
          updates.endHourReading !== undefined
        ) {
          merged.totalHours = Math.max(
            0,
            merged.endHourReading - merged.startHourReading
          );
          merged.totalAmount = merged.totalHours * (merged.ratePerHour || 1400);
        }
        return merged;
      })
    );
  };

  const deleteJcbRecord = (id: string) => {
    setJcbRecords((prev) => prev.filter((j) => j.id !== id));
  };

  // Machine Rent Contracts
  const addRentContract = (
    contract: Omit<MachineRentContract, 'id' | 'createdAt'> & { id?: string }
  ): MachineRentContract => {
    const audit = getAuditInfo();
    const newContract: MachineRentContract = {
      ...contract,
      ...audit,
      id: contract.id || `rc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setRentContracts((prev) => [newContract, ...prev]);
    return newContract;
  };

  const updateRentContract = (
    id: string,
    updates: Partial<MachineRentContract>
  ) => {
    setRentContracts((prev) =>
      prev.map((rc) => (rc.id === id ? { ...rc, ...updates } : rc))
    );
  };

  const settleRentContract = (id: string, amount: number) => {
    setRentContracts((prev) =>
      prev.map((rc) => {
        if (rc.id !== id) return rc;
        const newPaid = (rc.paidRent || 0) + amount;
        const outstanding = Math.max(0, (rc.accruedRent || 0) - newPaid);
        return {
          ...rc,
          paidRent: newPaid,
          outstandingBalance: outstanding,
          paymentStatus: outstanding <= 0 ? 'PAID' : 'PARTIAL',
        };
      })
    );
  };

  // Diesel Entries
  const addDieselEntry = (
    entry: Omit<DieselEntry, 'id' | 'createdAt' | 'amount'> & {
      id?: string;
      amount?: number;
    }
  ): DieselEntry => {
    const audit = getAuditInfo();
    const amount =
      entry.amount !== undefined ? entry.amount : entry.quantityLiters * entry.ratePerLiter;
    const newEntry: DieselEntry = {
      ...entry,
      ...audit,
      amount,
      id: entry.id || `dsl-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDieselEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const deleteDieselEntry = (id: string) => {
    setDieselEntries((prev) => prev.filter((d) => d.id !== id));
  };

  // Oil Entries
  const addOilEntry = (
    entry: Omit<OilEntry, 'id' | 'createdAt' | 'amount'> & {
      id?: string;
      amount?: number;
    }
  ): OilEntry => {
    const audit = getAuditInfo();
    const amount =
      entry.amount !== undefined ? entry.amount : entry.quantityLiters * entry.ratePerLiter;
    const newEntry: OilEntry = {
      ...entry,
      ...audit,
      amount,
      id: entry.id || `oil-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setOilEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const deleteOilEntry = (id: string) => {
    setOilEntries((prev) => prev.filter((o) => o.id !== id));
  };

  // Spare Parts Entries
  const addSparePartEntry = (
    entry: Omit<SparePartEntry, 'id' | 'createdAt' | 'amount'> & {
      id?: string;
      amount?: number;
    }
  ): SparePartEntry => {
    const audit = getAuditInfo();
    const amount =
      entry.amount !== undefined ? entry.amount : entry.quantity * entry.rate;
    const newEntry: SparePartEntry = {
      ...entry,
      ...audit,
      amount,
      id: entry.id || `sp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSparePartEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const deleteSparePartEntry = (id: string) => {
    setSparePartEntries((prev) => prev.filter((s) => s.id !== id));
  };

  // Blade Master & Life Tracking
  const addBladeRecord = (
    blade: Omit<BladeRecord, 'id' | 'createdAt' | 'bladeId'> & {
      id?: string;
      bladeId?: string;
    }
  ): BladeRecord => {
    const audit = getAuditInfo();
    const newBlade: BladeRecord = {
      ...blade,
      ...audit,
      id: blade.id || `bld-${Date.now()}`,
      bladeId: blade.bladeId || `BLD-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    setBladeRecords((prev) => [newBlade, ...prev]);
    return newBlade;
  };

  const updateBladeRecord = (id: string, updates: Partial<BladeRecord>) => {
    setBladeRecords((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  // Machine Maintenance Records
  const addMaintenanceRecord = (
    record: Omit<
      MachineMaintenanceRecord,
      'id' | 'createdAt' | 'maintenanceId' | 'totalCost'
    > & {
      id?: string;
      maintenanceId?: string;
      totalCost?: number;
    }
  ): MachineMaintenanceRecord => {
    const audit = getAuditInfo();
    const totalCost =
      record.totalCost !== undefined
        ? record.totalCost
        : record.partsCost + record.labourCost;
    const newRec: MachineMaintenanceRecord = {
      ...record,
      ...audit,
      totalCost,
      id: record.id || `maint-${Date.now()}`,
      maintenanceId: record.maintenanceId || `MNT-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    setMaintenanceRecords((prev) => [newRec, ...prev]);
    return newRec;
  };

  const deleteMaintenanceRecord = (id: string) => {
    setMaintenanceRecords((prev) => prev.filter((m) => m.id !== id));
  };

  // Vendor / Shop Master
  const addVendor = (
    vendor: Omit<VendorShop, 'id' | 'createdAt'> & { id?: string }
  ): VendorShop => {
    const audit = getAuditInfo();
    const newVendor: VendorShop = {
      ...vendor,
      ...audit,
      id: vendor.id || `vnd-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setVendors((prev) => [newVendor, ...prev]);
    return newVendor;
  };

  const updateVendor = (id: string, updates: Partial<VendorShop>) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  // Food Purchases (Worker Welfare)
  const addFoodPurchase = (
    bill: Omit<FoodPurchaseBill, 'id' | 'createdAt'> & { id?: string }
  ): FoodPurchaseBill => {
    const audit = getAuditInfo();
    const newBill: FoodPurchaseBill = {
      ...bill,
      ...audit,
      id: bill.id || `fp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setFoodPurchases((prev) => [newBill, ...prev]);
    return newBill;
  };

  const deleteFoodPurchase = (id: string) => {
    setFoodPurchases((prev) => prev.filter((f) => f.id !== id));
  };

  // Tools Room Rent
  const addToolsRoomRent = (
    rent: Omit<ToolsRoomRentRecord, 'id' | 'createdAt'> & { id?: string }
  ): ToolsRoomRentRecord => {
    const audit = getAuditInfo();
    const newRent: ToolsRoomRentRecord = {
      ...rent,
      ...audit,
      id: rent.id || `tr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setToolsRoomRent((prev) => [newRent, ...prev]);
    return newRent;
  };

  const settleToolsRoomRent = (id: string, paidAmount: number) => {
    setToolsRoomRent((prev) =>
      prev.map((tr) => {
        if (tr.id !== id) return tr;
        const newPaid = (tr.paid || 0) + paidAmount;
        const outstanding = Math.max(0, tr.rentDue - newPaid);
        return {
          ...tr,
          paid: newPaid,
          outstanding,
          paymentDate: getTodayDateString(),
        };
      })
    );
  };

  // Daily Machine Work Logs
  const addMachineWorkLog = (
    log: Omit<DailyMachineWorkLog, 'id' | 'createdAt'> & { id?: string }
  ): DailyMachineWorkLog => {
    const audit = getAuditInfo();
    const newLog: DailyMachineWorkLog = {
      ...log,
      ...audit,
      id: log.id || `mwl-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setMachineWorkLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  // System Backup & Reset
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
    setRotations(INITIAL_ROTATIONS);
    setVehicleTransactions(INITIAL_VEHICLE_TRANSACTIONS || []);
    setOrders(INITIAL_ORDERS || []);
    setQuarries(INITIAL_QUARRIES || []);
    setActiveQuarryIdState('quarry-001');
    setBranding(INITIAL_BRANDING);
    setBillingConfig(INITIAL_BILLING_CONFIG);
    setThemeState('rz_gold');
    setDriverCollections(INITIAL_DRIVER_COLLECTIONS || []);
    setDailyProductionRecords(INITIAL_DAILY_PRODUCTION_RECORDS || []);
    setGapQueue(INITIAL_GAP_QUEUE || []);
    setGapOfferEvents(INITIAL_GAP_OFFER_EVENTS || []);
    setRoundLogs(INITIAL_ROUND_LOGS || []);
    setMachines(INITIAL_MACHINES || []);
    setJcbRecords(INITIAL_JCB_RECORDS || []);
    setRentContracts(INITIAL_RENT_CONTRACTS || []);
    setVendors(INITIAL_VENDORS || []);
    setDieselEntries(INITIAL_DIESEL_ENTRIES || []);
    setOilEntries(INITIAL_OIL_ENTRIES || []);
    setSparePartEntries(INITIAL_SPARE_ENTRIES || []);
    setBladeRecords(INITIAL_BLADES || []);
    setMaintenanceRecords(INITIAL_MAINTENANCE_RECORDS || []);
    setFoodPurchases(INITIAL_FOOD_PURCHASES || []);
    setToolsRoomRent(INITIAL_TOOLS_RENT || []);
    setMachineWorkLogs(INITIAL_MACHINE_WORK_LOGS || []);

    // Clear local storage cache
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });

    fetch('/api/reset', { method: 'POST' }).catch(console.error);
  };

  const exportBackupJSON = (): string => {
    const data = {
      exportTimestamp: new Date().toISOString(),
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
      machines,
      jcbRecords,
      rentContracts,
      vendors,
      dieselEntries,
      oilEntries,
      sparePartEntries,
      bladeRecords,
      maintenanceRecords,
      foodPurchases,
      toolsRoomRent,
      machineWorkLogs,
    };
    return JSON.stringify(data, null, 2);
  };

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.vehicles && Array.isArray(data.vehicles)) setVehicles(data.vehicles);
      if (data.drivers && Array.isArray(data.drivers)) setDrivers(data.drivers);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.staff && Array.isArray(data.staff)) setStaff(data.staff);
      if (data.attendance && Array.isArray(data.attendance)) setAttendance(data.attendance);
      if (data.advances && Array.isArray(data.advances)) setAdvances(data.advances);
      if (data.payrolls && Array.isArray(data.payrolls)) setPayrolls(data.payrolls);
      if (data.rates) setRates(data.rates);
      if (data.loads && Array.isArray(data.loads)) setLoads(data.loads);
      if (data.gatePasses && Array.isArray(data.gatePasses)) setGatePasses(data.gatePasses);
      if (data.production && Array.isArray(data.production)) setProduction(data.production);
      if (data.income && Array.isArray(data.income)) setIncome(data.income);
      if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (data.payments && Array.isArray(data.payments)) setPayments(data.payments);
      if (data.statements && Array.isArray(data.statements)) setStatements(data.statements);
      if (data.rotations && Array.isArray(data.rotations)) setRotations(data.rotations);
      if (data.vehicleTransactions && Array.isArray(data.vehicleTransactions)) {
        setVehicleTransactions(data.vehicleTransactions);
      }
      if (data.orders && Array.isArray(data.orders)) setOrders(data.orders);
      if (data.quarries && Array.isArray(data.quarries)) setQuarries(data.quarries);
      if (data.activeQuarryId) setActiveQuarryIdState(data.activeQuarryId);
      if (data.branding) setBranding(data.branding);
      if (data.billingConfig) setBillingConfig(data.billingConfig);
      if (data.theme) setThemeState(data.theme);
      if (data.driverCollections && Array.isArray(data.driverCollections)) {
        setDriverCollections(data.driverCollections);
      }
      if (data.dailyProductionRecords && Array.isArray(data.dailyProductionRecords)) {
        setDailyProductionRecords(data.dailyProductionRecords);
      }
      if (data.machines && Array.isArray(data.machines)) setMachines(data.machines);
      if (data.jcbRecords && Array.isArray(data.jcbRecords)) setJcbRecords(data.jcbRecords);
      if (data.rentContracts && Array.isArray(data.rentContracts)) setRentContracts(data.rentContracts);
      if (data.vendors && Array.isArray(data.vendors)) setVendors(data.vendors);
      if (data.dieselEntries && Array.isArray(data.dieselEntries)) setDieselEntries(data.dieselEntries);
      if (data.oilEntries && Array.isArray(data.oilEntries)) setOilEntries(data.oilEntries);
      if (data.sparePartEntries && Array.isArray(data.sparePartEntries)) setSparePartEntries(data.sparePartEntries);
      if (data.bladeRecords && Array.isArray(data.bladeRecords)) setBladeRecords(data.bladeRecords);
      if (data.maintenanceRecords && Array.isArray(data.maintenanceRecords)) setMaintenanceRecords(data.maintenanceRecords);
      if (data.foodPurchases && Array.isArray(data.foodPurchases)) setFoodPurchases(data.foodPurchases);
      if (data.toolsRoomRent && Array.isArray(data.toolsRoomRent)) setToolsRoomRent(data.toolsRoomRent);
      if (data.machineWorkLogs && Array.isArray(data.machineWorkLogs)) setMachineWorkLogs(data.machineWorkLogs);

      fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
      }).catch(console.error);

      return true;
    } catch (e) {
      console.error('Import parse error:', e);
      return false;
    }
  };

  const value: QuarryContextType = {
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
    machines,
    addMachine,
    updateMachine,
    replaceMachine,
    deactivateMachine,
    jcbRecords,
    addJcbRecord,
    updateJcbRecord,
    deleteJcbRecord,
    rentContracts,
    addRentContract,
    updateRentContract,
    settleRentContract,
    dieselEntries,
    addDieselEntry,
    deleteDieselEntry,
    oilEntries,
    addOilEntry,
    deleteOilEntry,
    sparePartEntries,
    addSparePartEntry,
    deleteSparePartEntry,
    bladeRecords,
    addBladeRecord,
    updateBladeRecord,
    maintenanceRecords,
    addMaintenanceRecord,
    deleteMaintenanceRecord,
    vendors,
    addVendor,
    updateVendor,
    foodPurchases,
    addFoodPurchase,
    deleteFoodPurchase,
    toolsRoomRent,
    addToolsRoomRent,
    settleToolsRoomRent,
    machineWorkLogs,
    addMachineWorkLog,
    resetAllData,
    exportBackupJSON,
    importBackupJSON,
    refreshBackendData,
  };

  return <QuarryContext.Provider value={value}>{children}</QuarryContext.Provider>;
};

export const useQuarry = () => {
  const context = useContext(QuarryContext);
  if (!context) {
    throw new Error('useQuarry must be used within a QuarryProvider');
  }
  return context;
};

export { QuarryContext };
export default QuarryContext;
