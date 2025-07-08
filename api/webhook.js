import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Port configuration for localhost
const PORT = process.env.PORT || 3000;

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
    
    // Log basic message info for debugging
    console.log('📱 Message details:');
    console.log(`   - From: ${message.from?.first_name || 'Unknown'} (ID: ${message.from?.id})`);
    console.log(`   - Text: "${message.text}"`);
    console.log(`   - Chat ID: ${message.chat?.id}`);
    console.log(`   - Is reply: ${!!message.reply_to_message}`);

    // Check if admin reply quotes a user message
    if (!message.reply_to_message || !message.reply_to_message.text) {
      console.log('⚠️ No reply_to_message.text found - this is a regular message, not an admin reply');
      console.log('💡 Storing regular message to Firebase');
      
      // Store regular messages to Firebase
      try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
        
        const chatMessage = {
          message: message.text,
          userId: message.from.id.toString(),
          userName: message.from.first_name || 'Unknown User',
          timestamp: now,
          createdAt: now.toISOString(),
          expiresAt: expiresAt, // TTL field for automatic deletion
          isFromTelegram: true,
          messageType: 'user_message',
          telegramMessageId: message.message_id,
          chatId: message.chat.id.toString()
        };

        const docRef = await db.collection('chat-messages').add(chatMessage);
        console.log('✅ Regular message stored in Firebase with ID:', docRef.id);
      } catch (firebaseError) {
        console.error('❌ Error storing regular message in Firebase:', firebaseError);
      }
      
      // For testing: respond to simple messages like "hi", "hello", "test"
      const testMessages = ['hi', 'hello', 'test', 'ping'];
      if (testMessages.includes(message.text.toLowerCase())) {
        console.log('🧪 Test message detected, sending auto-reply');
        
        try {
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: message.chat.id,
              text: `👋 Hello! I received your message: "${message.text}"\n\n🤖 This message has been stored in Firebase!\n📡 Server is working correctly!`,
              reply_to_message_id: message.message_id
            })
          });
          console.log('✅ Test reply sent successfully');
        } catch (replyError) {
          console.error('❌ Error sending test reply:', replyError);
        }
      }
      
      return res.status(200).json({ success: true, note: 'Regular message received and stored in Firebase' });
    }

    const originalText = message.reply_to_message.text;
    console.log('📝 Original quoted text:', originalText);

    // Extract userId from quoted message - multiple patterns to handle different formats
    let userIdMatch = originalText.match(/🆔 ID: ([^\n]+)/);
    
    // If first pattern fails, try alternative patterns
    if (!userIdMatch) {
      userIdMatch = originalText.match(/user_\d+_[a-z0-9]+/);
      if (userIdMatch) {
        userIdMatch = [userIdMatch[0], userIdMatch[0]]; // Format to match expected array structure
      }
    }
    
    console.log('🔎 userIdMatch:', userIdMatch);

    if (!userIdMatch) {
      console.log('❌ Could not extract userId from quoted text');
      console.log('📝 Trying all possible extraction methods...');
      
      // Try more alternative patterns
      const patterns = [
        /ID:\s*([^\s\n]+)/,
        /user_\d+_[a-z\d]+/,
        /🆔[^:]*:\s*([^\n]+)/,
        /ID[^:]*:\s*([^\n]+)/
      ];
      
      let foundUserId = null;
      for (const pattern of patterns) {
        const match = originalText.match(pattern);
        if (match) {
          foundUserId = match[1] || match[0];
          console.log('✅ Found user ID with pattern:', pattern, '→', foundUserId);
          break;
        }
      }
      
      if (foundUserId) {
        const responseText = message.text.trim();
        
        // Store response with extracted user ID
        try {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
          
          const chatMessage = {
            message: responseText,
            userId: foundUserId,
            userName: 'Support Team',
            timestamp: now,
            createdAt: now.toISOString(),
            expiresAt: expiresAt, // TTL field for automatic deletion
            isFromTelegram: true,
            messageType: 'support',
            originalMessageId: null,
            replyToUser: true
          };

          const docRef = await db.collection('chat-messages').add(chatMessage);
          console.log('✅ Support response stored in Firebase with ID:', docRef.id);
          
          // Confirm to Telegram admin in chat
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: message.chat.id,
              text: `✅ Response sent to user ${foundUserId}`,
              reply_to_message_id: message.message_id
            })
          });
          
          return res.status(200).json({ success: true });
        } catch (firebaseError) {
          console.error('❌ Error storing support response in Firebase:', firebaseError);
        }
      }
      
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
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
      
      const chatMessage = {
        message: responseText,
        userId: userId,
        userName: 'Support Team',
        timestamp: now, // Will be converted to Firestore timestamp
        createdAt: now.toISOString(),
        expiresAt: expiresAt, // TTL field for automatic deletion
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

// GET endpoint for webhook testing (shows webhook info)
app.get('/api/webhook/telegram', (req, res) => {
  res.json({
    message: 'Telegram Webhook Endpoint',
    method: 'This endpoint accepts POST requests from Telegram',
    status: 'Ready to receive webhooks',
    timestamp: new Date().toISOString(),
    botTokenConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
    firebaseConfigured: !!process.env.FIREBASE_PROJECT_ID
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Telegram Webhook Server is running!', 
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: '/api/webhook/telegram',
      health: '/api/health'
    }
  });
});

// Start server only if not in serverless environment
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


export default app;