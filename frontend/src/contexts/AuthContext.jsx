import { createContext, useContext, useState, useEffect } from "react";
import { getMe, login as apiLogin, register as apiRegister } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("stockwise_token");
    if (token) {
      getMe()
        .then((res) => setUser(res.data.data.user))
        .catch(() => { localStorage.removeItem("stockwise_token"); localStorage.removeItem("stockwise_user"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    const { token, user } = res.data.data;
    localStorage.setItem("stockwise_token", token);
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await apiRegister(data);
    const { token, user } = res.data.data;
    localStorage.setItem("stockwise_token", token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem("stockwise_token");
    setUser(null);
    window.location.href = "/login";
  };

  const hasRole = (...roles) => user && roles.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
