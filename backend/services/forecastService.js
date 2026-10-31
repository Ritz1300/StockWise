const Sale = require("../models/Sale");
const mongoose = require("mongoose");

// Aggregate daily sales for a product over a date range
const getDailySales = async (productId, storeId, days = 90) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await Sale.aggregate([
    {
      $match: {
        store: new mongoose.Types.ObjectId(storeId),
        saleDate: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: "$items" },
    {
      $match: { "items.product": new mongoose.Types.ObjectId(productId) },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
        quantity: { $sum: "$items.quantity" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in missing days with 0
  const filled = [];
  const dateMap = {};
  result.forEach((r) => (dateMap[r._id] = r.quantity));

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    filled.push({ date: key, quantity: dateMap[key] || 0 });
  }

  return filled;
};

// Naive: last known day's value
const naiveForecast = (history, period) => {
  const last = history[history.length - 1]?.quantity || 0;
  const daily = last;
  const predictions = [];
  const startDate = new Date();
  for (let i = 1; i <= period; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    predictions.push({ date: d.toISOString().split("T")[0], quantity: Math.max(0, Math.round(daily)) });
  }
  return { predictions, total: daily * period };
};

// Seasonal naive: same day of week from prior weeks
const seasonalNaiveForecast = (history, period) => {
  const predictions = [];
  const startDate = new Date();
  for (let i = 1; i <= period; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    // Find matching days from history
    const matching = history.filter((h) => new Date(h.date).getDay() === dayOfWeek);
    const avg = matching.length > 0 ? matching.reduce((s, h) => s + h.quantity, 0) / matching.length : 0;
    predictions.push({ date: d.toISOString().split("T")[0], quantity: Math.max(0, Math.round(avg)) });
  }
  const total = predictions.reduce((s, p) => s + p.quantity, 0);
  return { predictions, total };
};

// Moving average (last N days)
const movingAverageForecast = (history, period, windowSize = 7) => {
  const recent = history.slice(-windowSize);
  const avg = recent.length > 0 ? recent.reduce((s, h) => s + h.quantity, 0) / recent.length : 0;
  const predictions = [];
  const startDate = new Date();
  for (let i = 1; i <= period; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    predictions.push({ date: d.toISOString().split("T")[0], quantity: Math.max(0, Math.round(avg)) });
  }
  return { predictions, total: Math.round(avg * period) };
};

// Weighted moving average (more recent = higher weight)
const weightedMovingAverageForecast = (history, period, windowSize = 7) => {
  const recent = history.slice(-windowSize);
  const n = recent.length;
  if (n === 0) return movingAverageForecast(history, period, windowSize);

  const totalWeight = (n * (n + 1)) / 2;
  const weighted = recent.reduce((sum, h, idx) => sum + h.quantity * (idx + 1), 0) / totalWeight;
  const predictions = [];
  const startDate = new Date();
  for (let i = 1; i <= period; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    predictions.push({ date: d.toISOString().split("T")[0], quantity: Math.max(0, Math.round(weighted)) });
  }
  return { predictions, total: Math.round(weighted * period) };
};

// Simple regression-based forecast using trend + day-of-week seasonality
const regressionForecast = (history, period) => {
  if (history.length < 7) return movingAverageForecast(history, period);

  const n = history.length;
  // Linear trend
  const xMean = (n - 1) / 2;
  const yMean = history.reduce((s, h) => s + h.quantity, 0) / n;
  let numerator = 0, denominator = 0;
  history.forEach((h, i) => {
    numerator += (i - xMean) * (h.quantity - yMean);
    denominator += (i - xMean) ** 2;
  });
  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Day-of-week factors
  const dowTotals = new Array(7).fill(0);
  const dowCounts = new Array(7).fill(0);
  history.forEach((h) => {
    const dow = new Date(h.date).getDay();
    dowTotals[dow] += h.quantity;
    dowCounts[dow]++;
  });
  const dowAvg = dowTotals.map((t, i) => (dowCounts[i] > 0 ? t / dowCounts[i] : yMean));
  const overallAvg = dowAvg.reduce((s, v) => s + v, 0) / 7 || 1;
  const dowFactors = dowAvg.map((v) => (overallAvg > 0 ? v / overallAvg : 1));

  const predictions = [];
  const startDate = new Date();
  for (let i = 1; i <= period; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const xVal = n + i - 1;
    const trendVal = intercept + slope * xVal;
    const dow = d.getDay();
    const adjusted = trendVal * dowFactors[dow];
    predictions.push({ date: d.toISOString().split("T")[0], quantity: Math.max(0, Math.round(adjusted)) });
  }
  const total = predictions.reduce((s, p) => s + p.quantity, 0);
  return { predictions, total };
};

// Calculate MAE and WAPE using walk-forward validation
const evaluateModel = (history, modelFn, validationDays = 14) => {
  if (history.length < validationDays + 7) return { mae: null, wape: null, bias: null };

  const trainEnd = history.length - validationDays;
  const train = history.slice(0, trainEnd);
  const actual = history.slice(trainEnd);

  const { predictions } = modelFn(train, validationDays);

  let totalError = 0, totalActual = 0, totalBias = 0;
  for (let i = 0; i < actual.length && i < predictions.length; i++) {
    const err = predictions[i].quantity - actual[i].quantity;
    totalError += Math.abs(err);
    totalActual += actual[i].quantity;
    totalBias += err;
  }

  const mae = totalError / actual.length;
  const wape = totalActual > 0 ? (totalError / totalActual) * 100 : 100;
  const bias = totalBias / actual.length;

  return { mae: parseFloat(mae.toFixed(2)), wape: parseFloat(wape.toFixed(2)), bias: parseFloat(bias.toFixed(2)) };
};

// Select best model
const selectBestModel = (history) => {
  const models = [
    { name: "naive", fn: (h, p) => naiveForecast(h, p) },
    { name: "seasonal_naive", fn: (h, p) => seasonalNaiveForecast(h, p) },
    { name: "moving_average", fn: (h, p) => movingAverageForecast(h, p) },
    { name: "weighted_moving_average", fn: (h, p) => weightedMovingAverageForecast(h, p) },
    { name: "regression", fn: (h, p) => regressionForecast(h, p) },
  ];

  let best = null;
  let bestWape = Infinity;

  const results = models.map((m) => {
    const metrics = evaluateModel(history, m.fn);
    if (metrics.wape !== null && metrics.wape < bestWape) {
      bestWape = metrics.wape;
      best = m;
    }
    return { model: m.name, metrics };
  });

  if (!best) best = models[2]; // fallback to moving average
  return { bestModel: best, allResults: results };
};

// Main forecast function
const runForecast = async (productId, storeId, period = 7) => {
  const historicalDays = Math.max(90, period * 6);
  const history = await getDailySales(productId, storeId, historicalDays);
  const nonZeroDays = history.filter((h) => h.quantity > 0).length;

  let confidence = "high";
  let explanation = "";

  if (nonZeroDays < 7) {
    confidence = "low";
    explanation = "Insufficient historical data. Using a simple baseline forecast. Accuracy will improve as more sales are recorded.";
    const { predictions, total } = movingAverageForecast(history, period);
    return {
      model: "moving_average",
      predictions,
      totalForecast: total,
      metrics: { mae: null, wape: null, bias: null },
      confidence,
      explanation,
      history,
    };
  }

  if (nonZeroDays < 21) {
    confidence = "medium";
  }

  const { bestModel, allResults } = selectBestModel(history);
  const { predictions, total } = bestModel.fn(history, period);
  const metrics = allResults.find((r) => r.model === bestModel.name)?.metrics || {};

  if (!explanation) {
    const avgDaily = total / period;
    explanation = `Based on ${nonZeroDays} days of sales history, this product is expected to sell approximately ${Math.round(total)} units over the next ${period} days (avg ${avgDaily.toFixed(1)}/day). Model: ${bestModel.name.replace(/_/g, " ")}.`;
  }

  return {
    model: bestModel.name,
    predictions,
    totalForecast: total,
    metrics,
    confidence,
    explanation,
    history: history.slice(-30), // return last 30 days for chart
    allModels: allResults,
  };
};

module.exports = {
  runForecast,
  getDailySales,
  naiveForecast,
  seasonalNaiveForecast,
  movingAverageForecast,
  weightedMovingAverageForecast,
  regressionForecast,
};
