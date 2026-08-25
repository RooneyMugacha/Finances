import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to store received SMS transactions persistently
const DATA_FILE = path.join(process.cwd(), 'received_sms.json');

// M-Pesa SMS text parser
function parseSmsMessage(rawMessage: string, rawSender: string, currentTransactions: any[]) {
  const msg = rawMessage.trim();
  
  // Transaction ID (e.g. QGH8912355 or UHPOF48XG8)
  const idMatch = msg.match(/^([A-Z0-9]{8,12})\s+Confirmed/i) || msg.match(/\b([A-Z0-9]{8,12})\b/);
  const id = idMatch ? idMatch[1].toUpperCase() : 'TX' + Math.floor(10000000 + Math.random() * 90000000);

  // Check if explicit receive
  const isReceive = /received|credited|received from|you have received/i.test(msg);

  // Check if explicit send / pay / buy
  const isExplicitSend = /paid to|sent to|bought|you paid|you sent|debited|cost, ksh[1-9]/i.test(msg);

  // Check if Balance Check / Inquiry
  const isBalanceCheck =
    /account balance|balance was|balance is|balance inquiry|your account balance|m-pesa account/i.test(msg) &&
    !isExplicitSend &&
    !isReceive;

  // Extract transferred amount (e.g. "Ksh1,200.00 paid to..." or "You have received Ksh5,000.00...")
  // Do NOT extract balance amounts (e.g. Ksh6,107.51 in "Account balance was: Ksh6,107.51") as transferred amounts!
  let amount = 0;
  if (!isBalanceCheck) {
    const transferAmountMatch =
      msg.match(/(?:Ksh|KES)\s*([\d,]+\.?\d*)\s*(?:paid|sent|received|from|to|bought|credited|debited)/i) ||
      msg.match(/(?:paid|sent|received|from|to|bought|credited|debited)\s*(?:Ksh|KES)?\s*([\d,]+\.?\d*)/i) ||
      msg.match(/(?:You have received|You bought|paid to|sent to)\s*(?:Ksh|KES)?\s*([\d,]+\.?\d*)/i);

    if (transferAmountMatch) {
      amount = parseFloat(transferAmountMatch[1].replace(/,/g, ''));
    }
  }

  // Extract Balance After (e.g. "M-PESA Account : Ksh6,107.51" or "New M-PESA balance is Ksh16,250.00")
  let balanceAfter = 0;
  const balMatch =
    msg.match(/(?:M-PESA Account|balance is|bal is|new balance|balance was|account balance was:?)\s*:?\s*(?:Ksh|KES)?\s*([\d,]+\.?\d*)/i) ||
    msg.match(/(?:Ksh|KES)\s*([\d,]+\.?\d*)\s*(?:on \d|\.|$)/i);

  if (balMatch) {
    balanceAfter = parseFloat(balMatch[1].replace(/,/g, ''));
  } else {
    const prevBal = currentTransactions.length > 0 ? currentTransactions[0].balanceAfter : 0;
    balanceAfter = isReceive ? prevBal + amount : prevBal - amount;
  }

  // Final Type Determination
  let type = 'send';
  if (isReceive) {
    type = 'receive';
  } else if (isBalanceCheck || amount === 0) {
    type = 'balance';
    amount = 0;
  } else {
    type = 'send';
  }

  // Sender or Category
  let sender = rawSender || 'SMS Forwarder';
  let category = type === 'receive' ? 'Money Received' : type === 'balance' ? 'Balance Inquiry' : 'Expense';

  if (type === 'balance') {
    sender = 'M-PESA Balance Inquiry';
    category = 'Balance Inquiry';
  } else if (isReceive) {
    const m = msg.match(/from\s+([^on]+?)(?=\s+on|\s+at|\.|$)/i);
    if (m) sender = m[1].trim();
    category = 'Income / Transfer';
  } else {
    if (/paid to\s+([^on]+)/i.test(msg)) {
      const m = msg.match(/paid to\s+([^on]+?)(?=\s+on|\s+at|\.|$)/i);
      if (m) sender = m[1].trim();
    } else if (/sent to\s+([^on]+)/i.test(msg)) {
      const m = msg.match(/sent to\s+([^on]+?)(?=\s+on|\s+at|\.|$)/i);
      if (m) sender = m[1].trim();
    } else if (/bought\s+(?:Ksh|KES)?[\d,.]+\s+of\s+airtime/i.test(msg)) {
      sender = 'Airtime Purchase';
      category = 'Utilities';
    }

    if (/fuel|petrol|shell|total|rubis/i.test(sender + ' ' + msg)) category = 'Transport / Fuel';
    else if (/supermarket|retail|quickmart|naivas|carrefour/i.test(sender + ' ' + msg)) category = 'Groceries';
    else if (/kplc|zuku|safaricom|airtime|power|internet/i.test(sender + ' ' + msg)) category = 'Utilities';
  }

  const dateNow = new Date();
  const dateStr = `Today, ${dateNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return {
    id,
    from: rawSender || 'SMS',
    sender,
    message: msg,
    amount,
    type,
    category,
    balanceAfter,
    timestamp: dateNow.toISOString(),
    dateStr
  };
}

// Read stored transactions safely with auto-repair
function getStoredTransactions() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      if (data && data.trim() !== '') {
        const rawList = JSON.parse(data);
        if (Array.isArray(rawList)) {
          // Re-parse all stored messages to apply latest parser rules dynamically
          const reparsedList = rawList.map((tx: any) => {
            if (tx.message) {
              const reparsed = parseSmsMessage(tx.message, tx.from || tx.sender, []);
              return {
                ...tx,
                type: reparsed.type,
                amount: reparsed.amount,
                balanceAfter: reparsed.balanceAfter,
                category: reparsed.category,
                sender: reparsed.sender
              };
            }
            return tx;
          });
          // Save reparsed back to disk to permanently repair
          saveTransactions(reparsedList);
          return reparsedList;
        }
      }
    }
  } catch (err) {
    console.error('Error reading received_sms.json:', err);
  }
  return [];
}

// Write transactions safely
function saveTransactions(transactions: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(transactions, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving received_sms.json:', err);
  }
}

// Helper to deeply extract fields from any SMS forwarder payload
function extractDeepField(obj: any, candidateKeys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;

  for (const key of candidateKeys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return String(obj[key]);
    }
  }

  for (const k in obj) {
    if (typeof obj[k] === 'object') {
      const found = extractDeepField(obj[k], candidateKeys);
      if (found) return found;
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let payload: any = {};

    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await req.formData();
      const obj: Record<string, any> = {};
      formData.forEach((value, key) => {
        obj[key] = value.toString();
      });
      payload = obj;
    } else {
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { rawBody: text, message: text };
      }
    }

    console.log('\n📩 [SMS Webhook] Incoming Webhook Payload Received');
    console.log('--------------------------------------------------');
    console.log('Content-Type:', contentType);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Extract sender & message across all known Android SMS Forwarders / Twilio / Tasker formats
    const sender =
      extractDeepField(payload, [
        'from',
        'From',
        'sender',
        'phone',
        'address',
        'originatingAddress',
        'contact',
        'number',
        'sender_address'
      ]) || 'Unknown Sender';

    const message =
      extractDeepField(payload, [
        'message',
        'Body',
        'text',
        'content',
        'sms',
        'msg',
        'body',
        'payload',
        'sms_body',
        'text_body',
        'rawBody'
      ]) || (typeof payload === 'string' ? payload : JSON.stringify(payload));

    console.log(`Parsed Sender : ${sender}`);
    console.log(`Parsed Content: ${message}`);
    console.log('--------------------------------------------------\n');

    // Get current stored transactions
    const currentTx = getStoredTransactions();

    // Parse into structured transaction object
    const parsedTx = parseSmsMessage(message, sender, currentTx);

    // Prevent exact duplicate transaction IDs
    const updatedTx = [parsedTx, ...currentTx.filter((t: any) => t.id !== parsedTx.id)];
    
    // Save to persistent json file
    saveTransactions(updatedTx);

    return NextResponse.json(
      {
        success: true,
        message: 'SMS received and processed successfully',
        transaction: parsedTx,
        totalCount: updatedTx.length
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ [SMS Webhook] Error processing request:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process SMS webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const transactions = getStoredTransactions();
  return NextResponse.json(
    {
      status: 'online',
      service: 'SMS Webhook Listener',
      totalCount: transactions.length,
      transactions,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
