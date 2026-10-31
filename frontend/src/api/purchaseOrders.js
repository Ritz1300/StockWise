import api from "./axios";
export const getPurchaseOrders = (params) => api.get("/purchase-orders", { params });
export const getPurchaseOrder = (id) => api.get(`/purchase-orders/${id}`);
export const createPurchaseOrder = (data) => api.post("/purchase-orders", data);
export const updatePOStatus = (id, data) => api.put(`/purchase-orders/${id}/status`, data);
export const receiveGoods = (id, data) => api.post(`/purchase-orders/${id}/receive`, data);
