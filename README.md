# Fleet Ledger - Next.js Application

A comprehensive fleet management and expense tracking system with role-based access control.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file with your MongoDB connection:
```
MONGODB_URI=your_mongodb_atlas_uri
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 3. Seed Database
```bash
node scripts/seed.mjs
```

This creates:
- **Admin**: admin@fleet.com / admin123
- **Driver**: driver@fleet.com / driver123
- 2 test vehicles
- 3 sample trips

### 4. Run Development Server
```bash
npm run dev
```

Visit: http://localhost:3000

## Features

### Driver Access (`/trips/new`)
- Mobile-first trip entry form
- Auto-filtered vehicle dropdown (assigned vehicles only)
- Real-time expense calculation
- Clean, dark-mode UI

### Admin Access
- **Dashboard** (`/admin/summary`): KPIs, charts, month filter
- **Vehicle Ledgers** (`/admin/ledger`): Detailed transaction history with running balances
- **Opening Balances** (`/admin/opening-balances`): Configure starting balances

## Key Business Rules

✅ **Running Balance**: Never stored, always computed on-the-fly
✅ **Auto-Calculations**: Month and total_expenses computed automatically
✅ **Role Enforcement**: Strict API-level permission checks
✅ **Data Integrity**: Opening balance changes affect all future calculations immediately

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB with Mongoose
- **Auth**: NextAuth (Credentials)
- **UI**: Tailwind CSS v4
- **Charts**: Recharts

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin-only pages
│   ├── api/            # API routes
│   ├── trips/          # Driver trip entry
│   └── components/     # Shared components
├── lib/                # Utilities (auth, db)
└── models/             # Mongoose schemas
```

## API Endpoints

- `POST /api/trips` - Create trip
- `GET /api/ledger/[vehicleId]` - Get vehicle ledger with running balance
- `GET /api/summary/monthly?month=YYYY-MM` - Get monthly summary
- `GET/POST /api/opening-balances` - Manage opening balances
- `GET /api/user/vehicles` - Get assigned vehicles

## Testing

Run verification scripts:
```bash
node scripts/test-schemas.mjs  # Test schemas
node scripts/test-ledger.mjs   # Test ledger logic
node scripts/test-summary.mjs  # Test aggregations
```
