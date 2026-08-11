import mongoose from 'mongoose';

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) {
      console.log('📦 Using existing database connection');
      return;
    }

    try {
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,

        maxPoolSize: 10,
        minPoolSize: 5,

        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,

        autoIndex: process.env.NODE_ENV !== 'production',

        retryWrites: true,
        w: 'majority'
      };

      const conn = await mongoose.connect(process.env.MONGODB_URI, options);

      this.isConnected = true;

      console.log('✅ MongoDB Connected Successfully');
      console.log(`📍 Database: ${conn.connection.name}`);
      console.log(`🔗 Host: ${conn.connection.host}`);
      console.log(`⚡ Port: ${conn.connection.port}`);

      this.setupEventHandlers();

    } catch (error) {
      console.error('❌ MongoDB Connection Error:', error.message);
      console.error('💡 Check your MONGODB_URI in .env file');

      process.exit(1);
    }
  }

  setupEventHandlers() {
    const db = mongoose.connection;

    db.on('error', (error) => {
      console.error('❌ MongoDB Connection Error:', error.message);
      this.isConnected = false;
    });

    db.on('disconnected', () => {
      console.warn('⚠️  MongoDB Disconnected');
      this.isConnected = false;
    });

    db.on('reconnected', () => {
      console.log('✅ MongoDB Reconnected');
      this.isConnected = true;
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });

    mongoose.set('strictQuery', false);
  }

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

const database = new Database();
export default database;
