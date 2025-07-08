import dotenv from 'dotenv';
dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
  process.exit(1);
}

async function setupTelegramWebhook() {
  const webhookUrl = process.argv[2];
  
  if (!webhookUrl) {
    console.log(`
📋 Telegram Webhook Setup Instructions:

1. First, expose your localhost using ngrok:
   - Download ngrok from https://ngrok.com/
   - Run: ngrok http 3500
   - Copy the https URL (e.g., https://abc123.ngrok.io)

2. Then run this script with your ngrok URL:
   node setup-webhook.js https://857c62433459.ngrok-free.app/api/webhook/telegram

3. Or set webhook manually:
   https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=https://your-ngrok-url.ngrok.io/api/webhook/telegram

Current bot info:
`);
    
    // Get bot info
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
      const data = await response.json();
      
      if (data.ok) {
        console.log(`✅ Bot: @${data.result.username} (${data.result.first_name})`);
        console.log(`🆔 Bot ID: ${data.result.id}`);
      } else {
        console.error('❌ Invalid bot token');
      }
    } catch (error) {
      console.error('❌ Error fetching bot info:', error.message);
    }
    
    return;
  }

  try {
    console.log(`🔗 Setting webhook URL: ${webhookUrl}`);
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message']
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Webhook set successfully!');
      console.log('📱 Your bot will now send all messages to your Firebase database');
      console.log('🧪 Try sending "hi" to your bot to test');
    } else {
      console.error('❌ Failed to set webhook:', data.description);
    }
    
    // Get webhook info
    const infoResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    const infoData = await infoResponse.json();
    
    if (infoData.ok) {
      console.log('\\n📋 Webhook Info:');
      console.log(`   URL: ${infoData.result.url}`);
      console.log(`   Pending updates: ${infoData.result.pending_update_count}`);
      console.log(`   Last error: ${infoData.result.last_error_message || 'None'}`);
    }
    
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
  }
}

setupTelegramWebhook();
