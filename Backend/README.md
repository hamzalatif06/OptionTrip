# OptionTrip Backend API

Professional Node.js backend for OptionTrip - AI-powered trip planning platform.

## 🚀 Features

- **AI-Powered Trip Generation** using OpenAI GPT-4
- **Location Enrichment** with Google Places API
- **3 Trip Iterations** with different paces (Relaxed, Moderate, Fast-paced)
- **Complete Authentication System** with JWT and OAuth
  - Email/password authentication
  - Social login (Google, Facebook, Twitter)
  - Multi-provider account linking
  - JWT access tokens + refresh token rotation
- **MongoDB Integration** for trip and user storage
- **Professional Error Handling** and validation
- **RESTful API Design** with Express.js
- **Security Features** (rate limiting, CSRF protection, input sanitization)

## 📋 Prerequisites

- **Node.js** >= 18.x
- **MongoDB** >= 6.x (local or MongoDB Atlas)
- **OpenAI API Key** (for trip generation)
- **Google Places API Key** (for location enrichment)
- **OAuth Credentials** (optional, for social login):
  - Google OAuth Client ID & Secret
  - Facebook App ID & Secret
  - Twitter Consumer Key & Secret

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys
```

## ⚙️ Environment Variables

Create a `.env` file in the Backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/optiontrip

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Google Places API
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# JWT Secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_ACCESS_SECRET=your_access_token_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars

# OAuth Credentials (optional - for social login)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
TWITTER_CONSUMER_KEY=your_twitter_consumer_key
TWITTER_CONSUMER_SECRET=your_twitter_consumer_secret

# Security
CORS_ORIGIN=http://localhost:3000
```

See [.env.example](./.env.example) for complete configuration details.

## 🏃 Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📍 API Endpoints

### Health Check

```http
GET /
GET /api/health
```

Returns server status and API configuration.

### Authentication

Complete authentication system with email/password and OAuth support.

See **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** for complete authentication API reference.

