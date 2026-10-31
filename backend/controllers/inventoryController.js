const Batch = require("../models/Batch");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const { getProductStock, adjustStock, recordWaste } = require("../services/inventoryService");
const { successResponse, paginatedResponse } = require("../utils/helpers");
const mongoose = require("mongoose");

// Get all products with current stock levels
exports.getInventory = async (req, res, next) => {
  try {
    const storeId = req.user.store._id;
    const { search, category, lowStock, page = 1, limit = 20 } = req.query;
    const query = { store: storeId, isActive: true };
    if (category) query.category = category;
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }];

    const products = await Product.find(query).populate("supplier", "name").sort({ name: 1 });
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const inventoryData = await Promise.all(
      products.map(async (p) => {
        const stock = await getProductStock(p._id, storeId);
        const batches = await Batch.find({
          product: p._id, store: storeId, status: "active", remainingQuantity: { $gt: 0 },
          $or: [{ expiryDate: null }, { expiryDate: { $gt: today } }],
        }).sort({ expiryDate: 1 });
        const inventoryValue = batches.reduce((s, b) => s + b.remainingQuantity * b.unitCost, 0);
        return {
          product: p,
          currentStock: stock,
          reorderLevel: p.reorderLevel,
          safetyStock: p.safetyStock,
          isLowStock: stock <= p.reorderLevel,
          isCritical: stock <= p.safetyStock,
          inventoryValue: parseFloat(inventoryValue.toFixed(2)),
          activeBatches: batches.length,
        };
      })
    );

    const filtered = lowStock === "true" ? inventoryData.filter((d) => d.isLowStock) : inventoryData;
    const paginated = filtered.slice((page - 1) * limit, page * limit);
    return paginatedResponse(res, paginated, filtered.length, page, limit);
  } catch (err) {
    next(err);
  }
};

// Get batches for a product
exports.getProductBatches = async (req, res, next) => {
  try {
    const batches = await Batch.find({ product: req.params.productId, store: req.user.store._id }).sort({ expiryDate: 1, createdAt: -1 });
    return successResponse(res, batches);
  } catch (err) {
    next(err);
  }
};

// Get stock movements for a product
exports.getStockMovements = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const query = { store: req.user.store._id };
    if (productId) query.product = productId;
    const total = await StockMovement.countDocuments(query);
    const movements = await StockMovement.find(query)
      .populate("product", "name sku")
      .populate("batch", "batchNumber")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    return paginatedResponse(res, movements, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// Adjust stock (adjustment)
exports.adjustStock = async (req, res, next) => {
  try {
    const { batchId, quantity, notes } = req.body;
    const batch = await Batch.findOne({ _id: batchId, store: req.user.store._id });
    if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });
    const result = await adjustStock({
      storeId: req.user.store._id,
      productId: batch.product,
      batchId,
      quantity: parseFloat(quantity),
      notes,
      userId: req.user._id,
    });
    return successResponse(res, result, "Stock adjusted successfully");
  } catch (err) {
    next(err);
  }
};

// Record waste
exports.recordWaste = async (req, res, next) => {
  try {
    const { batchId, quantity, notes } = req.body;
    const batch = await Batch.findOne({ _id: batchId, store: req.user.store._id });
    if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });
    const result = await recordWaste({
      storeId: req.user.store._id,
      productId: batch.product,
      batchId,
      quantity: parseFloat(quantity),
      notes,
      userId: req.user._id,
    });
    return successResponse(res, result, "Waste recorded successfully");
  } catch (err) {
    next(err);
  }
};

// Get inventory summary stats
exports.getInventorySummary = async (req, res, next) => {
  try {
    const storeId = req.user.store._id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today); in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date(today); in30Days.setDate(in30Days.getDate() + 30);

    const [totalProducts, expiringSoon, expiredBatches, activeBatches] = await Promise.all([
      Product.countDocuments({ store: storeId, isActive: true }),
      Batch.countDocuments({ store: storeId, status: "active", expiryDate: { $gt: today, $lte: in30Days } }),
      Batch.countDocuments({ store: storeId, status: "active", expiryDate: { $lte: today } }),
      Batch.find({ store: storeId, status: "active", remainingQuantity: { $gt: 0 } }),
    ]);

    const totalInventoryValue = activeBatches.reduce((s, b) => s + b.remainingQuantity * b.unitCost, 0);

    return successResponse(res, { totalProducts, expiringSoon, expiredBatches, totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)) });
  } catch (err) {
    next(err);
  }
};
