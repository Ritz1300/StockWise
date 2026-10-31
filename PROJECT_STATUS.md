# StockWise – Smart Grocery Inventory & Demand Forecasting Platform
## Project Status & Architecture Documentation

**Last Updated:** 2026-10-31  
**Project Location:** `C:\Users\HP\Desktop\StockWise`  
**Current State:** Completed Frontend & Backend Integration, Fixed Critical Routes & Syntax Errors, Added Missing Pages, Seed Script, and Build Verification.

---

## 1. Project Overview & Architecture

StockWise is a full-stack MERN application built specifically for grocery stores to manage batch-level perishable inventory, calculate automated reorders, enforce FEFO (First Expiring, First Out) stock deduction, and forecast future demand using five statistical and machine learning models.

```
       +-------------------------------------------------------------+
       |                     React 19 + Vite Frontend                |
       |  (Tailwind CSS v4, Lucide Icons, Recharts, Axios, Context)   |
       +------------------------------+------------------------------+
                                      | HTTP/REST (Bearer JWT)
                                      v
       +-------------------------------------------------------------+
       |                     Node.js Express API                     |
       |  (/api/v1/auth, /products, /inventory, /sales, /forecast..) |
       +--------------+-------------------------------+--------------+
                      |                               |
                      v                               v
       +-----------------------------+ +-----------------------------+
       |   FEFO Inventory Engine     | |  5-Model Forecasting Engine |
       | - Oldest expiry deduction   | | - Naive & Seasonal Naive    |
       | - Movement audit tracking   | | - Moving & Weighted Average |
       | - Wastage write-off records | | - Seasonality Regression    |
       | - Batch-level cost tracking | | - Walk-forward MAE/WAPE     |
       +-----------------------------+ +-----------------------------+
                      |                               |
                      +---------------+---------------+
                                      |
                                      v
                      +-------------------------------+
                      |         MongoDB Atlas         |
                      |  (Mongoose Schemas & Indexes) |
                      +-------------------------------+
```

---

## 2. Modules Status

| Module | Backend API | Frontend UI | Integration Status | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Authentication & RBAC** | ✅ Done | ✅ Done | Connected | Roles: `owner`, `manager`, `staff`. JWT in localStorage. |
| **Dashboard** | ✅ Done | ✅ Done | Connected | Real-time KPIs, revenue trends, top items, low stock alerts. |
| **Product Catalog** | ✅ Done | ✅ Done | Connected | SKU search, category filters, cost/sell prices, reorder rules. |
| **Batch Inventory** | ✅ Done | ✅ Done | Connected | Batch tracking, drawer expansion, stock adjustment, waste logs. |
| **Sales & FEFO POS** | ✅ Done | ✅ Done | Connected | Stock deduction strictly enforced via earliest expiry date first. |
| **Suppliers** | ✅ Done | ✅ Done | Connected | Supplier directory, lead times, phone & email contacts. |
| **Purchase Orders** | ✅ Done | ✅ Done | Connected | PO generation, status lifecycle, partial/full goods receipt. |
| **Demand Forecasting** | ✅ Done | ✅ Done | Connected | 7/14/28-day forecasts, accuracy metrics, chart visualization. |
| **Reorder Engine** | ✅ Done | ✅ Done | Connected | Inventory position, stockout risk (High/Med/Low), order advice. |
| **Expiry Management** | ✅ Done | ✅ Done | Connected | 7-day & 30-day horizons, financial risk, one-click write-off. |
| **Reports & Analytics** | ✅ Done | ✅ Done | Connected | Sales & margins, inventory valuation, waste loss audit table. |
| **Settings** | ✅ Done | ✅ Done | Connected | Store metadata, user profile update, password change. |

---

## 3. Database & API Endpoints

### Base URL: `http://localhost:5000/api/v1`

- **Auth:**
  - `POST /auth/register` — Register store owner
  - `POST /auth/login` — Login & receive JWT
  - `GET /auth/me` — Current user profile
  - `PUT /auth/profile` — Update name/email
  - `PUT /auth/change-password` — Change password
- **Products:**
  - `GET /products` (query: `search`, `category`, `page`, `limit`)
  - `POST /products` — Add product
  - `PUT /products/:id` — Update product
  - `DELETE /products/:id` — Deactivate product
  - `GET /products/categories` — Distinct categories
