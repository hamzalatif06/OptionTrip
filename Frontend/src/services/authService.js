const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_API = `${API_BASE_URL}/api/auth`;

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';

export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAccessToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeAccessToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};

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
    credentials: 'include',
  };

  try {
    let response = await fetch(url, config);

    if (response.status === 401 && !url.includes('/refresh-token')) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        const newToken = getAccessToken();
        config.headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, config);
      } else {
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

export const register = async (userData) => {
  try {
    const response = await fetch(`${AUTH_API}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error?.message || 'Registration failed');
    }

    return data.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const response = await fetch(`${AUTH_API}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'OTP verification failed');
    }

    if (data.data.accessToken) setAccessToken(data.data.accessToken);
    if (data.data.user) setUser(data.data.user);

    return data.data;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw error;
  }
};

export const resendOtp = async (email) => {
  try {
    const response = await fetch(`${AUTH_API}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend OTP');
    }

    return data;
  } catch (error) {
    console.error('Resend OTP error:', error);
    throw error;
  }
};

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
    removeAccessToken();
    removeUser();
  }
};

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

export const getProfile = async () => {
  try {
    const response = await authenticatedFetch(`${AUTH_API}/me`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch profile');
    }

    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data.user;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

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

    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data.user;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

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

    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data;
  } catch (error) {
    console.error('Upload profile image error:', error);
    throw error;
  }
};

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

    removeAccessToken();
    removeUser();

    return data.message;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

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

    removeAccessToken();
    removeUser();

    return data.message;
  } catch (error) {
    console.error('Delete account error:', error);
    throw error;
  }
};

export const loginWithOAuth = (provider) => {
  if (provider === 'twitter') {
    const twitterAuthUrl = AUTH_API.replace('localhost', '127.0.0.1');
    window.location.href = `${twitterAuthUrl}/${provider}`;
  } else {
    window.location.href = `${AUTH_API}/${provider}`;
  }
};

export const handleOAuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const error = params.get('error');

  if (error) {
    return { success: false, error };
  }

  if (token) {
    setAccessToken(token);
    getProfile().catch(err => console.error('Failed to fetch profile after OAuth:', err));
    return { success: true, token };
  }

  return { success: false, error: 'No token received' };
};

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

    if (data.data.user) {
      setUser(data.data.user);
    }

    return data.data.user;
  } catch (error) {
    console.error('Link provider error:', error);
    throw error;
  }
};

export const unlinkProvider = async (provider) => {
  try {
    const response = await authenticatedFetch(`${AUTH_API}/unlink-provider/${provider}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to unlink provider');
    }

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
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  refreshAccessToken,
  isAuthenticated,

  getProfile,
  updateProfile,
  uploadProfileImage,
  changePassword,
  deleteAccount,

  loginWithOAuth,
  handleOAuthCallback,
  linkProvider,
  unlinkProvider,

  getAccessToken,
  setAccessToken,
  removeAccessToken,

  getUser,
  setUser,
  removeUser,
};
