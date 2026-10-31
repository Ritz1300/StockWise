const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Batch = require("../models/Batch");
const PurchaseOrder = require("../models/PurchaseOrder");
const { getProductStock } = require("../services/inventoryService");
const { successResponse } = require("../utils/helpers");
const mongoose = require("mongoose");

exports.getDashboardStats = async (req, res, next) => {
  try {
    const storeId = req.user.store._id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const in7Days = new Date(today); in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date(today); in30Days.setDate(in30Days.getDate() + 30);
    const last30Days = new Date(today); last30Days.setDate(last30Days.getDate() - 30);

    const [
      totalProducts,
      todaySalesResult,
      pendingPOs,
      activeBatches,
      nearExpiryBatches,
    ] = await Promise.all([
      Product.countDocuments({ store: storeId, isActive: true }),
      Sale.aggregate([
        { $match: { store: new mongoose.Types.ObjectId(storeId), saleDate: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      PurchaseOrder.countDocuments({ store: storeId, status: { $in: ["draft", "sent", "partial"] } }),
      Batch.find({ store: storeId, status: "active", remainingQuantity: { $gt: 0 } }),
      Batch.countDocuments({ store: storeId, status: "active", expiryDate: { $gt: today, $lte: in30Days }, remainingQuantity: { $gt: 0 } }),
    ]);

    const totalInventoryValue = activeBatches.reduce((s, b) => s + b.remainingQuantity * b.unitCost, 0);

    // Low stock products
    const products = await Product.find({ store: storeId, isActive: true });
    let lowStockCount = 0;
    const lowStockProducts = [];
    for (const p of products) {
      const stock = await getProductStock(p._id, storeId);
      if (stock <= p.reorderLevel) {
        lowStockCount++;
        lowStockProducts.push({ _id: p._id, name: p.name, sku: p.sku, currentStock: stock, reorderLevel: p.reorderLevel });
      }
      if (lowStockProducts.length >= 5) break;
    }

    // Daily sales for last 14 days
    const dailySales = await Sale.aggregate([
      { $match: { store: new mongoose.Types.ObjectId(storeId), saleDate: { $gte: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } }, total: { $sum: "$total" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Top selling products last 30 days
    const topProducts = await Sale.aggregate([
      { $match: { store: new mongoose.Types.ObjectId(storeId), saleDate: { $gte: last30Days } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.product", name: { $first: "$items.productName" }, totalQty: { $sum: "$items.quantity" }, totalRevenue: { $sum: "$items.subtotal" } } },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
    ]);

    // Near expiry batches
    const nearExpiry = await Batch.find({
      store: storeId, status: "active", expiryDate: { $gt: today, $lte: in7Days }, remainingQuantity: { $gt: 0 },
    }).populate("product", "name sku").sort({ expiryDate: 1 }).limit(5);

    return successResponse(res, {
      summary: {
        totalProducts,
        todaySales: todaySalesResult[0]?.total || 0,
        todaySalesCount: todaySalesResult[0]?.count || 0,
        totalInventoryValue: parseFloat(totalInventoryValue.toFixed(2)),
        lowStockCount,
        nearExpiryCount: nearExpiryBatches,
        pendingPOs,
      },
      dailySales,
      topProducts,
      lowStockProducts,
      nearExpiry,
    });
  } catch (err) {
    next(err);
  }
};
