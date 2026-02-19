# 🚀 OptionTrip Backend Setup Guide

Complete step-by-step guide to set up the authentication system and backend API.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js** 18.x or higher installed
- [ ] **MongoDB** 6.x or higher (local) OR MongoDB Atlas account
- [ ] **Git** installed
- [ ] **Text editor** (VS Code recommended)
- [ ] **Terminal/Command Prompt** access

---

## 🛠️ Installation Steps

### 1. Clone and Navigate to Project

```bash
cd c:\Users\JUNAID\Desktop\optiontrip\Backend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (server framework)
- Mongoose (MongoDB ODM)
- Passport.js (authentication)
- JWT libraries (token management)
- bcryptjs (password hashing)
- Security packages (helmet, rate limiting, etc.)

### 3. Set Up Environment Variables

**Option A: Copy from template**
```bash
cp .env.example .env
```

**Option B: Create new .env file**

Create a file named `.env` in the Backend directory with the following content:

```env
# Application
NODE_ENV=development
PORT=5000
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/optiontrip

# JWT Secrets (GENERATE YOUR OWN!)
JWT_ACCESS_SECRET=your_access_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars

# OAuth (Optional for now)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
TWITTER_CONSUMER_KEY=
TWITTER_CONSUMER_SECRET=

# OpenAI (for trip generation)
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini

# Google Places (for location data)
GOOGLE_PLACES_API_KEY=your_google_places_key

# Security
CORS_ORIGIN=http://localhost:3000
```

### 4. Generate JWT Secrets

**IMPORTANT:** Do NOT use the default secrets in production!

Generate secure random secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this command **twice** and copy the outputs to:
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### 5. Set Up MongoDB

**Option A: Local MongoDB**

1. Install MongoDB Community Server
2. Start MongoDB service:
   ```bash
   # Windows (as admin)
   net start MongoDB

   # Mac/Linux
   sudo systemctl start mongod
   ```
3. Verify connection:
   ```bash
   mongosh
   # Should connect to mongodb://localhost:27017
   ```

**Option B: MongoDB Atlas (Cloud)**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create new cluster (free tier available)
4. Click "Connect" → "Connect your application"
5. Copy connection string
6. Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/optiontrip?retryWrites=true&w=majority
   ```

### 6. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
✅ MongoDB Connected Successfully
📍 Database: optiontrip
🚀 Server running on port 5000
🌍 Environment: development
```

---

## ✅ Verify Installation

### 1. Test Health Check

Open browser or use curl:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-01-15T10:30:00.000Z",
  "services": {
    "database": "connected",
    "openai": "configured",
    "googlePlaces": "configured"
  }
}
```

### 2. Test User Registration

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "phoneNumber": "+1234567890"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "Test User",
      "email": "test@example.com",
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Test User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### 4. Test Protected Route

```bash
# Replace <TOKEN> with accessToken from login response
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>" \
  -b cookies.txt
```

If all tests pass, authentication is working! ✅

---

## 🔐 OAuth Setup (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type: "Web application"
6. Add authorized redirect URI:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
7. Copy Client ID and Client Secret to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create new app or select existing
3. Add "Facebook Login" product
4. Settings → Basic → Copy App ID and App Secret
5. Settings → Facebook Login → Valid OAuth Redirect URIs:
   ```
   http://localhost:5000/api/auth/facebook/callback
   ```
6. Update `.env`:
   ```env
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   ```

### Twitter OAuth

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create new app
3. Keys and Tokens → Copy API Key and API Secret Key
4. Authentication settings → Enable 3-legged OAuth
5. Callback URL:
   ```
   http://localhost:5000/api/auth/twitter/callback
   ```
6. Update `.env`:
   ```env
   TWITTER_CONSUMER_KEY=your_consumer_key
   TWITTER_CONSUMER_SECRET=your_consumer_secret
   ```

**Test OAuth:**
```bash
# Open in browser
http://localhost:5000/api/auth/google
```

Should redirect to Google login, then back to your frontend.

---

## 🔧 Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"

**Solution:**
1. Check MongoDB is running:
   ```bash
   mongosh
   ```
2. Verify `MONGODB_URI` in `.env`
3. Check firewall isn't blocking port 27017
4. For Atlas: Check IP whitelist and credentials

### Issue: "JWT secret error"

**Solution:**
1. Generate new secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Update `.env` with new secrets
3. Ensure secrets are at least 32 characters

