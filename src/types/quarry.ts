export type AppUser = 'Nafid' | 'Aflah' | 'Sulthan';

export interface GoogleAuthUser {
  id: string; // Google User ID / sub
  email: string;
  name: string; // Full display name
  shortName: 'Nafid' | 'Aflah' | 'Sulthan'; // Standard operator name
  picture?: string;
  verifiedAt: string;
}

export interface AuditFields {
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

export interface Vehicle extends AuditFields {
  id: string;
  vehicleNumber: string;
  owner: string;
  driver: string;
  category: VehicleCategory;
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

export interface RateConfig {
  quarryRates: {
    'Laterite Stone — 1st': { unit: 'pc'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
    'Laterite Stone — 2nd': { unit: 'pc'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
    'Laterite Stone — 3rd': { unit: 'load'; standardQty: number; ratePerUnit: number; totalPerLoad: number };
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
  
  // Quarry Rates & Totals
  quarryRate: number; // per pc or per load
  quarryAmount: number; // 250 * 43 = 10,750

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

  enteredBy: AppUser;
  remarks?: string;
  createdAt: string;
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