**Quick Links:**
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/facebook` - Initiate Facebook OAuth
- `GET /api/auth/twitter` - Initiate Twitter OAuth
- `GET /api/auth/me` - Get user profile (protected)
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Trip Management

#### 1. Generate Trip Iterations

**Endpoint:** `POST /api/trips/generate`

**Description:** Generate 3 AI-powered trip iterations based on user preferences.

**Request Body:**
```json
{
  "destination": {
    "text": "Paris, France",
    "place_id": "ChIJD7fiBh9u5kcRYJSMaMOCCwQ",
    "name": "Paris",
    "geometry": {
      "lat": 48.856614,
      "lng": 2.3522219
    }
  },
  "start_date": "2026-03-26",
  "end_date": "2026-03-29",
  "duration_days": 4,
  "month_year": "March 2026",
  "tripType": "Family Vacation",
  "guests": {
    "total": 4,
    "adults": 2,
    "children": 2,
    "infants": 0,
    "label": "4 Guests"
  },
  "budget": "moderate",
  "description": "We love hiking, trying local cuisine, and exploring art galleries."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trip iterations generated successfully",
  "data": {
    "trip_id": "trip_1735314000000_xyz123",
    "destination": {...},
    "dates": {...},
    "iterations": [
      {
        "iteration_id": "iter_1735314000000_0",
        "title": "Balanced Explorer",
        "description": "Perfect mix of must-see attractions and hidden gems",
        "pace": "moderate",
        "total_days": 4,
        "total_cost": 1200,
        "highlights": [...],
        "itinerary": [...]
      },
      {...},
      {...}
    ],
    "selected_iteration_id": "iter_1735314000000_0"
  }
}
```

**Validation Rules:**
- `destination`: Required object with `text`, `name`, `geometry`
- `start_date`, `end_date`: Required, valid date format (YYYY-MM-DD)
- `duration_days`: Required, between 2-10 days
- `tripType`: Required string
- `guests.total`: Required, between 1-10
- `budget`: Required, one of: `budget`, `moderate`, `luxury`, `premium`

#### 2. Get Trip by ID

**Endpoint:** `GET /api/trips/:tripId`

**Description:** Retrieve complete trip data including all iterations.

**Response:**
```json
{
  "success": true,
  "data": {
    "trip_id": "trip_1735314000000_xyz123",
    "destination": {...},
    "dates": {...},
    "trip_type": "Family Vacation",
    "guests": {...},
    "budget": "moderate",
    "description": "...",
    "iterations": [...],
    "selected_iteration_id": "iter_1735314000000_0",
    "status": "generated",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
}
```

#### 3. Select Trip Iteration

**Endpoint:** `PATCH /api/trips/:tripId/select-iteration`

**Description:** Update which iteration is selected by the user.

**Request Body:**
```json
{
  "iteration_id": "iter_1735314000000_1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Iteration selected successfully",
  "data": {
    "trip_id": "trip_1735314000000_xyz123",
    "selected_iteration_id": "iter_1735314000000_1"
  }
}
```

#### 4. Get User Trips

**Endpoint:** `GET /api/trips/user/:userId`

**Query Parameters:**
- `limit` (optional, default: 10)
- `skip` (optional, default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "trips": [...],
    "total": 25,
    "limit": 10,
    "skip": 0
  }
}
```

## 🏗️ Project Structure

```
Backend/
├── src/
│   ├── config/
│   │   ├── db.js                      # MongoDB configuration
│   │   ├── database.js                # Database connection utility
│   │   └── passport.js                # Passport OAuth strategies
│   ├── controllers/
│   │   ├── tripController.js          # Trip route handlers
│   │   └── authController.js          # Auth route handlers
│   ├── middleware/
│   │   ├── errorHandler.js            # Global error handling
│   │   ├── validation.js              # Request validation
│   │   ├── auth.js                    # JWT authentication
│   │   └── security.js                # Rate limiting, sanitization
│   ├── models/
│   │   ├── Trip.js                    # MongoDB Trip model
│   │   └── User.js                    # MongoDB User model
│   ├── routes/
│   │   ├── trips.js                   # Trip routes
│   │   ├── products.js                # Product routes
│   │   └── authRoutes.js              # Auth routes
│   ├── services/
│   │   ├── openaiService.js           # OpenAI integration
│   │   ├── placesService.js           # Google Places integration
│   │   ├── tripGenerationService.js   # Trip generation logic
│   │   ├── authService.js             # Authentication logic
│   │   └── tokenService.js            # JWT token management
│   ├── validators/
│   │   └── authValidators.js          # Joi validation schemas
│   ├── app.js                         # Express app setup
│   └── server.js                      # Server entry point
├── .env                               # Environment variables
├── .env.example                       # Environment template
├── package.json
├── README.md                          # Main documentation
└── API_DOCUMENTATION.md               # Complete API reference
```

## 🔧 Services

### Authentication Service

Complete user authentication and management:

- **Registration**: Email/password with validation
- **Login**: Secure password verification with bcrypt
- **Token Management**: JWT access tokens (15m) + refresh tokens (30d)
- **OAuth Integration**: Google, Facebook, Twitter login
- **Account Linking**: Multi-provider support for single account
- **Profile Management**: Update user info, change password
- **Account Operations**: Logout, logout all devices, delete account

### Token Service

JWT token generation and management:

- **Access Tokens**: Short-lived (15 minutes) for API requests
- **Refresh Tokens**: Long-lived (30 days) for token renewal
- **Token Rotation**: New refresh token issued on each refresh
- **Revocation**: Database-backed token validation
- **Security**: Signed with separate secrets, includes user metadata

### OpenAI Service

Generates personalized trip itineraries using GPT-4:

- Creates 3 different trip styles (Balanced, Relaxed, Action-Packed)
- Generates day-by-day activities with timing
- Provides realistic cost estimates
- Considers traveler preferences and budget

### Google Places Service

Enriches activities with real location data:

- Fetches actual place names and addresses
- Retrieves high-quality photos
- Adds ratings and reviews
- Provides accurate coordinates

### Trip Generation Service

Orchestrates the complete trip generation flow:

1. Calls OpenAI to generate base itineraries
2. Enriches each activity with Google Places data
3. Calculates accurate costs
4. Falls back to mock data if APIs fail

## 📊 Data Models

### User Model

```javascript
{
  _id: ObjectId,
  name: String (required, 2-50 chars),
  email: String (required, unique, lowercase),
  passwordHash: String (select: false),
  phoneNumber: String (optional),
  profileImage: String (URL),
  emailVerified: Boolean (default: false),

  // Multi-provider support
  authProviders: [Enum['local', 'google', 'facebook', 'twitter']],
  googleId: String (sparse, unique),
  facebookId: String (sparse, unique),
  twitterId: String (sparse, unique),

  // Token management
  refreshTokens: [{
    token: String,
    createdAt: Date (expires: 30d)
  }],

  // Account status
  isActive: Boolean (default: true),
  lastLogin: Date,

  timestamps: true (createdAt, updatedAt)
}
```

### Trip Model

```javascript
{
  trip_id: String (unique),
  user_id: String,
  destination: {
    text: String,
    place_id: String,
    name: String,
    geometry: { lat: Number, lng: Number }
  },
  dates: {
    start_date: String,
    end_date: String,
    duration_days: Number,
    month_year: String
  },
  trip_type: String,
  guests: {
    total: Number,
    adults: Number,
    children: Number,
    infants: Number,
    label: String
  },
  budget: Enum['budget', 'moderate', 'luxury', 'premium'],
  description: String,
  iterations: [TripIteration],
  selected_iteration_id: String,
  status: Enum['draft', 'generated', 'confirmed', 'archived'],
  timestamps: true
}
```

## 🛡️ Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## 🔒 Security Features

### Authentication & Authorization
- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Separate access (15m) and refresh (30d) tokens
- **Token Rotation**: New refresh token on each refresh
- **HTTP-Only Cookies**: Refresh tokens stored securely
- **Token Revocation**: Database-backed validation

### Input Protection
- **Joi Validation**: Strict input validation on all endpoints
- **MongoDB Injection**: express-mongo-sanitize strips malicious queries
- **XSS Protection**: Input sanitization and validation
- **Email Normalization**: Lowercase and trim

### Network Security
- **CORS**: Configured for specific frontend origin
- **Helmet**: Security headers (X-Frame-Options, CSP, etc.)
- **Rate Limiting**: IP-based limits on sensitive endpoints
  - Auth endpoints: 5 requests per 15 minutes
  - Critical operations: 3 requests per 15 minutes
  - General: 100 requests per 15 minutes

### API Protection
- **Environment Variables**: All secrets in .env
- **Error Sanitization**: Stack traces only in development
- **Request Size Limits**: 10MB max body size
- **Cookie Security**: Secure flag in production, SameSite protection

## 🧪 Testing

```bash
# Test health check
curl http://localhost:5000/api/health

# Test authentication - Register
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "phoneNumber": "+1234567890"
  }'

# Test authentication - Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Test protected route - Get profile
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_access_token>" \
  -b cookies.txt

# Generate a trip
curl -X POST http://localhost:5000/api/trips/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_access_token>" \
  -d @test-trip.json
```

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete testing examples.

## 📈 Performance

- **Fallback System:** Automatically uses mock data if AI APIs fail
- **Rate Limiting:** 100ms delay between Google Places requests
- **Caching:** Response data stored in MongoDB for quick retrieval
- **Async Processing:** All API calls are asynchronous

## 🤝 Integration with Frontend

### Frontend Configuration

In your frontend `.env`:

```env
VITE_API_URL=http://localhost:5000
```

### Example Frontend Call

```javascript
import { generateTripIterations } from './services/tripsService';

const response = await generateTripIterations(formData);
if (response.success) {
  navigate(`/trips/${response.data.trip_id}`);
}
```

## 📝 MVP API Checklist

### Trip Management
- ✅ **API 1:** Create Trip from Form - `POST /api/trips/generate`
- ✅ **API 2:** Generate 3 AI Trip Options - Included in API 1
- ✅ **API 3:** Select Trip Option - `PATCH /api/trips/:tripId/select-iteration`
- ✅ **API 4:** Generate Detailed Itinerary - Included in API 1
- ✅ **API 5:** Enrich Activity with Maps - Automatic in generation
- ✅ **API 6:** Get Trip - `GET /api/trips/:tripId`

### Authentication System
- ✅ **Email/Password Auth:** Registration and login
- ✅ **JWT Tokens:** Access + refresh token system
- ✅ **OAuth Integration:** Google, Facebook, Twitter
- ✅ **Account Linking:** Multi-provider support
- ✅ **User Management:** Profile, password, account operations
- ✅ **Security:** Rate limiting, validation, sanitization
- ✅ **API Documentation:** Complete endpoint reference

## 🚨 Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB is running
mongosh

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/optiontrip
```

### Authentication Issues

**"Invalid credentials" error:**
- Verify email/password are correct
- Check User exists in database
- Ensure password was hashed properly

**"Unauthorized" error:**
- Check Authorization header format: `Bearer <token>`
- Verify token hasn't expired (access tokens expire in 15m)
- Try refreshing token with `/api/auth/refresh-token`

**OAuth redirect not working:**
- Verify OAuth credentials in .env
- Check callback URLs match in OAuth provider settings
- Ensure `API_BASE_URL` and `FRONTEND_URL` are correct

**"Too many requests" error:**
- Rate limit exceeded, wait 15 minutes
- Reduce request frequency
- Check IP address isn't being shared

### OpenAI API Errors

- Verify your API key is valid
- Check you have sufficient credits
- Review rate limits on your account

### Google Places API Errors

- Enable Places API in Google Cloud Console
- Verify API key has correct permissions
- Check billing is enabled

### JWT Token Issues

**Generate new secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Clear all refresh tokens:**
```javascript
// In MongoDB shell
db.users.updateMany({}, { $set: { refreshTokens: [] } })
```

## 📞 Support

For issues or questions:
- Check the logs: `npm run dev` shows detailed error messages
- Review environment variables
- Ensure all services are configured correctly

## 🎯 Next Steps

1. ~~Add authentication/authorization~~ ✅ **Complete**
2. Add email verification for new accounts
3. Add password reset functionality
4. Implement trip booking functionality
5. Add payment processing
6. Create admin dashboard
7. Add real-time notifications
8. Implement user trip history and favorites
9. Add social features (share trips, reviews)
10. Create mobile app with React Native

---

**Built with ❤️ for OptionTrip**
