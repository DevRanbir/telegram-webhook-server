// server.js (or api/webhook.js for Vercel)
const express = require('express');
const app = express();
const cors = require('cors');

// Middleware
app.use(express.json());
app.use(cors());

// Import Firebase Admin SDK (optional, for direct Firebase access)
// const admin = require('firebase-admin');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FIREBASE_WEBHOOK_URL = process.env.FIREBASE_WEBHOOK_URL; // Your website's webhook endpoint

// Webhook endpoint for Telegram
app.post('/webhook/telegram', async (req, res) => {
  try {
    const update = req.body;
    
    // Handle message from Telegram admin
    if (update.message && update.message.text) {
      const message = update.message;
      
      // Check if this is a reply to a user message
      if (message.reply_to_message && message.reply_to_message.text) {
        const originalText = message.reply_to_message.text;
        const userIdMatch = originalText.match(/🆔 ID: ([\\w_]+)/);
        
        if (userIdMatch) {
          const userId = userIdMatch[1];
          const responseText = message.text;
          
          // Forward response to your website's Firebase
          await fetch(`${FIREBASE_WEBHOOK_URL}/api/telegram-response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userId,
              message: responseText,
              timestamp: new Date().toISOString()
            })
          });
          
          // Confirm to Telegram admin
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: message.chat.id,
              text: `✅ Response sent to user ${userId}`,
              reply_to_message_id: message.message_id
            })
          });
        }
      }
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
// Start the server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}