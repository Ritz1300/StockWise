const Batch = require("../models/Batch");
const StockMovement = require("../models/StockMovement");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Get total available stock for a product (sum of active, non-expired batches)
const getProductStock = async (productId, storeId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = await Batch.aggregate([
    {
      $match: {
        product: new mongoose.Types.ObjectId(productId),
        store: new mongoose.Types.ObjectId(storeId),
        status: "active",
        remainingQuantity: { $gt: 0 },
        $or: [{ expiryDate: null }, { expiryDate: { $gt: today } }],
      },
    },
    { $group: { _id: null, total: { $sum: "$remainingQuantity" } } },
  ]);
  return result.length ? result[0].total : 0;
};

// Deduct stock using FEFO (First Expiring, First Out)
const deductStockFEFO = async (productId, storeId, qtyNeeded, referenceId, referenceType, userId, session) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch active batches sorted by expiry (nulls last)
  const batches = await Batch.find({
    product: productId,
    store: storeId,
    status: "active",
    remainingQuantity: { $gt: 0 },
    $or: [{ expiryDate: null }, { expiryDate: { $gt: today } }],
  })
    .sort({ expiryDate: 1 })
    .session(session);

  let remaining = qtyNeeded;
  const movements = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const deduct = Math.min(batch.remainingQuantity, remaining);
    const before = batch.remainingQuantity;
    batch.remainingQuantity -= deduct;
    if (batch.remainingQuantity === 0) batch.status = "exhausted";
    await batch.save({ session });

    movements.push({
      store: storeId,
      product: productId,
      batch: batch._id,
      type: referenceType,
      quantity: -deduct,
      quantityBefore: before,
      quantityAfter: batch.remainingQuantity,
      reference: referenceType,
      referenceId,
      createdBy: userId,
    });
    remaining -= deduct;
  }

  if (remaining > 0) {
    throw new Error(`Insufficient stock. Short by ${remaining} units.`);
  }

  await StockMovement.insertMany(movements, { session });
  return movements;
};

// Record received goods as new batch
const receiveGoods = async ({ storeId, productId, batchNumber, receivedDate, expiryDate, quantity, unitCost, purchaseOrderId, userId }, session) => {
  const batch = await Batch.create(
    [
      {
        store: storeId,
        product: productId,
        batchNumber,
        receivedDate,
        expiryDate,
        initialQuantity: quantity,
        remainingQuantity: quantity,
        unitCost,
        purchaseOrder: purchaseOrderId,
        status: "active",
      },
    ],
    { session }
  );

  await StockMovement.create(
    [
      {
        store: storeId,
        product: productId,
        batch: batch[0]._id,
        type: "received",
        quantity,
        quantityBefore: 0,
        quantityAfter: quantity,
        reference: "purchase_order",
        referenceId: purchaseOrderId,
        createdBy: userId,
      },
    ],
    { session }
  );

  return batch[0];
};

// Adjust stock (positive or negative)
const adjustStock = async ({ storeId, productId, batchId, quantity, notes, userId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const batch = await Batch.findOne({ _id: batchId, store: storeId }).session(session);
    if (!batch) throw new Error("Batch not found");

    const before = batch.remainingQuantity;
    batch.remainingQuantity += quantity;
    if (batch.remainingQuantity < 0) throw new Error("Adjustment would result in negative stock");
    if (batch.remainingQuantity === 0) batch.status = "exhausted";
    else batch.status = "active";
    await batch.save({ session });

    await StockMovement.create(
      [
        {
          store: storeId,
          product: productId,
          batch: batchId,
          type: "adjustment",
          quantity,
          quantityBefore: before,
          quantityAfter: batch.remainingQuantity,
          notes,
          createdBy: userId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return batch;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// Record waste
const recordWaste = async ({ storeId, productId, batchId, quantity, notes, userId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const batch = await Batch.findOne({ _id: batchId, store: storeId }).session(session);
    if (!batch) throw new Error("Batch not found");
    if (batch.remainingQuantity < quantity) throw new Error("Cannot waste more than remaining quantity");

    const before = batch.remainingQuantity;
    batch.remainingQuantity -= quantity;
    if (batch.remainingQuantity === 0) batch.status = "wasted";
    await batch.save({ session });

    await StockMovement.create(
      [
        {
          store: storeId,
          product: productId,
          batch: batchId,
          type: "waste",
          quantity: -quantity,
          quantityBefore: before,
          quantityAfter: batch.remainingQuantity,
          notes,
          createdBy: userId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return batch;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = { getProductStock, deductStockFEFO, receiveGoods, adjustStock, recordWaste };
