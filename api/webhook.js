import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.warn('⚠️ Missing TELEGRAM_BOT_TOKEN in environment variables!');
}

// Import Firebase Admin SDK for direct database access
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (only if not already initialized)
if (!getApps().length) {
  try {
    // You'll need to set these environment variables in Vercel
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

const db = getFirestore();

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

    console.log(`🎯 EXTRACTED DATA:`);
    console.log(`   - UserId: "${userId}"`);
    console.log(`   - Response: "${responseText}"`);
    console.log(`   - Original quoted text: "${originalText}"`);

    console.log(`➡️ Storing response in Firebase for userId=${userId}:`, responseText);

    try {
      // Store response directly in Firebase
      const chatMessage = {
        message: responseText,
        userId: userId,
        userName: 'Support Team',
        timestamp: new Date(), // Will be converted to Firestore timestamp
        createdAt: new Date().toISOString(),
        isFromTelegram: true,
        messageType: 'support',
        originalMessageId: null
      };

      const docRef = await db.collection('chat-messages').add(chatMessage);
      console.log('✅ Response stored in Firebase with ID:', docRef.id);

    } catch (firebaseError) {
      console.error('❌ Error storing in Firebase:', firebaseError);
      return res.status(500).json({ error: 'Failed to store response in Firebase' });
    }

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