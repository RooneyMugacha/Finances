const fs = require('fs');

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook/sms';
const messages = JSON.parse(fs.readFileSync('./mock_sms.json', 'utf-8'));

async function sendMessages() {
  console.log(`🚀 Sending ${messages.length} test SMS messages to ${WEBHOOK_URL}...\n`);

  for (let i = 0; i < messages.length; i++) {
    const item = messages[i];
    console.log(`[${i + 1}/${messages.length}] Sending SMS from ${item.from}...`);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      console.log(`   --> Result:`, data.success ? '✅ Success' : '❌ Failed');
    } catch (err) {
      console.error(`   --> Error:`, err.message);
    }
  }

  console.log('\n🎉 Finished sending all test messages!');
}

sendMessages();
