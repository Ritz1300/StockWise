const express = require("express");
const router = express.Router();
const { getForecast, getReorderRecommendations, getAllProductsForecasts } = require("../controllers/forecastController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.get("/", getForecast);
router.get("/reorder", getReorderRecommendations);
router.get("/products", getAllProductsForecasts);

module.exports = router;
