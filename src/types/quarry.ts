export type AppUser = 'Nafid' | 'Aflah';

export interface GoogleAuthUser {
  id: string;
  email: string;
  name: string;
  shortName: AppUser;
  picture?: string;
  verifiedAt: string;
}

export interface AuditFields {
  quarryId?: string; // Multi-quarry data isolation
  sectionId?: string; // Quarry section (A, B)
  created_by_user_id?: string;
  created_by_name?: string;
  created_by_email?: string;
  created_at?: string;
}

export type VehicleCategory = 'Outside' | 'RZ Mining';

export type MaterialType = 
  | 'Laterite Stone — 1st'
  | 'Laterite Stone — 2nd'
  | 'Laterite Stone — 3rd';

export type LoadStatus = 
  | 'Draft'
  | 'Loaded'
  | 'Gate Pass Generated'
  | 'Dispatched'
  | 'Delivered'
  | 'Settled';

export type PaymentMode = 'Cash' | 'Bank' | 'UPI' | 'Cheque';

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Leave' | 'Holiday';

export type ExpenseCategory = 
  | 'Loading'
  | 'Labour'
  | 'Diesel'
  | 'Electricity'
  | 'Water'
  | 'Machinery'
  | 'Maintenance'
  | 'Spare Parts'
  | 'Transport'
  | 'Vehicle Expense'
  | 'Driver Expense'
  | 'Staff Salary'
  | 'Staff Advance'
  | 'Food/Kitchen'
  | 'Rent'
  | 'Repair'
  | 'Office Expense'
  | 'Royalty/Government'
  | 'Other Expense';

export type IncomeCategory = 
  | 'Material Sales'
  | 'Customer Collections'
  | 'Other Income'
  | 'Other Receipts';

export type VehicleOwnerType = 'COMPANY' | 'OUTSIDE';

export interface Vehicle extends AuditFields {
  id: string;
  vehicleNumber: string;
  owner: string;
  driver: string;
  category: VehicleCategory;
  ownerType?: VehicleOwnerType; // 'COMPANY' or 'OUTSIDE'
  capacity: number; // in pcs or loads (default 250)
  status: 'Available' | 'On Trip' | 'Maintenance';
  active: boolean;
  remarks?: string;
  createdAt: string;
}

export interface Driver extends AuditFields {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  category: VehicleCategory;
  joiningDate: string;
  salaryType: 'Trip Batta' | 'Daily Wage' | 'Monthly';
  status: 'Active' | 'On Leave' | 'Inactive';
  remarks?: string;
  createdAt: string;
}

export interface Customer extends AuditFields {
  id: string;
  name: string;
  phone: string;
  address?: string;
  destination: string;
  openingBalance: number;
  remarks?: string;
  createdAt: string;
}

export interface Staff extends AuditFields {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  address?: string;
  role: string;
  joiningDate: string;
  salaryType: 'Monthly' | 'Daily Wage';
  basicSalary: number; // monthly
  dailyWage: number; // per day
  bankDetails?: string;
  status: 'Active' | 'Inactive';
  remarks?: string;
}

export interface StaffAttendance extends AuditFields {
  id: string;
  date: string;
  staffId: string;
  employeeName: string;
  status: AttendanceStatus;
  inTime?: string;
  outTime?: string;
  overtimeHours: number;
  remarks?: string;
  enteredBy: AppUser;
}

export interface StaffAdvance extends AuditFields {
  id: string;
  date: string;
  staffId: string;
  employeeName: string;
  amount: number;
  reason?: string;
  paymentMode: PaymentMode;
  deductionMonth: string; // YYYY-MM
  enteredBy: AppUser;
  createdAt: string;
}

