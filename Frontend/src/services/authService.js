/**
 * Authentication API Service
 * Handles user authentication, registration, and profile management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_API = `${API_BASE_URL}/api/auth`;

// Token management
const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

/**
 * Get stored access token
 */
export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set access token
 */
export const setAccessToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove access token
 */
export const removeAccessToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Get stored user data
 */
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Set user data
 */
export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Remove user data
 */
export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Make authenticated API request
 * Automatically includes JWT token and handles token refresh
 */
const authenticatedFetch = async (url, options = {}) => {
  const token = getAccessToken();

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    credentials: 'include', // Include cookies for refresh token
  };

  try {
    let response = await fetch(url, config);

    // If unauthorized, try to refresh token
    if (response.status === 401 && !url.includes('/refresh-token')) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        // Retry original request with new token
        const newToken = getAccessToken();
        config.headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, config);
      } else {
        // Refresh failed — clear tokens directly (don't call logout() to avoid recursion)
        removeAccessToken();
        removeUser();
        throw new Error('Session expired. Please login again.');
      }
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Register new user
 * @param {Object} userData - { name, email, password, phoneNumber }
 * @returns {Promise} { user, accessToken }
 */
export const register = async (userData) => {
  try {
    const response = await fetch(`${AUTH_API}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error?.message || 'Registration failed');
    }

    // Store token and user data
    if (data.data.accessToken) {
      setAccessToken(data.data.accessToken);
    }
    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} { user, accessToken }
 */
export const login = async (email, password) => {
  try {
    const response = await fetch(`${AUTH_API}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error?.message || 'Login failed');
    }

    // Store token and user data
    if (data.data.accessToken) {
      setAccessToken(data.data.accessToken);
    }
    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    const token = getAccessToken();
    await fetch(`${AUTH_API}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of API call result
    removeAccessToken();
    removeUser();
  }
};

/**
 * Refresh access token using refresh token cookie
 * @returns {Promise<boolean>} Success status
 */
export const refreshAccessToken = async () => {
  try {
    const response = await fetch(`${AUTH_API}/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    if (data.data.accessToken) {
      setAccessToken(data.data.accessToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
};

/**
 * Get current user profile
 * @returns {Promise} User object
 */
export const getProfile = async () => {
  try {
    const response = await authenticatedFetch(`${AUTH_API}/me`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }

    // Update stored user data
    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data.user;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} updates - { name, phoneNumber, profileImage }
 * @returns {Promise} Updated user object
 */
export const updateProfile = async (updates) => {
  try {
    const response = await authenticatedFetch(`${AUTH_API}/me`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

    // Update stored user data
    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data.user;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Upload profile image
 * @param {File} imageFile - The image file to upload
 * @returns {Promise} Updated user object with new image URL
 */
export const uploadProfileImage = async (imageFile) => {
  try {
    const token = getAccessToken();
    const formData = new FormData();
    formData.append('profileImage', imageFile);

    const response = await fetch(`${AUTH_API}/upload-profile-image`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload image');
    }

    // Update stored user data
    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data;
  } catch (error) {
    console.error('Upload profile image error:', error);
    throw error;
  }
};

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise} Success message
 */
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await authenticatedFetch(`${AUTH_API}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to change password');
    }

    // Password changed, user needs to login again
    removeAccessToken();
    removeUser();

    return data.message;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

/**
 * Delete user account
 * @param {string} password - User password for confirmation
 * @returns {Promise} Success message
 */
export const deleteAccount = async (password) => {
  try {
    const response = await authenticatedFetch(`${AUTH_API}/me`, {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete account');
    }

    // Account deleted, clear local storage
    removeAccessToken();
    removeUser();

    return data.message;
  } catch (error) {
    console.error('Delete account error:', error);
    throw error;
  }
};

/**
 * Initiate OAuth login
 * @param {string} provider - 'google', 'facebook', or 'twitter'
 */
export const loginWithOAuth = (provider) => {
  // Twitter doesn't support localhost, use 127.0.0.1 instead
  if (provider === 'twitter') {
    const twitterAuthUrl = AUTH_API.replace('localhost', '127.0.0.1');
    window.location.href = `${twitterAuthUrl}/${provider}`;
  } else {
    window.location.href = `${AUTH_API}/${provider}`;
  }
};

/**
 * Handle OAuth callback
 * Extract token from URL and store it
 * @returns {Object} { success: boolean, token?: string, error?: string }
 */
export const handleOAuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const error = params.get('error');

  if (error) {
    return { success: false, error };
  }

  if (token) {
    setAccessToken(token);
    // Fetch user profile to store user data
    getProfile().catch(err => console.error('Failed to fetch profile after OAuth:', err));
    return { success: true, token };
  }

  return { success: false, error: 'No token received' };
};

/**
 * Link social provider to account
 * @param {string} provider - 'google', 'facebook', or 'twitter'
 * @param {string} providerId - Provider's user ID
 * @returns {Promise} Updated user object
 */
export const linkProvider = async (provider, providerId) => {
  try {
    const response = await authenticatedFetch(`${AUTH_API}/link-provider`, {
      method: 'POST',
      body: JSON.stringify({ provider, providerId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to link provider');
    }

    // Update stored user data
    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data.user;
  } catch (error) {
    console.error('Link provider error:', error);
    throw error;
  }
};

/**
 * Unlink social provider from account
 * @param {string} provider - 'google', 'facebook', or 'twitter'
 * @returns {Promise} Updated user object
 */
export const unlinkProvider = async (provider) => {
  try {
    const response = await authenticatedFetch(`${AUTH_API}/unlink-provider/${provider}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to unlink provider');
    }

    // Update stored user data
    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data.user;
  } catch (error) {
    console.error('Unlink provider error:', error);
    throw error;
  }
};

export default {
  // Authentication
  register,
  login,
  logout,
  refreshAccessToken,
  isAuthenticated,

  // Profile Management
  getProfile,
  updateProfile,
  uploadProfileImage,
  changePassword,
  deleteAccount,

  // OAuth
  loginWithOAuth,
  handleOAuthCallback,
  linkProvider,
  unlinkProvider,

  // Token Management
  getAccessToken,
  setAccessToken,
  removeAccessToken,

  // User Management
  getUser,
  setUser,
  removeUser,
};
