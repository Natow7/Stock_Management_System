# Setup & Quick Start Guide

## Prerequisites
- Node.js v16+
- PostgreSQL v14+

## Installation

### 1. Backend
```bash
cd sms-backend
npm install
npm start  # Runs on port 4000
```

### 2. Frontend
```bash
cd sms-frontend
npm install
npm run dev  # Runs on port 5173
```

### 3. Database
```bash
psql -U postgres -d sms_db -f sms-backend/migrations/001_initial_schema.sql
psql -U postgres -d sms_db -f sms-backend/migrations/004_add_multi_item_goods_receipts.sql
```

## Demo Accounts
**All passwords:** `passwd`

- **admin@example.com** - Administrator
- **storehead@example.com** - Store Head
- **yonas.tec@university.edu** - TEC
- **clerk@example.com** - Stock Clerk
- **pro@example.com** - PRO
- **pao@example.com** - PAO
- **depthead@example.com** - Department Head
- **security@example.com** - Security Officer

## Access
- Frontend: http://localhost:5173
- Backend: http://localhost:4000/api/health
