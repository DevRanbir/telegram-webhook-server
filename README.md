# Telegram Webhook Server

A Node.js Express server that handles Telegram bot webhooks and integrates with Firebase Firestore for storing chat messages.

## Setup for Localhost

### Prerequisites
- Node.js (version 14 or higher)
- A Telegram Bot Token from [@BotFather](https://t.me/botfather)
- Firebase project with Firestore enabled
- Firebase service account credentials

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd telegram-webhook-server
   npm install
   ```

2. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Fill in your actual credentials:

   ```bash
   copy .env.example .env
   ```

   Edit `.env` file with your credentials:
   ```env
   TELEGRAM_BOT_TOKEN=your_actual_bot_token
   FIREBASE_PROJECT_ID=your_firebase_project_id
   # ... other Firebase credentials
   ```

3. **Get Firebase Credentials:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key (downloads a JSON file)
   - Extract the values and put them in your `.env` file

### Running the Server

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **The server will start on:** `http://localhost:3000`

### Testing the Server

1. **Health Check:**
   Visit `http://localhost:3000/api/health` in your browser

2. **Root Endpoint:**
   Visit `http://localhost:3000` to see server info

3. **Webhook Endpoint:**
   The webhook is available at `http://localhost:3000/api/webhook/telegram`

### Setting up Telegram Webhook (for testing)

To test with a real Telegram bot, you'll need to expose your localhost to the internet using tools like:
- [ngrok](https://ngrok.com/)
- [localtunnel](https://localtunnel.github.io/www/)

Example with ngrok:
```bash
# Install ngrok and expose port 3000
ngrok http 3000

# Use the provided URL to set your Telegram webhook
# https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-ngrok-url.ngrok.io/api/webhook/telegram
```

### Project Structure

```
telegram-webhook-server/
├── api/
│   └── webhook.js          # Main webhook handler
├── .env                    # Environment variables (create from .env.example)
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore file
├── package.json           # Project dependencies and scripts
└── README.md              # This file
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token from BotFather |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `PORT` | Server port (default: 3000) |

### Troubleshooting

1. **Firebase Connection Issues:**
   - Make sure all Firebase environment variables are set correctly
   - Check that your Firebase project has Firestore enabled
   - Verify service account permissions

2. **Telegram Bot Issues:**
   - Ensure your bot token is valid
   - Check that your webhook URL is accessible from the internet
   - Verify webhook is set correctly using Telegram Bot API

3. **Server Issues:**
   - Check that port 3000 is not in use by another application
   - Verify all dependencies are installed (`npm install`)
   - Check console logs for specific error messages