export interface StaffPayroll extends AuditFields {
  id: string;
  month: string; // YYYY-MM
  staffId: string;
  employeeName: string;
  role: string;
  salaryType: 'Monthly' | 'Daily Wage';
  basicSalaryOrDailyRate: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  overtimeHours: number;
  overtimePay: number;
  allowance: number;
  bonus: number;
  advanceDeduction: number;
  otherDeductions: number;
  grossSalary: number;
  netSalary: number;
  status: 'Draft' | 'Paid';
  paidDate?: string;
  paymentMode?: PaymentMode;
  enteredBy: AppUser;
  remarks?: string;
}

export type RateCondition = 'Standard Rock' | 'Weaker Rock';

export type OperationalQuality = '1ST QUALITY' | '2ND QUALITY' | '3RD / LATT' | 'MURY';

export interface RateConfig {
  quarryRates: {
    'Laterite Stone — 1st': { unit: 'pc'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
    'Laterite Stone — 2nd': { unit: 'pc'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
    'Laterite Stone — 3rd': { unit: 'load'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
  };
  // Weaker-Rock condition rates (Section B / Weaker Rock): 1st: ₹41, 2nd: ₹31, Mury: ₹1,000, Latt: ₹2,500
  weakerRockRates: {
    'Laterite Stone — 1st': { unit: 'pc'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
    'Laterite Stone — 2nd': { unit: 'pc'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
    'Laterite Stone — 3rd': { unit: 'load'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
  };
  muryLoadRate: number; // ₹1,000 / load
  lattLoadRate: number; // ₹2,500 / load
  loadFormula: {
    physicalQuantity: number; // 260 pieces
    freeQuantity: number; // 5 pieces
    ratedQuantity: number; // 255 pieces
  };
  rzCustomerRates: {
    'Laterite Stone — 1st': { unit: 'pc'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
    'Laterite Stone — 2nd': { unit: 'pc'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
    'Laterite Stone — 3rd': { unit: 'load'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
  };
  loadExpenses: {
    driverBatta: number; // ₹600
    vehicleTripRent: number; // ₹700
    loadingCharge: number; // ₹800
    diesel: number; // ₹300
    commissions: {
      'Laterite Stone — 1st': number; // ₹250 (₹1 x 250)
      'Laterite Stone — 2nd': number; // ₹250 (₹1 x 250)
      'Laterite Stone — 3rd': number; // ₹300
    };
  };
}

export interface LoadOrder extends AuditFields {
  id: string;
  loadNumber: string; // e.g. LD-1001
  date: string;
  time: string;
  vehicleNumber: string;
  owner: string;
  driver: string;
  vehicleCategory: VehicleCategory;
  customerId: string;
  customerName: string;
  destination: string;
  material: MaterialType;
  quantity: number;
  unit: 'pcs' | 'load';
  
  // 260 Physical + 5 Free + 255 Rated Model
  physicalQuantity?: number; // e.g. 260
  freeQuantity?: number; // e.g. 5
  ratedQuantity?: number; // e.g. 255
  vehicleReceivedQuantity?: number; // Stored independently from quarry rated qty (e.g. 260 or 250)
  rateCondition?: RateCondition; // 'Standard Rock' or 'Weaker Rock'
  quarrySection?: string; // 'Section A' or 'Section B'
  gapPosition?: number; // 1, 2, 3, 4
  roundNumber?: number;

  // Quarry Rates & Totals
  quarryRate: number; // per pc or per load (43 for Standard 1st, 41 for Weaker 1st, etc.)
  quarryAmount: number; // 255 * rate (or load rate)

  // Customer Sale Rates (applicable for RZ Mining or direct billed)
  customerSaleRate: number; // e.g. 65 for 1st
  customerSaleAmount: number; // e.g. 16,250

  // Payment Tracking
  paymentReceived: number;
  balance: number;

  // RZ Mining Operating Expenses per load
  driverBatta: number; // 600
  vehicleTripRent: number; // 700
  loadingCharge: number; // 800
  diesel: number; // 300
  orderCommission: number; // 250 or 300
  otherExpense: number; // 0
  totalExpense: number; // 2650 for 1st

  // Net Profit for RZ Mining
  netProfit: number; // 2850 for 1st

  status: LoadStatus;
  gatePassId?: string;
  gatePassNumber?: string;
  gatePassConfirmedAt?: string;

  // Order Module Extensions
  agentName?: string; // Orderman / Agent name
  paymentTerms?: string; // "Cash on Delivery", "Credit - 7 Days", etc.
  deliveryAddress?: string;
  commissionPaid?: boolean;

  enteredBy: AppUser;
  remarks?: string;
  createdAt: string;
}

export interface OrdermanAgent {
  id: string;
  name: string;
  phone: string;
  defaultCommissionPerUnit: number; // e.g. ₹250 per load or ₹1 per stone
  totalOrders: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  balanceDue: number;
  remarks?: string;
}

// --------------------------------------------------------------------------
// RZ MINETRIX — LATERITE STONE ORDER MANAGEMENT WORKFLOW
// ORDER → VEHICLE ASSIGNMENT → GATE ENTRY → LOADING → DISPATCH → DELIVERY → BILL → PAYMENT → SETTLEMENT
// --------------------------------------------------------------------------

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'ALLOCATED'
  | 'READY FOR LOADING'
  | 'LOADING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'PAYMENT PENDING'
  | 'PARTIALLY PAID'
  | 'PAID'
  | 'CANCELLED';

export type OrderPaymentTerms =
  | 'IMMEDIATE'
  | 'DAILY'
  | 'WEEKLY'
  | 'CUSTOM';

export interface StoneOrder extends AuditFields {
  id: string;
  orderId: string; // e.g., ORD-2026-101
  orderDate: string; // YYYY-MM-DD
  customer: string;
  customerId: string;
  customerPhone: string;
  deliveryLocation: string;
  agentName: string; // Orderman / Agent
  quality: MaterialType;
  quantity: number;
  unit: 'pcs' | 'load';
  rate: number;
  grossAmount: number; // quantity * rate (or load rate)
  commission: number; // Orderman commission
  paymentTerms: OrderPaymentTerms;
  assignedVehicle?: string; // Assigned Vehicle Number
  driver?: string;
  requiredDate: string; // Required Delivery Date
  remarks?: string;
  status: OrderStatus;

  // Integrated Workflow linkages (prevents duplicate data creation)
  loadId?: string; // Auto-linked to Load record
  gatePassId?: string; // Auto-linked Gate Pass record
  gatePassNumber?: string;
  gateEntryTime?: string;
  loadingStartTime?: string;
  loadingEndTime?: string;
  dispatchTime?: string;
  deliveryTime?: string;
  billNumber?: string;
  billDate?: string;
  paymentReceived: number;
  balance: number;
  settledDate?: string;
  enteredBy: AppUser;
  createdAt: string;
  updatedAt?: string;
}

export type RotationTurnStatus =
  | 'Waiting'
  | 'In Pit'
  | 'Loading'
  | 'Dispatched'
  | 'Delivered'
  | 'Returned'
  | 'Standby'
  | 'Maintenance';

export interface DailyRotationEntry {
  position: number; // Position 1 = FIXED (RZ MINING), 2 onward = Rotating vehicles
  vehicleId: string;
  vehicleNumber: string;
  owner: string; // Separate owner entity
  driver: string; // Separate driver entity
  category: VehicleCategory;
  capacity?: number;
  status: RotationTurnStatus;
  isFixed: boolean; // TRUE for Position 1 (RZ MINING)
  entryTime?: string;
  remarks?: string;
  lastTrip?: string;
}

export interface DailyRotation extends AuditFields {
  id: string;
  rotationDate: string; // YYYY-MM-DD
  rotationNumber: number; // Cycle sequence number
  entries: DailyRotationEntry[];
  status: 'Active' | 'Completed' | 'Draft';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// --------------------------------------------------------------------------
// RZ MINETRIX — UNIFIED VEHICLE ACCOUNTING ENGINE MODEL
// Company-owned vehicles and outside-owned vehicles use the SAME accounting structure.
// Identical transaction model, only ownerType: 'COMPANY' | 'OUTSIDE' differs.
// --------------------------------------------------------------------------

export type VehicleIncomeCategory =
  | 'Trip income'
  | 'Delivery income'
  | 'Other income';

export type VehicleExpenseCategory =
  | 'Fuel'
  | 'Driver payment'
  | 'Loading'
  | 'Repair'
  | 'Maintenance'
  | 'Tyre'
  | 'Toll'
  | 'Other vehicle expenses';

export type VehicleReceivableCategory =
  | 'Customer pending'
  | 'Driver collection pending';

export type VehiclePayableCategory =
  | 'Driver'
  | 'Owner'
  | 'Other party';

export type VehicleTransactionType = 'Income' | 'Expense' | 'Receivable' | 'Payable';

export interface VehicleTransaction extends AuditFields {
  id: string;
  date: string;
  time?: string;
  vehicleNumber: string;
  ownerType: VehicleOwnerType; // Immutable at time of transaction
  type: VehicleTransactionType;
  category:
    | VehicleIncomeCategory
    | VehicleExpenseCategory
    | VehicleReceivableCategory
    | VehiclePayableCategory;
  description: string;
  amount: number;
  status: 'Cleared' | 'Pending' | 'Settled';
  referenceId?: string; // e.g., LD-1001, GP-000001, EXP-101
  counterParty?: string; // Driver name, Owner name, Customer name, Vendor name
  paymentMode?: PaymentMode;
  enteredBy: AppUser;
  createdAt: string;
}

export interface VehicleAccountIncome {
  tripIncome: number;
  deliveryIncome: number;
  otherIncome: number;
  totalIncome: number;
}

export interface VehicleAccountExpenses {
  fuel: number;
  driverPayment: number;
  loading: number;
  repair: number;
  maintenance: number;
  tyre: number;
  toll: number;
  otherVehicleExpenses: number;
  totalExpenses: number;
}

export interface VehicleAccountReceivables {
  customerPending: number;
  driverCollectionPending: number;
  totalReceivables: number;
}

export interface VehicleAccountPayables {
  driver: number;
  owner: number;
  otherParty: number;
  totalPayables: number;
}

export interface VehicleAccount {
  vehicleId: string;
  vehicleNumber: string;
  owner: string;
  driver: string;
  ownerType: VehicleOwnerType; // 'COMPANY' or 'OUTSIDE'
  category: VehicleCategory;
  capacity: number;
  status: string;

  // Breakdown
  income: VehicleAccountIncome;
  expenses: VehicleAccountExpenses;
  receivables: VehicleAccountReceivables;
  payables: VehicleAccountPayables;

  // Unified Identical Calculations
  netOperatingProfit: number; // totalIncome - totalExpenses
  netBalance: number; // (totalIncome + totalReceivables) - (totalExpenses + totalPayables)
  totalTrips: number;
  totalStoneQty: number;
  transactions: VehicleTransaction[];
}

export interface VehicleRotationItem {
  id: string;
  vehicleNumber: string;
  driverName: string;
  owner: string;
  category: VehicleCategory;
  capacity: number;
  queueNumber: number;
  status: 'Waiting' | 'In Pit' | 'Loading' | 'Dispatched' | 'Returned';
  entryTime: string;
  lastTripTime?: string;
}

export interface GatePass extends AuditFields {
  id: string;
  gatePassNumber: string; // GP-000001
  date: string;
  time: string;
  loadId: string;
  loadNumber: string;
  vehicleNumber: string;
  owner: string;
  driver: string;
  vehicleCategory: VehicleCategory;
  material: MaterialType;
  quantity: number;
  unit: 'pcs' | 'load';
  customerName: string;
  destination: string;
  paymentStatus: 'Paid' | 'Credit' | 'Partial';
  amountCollected: number;
  totalBillAmount: number;
  enteredBy: AppUser;
  remarks?: string;
  createdAt: string;
}

export interface ProductionEntry extends AuditFields {
  id: string;
  date: string;
  material: MaterialType;
  quantity: number;
  unit: 'pcs' | 'load';
  shift: 'Morning' | 'Evening' | 'Full Day';
  operator: string;
  pitLocation?: string;
  remarks?: string;
  enteredBy: AppUser;
  createdAt: string;
}

// --------------------------------------------------------------------------
// RZ MINETRIX — QUARRY PRODUCTION & RECOVERY ENGINE
// --------------------------------------------------------------------------

export interface QuarryDailyProductionRecord extends AuditFields {
  id: string;
  productionId: string; // e.g. PRD-2026-001
  date: string; // YYYY-MM-DD
  quarryId: string;
  quarryName: string; // e.g. RZ Quarry 001
  section: string; // 'Section A' (top rock) or 'Section B' (weaker rock). Strictly NO "Medium"
  cuttingMachine: string; // e.g. 'Cutting Machine #1'
  operator: string;
  assistantOperator?: string;
  helpers?: string; // Count or worker names
  startTime?: string;
  endTime?: string;
  workingHours?: number;

  // Geological / Environmental Working Conditions
  soilCondition: string; // e.g. 'Dry / Compact', 'Moist', 'Hard overburden'
  rockStrength: string; // 'Hard / Top-Rock', 'Medium-Hard', 'Soft / Weaker-Rock'
  moisture: string; // 'Low', 'Moderate', 'High'
  heat: string; // 'Normal', 'Moderate', 'High'
  cuttingCondition: string; // 'Smooth', 'Blade wear high', 'Fractured'
  splittingCondition: string; // 'Clean split', 'Chipping', 'Uneven break'
  cuttingNotes?: string;

  // Operational Cutting Dimensions reference
  cuttingDimensions?: string; // '13.5 x 8.5 x 9 inch'
  finishedDimensions?: string; // '13 x 8 x 8 inch'

  // Actual Quantities (recorded AFTER rock is split, never forced before)
  totalCutQuantity: number; // Raw stone cut
  finishedQuantity: number; // Finished usable stones
  firstQualityQuantity: number; // 1st Quality (All 8 corners intact)
  secondQualityQuantity: number; // 2nd Quality (~3/4 corners)
  lattQuantity: number; // Latt / 3rd Number (defective/damaged)
  muryQuantity: number; // Mury (split/broken into rubble)
  unit: 'pcs' | 'load';

  // Recovery & Quality Analysis (Percentages show 'N/A' when denominator is missing)
  recoveryRate?: number | null; // (finished / cut) * 100
  firstQualityRate?: number | null; // (1st / finished) * 100
  secondQualityRate?: number | null; // (2nd / finished) * 100
  lattRate?: number | null; // (latt / finished) * 100
  muryRate?: number | null; // (mury / cut) * 100

  // Direct Vehicle Loading association
  allocatedVehicle?: string;
  gapPosition?: number; // Gap 1, 2, 3, 4

  remarks?: string;
  photos?: string[];
  enteredBy: AppUser;
  createdAt: string;
  updatedAt?: string;
}

// --------------------------------------------------------------------------
// RZ MINETRIX — DAILY GAP SYSTEM & ROTATION ENGINE
// 4-Gap physical vehicle queue: 1st Gap (1st Quality), 2nd Gap (2nd Quality),
// 3rd Gap (Mury), 4th Gap (Any available).
// Quality flexibility cascading: 1st Gap -> 2nd Gap -> 3rd Gap -> 4th Gap.
// RZ MINING vehicle is FIXED at Position 1.
// --------------------------------------------------------------------------

export type GapSlotNumber = 1 | 2 | 3 | 4;

export interface GapVehicleQueueItem {
  id: string;
  gapNumber: GapSlotNumber; // 1st, 2nd, 3rd, 4th Gap
  vehicleNumber: string;
  vehicleId: string;
  driver: string;
  owner: string;
  category: VehicleCategory;
  defaultExpectedQuality: '1ST QUALITY' | '2ND QUALITY' | 'MURY' | 'ANY AVAILABLE';
  currentStatus: 'Waiting' | 'Offered' | 'Loading' | 'Loaded' | 'Dispatched' | 'Returned';
  entryTime: string;
  roundNumber: number;
  isFixedCompanyVehicle: boolean; // TRUE for RZ MINING
  notes?: string;
}

export interface GapOfferEvent {
  id: string;
  timestamp: string;
  roundNumber: number;
  productionRecordId?: string;
  offeredQuality: '1ST QUALITY' | '2ND QUALITY' | 'LATT / 3RD' | 'MURY';
  offeredToGap: GapSlotNumber;
  vehicleNumber: string;
  driver: string;
  action: 'Accepted' | 'Rejected';
  rejectionReason?: string;
  nextOfferedGap?: GapSlotNumber | null;
  recordedBy: AppUser;
}

export interface QuarryRoundLog {
  id: string;
  roundNumber: number;
  date: string;
  vehicleNumber: string;
  driver: string;
  originalGap: GapSlotNumber;
  actualGapUsed: GapSlotNumber;
  offeredQuality: string;
  acceptedQuality: string;
  physicalQty: number; // 260
  freeQty: number; // 5
  ratedQty: number; // 255
  vehicleReceivedQty: number; // Actual received quantity stored independently
  loadingStart: string;
  loadingCompletion: string;
  departureTime: string;
  returnTime?: string;
  nextEligiblePosition?: number; // Determined by actual return time
  status: 'Loading' | 'Dispatched' | 'Delivered' | 'Returned';
  remarks?: string;
}

export interface StockAdjustment extends AuditFields {
  id: string;
  date: string;
  material: MaterialType;
  quantity: number; // positive or negative
  reason: string;
  enteredBy: AppUser;
  createdAt: string;
}

export interface QuarryIncome extends AuditFields {
  id: string;
  date: string;
  category: IncomeCategory;
  description: string;
  reference?: string;
  amount: number;
  paymentMode: PaymentMode;
  loadId?: string;
  customerId?: string;
  customerName?: string;
  enteredBy: AppUser;
  createdAt: string;
}

export interface QuarryExpense extends AuditFields {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMode: PaymentMode;
  vehicleNumber?: string;
  driverName?: string;
  staffName?: string;
  loadId?: string;
  reference?: string;
  enteredBy: AppUser;
  createdAt: string;
}

export interface CustomerPayment extends AuditFields {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  loadId?: string;
  amount: number;
  paymentMode: PaymentMode;
  reference?: string;
  remarks?: string;
  enteredBy: AppUser;
  createdAt: string;
}

export interface DailyCashSnapshot {
  date: string;
  openingCash: number;
  collections: number;
  quarryIncome: number;
  quarryExpenses: number;
  staffPayments: number;
  driverPayments: number;
  otherPayments: number;
  closingBalance: number;
}

export interface StatementQualitySummary {
  quality: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface SavedStatement extends AuditFields {
  id: string;
  invoiceNumber: string;
  date: string;
  clientCode: string;
  customerId: string;
  customerName: string;
  ownerName: string;
  driverName: string;
  phoneNumber: string;
  vehicleNumber: string;
  fromDate: string;
  toDate: string;
  materialFilter?: string;
  totalQuantity: number;
  totalLoads: number;
  grandTotal: number;
  amountInWords: string;
  qualitySummary: StatementQualitySummary[];
  generatedBy: AppUser;
  generatedAt: string;
  termsNotes?: string[];
}

// --------------------------------------------------------------------------
// MULTI-QUARRY & BUSINESS PROFILE ARCHITECTURE
// --------------------------------------------------------------------------

export interface QuarrySection {
  id: string;
  sectionCode: string; // 'A', 'B' (Strictly no "Medium"!)
  name: string; // e.g. 'Section A (North Face)', 'Section B (South Pit)'
  description?: string;
  active: boolean;
}

export interface LandPaymentEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMode: PaymentMode;
  reference?: string;
  remarks?: string;
  enteredBy: AppUser;
  createdAt: string;
}

export interface LandOwnerAccount {
  id: string;
  quarryId: string;
  landOwnerName: string;
  contactPhone?: string;
  totalLandCent: number; // 20 cent
  initialCuttingAgreementCent: number; // 14 cent
  cuttingAreaCent?: number; // 14 cent
  agreementAreaCent?: number; // 14 cent
  referenceRatePerCent: number; // ₹1,40,000 per cent
  referenceAgreementValue: number; // 14 * 140,000 = ₹19,60,000
  remainingCent: number; // 6 cent (no fixed price yet)
  undeterminedAreaCent?: number; // 6 cent
  paidAmount: number; // ONLY actual entered payments
  balanceAmount: number; // agreementValue - paidAmount
  outstandingAmount: number;
  adjustments: number;
  notes: string;
  documents: string[]; // document / photo URLs or names
  payments: LandPaymentEntry[];
}

export interface QuarryProfile extends AuditFields {
  id: string; // e.g. 'quarry-001'
  quarryCode: string; // 'RZ-Q001'
  quarryName: string; // 'RZ Quarry 001'
  businessName: string; // 'RZ Mining & Laterite Ventures'
  address: string;
  location: string; // 'Perinthalmanna / Melattur'
  phone: string;
  email: string;
  gstNumber?: string;
  taxDetails?: string;
  owner: string; // 'RZ Ventures / Nafid Khan'
  landDetails?: string;
  contactPerson?: string;
  active: boolean;
  notes?: string;
  sections: QuarrySection[];
  landOwnerAccount?: LandOwnerAccount;
}

// --------------------------------------------------------------------------
// BRANDING & ASSET CONFIGURATION
// --------------------------------------------------------------------------

export interface BrandingConfig {
  quarryLogoUrl?: string;
  rzLogoUrl?: string;
  pnkLogoUrl?: string;
  approvedPnkPersonalImageUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  billLogoUrl?: string;
  billWatermarkUrl?: string;
  billBackgroundUrl?: string;
  brandName: string;
  tagline: string;
}

// --------------------------------------------------------------------------
// BILLING CONFIGURATION
// --------------------------------------------------------------------------

export interface BillingConfig {
  billPrefix: string;
  billNumber: number;
  startingNumber: number;
  billFooter: string;
  address: string;
  phone: string;
  email: string;
  gstTaxDetails: string;
  signature: string;
  stamp: string;
  watermarkText: string;
  theme: string;
}

export type AppTheme = 'rz_gold' | 'pnk_gold' | 'corporate' | 'industrial' | 'minimal';

// --------------------------------------------------------------------------
// DRIVER PAYMENT COLLECTION
// --------------------------------------------------------------------------

export type PaymentCollectionMode =
  | 'CUSTOMER DIRECT'
  | 'DRIVER COLLECTION'
  | 'ORDERMAN COLLECTION'
  | 'OFFICE COLLECTION'
  | 'BANK TRANSFER';

export type DriverCollectionSettlementStatus = 'UNSETTLED' | 'PARTIALLY SETTLED' | 'SETTLED';

export interface DriverCollection extends AuditFields {
  id: string;
  collectionId: string; // e.g. DC-2026-001
  orderId: string; // e.g. ORD-2026-101
  driver: string;
  driverId?: string;
  vehicle: string;
  customer: string;
  customerId?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMode: PaymentMode | string;
  settlementStatus: DriverCollectionSettlementStatus;
  settledAmount?: number;
  unsettledAmount?: number;
  settlementDate?: string;
  settlementNotes?: string;
  settledBy?: string;
  remarks?: string;
  enteredBy: AppUser;
  createdAt: string;
  updatedAt?: string;
}

