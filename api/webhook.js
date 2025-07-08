import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FIREBASE_WEBHOOK_URL = process.env.FIREBASE_WEBHOOK_URL;

if (!TELEGRAM_BOT_TOKEN || !FIREBASE_WEBHOOK_URL) {
  console.warn('⚠️ Missing TELEGRAM_BOT_TOKEN or FIREBASE_WEBHOOK_URL in environment variables!');
}

// Telegram webhook endpoint
app.post('/api/webhook/telegram', async (req, res) => {
  try {
    const update = req.body;
    console.log('✅ Incoming Telegram update:', JSON.stringify(update, null, 2));

    // Check for message
    if (!update.message || !update.message.text) {
      console.log('⚠️ No text message found in update');
      return res.status(200).json({ success: true });
    }

    const message = update.message;

    // Check if admin reply quotes a user message
    if (!message.reply_to_message || !message.reply_to_message.text) {
      console.log('⚠️ No reply_to_message.text found');
      return res.status(200).json({ success: true });
    }

    const originalText = message.reply_to_message.text;
    console.log('📝 Original quoted text:', originalText);

    // Extract userId from quoted message
    const userIdMatch = originalText.match(/🆔 <b>ID:<\/b> <code>([^<]+)<\/code>/);
    console.log('🔎 userIdMatch:', userIdMatch);

    if (!userIdMatch) {
      console.log('❌ Could not extract userId from quoted text');
      return res.status(200).json({ success: false, error: 'User ID not found in original message' });
    }

    const userId = userIdMatch[1].trim();
    const responseText = message.text.trim();

    console.log(`➡️ Forwarding response to Firebase for userId=${userId}:`, responseText);

    // Forward to website's Firebase webhook
    const firebaseResponse = await fetch(`${FIREBASE_WEBHOOK_URL}/api/telegram-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        message: responseText,
        timestamp: new Date().toISOString()
      })
    });

    console.log('✅ Firebase webhook response status:', firebaseResponse.status);

    // Confirm to Telegram admin in chat
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: `✅ Response sent to user ${userId}`,
        reply_to_message_id: message.message_id
      })
    });

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default app;
