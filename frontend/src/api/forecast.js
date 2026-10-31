import api from "./axios";
export const getForecast = (params) => api.get("/forecast", { params });
export const getReorderRecommendations = () => api.get("/forecast/reorder");
export const getAllProductsForecasts = (params) => api.get("/forecast/products", { params });
