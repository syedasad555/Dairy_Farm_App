import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import i18n from '../i18n';
import { API_BASE_URL } from '../config/api';
import { registerForPushNotifications, savePushToken } from '../services/pushNotifications';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const API_URL = API_BASE_URL;

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      
      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        const response = await axios.get(`${API_URL}/auth/me`);
        if (response.data.success) {
          const userData = response.data.data;
          setUser({ ...userData, id: userData._id, token: storedToken });
          setIsAuthenticated(true);
          if (userData.preferredLanguage) {
            i18n.changeLanguage(userData.preferredLanguage);
          }
          const pushToken = await registerForPushNotifications();
          await savePushToken(pushToken);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Error loading token:', error);
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (mobileNumber, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        mobileNumber,
        password
      });

      if (response.data.success) {
        const { token: authToken, user: userData } = response.data;
        
        await AsyncStorage.setItem('token', authToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

        const meResponse = await axios.get(`${API_URL}/auth/me`);
        const fullUser = meResponse.data.success ? meResponse.data.data : userData;
        
        await AsyncStorage.setItem('user', JSON.stringify(fullUser));
        
        setToken(authToken);
        setUser({ ...fullUser, id: fullUser._id || fullUser.id, token: authToken });
        setIsAuthenticated(true);

        if (fullUser.preferredLanguage) {
          i18n.changeLanguage(fullUser.preferredLanguage);
        }

        const pushToken = await registerForPushNotifications();
        await savePushToken(pushToken);
        
        return { success: true, user: fullUser };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Login error:', error);
      console.error('API URL was:', API_URL);
      return { 
        success: false, 
        message: error.response?.data?.message || `Cannot reach server at ${API_URL}. Is backend running?` 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Registration error:', error);
      console.error('API URL was:', API_URL);
      return { 
        success: false, 
        message: error.response?.data?.message || `Cannot reach server at ${API_URL}. Is backend running?` 
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      if (response.data.success) {
        const userData = response.data.data;
        setUser({ ...userData, id: userData._id, token });
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
    return null;
  };

  const updateUser = async (updatedUser) => {
    setUser({ ...updatedUser, token });
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const changeLanguage = async (language) => {
    i18n.changeLanguage(language);
    if (token) {
      try {
        await axios.put(`${API_URL}/users/profile`, { preferredLanguage: language });
        await refreshUser();
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    changeLanguage,
    API_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
