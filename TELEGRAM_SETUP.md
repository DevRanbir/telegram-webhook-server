# Complete Telegram Bot → Firebase Setup Guide

## 🎯 What This Does
Your Telegram bot will now automatically save ALL incoming messages to your Firebase database!

## 📋 Step-by-Step Setup

### Step 1: Start Your Server
```bash
npm run dev
```
Your server should start on `http://localhost:3500`

### Step 2: Expose Localhost to Internet

**Option A: Using ngrok (Recommended)**
1. Download ngrok: https://ngrok.com/download
2. Extract and run:
   ```bash
   ngrok http 3500
   ```
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Option B: Using localtunnel**
```bash
npm install -g localtunnel
lt --port 3500
```

### Step 3: Set Telegram Webhook

**Method 1: Using our setup script**
```bash
npm run setup-webhook https://your-ngrok-url.ngrok.io/api/webhook/telegram
```

**Method 2: Manual URL**
Visit this URL in your browser (replace with your ngrok URL):
```
https://api.telegram.org/bot8118284542:AAG-XJMrd1EelpOY8g2eKGOhitzmHfjWwmo/setWebhook?url=https://your-ngrok-url.ngrok.io/api/webhook/telegram
```

### Step 4: Test Your Bot
1. Open Telegram
2. Find your bot
3. Send any message (e.g., "hello")
4. Check your server console logs
5. Check your Firebase console → Firestore → `chat-messages` collection

## 🔍 What Gets Saved to Firebase

Every message creates a document in `chat-messages` collection with:
```json
{
  "message": "User's message text",
  "userId": "Telegram user ID",
  "userName": "User's first name",
  "timestamp": "Firestore timestamp",
  "createdAt": "ISO string",
  "isFromTelegram": true,
  "messageType": "user_message",
  "telegramMessageId": "Message ID from Telegram",
  "chatId": "Chat ID"
}
```

## 🧪 Testing Commands

Send these to your bot to test:
- `hi` - Gets auto-reply + saved to Firebase
- `hello` - Gets auto-reply + saved to Firebase  
- `test` - Gets auto-reply + saved to Firebase
- `ping` - Gets auto-reply + saved to Firebase
- Any other message - Just saved to Firebase

## 🔧 Troubleshooting

**Bot not responding?**
1. Check server console for errors
2. Verify webhook URL is set: `https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo`
3. Make sure ngrok is still running
4. Check Firebase rules allow writes

**Messages not in Firebase?**
1. Check server console logs
2. Verify Firebase credentials in `.env`
3. Check Firebase Firestore rules
4. Look for Firebase errors in console

**Webhook errors?**
1. Make sure webhook URL uses HTTPS (ngrok provides this)
2. Check that `/api/webhook/telegram` path is correct
3. Verify bot token is correct

## 🎉 Success Indicators

✅ Server console shows: "✅ Regular message stored in Firebase with ID: xxx"
✅ Firebase console shows new documents in `chat-messages`
✅ Bot sends auto-replies to test messages
✅ No error messages in console

Your bot is now fully connected to Firebase! 🚀
