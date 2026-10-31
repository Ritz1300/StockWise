require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error");

const app = express();

// Connect to MongoDB
connectDB();

// Security & middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: "Too many requests, please try again later." });
app.use("/api", limiter);

// Routes
app.use("/api/v1/auth", require("./routes/auth"));
app.use("/api/v1/dashboard", require("./routes/dashboard"));
app.use("/api/v1/products", require("./routes/products"));
app.use("/api/v1/inventory", require("./routes/inventory"));
app.use("/api/v1/sales", require("./routes/sales"));
app.use("/api/v1/suppliers", require("./routes/suppliers"));
app.use("/api/v1/purchase-orders", require("./routes/purchaseOrders"));
app.use("/api/v1/forecast", require("./routes/forecast"));
app.use("/api/v1/expiry", require("./routes/expiry"));
app.use("/api/v1/reports", require("./routes/reports"));

// Health check
app.get("/api/v1/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`StockWise API running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`));

module.exports = app;
