# Implementation Plan — RZ MINETRIX Quarry Business Logic Correction

## 1. Executive Summary & User Alignment

This plan implements the definitive business logic corrections for RZ MINETRIX, aligning the application with real quarry extraction physics and operational dynamics as confirmed by the user:

1. **Remove Physical Warehouse Stock**: The quarry does NOT maintain finished stone inventory. Production is cut directly at pit faces and loaded immediately onto vehicles. At shift end, quarry stock is 0. Replace all warehouse stock displays on the Dashboard and throughout the app with the **Direct Pit Cutting & Dispatch Pipeline** (Production Cut → Vehicle Loading → Gate Pass → Dispatch).
2. **Multi-Quarry & Section Rates**: Support RZ Quarry 001/A (strong rock: ₹43/₹33), RZ Quarry 001/B (medium rock: ₹41/₹31), and newly configurable RZ Quarry 002. Rates auto-apply based on the selected quarry/section while allowing manual override per load.
3. **5:00 PM Shift Continuation & Overtime Rule**: Quarry shifts run 7:00 AM – 5:00 PM. At 5:00 PM, work continues only until the stopped 1st-quality vehicle becomes full. This extension is recorded as standard shift hours; any additional work beyond completing that vehicle is calculated as staff overtime (OT). 2nd and Mury waiting vehicles do not trigger this extension.
4. **Machinery & JCB Management**: Seamlessly integrated with JCB hour readings (start/end validation, ₹1,400/hr auto-calculation, owner diesel responsibility vs reimbursable expense), cutting machines, Ali's Rail 1 (₹0 rent), Mujeeb daily rent contract (₹2,000/working day), diesel/oil/blade tracking, and machine-specific ledgers.

---

## 2. Domain Architecture, Spatial Math & Visual Guidelines

- **Theme & Palette**: Industrial Quarry Executive Dark Theme (`#090a0d` obsidian background, `#12141a` high-contrast card surfaces, `#d4af37` gold highlights, emerald for dispatch throughput, rose for operational costs, cyan for vehicle bays).
- **Zero-Pill & Metadata Discipline**: Unboxed quiet metadata with `·` separators; interactive tabs/filters styled as crisp segmented buttons (`px-3.5 py-1.5 text-xs font-mono`).
- **Spatial Math**: Monospace tabular numerals (`font-mono`) for all stone quantities, JCB readings, and rupee amounts to ensure vertical alignment.
- **Direct Pipeline Visualization**: 4-stage operational flow:
  `PIT PRODUCTION (Cut & Split)` ➔ `VEHICLE LOADING (Direct Bay Fill)` ➔ `GATE PASS (Dispatch Verification)` ➔ `CUSTOMER DELIVERY & SETTLEMENT`.

---

## 3. Proposed Changes

### A. Dashboard Direct Loading Pipeline (`src/views/DashboardView.tsx`)
- Replace warehouse "Live Stock Status" and "Stock (1st Quality)" cards with **"Direct Loading & Dispatch Pipeline"**.
- Display today's live cut stones vs today's direct-loaded stones vs today's gate-out dispatches.
- Prominently declare the zero-closing-stock operational rule (*"Direct Pit Extraction • Zero Warehouse Stock"*).
- Update the workflow stepper: Quarry Production ➔ Vehicle Loading ➔ Gate Pass ➔ Dispatch.

### B. Production Model & Cutting Verification (`src/views/ProductionView.tsx` & `src/types/quarry.ts`)
- Ensure production logs record cutting dimensions (nominal 13.5x8.5x9 inch cut, 13x8x8 finished) and actual post-split observed recovery (1st, 2nd, 3rd/Mury, Latt) without predictive pre-assumptions.
- Link production entries directly to active quarry section (A vs B vs 002) and operational machines.

### C. Quarry Section Rates (`src/views/RateMasterView.tsx` & `src/components/modals/NewLoadModal.tsx`)
- Auto-populate quarry rates based on quarry section:
  - Quarry 001/A: 1st Quality = ₹43/pc, 2nd Quality = ₹33/pc, 3rd/Mury = ₹1,000/load, Latt = ₹2,500/load.
  - Quarry 001/B: 1st Quality = ₹41/pc, 2nd Quality = ₹31/pc.
  - Quarry 002: Configurable independent rates.
- Allow editable rate overrides per load entry without altering historical transactions.
- Enforce load capacity defaults (260 capacity, 5 free, 255 rated) while billing actual unloaded count when specified.

### D. 5:00 PM Shift Continuation & Overtime (`src/views/StaffAttendanceView.tsx` & `src/views/StaffSalaryPayrollView.tsx`)
- Add 5:00 PM First-Quality Bay Clearance indicator in attendance and shift logs.
- Automatically log completion of the stopped 1st-quality vehicle as regular hours, calculating any excess time as overtime pay for active pit staff.

---

## 4. Verification & Testing Checklist

- [ ] Build & compilation check via `compile_applet`.
- [ ] Verify Dashboard shows 0 warehouse stock and highlights direct pit loading throughput.
- [ ] Verify switching Quarry between 001/A, 001/B, and 002 updates default stone rates with manual override capability.
- [ ] Verify JCB hour meter validation (`endReading >= startReading`) and ₹1,400/hr billing calculation.
- [ ] Verify 5:00 PM shift extension calculation correctly attributes standard vs OT hours.
- [ ] Confirm full preservation of all 3 primary modules (Quarry, Vehicle, Order) with direct 2-user access.