### Issue: "OAuth callback not working"

**Solution:**
1. Verify callback URLs in provider settings
2. Check `API_BASE_URL` in `.env` matches your server
3. Ensure OAuth credentials are correct
4. Check browser console for errors

### Issue: "Rate limit exceeded"

**Solution:**
1. Wait 15 minutes
2. Check if multiple requests being sent
3. Clear rate limit manually if needed (restart server)

### Issue: "CORS error in frontend"

**Solution:**
1. Verify `CORS_ORIGIN` in `.env` matches frontend URL
2. Ensure frontend is running on correct port
3. Check frontend is sending credentials:
   ```javascript
   fetch(url, { credentials: 'include' })
   ```

### Issue: Port 5000 already in use

**Solution:**
1. Change port in `.env`:
   ```env
   PORT=5001
   ```
2. Or kill process using port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F

   # Mac/Linux
   lsof -ti:5000 | xargs kill -9
   ```

---

## 📁 Project Structure Reference

```
Backend/
├── src/
│   ├── config/
│   │   ├── db.js              # Old MongoDB config (still works)
│   │   ├── database.js        # New database utility
│   │   └── passport.js        # OAuth strategies
│   ├── controllers/
│   │   ├── authController.js  # Auth endpoints
│   │   └── tripController.js  # Trip endpoints
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── security.js        # Rate limiting, etc.
│   │   └── errorHandler.js    # Error handling
│   ├── models/
│   │   ├── User.js            # User schema
│   │   └── Trip.js            # Trip schema
│   ├── routes/
│   │   ├── authRoutes.js      # Auth routes
│   │   └── trips.js           # Trip routes
│   ├── services/
│   │   ├── authService.js     # Auth logic
│   │   ├── tokenService.js    # JWT management
│   │   └── tripGenerationService.js
│   ├── validators/
│   │   └── authValidators.js  # Joi schemas
│   ├── app.js                 # Express setup
│   └── server.js              # Entry point
├── .env                       # Your secrets (DON'T COMMIT!)
├── .env.example               # Template
├── package.json
├── README.md                  # Main docs
├── API_DOCUMENTATION.md       # Complete API reference
└── SETUP_GUIDE.md            # This file
```

---

## 🎯 Next Steps After Setup

1. **Test all authentication endpoints** using Postman or curl
2. **Integrate frontend** with authentication
3. **Set up OAuth providers** for social login
4. **Configure production environment**:
   - Use MongoDB Atlas
   - Set `NODE_ENV=production`
   - Enable HTTPS and set `COOKIE_SECURE=true`
   - Generate new JWT secrets
5. **Deploy backend** (Heroku, Railway, AWS, etc.)

---

## 📚 Additional Resources

- [API Documentation](./API_DOCUMENTATION.md) - Complete endpoint reference
- [Main README](./README.md) - Feature overview
- [Passport.js Docs](http://www.passportjs.org/) - OAuth strategies
- [JWT.io](https://jwt.io/) - JWT debugger
- [MongoDB Docs](https://docs.mongodb.com/) - Database reference

---

## 🆘 Getting Help

**Check logs:**
```bash
npm run dev
# Watch console for detailed error messages
```

**Test with verbose output:**
```bash
DEBUG=* npm run dev
```

**Check database:**
```bash
mongosh
use optiontrip
db.users.find()
```

**Verify environment:**
```bash
# Check if .env is loaded
node -e "require('dotenv').config(); console.log(process.env.JWT_ACCESS_SECRET)"
```

---

## ✅ Setup Verification Checklist

Before moving to production, verify:

- [ ] MongoDB connected successfully
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens being generated
- [ ] Refresh token rotation works
- [ ] Protected routes require authentication
- [ ] OAuth providers configured (optional)
- [ ] Rate limiting active
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] JWT secrets are strong (32+ chars)
- [ ] .env file NOT committed to git
- [ ] All tests pass
- [ ] Frontend can authenticate
- [ ] Cookies being set correctly

---

## 🎉 You're Ready!

Your authentication system is now set up and ready to use!

**Quick Commands:**

```bash
# Start development server
npm run dev

# Test health
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"User","email":"user@test.com","password":"Pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"Pass123"}'
```

**Frontend Integration:**

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) sections:
- "Usage Examples" for frontend code
- "OAuth Endpoints" for social login integration
- "Token Refresh Flow" for automatic token renewal

---

**Happy Coding! 🚀**

Last Updated: January 2026
