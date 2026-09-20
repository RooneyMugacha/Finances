import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/session';

// ─── M-Pesa SMS Parser ────────────────────────────────────────────────────────

function parseSmsMessage(rawMessage: string, rawSender: string, latestBalance: number) {
  const msg = rawMessage.trim();

  // Transaction ID (e.g. QGH8912355 or UHPOF48XG8)
  const idMatch =
    msg.match(/^([A-Z0-9]{8,12})\s+Confirmed/i) || msg.match(/\b([A-Z0-9]{8,12})\b/);
  const id =
    idMatch
      ? idMatch[1].toUpperCase()
      : 'TX' + Math.floor(10000000 + Math.random() * 90000000);

  // Check if explicit receive
  const isReceive = /received|credited|received from|you have received/i.test(msg);

  // Check if explicit send / pay / buy
  const isExplicitSend =
    /paid to|sent to|bought|you paid|you sent|debited|cost, ksh[1-9]/i.test(msg);

  // Check if Balance Check / Inquiry
  const isBalanceCheck =
    /account balance|balance was|balance is|balance inquiry|your account balance|m-pesa account/i.test(
      msg
    ) &&
    !isExplicitSend &&
    !isReceive;

  // Extract transferred amount — do NOT extract balance amounts
  let amount = 0;
  if (!isBalanceCheck) {
    const transferAmountMatch =
      msg.match(
        /(?:Ksh|KES)\s*([\d,]+\.?\d*)\s*(?:paid|sent|received|from|to|bought|credited|debited)/i
      ) ||
      msg.match(
        /(?:paid|sent|received|from|to|bought|credited|debited)\s*(?:Ksh|KES)?\s*([\d,]+\.?\d*)/i
      ) ||
      msg.match(
        /(?:You have received|You bought|paid to|sent to)\s*(?:Ksh|KES)?\s*([\d,]+\.?\d*)/i
      );

    if (transferAmountMatch) {
      amount = parseFloat(transferAmountMatch[1].replace(/,/g, ''));
    }
  }

  // Extract Balance After
  let balanceAfter = 0;
  const balMatch =
    msg.match(
      /(?:M-PESA Account|balance is|bal is|new balance|balance was|account balance was:?)\s*:?\s*(?:Ksh|KES)?\s*([\d,]+\.?\d*)/i
    ) || msg.match(/(?:Ksh|KES)\s*([\d,]+\.?\d*)\s*(?:on \d|\.|$)/i);

  if (balMatch) {
    balanceAfter = parseFloat(balMatch[1].replace(/,/g, ''));
  } else {
    balanceAfter = isReceive ? latestBalance + amount : latestBalance - amount;
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

  // Sender / Category
  let sender = rawSender || 'SMS Forwarder';
  let category =
    type === 'receive'
      ? 'Money Received'
      : type === 'balance'
      ? 'Balance Inquiry'
      : 'Expense';

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

    const combined = sender + ' ' + msg;
    if (/fuel|petrol|shell|total|rubis/i.test(combined)) category = 'Transport / Fuel';
    else if (/supermarket|retail|quickmart|naivas|carrefour/i.test(combined))
      category = 'Groceries';
    else if (/kplc|zuku|safaricom|airtime|power|internet/i.test(combined))
      category = 'Utilities';
  }

  const dateNow = new Date();
  const dateStr = `Today, ${dateNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return { id, from: rawSender || 'SMS', sender, message: msg, amount, type, category, balanceAfter, dateStr };
}

// ─── Helper: deep-extract a field from any SMS forwarder payload ──────────────

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

// ─── POST — Receive a forwarded SMS linked to a User Token ───────────────────

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

    // Identify user by token parameter in URL or payload header
    const token =
      req.nextUrl.searchParams.get('token') ||
      payload.token ||
      payload.webhookToken ||
      req.headers.get('x-webhook-token');

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Missing webhook token. Provide your token in the URL: /api/webhook/sms?token=YOUR_TOKEN',
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { webhookToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid webhook token.' },
        { status: 401 }
      );
    }

    console.log(`\n📩 [SMS Webhook] Incoming Payload for User: ${user.email} (${user.id})`);

    // Extract sender & message across all known SMS forwarder formats
    const sender =
      extractDeepField(payload, [
        'from', 'From', 'sender', 'phone', 'address',
        'originatingAddress', 'contact', 'number', 'sender_address',
      ]) || 'Unknown Sender';

    const message =
      extractDeepField(payload, [
        'message', 'Body', 'text', 'content', 'sms', 'msg',
        'body', 'payload', 'sms_body', 'text_body', 'rawBody',
      ]) || (typeof payload === 'string' ? payload : JSON.stringify(payload));

    // Get user's most recent balance for delta calculation fallback
    const latest = await prisma.smsTransaction.findFirst({
      where: { userId: user.id },
      orderBy: { receivedAt: 'desc' },
      select: { balanceAfter: true },
    });
    const latestBalance = latest?.balanceAfter ?? 0;

    // Parse into structured transaction object
    const parsed = parseSmsMessage(message, sender, latestBalance);

    // Upsert — prevents duplicate transaction IDs and binds to user
    const saved = await prisma.smsTransaction.upsert({
      where: { id: parsed.id },
      update: {
        userId: user.id,
        type: parsed.type,
        amount: parsed.amount,
        balanceAfter: parsed.balanceAfter,
        category: parsed.category,
        sender: parsed.sender,
        message: parsed.message,
        dateStr: parsed.dateStr,
      },
      create: {
        id: parsed.id,
        userId: user.id,
        from: parsed.from,
        sender: parsed.sender,
        message: parsed.message,
        amount: parsed.amount,
        type: parsed.type,
        category: parsed.category,
        balanceAfter: parsed.balanceAfter,
        dateStr: parsed.dateStr,
      },
    });

    const totalCount = await prisma.smsTransaction.count({
      where: { userId: user.id },
    });

    console.log(`✅ Stored for ${user.email}: ${saved.id} | type=${saved.type} | amount=${saved.amount}`);

    return NextResponse.json(
      {
        success: true,
        message: 'SMS received and processed successfully',
        transaction: saved,
        totalCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ [SMS Webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to process SMS webhook' },
      { status: 500 }
    );
  }
}

// ─── GET — List user's transactions ──────────────────────────────────────────

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to view transactions.' },
        { status: 401 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, webhookToken: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 404 }
      );
    }

    if (!user.webhookToken) {
      const crypto = require('crypto');
      const newToken = 'usr_' + crypto.randomBytes(12).toString('hex');
      user = await prisma.user.update({
        where: { id: user.id },
        data: { webhookToken: newToken },
        select: { id: true, email: true, name: true, webhookToken: true },
      });
    }

    const transactions = await prisma.smsTransaction.findMany({
      where: { userId: user.id },
      orderBy: { receivedAt: 'desc' },
    });

    return NextResponse.json(
      {
        success: true,
        status: 'online',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          webhookToken: user.webhookToken,
        },
        totalCount: transactions.length,
        transactions,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ [SMS Webhook] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
