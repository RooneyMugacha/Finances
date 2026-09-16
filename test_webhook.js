const fs = require('fs');
const path = require('path');

// Load .env manually (no dotenv dependency required)
try {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
} catch (e) { /* ignore */ }

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook/sms';
const messages = JSON.parse(fs.readFileSync('./mock_sms.json', 'utf-8'));

async function sendMessages() {
  console.log(`\n🎯 Target URL  : ${WEBHOOK_URL}`);
  console.log(`📨 Messages    : ${messages.length} test SMS messages\n`);

  for (let i = 0; i < messages.length; i++) {
    const item = messages[i];
    console.log(`[${i + 1}/${messages.length}] Sending SMS from "${item.from}"...`);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',   // bypass ngrok free-tier interstitial
        },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        console.log(`   ✅ Success — Type: ${data.transaction?.type} | Amount: Ksh${data.transaction?.amount} | ID: ${data.transaction?.id}`);
      } else {
        console.log(`   ❌ Failed  — ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error(`   ❌ Error   — ${err.message}`);
    }
  }

  console.log('\n🎉 Done! Check received_sms.json for stored transactions.\n');
}

sendMessages();
