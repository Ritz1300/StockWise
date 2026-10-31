import api from "./axios";
export const getExpiryAlerts = () => api.get("/expiry");
