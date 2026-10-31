const PurchaseOrder = require("../models/PurchaseOrder");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const { receiveGoods } = require("../services/inventoryService");
const { generatePoNumber, generateBatchNumber, successResponse, paginatedResponse } = require("../utils/helpers");
const mongoose = require("mongoose");

exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { store: req.user.store._id };
    if (status) query.status = status;
    const total = await PurchaseOrder.countDocuments(query);
    const orders = await PurchaseOrder.find(query)
      .populate("supplier", "name phone")
      .populate("items.product", "name sku")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    return paginatedResponse(res, orders, total, page, limit);
  } catch (err) { next(err); }
};

exports.getPurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findOne({ _id: req.params.id, store: req.user.store._id })
      .populate("supplier")
      .populate("items.product", "name sku unit");
    if (!order) return res.status(404).json({ success: false, message: "Purchase order not found" });
    return successResponse(res, order);
  } catch (err) { next(err); }
};

exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, items, expectedDate, notes } = req.body;
    const storeId = req.user.store._id;
    const supplier = await Supplier.findOne({ _id: supplierId, store: storeId });
    if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });

    const poItems = [];
    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, store: storeId });
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      const subtotal = item.quantity * item.unitCost;
      totalAmount += subtotal;
      poItems.push({ product: product._id, productName: product.name, orderedQty: item.quantity, receivedQty: 0, unitCost: item.unitCost, subtotal });
    }

    const poNumber = generatePoNumber(storeId);
    const order = await PurchaseOrder.create({
      store: storeId, poNumber, supplier: supplierId, items: poItems, totalAmount, expectedDate, notes,
      status: "draft", createdBy: req.user._id,
    });
    return successResponse(res, order, "Purchase order created", 201);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store._id },
      { status }, { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: "Purchase order not found" });
    return successResponse(res, order, "Order status updated");
  } catch (err) { next(err); }
};

// Receive goods against a PO
exports.receiveGoods = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { receipts } = req.body; // [{ itemIndex, receivedQty, expiryDate, batchNumber }]
    const storeId = req.user.store._id;
    const order = await PurchaseOrder.findOne({ _id: req.params.id, store: storeId }).session(session);
    if (!order) { await session.abortTransaction(); return res.status(404).json({ success: false, message: "Purchase order not found" }); }
    if (order.status === "received" || order.status === "cancelled") {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Cannot receive goods for this order" });
    }

    for (const receipt of receipts) {
      const item = order.items[receipt.itemIndex];
      if (!item) continue;
      const remaining = item.orderedQty - item.receivedQty;
      const receiveQty = Math.min(receipt.receivedQty, remaining);
      if (receiveQty <= 0) continue;

      const product = await Product.findById(item.product).session(session);
      const batchNum = receipt.batchNumber || generateBatchNumber(product?.sku || "PROD");

      await receiveGoods({
        storeId, productId: item.product, batchNumber: batchNum,
        receivedDate: new Date(),
        expiryDate: receipt.expiryDate ? new Date(receipt.expiryDate) : null,
        quantity: receiveQty,
        unitCost: item.unitCost,
        purchaseOrderId: order._id,
        userId: req.user._id,
      }, session);

      item.receivedQty += receiveQty;
    }

    // Update PO status
    const allReceived = order.items.every((i) => i.receivedQty >= i.orderedQty);
    const anyReceived = order.items.some((i) => i.receivedQty > 0);
    order.status = allReceived ? "received" : anyReceived ? "partial" : order.status;
    if (allReceived) order.receivedDate = new Date();
    await order.save({ session });

    await session.commitTransaction();
    const populated = await PurchaseOrder.findById(order._id).populate("supplier").populate("items.product", "name sku");
    return successResponse(res, populated, "Goods received successfully");
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
