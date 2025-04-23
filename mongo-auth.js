const { Client } = require('whatsapp-web.js');
const mongoose = require('mongoose');

// Perbaikan: Gunakan BaseAuthStrategy yang benar
class MongoAuth extends Client.AuthStrategy {
  constructor({ modelName = 'whatsapp_sessions' }) {
    super();
    this.modelName = modelName;
    this.sessionModel = null;
  }

  async beforeAuthInit() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      const sessionSchema = new mongoose.Schema({
        sessionId: { type: String, default: 'default' },
        data: Object,
        createdAt: { type: Date, expires: '30d', default: Date.now }
      });

      this.sessionModel = mongoose.model(this.modelName, sessionSchema);
      console.log('MongoDB connected');
    } catch (err) {
      console.error('MongoDB connection error:', err);
      throw err;
    }
  }

  async afterAuthInit() {
    // Optional cleanup
  }

  async getAuthData() {
    try {
      const session = await this.sessionModel.findOne({ sessionId: 'default' });
      return session?.data || null;
    } catch (err) {
      console.error('Error getting auth data:', err);
      return null;
    }
  }

  async saveAuthData(data) {
    try {
      await this.sessionModel.findOneAndUpdate(
        { sessionId: 'default' },
        { $set: { data } },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error('Error saving auth data:', err);
    }
  }

  async clearAuthData() {
    try {
      await this.sessionModel.deleteOne({ sessionId: 'default' });
    } catch (err) {
      console.error('Error clearing auth data:', err);
    }
  }
}

module.exports = MongoAuth;
