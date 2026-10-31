import api from "./axios";
export const getSalesReport = (params) => api.get("/reports/sales", { params });
export const getInventoryReport = () => api.get("/reports/inventory");
export const getWasteReport = (params) => api.get("/reports/waste", { params });
