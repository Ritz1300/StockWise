const Product = require("../models/Product");
const ForecastResult = require("../models/ForecastResult");
const { runForecast } = require("../services/forecastService");
const { getReorderRecommendations } = require("../services/reorderService");
const { successResponse, paginatedResponse } = require("../utils/helpers");

exports.getForecast = async (req, res, next) => {
  try {
    const { productId, period = 7 } = req.query;
    if (!productId) return res.status(400).json({ success: false, message: "productId is required" });
    const storeId = req.user.store._id;
    const product = await Product.findOne({ _id: productId, store: storeId });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const result = await runForecast(productId, storeId, parseInt(period));

    // Save forecast result
    await ForecastResult.create({
      store: storeId,
      product: productId,
      period: parseInt(period),
      model: result.model,
      predictions: result.predictions,
      totalForecast: result.totalForecast,
      metrics: result.metrics,
      confidence: result.confidence,
      explanation: result.explanation,
    });

    return successResponse(res, { product: { _id: product._id, name: product.name, sku: product.sku }, ...result });
  } catch (err) {
    next(err);
  }
};

exports.getReorderRecommendations = async (req, res, next) => {
  try {
    const recommendations = await getReorderRecommendations(req.user.store._id);
    const urgent = recommendations.filter((r) => r.stockoutRisk === "high");
    const needsAction = recommendations.filter((r) => r.needsReorder);
    return successResponse(res, { recommendations, summary: { total: recommendations.length, urgent: urgent.length, needsAction: needsAction.length } });
  } catch (err) {
    next(err);
  }
};

exports.getAllProductsForecasts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const storeId = req.user.store._id;
    const products = await Product.find({ store: storeId, isActive: true }).sort({ name: 1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Product.countDocuments({ store: storeId, isActive: true });

    const forecasts = await Promise.all(
      products.map(async (p) => {
        try {
          const latest = await ForecastResult.findOne({ store: storeId, product: p._id }).sort({ generatedAt: -1 });
          return { product: { _id: p._id, name: p.name, sku: p.sku }, latestForecast: latest };
        } catch {
          return { product: { _id: p._id, name: p.name, sku: p.sku }, latestForecast: null };
        }
      })
    );

    return paginatedResponse(res, forecasts, total, page, limit);
  } catch (err) {
    next(err);
  }
};
