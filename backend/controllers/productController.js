const Product = require("../models/Product");
const { successResponse, paginatedResponse } = require("../utils/helpers");

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20, active } = req.query;
    const query = { store: req.user.store._id };
    if (active !== undefined) query.isActive = active === "true";
    if (category) query.category = category;
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { sku: { $regex: search, $options: "i" } }];

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate("supplier", "name phone")
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, products, total, page, limit);
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, store: req.user.store._id }).populate("supplier");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return successResponse(res, product);
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, sku, barcode, category, unit, costPrice, sellingPrice, reorderLevel, safetyStock, targetCoverageDays, supplier, description } = req.body;
    const existing = await Product.findOne({ store: req.user.store._id, sku });
    if (existing) return res.status(400).json({ success: false, message: "SKU already exists" });
    const product = await Product.create({
      store: req.user.store._id,
      name, sku, barcode, category, unit, costPrice, sellingPrice, reorderLevel, safetyStock, targetCoverageDays, supplier, description,
    });
    return successResponse(res, product, "Product created", 201);
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { name, barcode, category, unit, costPrice, sellingPrice, reorderLevel, safetyStock, targetCoverageDays, supplier, description, isActive } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store._id },
      { name, barcode, category, unit, costPrice, sellingPrice, reorderLevel, safetyStock, targetCoverageDays, supplier, description, isActive },
      { new: true, runValidators: true }
    ).populate("supplier");
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return successResponse(res, product, "Product updated");
  } catch (err) {
    next(err);
  }
};

exports.deactivateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate({ _id: req.params.id, store: req.user.store._id }, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return successResponse(res, product, "Product deactivated");
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct("category", { store: req.user.store._id });
    return successResponse(res, categories);
  } catch (err) {
    next(err);
  }
};
