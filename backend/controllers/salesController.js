const Sale = require("../models/Sale");
const Product = require("../models/Product");
const { deductStockFEFO, getProductStock } = require("../services/inventoryService");
const { generateSaleNumber, successResponse, paginatedResponse } = require("../utils/helpers");
const mongoose = require("mongoose");

exports.createSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items, paymentMethod, notes, discount = 0 } = req.body;
    if (!items || items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Sale must have at least one item" });
    }

    const storeId = req.user.store._id;
    const saleItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, store: storeId, isActive: true }).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      }
      const available = await getProductStock(product._id, storeId);
      if (available < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${available}, Requested: ${item.quantity}`,
        });
      }
      const itemSubtotal = product.sellingPrice * item.quantity;
      subtotal += itemSubtotal;
      saleItems.push({
        product: product._id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        subtotal: itemSubtotal,
      });
    }

    const total = subtotal - discount;
    const saleNumber = generateSaleNumber();
    const [sale] = await Sale.create(
      [{ store: storeId, saleNumber, items: saleItems, subtotal, discount, total, paymentMethod: paymentMethod || "cash", notes, createdBy: req.user._id }],
      { session }
    );

    // Deduct stock using FEFO
    for (const item of saleItems) {
      await deductStockFEFO(item.product, storeId, item.quantity, sale._id, "sale", req.user._id, session);
    }

    await session.commitTransaction();
    const populatedSale = await Sale.findById(sale._id).populate("items.product", "name sku");
    return successResponse(res, populatedSale, "Sale recorded successfully", 201);
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

exports.getSales = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const query = { store: req.user.store._id };
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) { const end = new Date(endDate); end.setHours(23, 59, 59, 999); query.saleDate.$lte = end; }
    }
    const total = await Sale.countDocuments(query);
    const sales = await Sale.find(query)
      .populate("createdBy", "name")
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    return paginatedResponse(res, sales, total, page, limit);
  } catch (err) {
    next(err);
  }
};

exports.getSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, store: req.user.store._id })
      .populate("createdBy", "name")
      .populate("items.product", "name sku");
    if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });
    return successResponse(res, sale);
  } catch (err) {
    next(err);
  }
};

exports.getSalesSummary = async (req, res, next) => {
  try {
    const storeId = req.user.store._id;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - 7);

    const [todaySales, weekSales, monthlySales] = await Promise.all([
      Sale.aggregate([
        { $match: { store: new mongoose.Types.ObjectId(storeId), saleDate: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
      Sale.aggregate([
        { $match: { store: new mongoose.Types.ObjectId(storeId), saleDate: { $gte: weekStart } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } }, total: { $sum: "$total" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Sale.aggregate([
        { $match: { store: new mongoose.Types.ObjectId(storeId), saleDate: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),
    ]);

    return successResponse(res, {
      today: { total: todaySales[0]?.total || 0, count: todaySales[0]?.count || 0 },
      week: weekSales,
      month: { total: monthlySales[0]?.total || 0, count: monthlySales[0]?.count || 0 },
    });
  } catch (err) {
    next(err);
  }
};
