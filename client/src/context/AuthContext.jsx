import { createContext, useContext, useState, useEffect } from "react";
import { getMe, logoutUser } from "../services/authService";

// Create the context
const AuthContext = createContext();

// Provider wraps the whole app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Logged in user data
  const [loading, setLoading] = useState(true); // App is checking login status

  // Check if user is already logged in when app starts
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await getMe();
      setUser(data.user);
    } catch {
      setUser(null); // Not logged in
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        loading,
        isLoggedIn: !!user,
        isAdmin: user?.role === "admin",
        isHost: user?.role === "host",
        isGuest: user?.role === "guest",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook — use this in any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};