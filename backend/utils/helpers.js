const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });
};

const generatePoNumber = (storeId) => {
  const date = new Date();
  const prefix = "PO";
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `${prefix}-${dateStr}-${random}`;
};

const generateSaleNumber = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `INV-${dateStr}-${random}`;
};

const generateBatchNumber = (productSku) => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${productSku}-${dateStr}-${random}`;
};

const successResponse = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const paginatedResponse = (res, data, total, page, limit, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });
};

module.exports = {
  generateToken,
  generatePoNumber,
  generateSaleNumber,
  generateBatchNumber,
  successResponse,
  paginatedResponse,
};
