const Product = require("../models/Product");
const PurchaseOrder = require("../models/PurchaseOrder");
const { getProductStock } = require("./inventoryService");
const { runForecast } = require("./forecastService");
const mongoose = require("mongoose");

const getReorderRecommendations = async (storeId) => {
  const products = await Product.find({ store: storeId, isActive: true }).populate("supplier");
  const recommendations = [];

  for (const product of products) {
    try {
      const currentStock = await getProductStock(product._id, storeId);
      const leadTimeDays = product.supplier?.leadTimeDays || 3;
      const targetCoverage = product.targetCoverageDays || 14;
      const safetyStock = product.safetyStock || 0;

      // Get pending PO quantities
      const pendingPOs = await PurchaseOrder.aggregate([
        {
          $match: {
            store: new mongoose.Types.ObjectId(storeId),
            status: { $in: ["draft", "sent", "partial"] },
          },
        },
        { $unwind: "$items" },
        {
          $match: { "items.product": product._id },
        },
        {
          $group: {
            _id: null,
            pendingQty: { $sum: { $subtract: ["$items.orderedQty", "$items.receivedQty"] } },
          },
        },
      ]);
      const pendingQty = pendingPOs.length ? pendingPOs[0].pendingQty : 0;

      const inventoryPosition = currentStock + pendingQty;

      // Forecast demand
      const forecastData = await runForecast(product._id, storeId, 28);
      const dailyDemand = forecastData.totalForecast / 28;
      const demandDuringLeadTime = dailyDemand * leadTimeDays;
      const reorderPoint = demandDuringLeadTime + safetyStock;
      const targetLevel = dailyDemand * targetCoverage + safetyStock;
      const suggestedOrderQty = Math.max(0, Math.ceil(targetLevel - inventoryPosition));

      let stockoutRisk = "low";
      const daysOfStock = dailyDemand > 0 ? inventoryPosition / dailyDemand : 999;
      if (daysOfStock < leadTimeDays) stockoutRisk = "high";
      else if (daysOfStock < leadTimeDays + 3) stockoutRisk = "medium";

      const needsReorder = inventoryPosition <= reorderPoint || stockoutRisk === "high";

      let action = "Monitor";
      let reason = `Current stock covers approximately ${Math.round(daysOfStock)} days of demand.`;
      if (stockoutRisk === "high") {
        action = "Reorder Urgently";
        reason = `Stock will run out in ${Math.round(daysOfStock)} days, which is less than the lead time of ${leadTimeDays} days.`;
      } else if (needsReorder) {
        action = "Reorder Soon";
        reason = `Inventory position (${inventoryPosition} units) is at or below the reorder point (${Math.round(reorderPoint)} units).`;
      }

      recommendations.push({
        product: { _id: product._id, name: product.name, sku: product.sku, supplier: product.supplier },
        currentStock,
        pendingQty,
        inventoryPosition,
        reorderPoint: Math.round(reorderPoint),
        targetLevel: Math.round(targetLevel),
        dailyDemand: parseFloat(dailyDemand.toFixed(2)),
        forecastDemand28Days: forecastData.totalForecast,
        suggestedOrderQty,
        stockoutRisk,
        daysOfStock: parseFloat(daysOfStock.toFixed(1)),
        needsReorder,
        action,
        reason,
        forecastConfidence: forecastData.confidence,
      });
    } catch (err) {
      console.error(`Error computing reorder for product ${product._id}:`, err.message);
    }
  }

  // Sort: urgent first
  recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.stockoutRisk] - order[b.stockoutRisk];
  });

  return recommendations;
};

module.exports = { getReorderRecommendations };
