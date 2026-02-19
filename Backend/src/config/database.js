import mongoose from 'mongoose';

/**
 * Database connection configuration and utilities
 */
class Database {
  constructor() {
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB database
   */
  async connect() {
    // Avoid multiple connections
    if (this.isConnected) {
      console.log('📦 Using existing database connection');
      return;
    }

    try {
      const options = {
        // Use new URL parser
        useNewUrlParser: true,
        useUnifiedTopology: true,

        // Connection pool settings
        maxPoolSize: 10,
        minPoolSize: 5,

        // Timeout settings
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,

        // Automatic index creation
        autoIndex: process.env.NODE_ENV !== 'production',

        // Retry settings
        retryWrites: true,
        w: 'majority'
      };

      const conn = await mongoose.connect(process.env.MONGODB_URI, options);

      this.isConnected = true;

      console.log('✅ MongoDB Connected Successfully');
      console.log(`📍 Database: ${conn.connection.name}`);
      console.log(`🔗 Host: ${conn.connection.host}`);
      console.log(`⚡ Port: ${conn.connection.port}`);

      // Handle connection events
      this.setupEventHandlers();

    } catch (error) {
      console.error('❌ MongoDB Connection Error:', error.message);
      console.error('💡 Check your MONGODB_URI in .env file');

      // Exit process with failure
      process.exit(1);
    }
  }

  /**
   * Setup database event handlers
   */
  setupEventHandlers() {
    const db = mongoose.connection;

    // Connection error after initial connection
    db.on('error', (error) => {
      console.error('❌ MongoDB Connection Error:', error.message);
      this.isConnected = false;
    });

    // Disconnected event
    db.on('disconnected', () => {
      console.warn('⚠️  MongoDB Disconnected');
      this.isConnected = false;
    });

    // Reconnected event
    db.on('reconnected', () => {
      console.log('✅ MongoDB Reconnected');
      this.isConnected = true;
    });

    // Process termination - close connection gracefully
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });

    // MongoDB driver 4.0+ deprecations
    mongoose.set('strictQuery', false);
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('👋 MongoDB Connection Closed');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error.message);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      isConnected: this.isConnected,
      readyState: states[mongoose.connection.readyState],
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }

  /**
   * Drop database (use with caution - only for testing)
   */
  async dropDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop database in production!');
    }

    try {
      await mongoose.connection.dropDatabase();
      console.log('🗑️  Database dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping database:', error.message);
      throw error;
    }
  }

  /**
   * Clear all collections (use with caution - only for testing)
   */
  async clearCollections() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear collections in production!');
    }

    try {
      const collections = mongoose.connection.collections;

      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }

      console.log('🧹 All collections cleared');
    } catch (error) {
      console.error('❌ Error clearing collections:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
const database = new Database();
export default database;
