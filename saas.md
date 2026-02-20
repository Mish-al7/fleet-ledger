# Fleet Ledger SaaS

Fleet Ledger is a multi-tenant fleet accounting SaaS platform built with the MERN stack.

This document defines STRICT ARCHITECTURAL RULES to prevent scope drift, hallucinations, cross-module contamination, and unsafe modifications.

------------------------------------------------------------
CORE ARCHITECTURE
------------------------------------------------------------

This system uses:

Logical Multi-Tenancy (Single MongoDB Database)

Each company (tenant) is isolated using:

    company_id

Every business record MUST belong to exactly one company.

------------------------------------------------------------
MULTI-TENANCY RULES (NON-NEGOTIABLE)
------------------------------------------------------------

1. Every business collection MUST contain:

    company_id: ObjectId (required, indexed)

2. company_id must NEVER be accepted from frontend.

3. company_id must ALWAYS be extracted from JWT.

4. Every query MUST filter by:

    company_id: req.user.company_id

5. Updates and deletes MUST validate company ownership.

6. No global queries without company_id filter.

------------------------------------------------------------
CORE COLLECTIONS
------------------------------------------------------------

Company
- _id
- name
- email
- plan
- status
- created_at

User
- _id
- name
- email
- password
- role (Admin / Driver)
- company_id (required)

Business Collections (ALL must include company_id):
- Vehicles
- Trips
- Bookings
- VehicleLedger
- OpeningBalances
- AdminExpenses
- PersonalLedger
- Drivers

------------------------------------------------------------
MODULE ISOLATION RULES
------------------------------------------------------------

Each module must remain logically isolated.

TRIPS
- Generates trip income/expense entries.
- Can post to VehicleLedger.
- Must NOT interact with PersonalLedger.

BOOKINGS
- Independent from accounting.
- Does NOT affect VehicleLedger unless explicitly approved logic exists.

PERSONAL LEDGER
- Admin-only.
- Completely separate from VehicleLedger.
- Must NOT affect dashboards or trip balances.

ADMIN EXPENSES (Recurring & Misc)
- Separate module.
- If vehicle_id exists → post to VehicleLedger.
- If vehicle_id is null → company-level only.
- Must NOT mix with Trip entries.

OPENING BALANCE
- Remains independent.
- Must NOT be merged into running balance logic.
- Total Balance is display-only.

------------------------------------------------------------
LEDGER POSTING RULES
------------------------------------------------------------

Vehicle Ledger receives entries ONLY from:
- Trips
- Admin Expenses (if vehicle-linked)

Vehicle Ledger must:
- Store running_balance per row
- Never recalculate historical rows
- Never auto-modify past entries

------------------------------------------------------------
STRICT PROHIBITIONS
------------------------------------------------------------

The system MUST NOT:

- Merge Opening Balance into running balance logic
- Auto-backfill recurring expenses historically
- Allow cross-company data visibility
- Trust frontend-provided company_id
- Modify historical ledger entries
- Mix Personal Ledger with Vehicle Ledger
- Include Personal Ledger in dashboard metrics

------------------------------------------------------------
RECURRING EXPENSE ENGINE RULES
------------------------------------------------------------

Recurring expenses:
- Post only when due
- Use last_posted_date
- Never retroactively create historical entries
- One-time expenses must mark as Completed after posting

------------------------------------------------------------
DISPLAY RULES
------------------------------------------------------------

Running Balance:
- Calculated at insert time
- Stored per entry
- Not recalculated dynamically

Total Balance:
- Display-only
- Opening Balance + Running Balance
- Must not alter stored data

------------------------------------------------------------
ACCESS CONTROL RULES
------------------------------------------------------------

Admin:
- Full access within company scope

Driver:
- Restricted to their own data
- No access to Personal Ledger
- No access to Admin Expenses

------------------------------------------------------------
MIGRATION SAFETY
------------------------------------------------------------

If modifying schemas:

1. Ensure company_id exists
2. Migrate old data safely
3. Make company_id required
4. Test isolation before deployment

------------------------------------------------------------
SAAS PRINCIPLES
------------------------------------------------------------

- Single MongoDB database
- Tenant isolation via company_id
- Zero cross-tenant leakage
- Additive modules only
- No destructive schema changes without migration plan

------------------------------------------------------------
DEVELOPER WARNING
------------------------------------------------------------

Any new feature MUST:

- Respect company isolation
- Not merge modules
- Not modify historical financial data
- Not change accounting logic silently

If uncertain:
DO NOT IMPLEMENT.
Ask for clarification.

------------------------------------------------------------
END OF SCOPE DEFINITION
------------------------------------------------------------