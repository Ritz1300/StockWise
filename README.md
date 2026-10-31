# StockWise – Smart Grocery Inventory & Demand Forecasting Platform

StockWise is a smart grocery inventory management platform built using the MERN stack. It helps grocery store owners manage products, monitor stock levels, track expiry dates, record sales, and make better purchasing decisions using demand forecasting.

Unlike traditional inventory systems, StockWise uses historical sales data to estimate future product demand and generate intelligent stock reorder recommendations.

## Key Features

- **Dashboard:** View important inventory statistics, sales summaries, and stock alerts.
- **Product Management:** Add, update, view, and manage grocery products.
- **Inventory Management:** Track available stock through individual batches.
- **FEFO Inventory Tracking:** First Expired, First Out (FEFO) ensures that batches with earlier expiry dates are used first.
- **Sales Management:** Record sales and automatically update inventory quantities.
- **Supplier Management:** Maintain supplier information.
- **Purchase Orders:** Create purchase orders and track stock receiving, including partial deliveries.
- **Demand Forecasting:** Predict future product demand using historical sales data.
- **Reorder Recommendations:** Calculate suggested order quantities based on predicted demand, lead time, and safety stock.
- **Expiry Management:** Monitor batches approaching their expiry dates and track wastage.
- **Reports:** View inventory and sales-related information.
- **Role-Based Access:** Support different access levels for owners, managers, and staff.

## Technology Stack

Frontend - React.js, Vite 
Styling - Tailwind CSS 
Charts - Recharts 
Icons - Lucide React 
Backend - Node.js, Express.js 
Database - MongoDB Atlas 
ODM - Mongoose 
Authentication - JWT, bcrypt 
API Communication - Axios 

## Project Structure

```text
StockWise/
│
├── backend/
│   ├── config/           # Database configuration
│   ├── controllers/      # Request handling logic
│   ├── middleware/       # Authentication and validation
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic and forecasting
│   ├── utils/            # Helper functions and seed script
│   ├── jobs/             # Background job-related files
│   ├── server.js         # Backend entry point
│   └── .env.example      # Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── api/          # API integration modules
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Authentication context
│   │   ├── pages/        # Application pages
│   │   ├── App.jsx       # Application routing
│   │   └── main.jsx     # Frontend entry point
│   └── package.json
│
├── PROJECT_STATUS.md
└── README.md
```

## Demand Forecasting

One of the main features of StockWise is its demand forecasting system.

The system analyzes historical sales data to estimate future demand for individual grocery products.

The forecasting service includes the following approaches:

1. **Naive Forecasting:** Uses the most recent observed demand as the prediction.
2. **Seasonal Naive Forecasting:** Uses demand from a corresponding previous seasonal period.
3. **Moving Average:** Calculates predictions using the average of recent sales.
4. **Weighted Moving Average:** Assigns greater importance to more recent sales.
5. **Regression with Day-of-Week Seasonality:** Uses regression to account for weekly demand patterns.

The models are evaluated using error metrics such as:

- Mean Absolute Error (MAE)
- Weighted Absolute Percentage Error (WAPE)

The system supports 7-day, 14-day, and 28-day forecasting.

### Reorder Recommendations

StockWise uses forecasted demand, supplier lead time, and safety stock to estimate when products need replenishment.

The reorder recommendation considers inventory position, including available stock and incoming purchase orders, to help avoid unnecessary orders and stock shortages.

## Inventory Management

StockWise maintains inventory at the batch level rather than storing only a single product quantity.

Each batch contains information such as:

- Product
- Quantity
- Received date
- Expiry date

The system follows the **FEFO (First Expired, First Out)** approach when deducting stock during sales.

This helps reduce product wastage and ensures that batches nearing expiry are used first.

## Getting Started

Follow these instructions to run StockWise locally.

### Prerequisites

Make sure you have installed:

- Node.js and npm
- MongoDB Atlas account
- Git
- Visual Studio Code (recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/StockWise.git
cd StockWise
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder using `.env.example` as a reference.

Configure your MongoDB Atlas connection string and the other required environment variables.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

Use the actual variable names required by your backend configuration.

### 3. Seed the Database

After configuring MongoDB Atlas, run:

```bash
npm run seed
```

This populates the database with sample users, grocery products, suppliers, inventory batches, sales history, and purchase order data.

### 4. Start the Backend Server

```bash
npm run dev
```

The backend runs at:

`http://localhost:5000`

### 5. Set Up the Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Configure the frontend environment variable using the required API URL.

Example:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Start the frontend:

```bash
npm run dev
```

The application will be available at:

`http://localhost:5173`

## Demo Login Credentials

After successfully running the database seed script, the following demo accounts are available:

| Role | Email | Password |
|---|---|---|
| Owner | demo@stockwise.com | password123 |
| Manager | manager@stockwise.com | password123 |
| Staff | staff@stockwise.com | password123 |

These credentials are intended for local demonstration and testing only.

## Team Development

To contribute to StockWise:

1. Clone the repository.
2. Create a separate branch for your work.
3. Make your changes and test them locally.
4. Commit and push your changes.
5. Create a Pull Request for review.

Avoid directly pushing unfinished changes to the `main` branch.

## Future Improvements

- Improve forecasting accuracy with additional machine learning approaches.
- Add automated low-stock and expiry notifications.
- Introduce interactive sales and inventory analytics.
- Improve forecasting performance with larger datasets.
- Add more advanced supplier and purchasing analytics.

## Project Goal

The goal of StockWise is to make grocery inventory management more efficient by combining traditional stock management with data-driven demand forecasting.

**StockWise – Smarter Inventory. Better Decisions.**