- **Inventory:**
  - `GET /inventory` — Products with aggregated stock and active batch counts
  - `GET /inventory/summary` — Inventory KPIs (total stock value, expiring counts)
  - `GET /inventory/batches/:productId` — Specific product batches
  - `GET /inventory/movements` & `GET /inventory/movements/:productId` — Audit trail
  - `POST /inventory/adjust` — Manual stock correction
  - `POST /inventory/waste` — Record spoiled/expired waste
- **Sales:**
  - `POST /sales` — Create sale & trigger FEFO batch deductions
  - `GET /sales` — Sales transaction history with pagination
  - `GET /sales/summary` — Today, week, and month sales aggregates
- **Suppliers:**
  - `GET /suppliers`, `POST /suppliers`, `PUT /suppliers/:id`, `DELETE /suppliers/:id`
- **Purchase Orders:**
  - `GET /purchase-orders`, `POST /purchase-orders`, `PUT /purchase-orders/:id/status`
  - `POST /purchase-orders/:id/receive` — Receive goods into new inventory batches
- **Demand Forecasting:**
  - `GET /forecast` (params: `productId`, `period: 7|14|28`) — Computes best model & forecasts
  - `GET /forecast/reorder` — Reorder recommendations for all products
- **Expiry:**
  - `GET /expiry` — Expired, 7-day, and 30-day batches with predicted sales
- **Reports:**
  - `GET /reports/sales` — Daily/weekly sales, gross revenue, top 10 products
  - `GET /reports/inventory` — Product-by-product valuation & total capital
  - `GET /reports/waste` — Historical waste write-offs and financial losses

---

## 4. Key Fixes & Implementation Details Completed

1. **Frontend Dependencies Installed:**
   - Added `react-router-dom`, `lucide-react`, `recharts`, and `axios` to `frontend/package.json`.
2. **Runtime & Compiler Fixes:**
   - **`ForecastPage.jsx`**: Fixed hoisting bug where `fetchRecommendations` was invoked inside `useEffect` prior to its declaration.
   - **`index.css`**: Fixed CSS font `@import` order by placing `@import url(...)` before `@import "tailwindcss";`.
   - **`PurchaseOrdersPage.jsx`**: Repaired non-UTF8 file encoding that caused Vite and Oxlint parsing errors.
   - **`backend/routes/inventory.js`**: Fixed Express 4.21+ path-to-regexp crash caused by `/:productId?`. Split into two valid routes: `/movements` and `/movements/:productId`.
3. **Frontend Routing & Shell Assembly (`App.jsx`):**
   - Configured `BrowserRouter`, `AuthProvider`, `PublicRoute`, and `ProtectedRoute` (with role validation).
   - Wired up all 10 modules inside `Layout` (`Sidebar` + `Topbar`).
4. **Missing Modules Built:**
   - Implemented `ExpiryPage.jsx` with KPI cards, risk filters, and a direct waste write-off modal.
   - Implemented `ReportsPage.jsx` with sales revenue charts, top product margins, inventory valuation, and waste losses.
   - Implemented `SettingsPage.jsx` with store details, profile editing, and password updating.
5. **Database Configuration & Robustness:**
   - Configured `backend/.env` and `backend/.env.example` with clear instructions for MongoDB Atlas.
   - Updated `backend/config/db.js` so that an unconfigured URI logs a prominent, helpful message without crashing the server.
6. **Development Database Seeder (`backend/utils/seed.js`):**
   - Created `npm run seed` command.
   - Seeds realistic grocery data: 3 users, 4 suppliers, 12 products across 5 categories, varied batches (healthy, urgent expiry, expired), 90 days of historical sales with weekend seasonality, and pending purchase orders.

---

## 5. Verification & Testing Summary

- **Frontend Production Build (`npm run build`):**  
  `✓ 2698 modules transformed. Built cleanly in 2.22s.`
- **Frontend Linter (`npx oxlint`):**  
  `0 errors across 32 files.`
- **Backend Node Syntax (`node -c`):**  
  `All backend files passed with 0 errors.`
- **Backend Server Boot & Health Check:**  
  Server boots up on port 5000; `GET /api/v1/health` verified with HTTP 200 `{"status": "ok"}`.

---

## 6. Next Steps for Developer

1. **Configure MongoDB Atlas:**
   - Open `backend/.env`
   - Paste your Atlas connection string into `MONGODB_URI`:
     `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/stockwise?retryWrites=true&w=majority`
2. **Seed Initial Data:**
   - Run `npm run seed` inside `backend/`
3. **Start Development Servers:**
   - Backend: `npm run dev` in `backend/`
   - Frontend: `npm run dev` in `frontend/`
4. **Log in to Demo Store:**
   - Owner: `demo@stockwise.com` / `password123`