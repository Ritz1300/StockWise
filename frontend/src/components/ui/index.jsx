// Shared UI Components

// Button
export const Button = ({ children, variant = "primary", size = "md", className = "", disabled, loading, ...props }) => {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
    outline: "border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500",
  };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
};

// Badge
export const Badge = ({ children, color = "gray", className = "" }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]} ${className}`}>{children}</span>;
};

// Card
export const Card = ({ children, className = "" }) => (
  <div className={`bg-white border border-gray-200 rounded-xl ${className}`}>{children}</div>
);

export const CardHeader = ({ title, subtitle, actions, className = "" }) => (
  <div className={`flex items-start justify-between px-5 py-4 border-b border-gray-100 ${className}`}>
    <div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const CardBody = ({ children, className = "" }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

// Table
export const Table = ({ children, className = "" }) => (
  <div className="overflow-x-auto">
    <table className={`w-full text-sm ${className}`}>{children}</table>
  </div>
);

export const Th = ({ children, className = "" }) => (
  <th className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 ${className}`}>
    {children}
  </th>
);

export const Td = ({ children, className = "" }) => (
  <td className={`px-4 py-3 text-gray-800 border-t border-gray-100 ${className}`}>{children}</td>
);

// Input
export const Input = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <input
      className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent ${
        error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"
      } ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// Select
export const Select = ({ label, error, className = "", children, ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <select
      className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent ${
        error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// Textarea
export const Textarea = ({ label, error, className = "", ...props }) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <textarea
      className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${
        error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"
      } ${className}`}
      rows={3}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
);

// Spinner
export const Spinner = ({ className = "" }) => (
  <div className={`w-8 h-8 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin ${className}`} />
);

// Loading state
export const LoadingState = () => (
  <div className="flex items-center justify-center py-16">
    <Spinner />
  </div>
);

// Empty state
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && <div className="p-4 bg-gray-100 rounded-full mb-4"><Icon size={32} className="text-gray-400" /></div>}
    <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>}
    {action}
  </div>
);

// Error state
export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="p-4 bg-red-50 rounded-full mb-4 text-red-400">
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
    <p className="text-sm text-gray-600 mb-4">{message || "Something went wrong"}</p>
    {onRetry && <button onClick={onRetry} className="text-sm text-green-600 font-medium hover:text-green-700">Try again</button>}
  </div>
);

// Stat card
export const StatCard = ({ title, value, icon: Icon, color = "green", subtitle, trend }) => {
  const colors = {
    green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
    blue: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
    yellow: { bg: "bg-yellow-50", icon: "text-yellow-600", border: "border-yellow-100" },
    red: { bg: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100" },
  };
  const c = colors[color] || colors.green;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${c.bg}`}>
            <Icon size={20} className={c.icon} />
          </div>
        )}
      </div>
    </Card>
  );
};

// Modal
export const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;
  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// Alert/Toast-like inline alert
export const Alert = ({ type = "info", message, className = "" }) => {
  const types = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-green-50 text-green-800 border-green-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    error: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm ${types[type]} ${className}`}>
      {message}
    </div>
  );
};

// Pagination
export const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
        Previous
      </button>
      <span className="text-sm text-gray-600">Page {page} of {pages}</span>
      <button onClick={() => onPageChange(page + 1)} disabled={page >= pages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
        Next
      </button>
    </div>
  );
};
