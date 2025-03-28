import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import axiosInstance from "../utils/axiosInstance";

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axiosInstance.get(`/api/auth/me`);
        console.log("Auth Check", response.data.user)
        setUser(response.data.user);
      }  catch (error) {
        if (error.response && error.response.status === 401) {
          console.warn("User not logged in.");
        } else {
          console.error("Auth check error:", error);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    await axiosInstance.post(`/api/auth/login`, { email, password });
    const response = await axiosInstance.get(`/api/auth/me`,);
    setUser(response.data.user);
  };

  // Logout function
  const logout = async () => {
    await axiosInstance.post(`/api/auth/logout`, {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);
