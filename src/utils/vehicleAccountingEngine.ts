import {
  Vehicle,
  VehicleTransaction,
  VehicleAccount,
  VehicleOwnerType,
  LoadOrder,
  QuarryExpense,
} from '../types/quarry';

/**
 * RZ MINETRIX — VEHICLE ACCOUNTING ENGINE
 * 
 * CORE RULES:
 * 1. Company-owned vehicles and outside-owned vehicles must use the SAME accounting structure.
 * 2. Do NOT create a special accounting calculation for RZ MINING vehicles.
 * 3. Every vehicle must have:
 *    - Income: Trip income, Delivery income, Other income
 *    - Expenses: Fuel, Driver payment, Loading, Repair, Maintenance, Tyre, Toll, Other vehicle expenses
 *    - Receivables: Customer pending, Driver collection pending
 *    - Payables: Driver, Owner, Other party
 * 4. The accounting engine must calculate company vehicles and outside vehicles using the SAME transaction model.
 * 5. The only difference may be ownership information: Owner Type: COMPANY or OUTSIDE.
 *    Calculation logic remains identical.
 * 6. Historical transactions must never change when the vehicle owner type is changed.
 */

export function resolveVehicleOwnerType(vehicle: Partial<Vehicle>): VehicleOwnerType {
  if (vehicle.ownerType === 'COMPANY' || vehicle.ownerType === 'OUTSIDE') {
    return vehicle.ownerType;
  }
  const owner = (vehicle.owner || '').trim().toLowerCase();
  const category = (vehicle.category || '').trim().toLowerCase();
  if (owner.includes('rz') || category.includes('rz')) {
    return 'COMPANY';
  }
  return 'OUTSIDE';
}

/**
 * Pure calculation engine applied identically to every vehicle (Company or Outside)
 */
export function computeVehicleAccount(
  vehicle: Vehicle,
  allTransactions: VehicleTransaction[],
  allLoads: LoadOrder[] = []
): VehicleAccount {
  const vNum = vehicle.vehicleNumber.trim().toUpperCase();
  const ownerType = resolveVehicleOwnerType(vehicle);

  // Filter transactions for this vehicle
  const vehicleTxns = allTransactions.filter(
    (t) => t.vehicleNumber.trim().toUpperCase() === vNum
  );

  // 1. Income (Trip income, Delivery income, Other income)
  let tripIncome = 0;
  let deliveryIncome = 0;
  let otherIncome = 0;

  // 2. Expenses (Fuel, Driver payment, Loading, Repair, Maintenance, Tyre, Toll, Other vehicle expenses)
  let fuel = 0;
  let driverPayment = 0;
  let loading = 0;
  let repair = 0;
  let maintenance = 0;
  let tyre = 0;
  let toll = 0;
  let otherVehicleExpenses = 0;

  // 3. Receivables (Customer pending, Driver collection pending)
  let customerPending = 0;
  let driverCollectionPending = 0;

  // 4. Payables (Driver, Owner, Other party)
  let driverPayable = 0;
  let ownerPayable = 0;
  let otherPartyPayable = 0;

  // Process transactions - identical model for both company and outside vehicles
  vehicleTxns.forEach((txn) => {
    const amt = Number(txn.amount) || 0;

    if (txn.type === 'Income') {
      if (txn.category === 'Trip income') tripIncome += amt;
      else if (txn.category === 'Delivery income') deliveryIncome += amt;
      else if (txn.category === 'Other income') otherIncome += amt;
    } else if (txn.type === 'Expense') {
      if (txn.category === 'Fuel') fuel += amt;
      else if (txn.category === 'Driver payment') driverPayment += amt;
      else if (txn.category === 'Loading') loading += amt;
      else if (txn.category === 'Repair') repair += amt;
      else if (txn.category === 'Maintenance') maintenance += amt;
      else if (txn.category === 'Tyre') tyre += amt;
      else if (txn.category === 'Toll') toll += amt;
      else if (txn.category === 'Other vehicle expenses') otherVehicleExpenses += amt;
    } else if (txn.type === 'Receivable') {
      if (txn.category === 'Customer pending') customerPending += amt;
      else if (txn.category === 'Driver collection pending') driverCollectionPending += amt;
    } else if (txn.type === 'Payable') {
      if (txn.category === 'Driver') driverPayable += amt;
      else if (txn.category === 'Owner') ownerPayable += amt;
      else if (txn.category === 'Other party') otherPartyPayable += amt;
    }
  });

  const totalIncome = tripIncome + deliveryIncome + otherIncome;
  const totalExpenses =
    fuel +
    driverPayment +
    loading +
    repair +
    maintenance +
    tyre +
    toll +
    otherVehicleExpenses;
  const totalReceivables = customerPending + driverCollectionPending;
  const totalPayables = driverPayable + ownerPayable + otherPartyPayable;

  // Identical calculation logic:
  const netOperatingProfit = totalIncome - totalExpenses;
  const netBalance = totalIncome + totalReceivables - (totalExpenses + totalPayables);

  // Trips & Quantity from Loads register
  const vehicleLoads = allLoads.filter(
    (l) => l.vehicleNumber.trim().toUpperCase() === vNum
  );
  const totalTrips = vehicleLoads.length;
  // Vehicle side uses the actual received quantity entered by operator (stored independently from quarry rated qty)
  const totalStoneQty = vehicleLoads.reduce((sum, l) => sum + (l.vehicleReceivedQuantity || l.quantity || 0), 0);

  return {
    vehicleId: vehicle.id,
    vehicleNumber: vehicle.vehicleNumber,
    owner: vehicle.owner,
    driver: vehicle.driver,
    ownerType,
    category: vehicle.category,
    capacity: vehicle.capacity,
    status: vehicle.status,
    income: {
      tripIncome,
      deliveryIncome,
      otherIncome,
      totalIncome,
    },
    expenses: {
      fuel,
      driverPayment,
      loading,
      repair,
      maintenance,
      tyre,
      toll,
      otherVehicleExpenses,
      totalExpenses,
    },
    receivables: {
      customerPending,
      driverCollectionPending,
      totalReceivables,
    },
    payables: {
      driver: driverPayable,
      owner: ownerPayable,
      otherParty: otherPartyPayable,
      totalPayables,
    },
    netOperatingProfit,
    netBalance,
    totalTrips,
    totalStoneQty,
    transactions: vehicleTxns,
  };
}
