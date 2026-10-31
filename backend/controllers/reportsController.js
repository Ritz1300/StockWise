const Sale = require("../models/Sale");
const StockMovement = require("../models/StockMovement");
const Batch = require("../models/Batch");
const Product = require("../models/Product");
const { successResponse } = require("../utils/helpers");
const mongoose = require("mongoose");

exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;
    const storeId = req.user.store._id;
    const match = { store: new mongoose.Types.ObjectId(storeId) };
    if (startDate || endDate) {
      match.saleDate = {};
      if (startDate) match.saleDate.$gte = new Date(startDate);
      if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); match.saleDate.$lte = e; }
    }

    const format = groupBy === "month" ? "%Y-%m" : groupBy === "week" ? "%Y-%U" : "%Y-%m-%d";
    const salesData = await Sale.aggregate([
      { $match: match },
      { $group: {
        _id: { $dateToString: { format, date: "$saleDate" } },
        revenue: { $sum: "$total" }, count: { $sum: 1 }, discount: { $sum: "$discount" },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Top products
    const topProducts = await Sale.aggregate([
      { $match: match },
      { $unwind: "$items" },
      { $group: {
        _id: "$items.product", name: { $first: "$items.productName" },
        totalQty: { $sum: "$items.quantity" }, totalRevenue: { $sum: "$items.subtotal" },
        totalCost: { $sum: { $multiply: ["$items.quantity", "$items.costPrice"] } },
      }},
      { $addFields: { profit: { $subtract: ["$totalRevenue", "$totalCost"] } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    return successResponse(res, { salesData, topProducts });
  } catch (err) { next(err); }
};

exports.getInventoryReport = async (req, res, next) => {
  try {
    const storeId = req.user.store._id;
    const products = await Product.find({ store: storeId, isActive: true });
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const report = await Promise.all(products.map(async (p) => {
      const batches = await Batch.find({ product: p._id, store: storeId, status: "active", remainingQuantity: { $gt: 0 } });
      const totalStock = batches.reduce((s, b) => s + b.remainingQuantity, 0);
      const totalValue = batches.reduce((s, b) => s + b.remainingQuantity * b.unitCost, 0);
      return { product: p.name, sku: p.sku, category: p.category, currentStock: totalStock, value: parseFloat(totalValue.toFixed(2)), reorderLevel: p.reorderLevel };
    }));

    const totalValue = report.reduce((s, r) => s + r.value, 0);
    return successResponse(res, { products: report, totalValue: parseFloat(totalValue.toFixed(2)) });
  } catch (err) { next(err); }
};

exports.getWasteReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const storeId = req.user.store._id;
    const match = { store: new mongoose.Types.ObjectId(storeId), type: "waste" };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); match.createdAt.$lte = e; }
    }
    const movements = await StockMovement.find(match)
      .populate("product", "name sku costPrice")
      .populate("batch", "batchNumber expiryDate unitCost")
      .sort({ createdAt: -1 });
    const totalValue = movements.reduce((s, m) => s + Math.abs(m.quantity) * (m.batch?.unitCost || 0), 0);
    return successResponse(res, { movements, totalValue: parseFloat(totalValue.toFixed(2)) });
  } catch (err) { next(err); }
};
