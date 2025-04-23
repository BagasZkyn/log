require('dotenv').config();
const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const MongoAuth = require('../mongo-auth');

const app = express();
app.use(express.json());

let client = null;

// Init WhatsApp Client
const initClient = async () => {
  client = new Client({
    authStrategy: new MongoAuth({
      modelName: process.env.SESSION_MODEL_NAME || 'whatsapp_sessions'
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  // QR Code Handler
  client.on('qr', async (qr) => {
    console.log('QR RECEIVED:', qr);
    app.get('/qr', async (req, res) => {
      const qrImage = await qrcode.toDataURL(qr);
      res.send(`<img src="${qrImage}" alt="QR Code"/>`);
    });
  });

  // Ready Handler
  client.on('ready', () => {
    console.log('Client is ready!');
  });

  // Message Handler
  client.on('message', message => {
    if (message.body === '!ping') {
      message.reply('pong');
    }
  });

  await client.initialize();
};

// Routes
app.get('/', async (req, res) => {
  if (!client) await initClient();
  res.send('WhatsApp Bot is running');
});

app.get('/restart', async (req, res) => {
  if (client) await client.destroy();
  await initClient();
  res.send('Restarted');
});

module.exports = app
