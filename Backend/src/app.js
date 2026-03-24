// IMPORTANT: Load environment variables FIRST before any other imports
import "./config/env.js";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import passport from "passport";
import cookieParser from "cookie-parser";
import session from "express-session";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import productsRouter from "./routes/products.js";
import tripsRouter from "./routes/trips.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chat.js";
import youtubeRouter from "./routes/youtube.js";
import translateRouter from "./routes/translate.js";
import contactRouter from "./routes/contact.js";
import voiceRouter from "./routes/voice.js";
import flightsRouter from "./routes/flights.js";
import hotelsRouter from "./routes/hotels.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { corsOptions } from "./middleware/security.js";
import "./config/passport.js";

connectDB();

const app = express();

// CORS Configuration (must be early)
app.use(cors(corsOptions));

// Body Parser Middlewares (must be before sanitization)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Security Middlewares (after body parsing)
app.use(helmet());
// Note: mongo-sanitize disabled due to Express 5 compatibility issues
// Input validation is handled by Joi validators which prevent NoSQL injection
// app.use(mongoSanitize());

// Session Configuration (required for Twitter OAuth 1.0a)
app.use(session({
  secret: process.env.JWT_ACCESS_SECRET || 'your-session-secret',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 300000 // 5 minutes - for OAuth flow
  }
}));

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "OptionTrip Backend API is running",
    version: "1.0.0",
    endpoints: {
      trips: "/api/trips",
      products: "/api/products",
      auth: "/api/auth",
      chat: "/api/chat"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
      googlePlaces: process.env.GOOGLE_PLACES_API_KEY ? "configured" : "missing"
    }
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/chat", chatRoutes);
app.use("/api/youtube", youtubeRouter);
app.use("/api/translate", translateRouter);
app.use("/api/contact", contactRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/flights", flightsRouter);
app.use("/api/hotels", hotelsRouter);

// 404 Handler - must be after all routes
app.use(notFoundHandler);

// Error Handler - must be last
app.use(errorHandler);

export default app;
