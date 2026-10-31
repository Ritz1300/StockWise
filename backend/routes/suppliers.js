const express = require("express");
const router = express.Router();
const { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require("../controllers/supplierController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.get("/", getSuppliers);
router.get("/:id", getSupplier);
router.post("/", authorize("owner", "manager"), createSupplier);
router.put("/:id", authorize("owner", "manager"), updateSupplier);
router.delete("/:id", authorize("owner"), deleteSupplier);

module.exports = router;
