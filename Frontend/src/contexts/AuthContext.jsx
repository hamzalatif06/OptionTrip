import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';
import { showSuccessToast, showErrorToast } from '../utils/toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = authService.getAccessToken();
      const storedUser = authService.getUser();

      if (token && storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const freshUser = await Promise.race([
            authService.getProfile(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
            )
          ]);

          clearTimeout(timeoutId);
          setUser(freshUser);
        } catch (error) {
          console.warn('Failed to fetch fresh user data:', error.message);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    try {
      const data = await authService.register(userData);
      return { success: true, requiresOtp: true, email: data.email };
    } catch (error) {
      showErrorToast(error.message || 'Registration failed. Please try again.');
      return { success: false, error: error.message };
    }
  };

  const handleVerifyOtp = async (email, otp) => {
    try {
      const data = await authService.verifyOtp(email, otp);
      setUser(data.user);
      setIsAuthenticated(true);
      showSuccessToast('Email verified! Welcome aboard!');
      return { success: true, user: data.user };
    } catch (error) {
      showErrorToast(error.message || 'OTP verification failed.');
      return { success: false, error: error.message };
    }
  };

  const handleResendOtp = async (email) => {
    try {
      await authService.resendOtp(email);
      showSuccessToast('New OTP sent to your email.');
      return { success: true };
    } catch (error) {
      showErrorToast(error.message || 'Failed to resend OTP.');
      return { success: false, error: error.message };
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      setIsAuthenticated(true);
      showSuccessToast(`Welcome back, ${data.user.name}! 👋`);
      return { success: true, user: data.user };
    } catch (error) {
      showErrorToast(error.message || 'Login failed. Please check your credentials.');
      return { success: false, error: error.message };
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      showSuccessToast('Logged out successfully. See you soon!');
    } catch (error) {
      console.error('Logout error:', error);
      showErrorToast('Logout failed. Please try again.');
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const handleUpdateProfile = async (updates) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleUploadProfileImage = async (imageFile) => {
    try {
      const result = await authService.uploadProfileImage(imageFile);
      setUser(result.user);
      return { success: true, user: result.user, imageUrl: result.imageUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      setUser(null);
      setIsAuthenticated(false);
      return { success: true, message: 'Password changed successfully. Please login again.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleDeleteAccount = async (password) => {
    try {
      await authService.deleteAccount(password);
      setUser(null);
      setIsAuthenticated(false);
      return { success: true, message: 'Account deleted successfully.' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const handleOAuthLogin = (provider) => {
    authService.loginWithOAuth(provider);
  };

  const handleOAuthCallback = async () => {
    const result = authService.handleOAuthCallback();

    if (result.success) {
      try {
        const user = await authService.getProfile();
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      } catch (error) {
        return { success: false, error: 'Failed to fetch user profile' };
      }
    }

    return result;
  };

  const refreshProfile = async () => {
    try {
      const freshUser = await authService.getProfile();
      setUser(freshUser);
      setIsAuthenticated(true);
      return freshUser;
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,

    register: handleRegister,
    verifyOtp: handleVerifyOtp,
    resendOtp: handleResendOtp,
    login: handleLogin,
    logout: handleLogout,

    updateProfile: handleUpdateProfile,
    uploadProfileImage: handleUploadProfileImage,
    changePassword: handleChangePassword,
    deleteAccount: handleDeleteAccount,
    refreshProfile,

    loginWithOAuth: handleOAuthLogin,
    handleOAuthCallback,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
