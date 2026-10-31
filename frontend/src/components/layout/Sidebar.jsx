import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Package, Archive, ShoppingCart, Truck, ClipboardList,
  TrendingUp, AlertTriangle, BarChart2, Settings, X
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["owner", "manager", "staff"] },
  { to: "/products", icon: Package, label: "Products", roles: ["owner", "manager", "staff"] },
  { to: "/inventory", icon: Archive, label: "Inventory", roles: ["owner", "manager", "staff"] },
  { to: "/sales", icon: ShoppingCart, label: "Sales", roles: ["owner", "manager", "staff"] },
  { to: "/suppliers", icon: Truck, label: "Suppliers", roles: ["owner", "manager"] },
  { to: "/purchase-orders", icon: ClipboardList, label: "Purchase Orders", roles: ["owner", "manager"] },
  { to: "/forecast", icon: TrendingUp, label: "Demand Forecast", roles: ["owner", "manager"] },
  { to: "/expiry", icon: AlertTriangle, label: "Expiry Management", roles: ["owner", "manager", "staff"] },
  { to: "/reports", icon: BarChart2, label: "Reports", roles: ["owner", "manager"] },
  { to: "/settings", icon: Settings, label: "Settings", roles: ["owner", "manager", "staff"] },
];

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();

  return (
    <>
      {/* Overlay for mobile */}
      {open && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 flex flex-col transform transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Archive size={16} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">StockWise</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Store name */}
        <div className="px-6 py-3 border-b border-gray-50">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Store</p>
          <p className="text-sm text-gray-700 font-medium mt-0.5 truncate">{user?.store?.name || "My Store"}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems
              .filter((item) => item.roles.includes(user?.role || "staff"))
              .map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-green-50 text-green-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`
                    }
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="px-6 py-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
