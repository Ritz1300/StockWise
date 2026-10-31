import api from "./axios";
export const getInventory = (params) => api.get("/inventory", { params });
export const getInventorySummary = () => api.get("/inventory/summary");
export const getProductBatches = (productId) => api.get(`/inventory/batches/${productId}`);
export const getStockMovements = (productId, params) => api.get(`/inventory/movements/${productId || ""}`, { params });
export const adjustStock = (data) => api.post("/inventory/adjust", data);
export const recordWaste = (data) => api.post("/inventory/waste", data);
