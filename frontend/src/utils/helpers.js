export const formatCurrency = (amount, currency = "INR") => {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const daysFromNow = (date) => {
  if (!date) return null;
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getStockStatusColor = (current, reorderLevel, safetyStock) => {
  if (current <= safetyStock) return "text-red-600 bg-red-50";
  if (current <= reorderLevel) return "text-yellow-600 bg-yellow-50";
  return "text-green-600 bg-green-50";
};

export const getStockStatusLabel = (current, reorderLevel, safetyStock) => {
  if (current <= safetyStock) return "Critical";
  if (current <= reorderLevel) return "Low";
  return "Normal";
};

export const getRiskColor = (risk) => {
  if (risk === "high") return "text-red-600 bg-red-50";
  if (risk === "medium") return "text-yellow-600 bg-yellow-50";
  return "text-green-600 bg-green-50";
};

export const getExpiryColor = (daysLeft) => {
  if (daysLeft === null) return "text-gray-500";
  if (daysLeft <= 0) return "text-red-600";
  if (daysLeft <= 7) return "text-orange-600";
  if (daysLeft <= 30) return "text-yellow-600";
  return "text-green-600";
};

export const cn = (...classes) => classes.filter(Boolean).join(" ");
