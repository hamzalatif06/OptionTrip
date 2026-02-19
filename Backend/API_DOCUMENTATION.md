# 🔐 OptionTrip Authentication API Documentation

Complete API documentation for the OptionTrip authentication system with email/password and OAuth support.

---

## 📋 Table of Contents

1. [Base URL](#base-url)
2. [Authentication Flow](#authentication-flow)
3. [Public Endpoints](#public-endpoints)
4. [Protected Endpoints](#protected-endpoints)
5. [OAuth Endpoints](#oauth-endpoints)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Security Features](#security-features)

---

## 🌐 Base URL

```
Development: http://localhost:5000/api/auth
Production: https://api.optiontrip.com/api/auth
```

---

## 🔄 Authentication Flow

### Email/Password Flow
```
1. User registers → POST /signup
2. Receive access token + refresh token (HTTP-only cookie)
3. Use access token for API requests (Authorization: Bearer <token>)
4. When access token expires → POST /refresh-token
5. Logout → POST /logout
```

### OAuth Flow
```
1. User clicks "Login with Google" → Redirect to GET /google
2. User approves permissions
3. Google redirects to GET /google/callback
4. Backend redirects to frontend with access token
5. Frontend stores access token and uses for API requests
```

### Multi-Provider Account Linking
```
1. User logged in with email/password
2. User clicks "Link Google Account" → POST /link-provider
3. Account now has both local and Google providers
4. User can login with either method
```

---

## 🔓 Public Endpoints

### 1. Register New User

**POST** `/signup`

Create a new user account with email and password.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phoneNumber": "+1234567890"
}
```

**Validation Rules:**
- `name`: 2-50 characters, required
- `email`: Valid email format, unique, required
- `password`: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, required
- `phoneNumber`: Valid phone format, optional

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "64abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "emailVerified": false,
      "authProviders": ["local"],
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies Set:**
- `refreshToken`: HTTP-only, secure (production), 30-day expiry

**Errors:**
- `400`: Validation error (invalid email, weak password, etc.)
- `409`: Email already registered
- `429`: Too many registration attempts

---

### 2. Login User

**POST** `/login`

Authenticate user with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "64abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "authProviders": ["local", "google"],
      "lastLogin": "2024-01-15T10:30:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies Set:**
- `refreshToken`: HTTP-only, secure (production), 30-day expiry

**Errors:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `404`: User not found
- `429`: Too many login attempts (max 5 per 15 minutes)

---

### 3. Refresh Access Token

**POST** `/refresh-token`

Get a new access token using refresh token.

**Authentication:** Requires valid refresh token in HTTP-only cookie or request body.

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Cookies Set:**
- `refreshToken`: New refresh token (token rotation)

**Errors:**
- `401`: Invalid or expired refresh token
- `404`: User not found

---

## 🔒 Protected Endpoints

All protected endpoints require a valid access token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Get Current User Profile

**GET** `/me`

Get the authenticated user's profile.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64abc123...",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "profileImage": "https://example.com/avatar.jpg",
      "emailVerified": true,
      "authProviders": ["local", "google"],
      "googleId": "123456789",
      "isActive": true,
      "lastLogin": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Errors:**
- `401`: Unauthorized (invalid/expired token)

---

### 5. Update User Profile

**PUT** `/me`

Update the authenticated user's profile.

**Request Body:**
```json
{
  "name": "John Smith",
  "phoneNumber": "+9876543210",
  "profileImage": "https://example.com/new-avatar.jpg"
}
```

**Validation Rules:**
- `name`: 2-50 characters, optional
- `phoneNumber`: Valid phone format, optional
- `profileImage`: Valid URL, optional
- Cannot update: email, password, authProviders, provider IDs

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "64abc123...",
      "name": "John Smith",
      "phoneNumber": "+9876543210",
      "profileImage": "https://example.com/new-avatar.jpg",
      ...
    }
  }
}
```

**Errors:**
- `400`: Validation error
- `401`: Unauthorized

---

### 6. Logout User

**POST** `/logout`

Logout user by invalidating the refresh token.

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Cookies Cleared:**
- `refreshToken`: Removed

**Errors:**
- `401`: Unauthorized

---

### 7. Logout From All Devices

**POST** `/logout-all`

Logout user from all devices by invalidating all refresh tokens.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

**Cookies Cleared:**
- `refreshToken`: Removed

**Errors:**
- `401`: Unauthorized
- `429`: Too many requests

---

### 8. Change Password

**POST** `/change-password`

Change the user's password.

**Request Body:**
```json
{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Validation Rules:**
- `currentPassword`: Required
- `newPassword`: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, required
- Cannot be the same as current password

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again."
}
```

**Cookies Cleared:**
- `refreshToken`: Removed (user must login again)

**Errors:**
- `400`: Validation error, passwords match
- `401`: Current password incorrect
- `404`: User not found or no password set (OAuth-only account)
- `429`: Too many attempts

---

### 9. Link Social Provider

**POST** `/link-provider`

Link a social provider (Google, Facebook, Twitter) to existing account.

**Request Body:**
```json
{
  "provider": "google",
  "providerId": "123456789"
}
```

**Validation Rules:**
- `provider`: Must be "google", "facebook", or "twitter"
- `providerId`: Required

**Response (200):**
```json
{
  "success": true,
  "message": "google account linked successfully",
  "data": {
    "user": {
      "_id": "64abc123...",
      "authProviders": ["local", "google"],
      "googleId": "123456789",
      ...
    }
  }
}
```

**Errors:**
- `400`: Validation error, provider already linked
- `401`: Unauthorized
- `409`: Provider ID already linked to another account

---

### 10. Unlink Social Provider

**DELETE** `/unlink-provider/:provider`

Unlink a social provider from account.

**URL Parameters:**
- `provider`: "google", "facebook", or "twitter"

**Response (200):**
```json
{
  "success": true,
  "message": "google account unlinked successfully",
  "data": {
    "user": {
      "_id": "64abc123...",
      "authProviders": ["local"],
      "googleId": null,
      ...
    }
  }
}
```

**Errors:**
- `400`: Cannot unlink last provider, provider not linked
- `401`: Unauthorized

---

### 11. Delete Account

**DELETE** `/me`

Permanently delete user account.

**Request Body:**
```json
{
  "password": "SecurePass123"
}
```

**Validation Rules:**
- `password`: Required for local accounts
- Not required for OAuth-only accounts

**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Cookies Cleared:**
- `refreshToken`: Removed

**Errors:**
- `400`: Validation error
- `401`: Incorrect password
- `429`: Too many attempts

---

## 🌍 OAuth Endpoints

### Google OAuth

#### Initiate Google Login
**GET** `/google`

Redirects user to Google consent screen.

**Query Parameters:**
- None required

**Scopes Requested:**
- `profile`: Basic profile info
- `email`: Email address

---

#### Google Callback
**GET** `/google/callback`

Google redirects here after user approves.

**Redirects To:**
```
Success: http://localhost:3000/auth/callback?token=<accessToken>
Failure: http://localhost:3000/login?error=google_auth_failed
```

**Frontend Handling:**
```javascript
// In your React component
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const error = params.get('error');

  if (token) {
    // Store access token
    localStorage.setItem('accessToken', token);
    // Redirect to dashboard
    navigate('/dashboard');
  } else if (error) {
    // Show error message
    setError('Google authentication failed');
  }
}, []);
```

---

### Facebook OAuth

#### Initiate Facebook Login
**GET** `/facebook`

Redirects user to Facebook consent screen.

**Scopes Requested:**
- `email`: Email address
- `public_profile`: Basic profile info

---

#### Facebook Callback
**GET** `/facebook/callback`

Facebook redirects here after user approves.

**Redirects To:**
```
Success: http://localhost:3000/auth/callback?token=<accessToken>
Failure: http://localhost:3000/login?error=facebook_auth_failed
```

---

### Twitter OAuth

#### Initiate Twitter Login
**GET** `/twitter`

Redirects user to Twitter consent screen.

**Scopes Requested:**
- Basic profile information

---

#### Twitter Callback
**GET** `/twitter/callback`

Twitter redirects here after user approves.

**Redirects To:**
```
Success: http://localhost:3000/auth/callback?token=<accessToken>
Failure: http://localhost:3000/login?error=twitter_auth_failed
```

---

## ⚠️ Error Handling

All errors follow a consistent format:

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      "field": "email",
      "reason": "Email already exists"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed successfully |
| 201 | Created | User registered successfully |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Invalid/expired token, wrong password |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | User/resource not found |
| 409 | Conflict | Email already exists, provider already linked |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

```javascript
// Authentication Errors
AUTH_INVALID_CREDENTIALS    // Wrong email/password
AUTH_TOKEN_EXPIRED         // JWT expired
AUTH_TOKEN_INVALID         // Malformed JWT
AUTH_UNAUTHORIZED          // No token provided

// Validation Errors
VALIDATION_ERROR           // Input validation failed
EMAIL_INVALID              // Invalid email format
PASSWORD_WEAK              // Password doesn't meet requirements

// Resource Errors
USER_NOT_FOUND            // User doesn't exist
USER_ALREADY_EXISTS       // Email already registered
PROVIDER_ALREADY_LINKED   // Provider already linked
PROVIDER_NOT_LINKED       // Cannot unlink non-linked provider

// Rate Limiting
RATE_LIMIT_EXCEEDED       // Too many requests
```

---

## 🚦 Rate Limiting

Rate limits are applied per IP address:

| Endpoint(s) | Limit | Window | Purpose |
|-------------|-------|--------|---------|
| `/signup`, `/login` | 5 requests | 15 minutes | Prevent brute force |
| `/change-password`, `/delete-account`, `/logout-all` | 3 requests | 15 minutes | Strict protection |
| All other auth endpoints | 100 requests | 15 minutes | General protection |

**Rate Limit Response (429):**
```json
{
  "success": false,
  "error": {
    "message": "Too many authentication attempts. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 900
  }
}
```

**Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705320000
Retry-After: 900
```

---

## 🔒 Security Features

### 1. Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Requirements**: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit
- **No Plain Text**: Passwords never stored in plain text
- **Field Selection**: Password hash excluded from queries by default

### 2. JWT Tokens
- **Access Token**: 15-minute expiry, stored in frontend
- **Refresh Token**: 30-day expiry, HTTP-only cookie
- **Token Rotation**: New refresh token on each refresh
- **Revocation**: Tokens stored in database for validation

### 3. HTTP-Only Cookies
- **Secure**: HTTPS-only in production
- **HttpOnly**: Not accessible via JavaScript
- **SameSite**: CSRF protection
- **Domain**: Restricted to API domain

### 4. Input Sanitization
- **MongoDB Injection**: Stripped using express-mongo-sanitize
- **XSS Protection**: Joi validation prevents malicious input
- **Trim/Lowercase**: Email normalization

### 5. CORS Configuration
```javascript
{
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### 6. Security Headers (Helmet)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000

### 7. Account Linking Security
- **Unique Provider IDs**: Sparse indexes prevent duplicates
- **Email Matching**: Auto-link when email matches
- **Cannot Unlink Last**: Must have at least one provider
- **Password Verification**: Required for account deletion

---

## 📖 Usage Examples

### Example 1: Register and Login Flow

```javascript
// 1. Register new user
const registerResponse = await fetch('http://localhost:5000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Include cookies
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123',
    phoneNumber: '+1234567890'
  })
});

const { data } = await registerResponse.json();
const accessToken = data.accessToken;

// 2. Store access token
localStorage.setItem('accessToken', accessToken);

// 3. Make authenticated request
const profileResponse = await fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include'
});

const profile = await profileResponse.json();
console.log(profile.data.user);
```

---

### Example 2: Token Refresh Flow

```javascript
// API request interceptor
async function apiRequest(url, options = {}) {
  let accessToken = localStorage.getItem('accessToken');

  // Add token to request
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`
  };
  options.credentials = 'include';

  let response = await fetch(url, options);

  // If token expired, refresh and retry
  if (response.status === 401) {
    // Refresh token
    const refreshResponse = await fetch('http://localhost:5000/api/auth/refresh-token', {
      method: 'POST',
      credentials: 'include'
    });

    if (refreshResponse.ok) {
      const { data } = await refreshResponse.json();
      accessToken = data.accessToken;
      localStorage.setItem('accessToken', accessToken);

      // Retry original request with new token
      options.headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, options);
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  return response;
}

// Usage
const response = await apiRequest('http://localhost:5000/api/auth/me');
const profile = await response.json();
```

---

### Example 3: OAuth Login Flow

```jsx
// Frontend - Login Page
import React from 'react';

function LoginPage() {
  const handleGoogleLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <button onClick={handleGoogleLogin}>
      Login with Google
    </button>
  );
}

// Frontend - OAuth Callback Page
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      // Store access token
      localStorage.setItem('accessToken', token);
      // Redirect to dashboard
      navigate('/dashboard');
    } else if (error) {
      // Show error and redirect to login
      console.error('OAuth error:', error);
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div>Processing login...</div>;
}
```

---

### Example 4: Account Linking

```javascript
// User is logged in with email/password
const accessToken = localStorage.getItem('accessToken');

// Link Google account
const linkResponse = await fetch('http://localhost:5000/api/auth/link-provider', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  credentials: 'include',
  body: JSON.stringify({
    provider: 'google',
    providerId: '123456789' // From Google OAuth profile
  })
});

if (linkResponse.ok) {
  const { data } = await linkResponse.json();
  console.log('Providers:', data.user.authProviders); // ['local', 'google']
}
```

---

## 🧪 Testing

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "phoneNumber": "+1234567890"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_access_token>" \
  -b cookies.txt
```

**Refresh Token:**
```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

---

## 📚 Additional Resources

- [Environment Setup Guide](../.env.example)
- [User Model Schema](../src/models/User.js)
- [Authentication Middleware](../src/middleware/auth.js)
- [Security Middleware](../src/middleware/security.js)

---

## 🎯 Quick Reference

### Access Token
- **Storage**: Frontend (localStorage/memory)
- **Expiry**: 15 minutes
- **Usage**: Authorization header
- **Format**: `Bearer <token>`

### Refresh Token
- **Storage**: HTTP-only cookie
- **Expiry**: 30 days
- **Usage**: Automatic (cookie)
- **Rotation**: Yes (new token on refresh)

### Authentication Header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Cookie Name
```
refreshToken
```

---

**Last Updated**: January 2026
**API Version**: 1.0.0
**Status**: ✅ Production Ready
