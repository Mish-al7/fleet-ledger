# Fleet Ledger (ActivFleet) - Application Summary

Fleet Ledger is a multi-tenant SaaS application designed for fleet management and accounting. It enables fleet owners (Admins) to track vehicle profitability, manage bookings, and monitor driver activities, while providing drivers with a mobile-first interface to log trips and expenses.

## 🚀 Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19, Tailwind CSS 4, Lucide React (Icons)
- **State & Charts**: Recharts & Chart.js for financial visualization
- **Backend**: Next.js API Routes (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js (Session-based)
- **Reporting**: PDFKit for PDF generation, CSV/Excel exports

## 🏗️ Core Architecture
- **Multi-Tenancy**: Logical isolation using `company_id` on all business collections. Data is partitioned and restricted based on the user's tenant context.
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full control over vehicles, drivers, opening balances, and all financial reports.
  - **Driver**: Restricted to assigned vehicles; primary task is logging trips and expenses.
- **Accounting Logic**: 
  - Running balances are calculated dynamically: `Opening Balance + (Cumulative Income - Cumulative Expenses)`.
  - Expenses include fuel, toll (Fastag), service, driver allowance, and adblue.
  - **Vehicle Ledger**: Aggregates data from `Trips` and `AdminExpenses` (e.g., insurance, permits).

## 📊 Key Modules
1. **Trips Management**: Drivers enter trip routes, income, and various expenses.
2. **Dashboard & Analytics**: Real-time KPIs (Total Income, Expenses, Profit) and trends per vehicle or fleet.
3. **Bookings (Phase 2)**: Vehicle availability management and scheduling.
4. **Opening Balances**: Manual entry per vehicle/year to initialize financial tracking.
5. **Admin Expenses**: Specialized module for recurring or one-off vehicle/company costs.
6. **Reports**: Monthly summaries and vehicle profitability exports.

## 🛠️ Optimization Strategies for AI/LLMs

### 1. Performance & Scalability
- **Aggregation Pipelines**: Move in-memory ledger calculations (currently in `GET /api/ledger/[vehicleId]`) to MongoDB aggregation pipelines to reduce server load and memory usage.
- **Pagination**: Implement cursor-based or offset pagination for trip logs and ledger entries to handle large fleets.
- **Caching**: Use Next.js `unstable_cache` or a dedicated Redis layer for dashboard stats which change infrequently.

### 2. Multi-Tenancy Safety
- **Global Scoping**: Implement a base query helper or middleware that automatically appends `{ company_id: session.user.company_id }` to every Mongoose query to prevent cross-tenant data leakage.

### 3. Financial Integrity
- **Transactional Consistency**: Use MongoDB transactions when posting complex entries that affect multiple logs (e.g., a trip that impacts multiple ledger types).
- **Snapshotting**: For historical reports, consider periodically snapshotting closing balances to avoid recalculating years of data.

### 4. Code Quality
- **Shared Logic**: Centralize calculation rules (e.g., `total_expenses` formula) into a shared utility library used by both frontend components and backend API routes.
- **Type Safety**: Introduce TypeScript (if not already fully adopted) or JSDoc for complex financial schemas to prevent logic errors in balance calculations.

### 5. Offline Capabilities
- **PWA/Service Workers**: Enhance the Driver Trip entry form with offline caching so drivers can log trips in areas with poor connectivity.
