const Supplier = require("../models/Supplier");
const { successResponse, paginatedResponse } = require("../utils/helpers");

exports.getSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { store: req.user.store._id };
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { contactPerson: { $regex: search, $options: "i" } }];
    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(parseInt(limit));
    return paginatedResponse(res, suppliers, total, page, limit);
  } catch (err) { next(err); }
};

exports.getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, store: req.user.store._id });
    if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
    return successResponse(res, supplier);
  } catch (err) { next(err); }
};

exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address, leadTimeDays, notes } = req.body;
    const supplier = await Supplier.create({ store: req.user.store._id, name, contactPerson, phone, email, address, leadTimeDays, notes });
    return successResponse(res, supplier, "Supplier created", 201);
  } catch (err) { next(err); }
};

exports.updateSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, phone, email, address, leadTimeDays, notes, isActive } = req.body;
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store._id },
      { name, contactPerson, phone, email, address, leadTimeDays, notes, isActive },
      { new: true, runValidators: true }
    );
    if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
    return successResponse(res, supplier, "Supplier updated");
  } catch (err) { next(err); }
};

exports.deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, store: req.user.store._id },
      { isActive: false }, { new: true }
    );
    if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
    return successResponse(res, supplier, "Supplier deactivated");
  } catch (err) { next(err); }
};
