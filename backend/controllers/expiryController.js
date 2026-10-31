const Batch = require("../models/Batch");
const Product = require("../models/Product");
const { runForecast } = require("../services/forecastService");
const { successResponse } = require("../utils/helpers");
const mongoose = require("mongoose");

exports.getExpiryAlerts = async (req, res, next) => {
  try {
    const storeId = req.user.store._id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today); in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date(today); in30Days.setDate(in30Days.getDate() + 30);

    const [expired, expiring7, expiring30] = await Promise.all([
      Batch.find({ store: storeId, status: "active", expiryDate: { $lte: today }, remainingQuantity: { $gt: 0 } })
        .populate("product", "name sku sellingPrice costPrice").sort({ expiryDate: 1 }),
      Batch.find({ store: storeId, status: "active", expiryDate: { $gt: today, $lte: in7Days }, remainingQuantity: { $gt: 0 } })
        .populate("product", "name sku sellingPrice costPrice").sort({ expiryDate: 1 }),
      Batch.find({ store: storeId, status: "active", expiryDate: { $gt: in7Days, $lte: in30Days }, remainingQuantity: { $gt: 0 } })
        .populate("product", "name sku sellingPrice costPrice").sort({ expiryDate: 1 }),
    ]);

    const enrichBatch = async (batch) => {
      const daysLeft = batch.expiryDate ? Math.ceil((batch.expiryDate - today) / (1000 * 60 * 60 * 24)) : null;
      let forecastedSales = 0;
      let suggestion = "Monitor";
      try {
        if (daysLeft !== null && daysLeft > 0) {
          const forecast = await runForecast(batch.product._id, storeId, Math.min(daysLeft, 28));
          forecastedSales = forecast.totalForecast;
        }
      } catch {}

      const riskValue = batch.remainingQuantity * (batch.product?.costPrice || 0);
      if (daysLeft !== null && daysLeft <= 0) suggestion = "Record Wastage";
      else if (forecastedSales < batch.remainingQuantity * 0.5) suggestion = "Consider Discount";
      else if (forecastedSales < batch.remainingQuantity) suggestion = "Prioritize Selling";
      else suggestion = "Normal Sales";

      return { ...batch.toObject(), daysLeft, forecastedSales: Math.round(forecastedSales), riskValue: parseFloat(riskValue.toFixed(2)), suggestion };
    };

    const [expiredEnriched, exp7Enriched, exp30Enriched] = await Promise.all([
      Promise.all(expired.map(enrichBatch)),
      Promise.all(expiring7.map(enrichBatch)),
      Promise.all(expiring30.map(enrichBatch)),
    ]);

    const totalRiskValue = [...expiredEnriched, ...exp7Enriched, ...exp30Enriched].reduce((s, b) => s + b.riskValue, 0);

    return successResponse(res, {
      expired: expiredEnriched,
      expiring7Days: exp7Enriched,
      expiring30Days: exp30Enriched,
      summary: {
        expiredCount: expired.length,
        expiring7Count: expiring7.length,
        expiring30Count: expiring30.length,
        totalRiskValue: parseFloat(totalRiskValue.toFixed(2)),
      },
    });
  } catch (err) {
    next(err);
  }
};
