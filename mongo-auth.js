const { AuthStrategy } = require('whatsapp-web.js');
const mongoose = require('mongoose');

class MongoAuth extends AuthStrategy {
  constructor({ modelName = 'whatsapp_sessions' }) {
    super();
    this.modelName = modelName;
    this.sessionModel = null;
  }

  async beforeAuthInit() {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Define session schema
    const sessionSchema = new mongoose.Schema({
      sessionId: String,
      data: Object,
      createdAt: { type: Date, expires: '30d', default: Date.now }
    });

    this.sessionModel = mongoose.model(this.modelName, sessionSchema);
  }

  async afterAuthInit() {
    // Optional cleanup
  }

  async getAuthData() {
    const session = await this.sessionModel.findOne({ sessionId: 'default' });
    return session?.data || null;
  }

  async saveAuthData(data) {
    await this.sessionModel.findOneAndUpdate(
      { sessionId: 'default' },
      { $set: { data } },
      { upsert: true }
    );
  }

  async clearAuthData() {
    await this.sessionModel.deleteOne({ sessionId: 'default' });
  }
}

module.exports = MongoAuth
