# Stock Management System (SPMS)

Ethiopia University Property Management System

---

## 🚀 Quick Start

```bash
# Backend
cd sms-backend && npm install && npm start

# Frontend  
cd sms-frontend && npm install && npm run dev
```

**Access:** http://localhost:5173  
**Login:** Any demo account with password `passwd`

See [docs/SETUP.md](docs/SETUP.md) for details.

---

## 📚 Documentation

1. **[Setup Guide](docs/SETUP.md)** - Installation & credentials
2. **[Testing Guide](docs/TESTING.md)** - How to test features
3. **[Workflows](docs/WORKFLOWS.md)** - Business processes
4. **[Architecture](docs/ARCHITECTURE.md)** - Tech stack & design
5. **[API Reference](docs/API.md)** - Backend endpoints

---

## ✨ Key Features

- Multi-item goods receipt with per-item TEC evaluation
- Stock issue workflow with gate clearance
- Return tracking and quality control
- Inter-store transfers
- Asset management and disposal
- PDF generation (Model 19 & 20)
- FIFO inventory tracking

---

## 🛠️ Tech Stack

**Frontend:** React 18, TailwindCSS, Vite  
**Backend:** Node.js, Express, PostgreSQL  
**Auth:** JWT

---

## 🧪 Quick Test

1. Login as Store Head → Create multi-item receipt
2. Login as TEC → Evaluate items individually
3. Verify "Partially Approved" status

See [docs/TESTING.md](docs/TESTING.md)

---

**Last Updated:** 2026-09-16
