# 🔐 Frontend Authentication Integration Guide

Complete guide for the frontend authentication system integrated with the OptionTrip backend.

---

## ✅ What's Been Integrated

### 1. **Authentication Service** (`src/services/authService.js`)
Complete API service for all authentication operations:

- ✅ **User Registration** - `register(userData)`
- ✅ **User Login** - `login(email, password)`
- ✅ **User Logout** - `logout()`
- ✅ **Token Refresh** - `refreshAccessToken()`
- ✅ **Get Profile** - `getProfile()`
- ✅ **Update Profile** - `updateProfile(updates)`
- ✅ **Change Password** - `changePassword(currentPassword, newPassword)`
- ✅ **Delete Account** - `deleteAccount(password)`
- ✅ **OAuth Login** - `loginWithOAuth(provider)`
- ✅ **OAuth Callback** - `handleOAuthCallback()`
- ✅ **Link Provider** - `linkProvider(provider, providerId)`
- ✅ **Unlink Provider** - `unlinkProvider(provider)`

### 2. **Authentication Context** (`src/contexts/AuthContext.jsx`)
React Context for global auth state management:

- ✅ **User State** - Current user data
- ✅ **Authentication Status** - `isAuthenticated`
- ✅ **Loading State** - Initial auth loading
- ✅ **Auto Token Refresh** - Handles 401 errors automatically
- ✅ **Persistent Login** - Restores session on page reload

### 3. **Updated Pages**
- ✅ **Login Page** - Integrated with auth service
- ✅ **Signup Page** - Integrated with auth service
- ✅ **OAuth Callback** - Handles OAuth redirects

### 4. **New Components**
- ✅ **OAuthCallback Component** - Beautiful loading/success/error states

---

## 📁 File Structure

```
Frontend/src/
├── services/
│   └── authService.js          # ✨ NEW - Complete auth API service
├── contexts/
│   └── AuthContext.jsx         # ✨ NEW - Global auth state
├── pages/
│   ├── Login/
│   │   ├── Login.jsx           # ✅ UPDATED - Integrated with auth
│   │   └── Login.css           # ✅ UPDATED - Added error banner
│   ├── Signup/
│   │   ├── Signup.jsx          # ✅ UPDATED - Integrated with auth
│   │   └── Signup.css          # No changes needed
│   └── OAuthCallback/          # ✨ NEW - OAuth redirect handler
│       ├── OAuthCallback.jsx
│       └── OAuthCallback.css
└── App.jsx                     # ✅ UPDATED - Added AuthProvider & routes
```

---

## 🚀 Quick Start

### 1. Start Backend
```bash
cd Backend
npm run dev
```

### 2. Start Frontend
```bash
cd Frontend
npm run dev
```

### 3. Test Authentication
1. Navigate to `http://localhost:3000/login`
2. Click "Sign up" to create an account
3. Enter your details and register
4. You'll be logged in automatically!

---

## 📚 Usage Examples

### Using Auth in Components

```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user.name}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return <button onClick={() => navigate('/login')}>Login</button>;
}
```

### OAuth Login (Already in Login/Signup pages)

```jsx
const { loginWithOAuth } = useAuth();

<button onClick={() => loginWithOAuth('google')}>
  Login with Google
</button>
```

---

## 🔐 How It Works

### Email/Password Flow
```
User enters credentials
    ↓
Frontend calls backend API
    ↓
Backend validates & returns tokens
    ↓
Frontend stores access token in localStorage
    ↓
User redirected to home page
```

### OAuth Flow
```
User clicks "Login with Google"
    ↓
Redirects to backend /api/auth/google
    ↓
Google consent screen shown
    ↓
Google redirects to backend callback
    ↓
Backend redirects to frontend /auth/callback?token=xxx
    ↓
Frontend stores token & redirects to home
```

### Auto Token Refresh
```
API request fails with 401
    ↓
Frontend automatically refreshes token
    ↓
Request retried with new token
    ↓
If refresh fails, user logged out
```

---

## ⚙️ Configuration

### Frontend .env
```env
VITE_API_URL=http://localhost:5000
```

---

## ✅ What's Complete

- [x] Auth service with all API methods
- [x] Auth context for global state
- [x] Login page integrated
- [x] Signup page integrated
- [x] OAuth callback page
- [x] Automatic token refresh
- [x] Persistent login on reload
- [x] Error handling & toasts
- [x] Loading states

---

## 🎯 Ready to Use!

Your authentication is fully integrated and working! Users can:
- ✅ Register with email/password
- ✅ Login with email/password
- ✅ Login with Google/Facebook/Twitter (once OAuth configured)
- ✅ Stay logged in across page reloads
- ✅ Automatically refresh expired tokens
- ✅ See beautiful error/success messages

For complete API documentation, see: `Backend/API_DOCUMENTATION.md`

---

**Last Updated**: January 2026
**Status**: ✅ Complete & Production Ready
