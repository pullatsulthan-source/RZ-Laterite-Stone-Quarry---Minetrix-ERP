import { z } from 'zod';

// --------------------------------------------------------------------------
// 1. Load Creation Validator
// --------------------------------------------------------------------------
export const createLoadSchema = z.object({
  quarryId: z.string().min(1, 'Quarry ID is required'),
  sectionId: z.string().optional(),
  loadNumber: z.string().min(1, 'Load number is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().min(1, 'Time is required'),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  vehicleCategory: z.string().default('Outside Vehicle'),
  driverName: z.string().min(1, 'Driver name is required'),
  ownerName: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  destination: z.string().optional(),
  material: z.string().min(1, 'Material quality is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unit: z.enum(['pcs', 'load']).default('pcs'),

  // Capacity & Physical Gate-Out tracking (Rule 9)
  capacity: z.number().int().positive().default(260),
  freeQuantity: z.number().int().min(0).default(5),
  ratedQuantity: z.number().int().positive().default(255),
  actualLoadedQuantity: z.number().int().positive().optional(),
  actualGateOutQuantity: z.number().int().positive().optional(),
  billableQuantity: z.number().int().positive().optional(),
  vehicleReceivedQuantity: z.number().int().positive().optional(),

  rateCondition: z.enum(['Standard Rock', 'Weaker Rock']).default('Standard Rock'),
  gapPosition: z.number().int().min(1).max(4).default(1),
  roundNumber: z.number().int().min(1).default(1),
  isSpecialTradingLoad: z.boolean().default(false),
  loadType: z.enum(['QUARRY_SALE', 'VEHICLE_STONE_PURCHASE']).default('QUARRY_SALE'),
  loadingPaidByQuarry: z.boolean().default(false),

  quarryRate: z.number().positive('Quarry rate must be positive'),
  quarryAmount: z.number().min(0),
  customerSaleRate: z.number().min(0),
  customerSaleAmount: z.number().min(0),

  driverBatta: z.number().min(0).default(0),
  vehicleTripRent: z.number().min(0).default(0),
  loadingCharge: z.number().min(0).default(0),
  diesel: z.number().min(0).default(0),
  orderCommission: z.number().min(0).default(0),
  otherExpense: z.number().min(0).default(0),
  totalExpense: z.number().min(0).default(0),
  netProfit: z.number().default(0),

  paymentReceived: z.number().min(0).default(0),
  balance: z.number().default(0),
  status: z.enum(['Draft', 'Loaded', 'Gate Pass Generated', 'Dispatched', 'Delivered', 'Settled']).default('Loaded'),
  gatePassNumber: z.string().optional(),
  enteredBy: z.string().min(1, 'Operator is required'),
  remarks: z.string().optional(),
});

// --------------------------------------------------------------------------
// 2. Order Creation Validator
// --------------------------------------------------------------------------
export const createOrderSchema = z.object({
  quarryId: z.string().min(1, 'Quarry ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  orderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  customer: z.string().min(1, 'Customer name is required'),
  customerId: z.string().optional(),
  customerPhone: z.string().optional(),
  deliveryLocation: z.string().optional(),
  agentName: z.string().optional(),
  quality: z.string().min(1, 'Quality is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unit: z.enum(['pcs', 'load']).default('pcs'),
  rate: z.number().positive('Rate must be positive'),
  grossAmount: z.number().min(0),
  commission: z.number().min(0).default(0),
  paymentTerms: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY', 'CUSTOM']).default('IMMEDIATE'),
  assignedVehicle: z.string().optional(),
  driver: z.string().optional(),
  requiredDate: z.string().optional(),
  remarks: z.string().optional(),
  status: z.enum([
    'NEW',
    'CONFIRMED',
    'ALLOCATED',
    'READY_FOR_LOADING',
    'LOADING',
    'DISPATCHED',
    'DELIVERED',
    'PAYMENT_PENDING',
    'PARTIALLY_PAID',
    'PAID',
    'CANCELLED',
  ]).default('NEW'),
  enteredBy: z.string().min(1, 'Operator is required'),
});

// --------------------------------------------------------------------------
// 3. Outward Gate Pass Validator
// --------------------------------------------------------------------------
export const createGatePassSchema = z.object({
  quarryId: z.string().min(1, 'Quarry ID is required'),
  gatePassNumber: z.string().min(1, 'Gate Pass number is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().min(1, 'Time is required'),
  loadId: z.string().optional(),
  loadNumber: z.string().optional(),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  owner: z.string().optional(),
  driver: z.string().min(1, 'Driver name is required'),
  vehicleCategory: z.string().optional(),
  material: z.string().min(1, 'Material is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unit: z.enum(['pcs', 'load']).default('pcs'),

  capacity: z.number().int().positive().default(260),
  freeQuantity: z.number().int().min(0).default(5),
  ratedQuantity: z.number().int().positive().default(255),
  actualLoadedQuantity: z.number().int().positive().optional(),
  actualGateOutQuantity: z.number().int().positive().optional(),
  billableQuantity: z.number().int().positive().optional(),

  customerName: z.string().min(1, 'Customer name is required'),
  destination: z.string().optional(),
  paymentStatus: z.enum(['Paid', 'Credit', 'Partial']).default('Credit'),
  amountCollected: z.number().min(0).default(0),
  totalBillAmount: z.number().min(0).default(0),
  enteredBy: z.string().min(1, 'Operator is required'),
  remarks: z.string().optional(),
});

// --------------------------------------------------------------------------
// 4. Payment Validator
// --------------------------------------------------------------------------
export const createPaymentSchema = z.object({
  quarryId: z.string().min(1, 'Quarry ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMode: z.enum(['Cash', 'Bank', 'Bank Transfer', 'UPI', 'Cheque']).default('Cash'),
  reference: z.string().optional(),
  receiptNumber: z.string().optional(),
  remarks: z.string().optional(),
  enteredBy: z.string().min(1, 'Operator is required'),
});

// --------------------------------------------------------------------------
// 5. Expense Validator
// --------------------------------------------------------------------------
export const createExpenseSchema = z.object({
  quarryId: z.string().min(1, 'Quarry ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  category: z.string().min(1, 'Expense category is required'),
  subcategory: z.string().optional(),
  party: z.string().min(1, 'Party/Vendor name is required'),
  amount: z.number().positive('Expense amount must be greater than 0'),
  paymentMode: z.enum(['Cash', 'Bank', 'Bank Transfer', 'UPI', 'Cheque']).default('Cash'),
  billNumber: z.string().optional(),
  machineId: z.string().optional(),
  vehicleNumber: z.string().optional(),
  staffId: z.string().optional(),
  reference: z.string().optional(),
  remarks: z.string().optional(),
  enteredBy: z.string().min(1, 'Operator is required'),
});

// --------------------------------------------------------------------------
// 6. Income Validator
// --------------------------------------------------------------------------
export const createIncomeSchema = z.object({
  quarryId: z.string().min(1, 'Quarry ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  title: z.string().min(1, 'Income title is required'),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentMode: z.enum(['Cash', 'Bank', 'Bank Transfer', 'UPI', 'Cheque']).default('Cash'),
  reference: z.string().optional(),
  customerId: z.string().optional(),
  vehicleNumber: z.string().optional(),
  receiptNumber: z.string().optional(),
  remarks: z.string().optional(),
  enteredBy: z.string().min(1, 'Operator is required'),
});

// --------------------------------------------------------------------------
// 7. Quarry Production Log Validator (Direct Pit Face Cutting)
// --------------------------------------------------------------------------
export const createProductionSchema = z.object({
  quarryId: z.string().min(1, 'Quarry ID is required'),
  sectionId: z.string().optional(),
  productionId: z.string().min(1, 'Production ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  workingHours: z.number().min(0).default(4.5),
  section: z.string().default('Section A'),
  cuttingMachine: z.string().optional(),
  operator: z.string().optional(),
  assistantOperator: z.string().optional(),
  helpers: z.string().optional(),

  soilCondition: z.string().optional(),
  rockStrength: z.string().optional(),
  moisture: z.string().optional(),
  heat: z.string().optional(),
  cuttingCondition: z.string().optional(),
  splittingCondition: z.string().optional(),
  cuttingNotes: z.string().optional(),

  totalCutQuantity: z.number().int().nonnegative('Total cut pieces cannot be negative'),
  finishedQuantity: z.number().int().nonnegative('Finished pieces cannot be negative'),
  firstQualityQuantity: z.number().int().nonnegative().default(0),
  secondQualityQuantity: z.number().int().nonnegative().default(0),
  lattQuantity: z.number().int().nonnegative().default(0),
  muryQuantity: z.number().int().nonnegative().default(0),

  allocatedVehicle: z.string().optional(),
  gapPosition: z.number().int().min(1).max(4).default(1),
  remarks: z.string().optional(),
  enteredBy: z.string().min(1, 'Operator is required'),
});

// --------------------------------------------------------------------------
// 8. Rate Master Update Validator
// --------------------------------------------------------------------------
export const updateRateMasterSchema = z.object({
  quarryId: z.string().min(1, 'Quarry ID is required'),
  sectionId: z.string().optional(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  ratesData: z.record(z.string(), z.any()),
  updatedBy: z.string().min(1, 'Operator is required'),
});

// --------------------------------------------------------------------------
// 9. JCB Work Log Validator (Hour Meter Calculation & Validation)
// --------------------------------------------------------------------------
export const createJcbLogSchema = z.object({
  quarryId: z.string().min(1, 'Quarry ID is required'),
  machineId: z.string().min(1, 'Machine ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  operator: z.string().min(1, 'Operator is required'),
  startHourReading: z.number().nonnegative('Start reading must be non-negative'),
  endHourReading: z.number().nonnegative('End reading must be non-negative'),
  ratePerHour: z.number().positive().default(1400),
  dieselResponsibility: z.enum(['Owner', 'Quarry Reimbursed']).default('Owner'),
  reimbursedDieselAmount: z.number().min(0).default(0),
  description: z.string().optional(),
  remarks: z.string().optional(),
  verifiedBy: z.string().min(1, 'Verifier is required'),
}).refine((data) => data.endHourReading >= data.startHourReading, {
  message: 'End hour reading must be greater than or equal to start hour reading',
  path: ['endHourReading'],
});
