const express = require("express");
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deactivateProduct, getCategories } = require("../controllers/productController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.get("/categories", getCategories);
router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", authorize("owner", "manager"), createProduct);
router.put("/:id", authorize("owner", "manager"), updateProduct);
router.delete("/:id", authorize("owner", "manager"), deactivateProduct);

module.exports = router;
