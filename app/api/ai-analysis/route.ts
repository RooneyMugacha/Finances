import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') === 'day' ? 'day' : 'week';

    const now = new Date();
    const startDate = new Date();
    if (period === 'day') {
      startDate.setHours(startDate.getHours() - 24);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    // Fetch transactions within timeframe
    let transactions = await prisma.smsTransaction.findMany({
      where: {
        receivedAt: {
          gte: startDate,
        },
      },
      orderBy: { receivedAt: 'desc' },
    });

    // If no transactions in recent period, fallback to all transactions to ensure user gets insights
    if (transactions.length === 0) {
      transactions = await prisma.smsTransaction.findMany({
        take: 50,
        orderBy: { receivedAt: 'desc' },
      });
    }

    let totalReceived = 0;
    let totalSent = 0;
    const categoryTotals: Record<string, number> = {};
    const topPayees: Record<string, number> = {};
    const topSenders: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'receive') {
        totalReceived += tx.amount;
        topSenders[tx.sender] = (topSenders[tx.sender] || 0) + tx.amount;
      } else if (tx.type === 'send') {
        totalSent += tx.amount;
        topPayees[tx.sender] = (topPayees[tx.sender] || 0) + tx.amount;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
      }
    });

    const netCashflow = totalReceived - totalSent;

    // Generate response data
    const statsData = {
      period,
      totalReceived,
      totalSent,
      netCashflow,
      txCount: transactions.length,
      categoryTotals,
      topPayees,
      topSenders,
    };

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `You are an expert personal finance advisor for M-Pesa users in Kenya.
Analyze this ${period === 'day' ? 'daily (past 24h)' : 'weekly (past 7 days)'} financial summary for a user:

- Period: ${period === 'day' ? 'Last 24 Hours' : 'Past 7 Days'}
- Total Received: KES ${totalReceived.toLocaleString('en-US')}
- Total Sent (Outflow): KES ${totalSent.toLocaleString('en-US')}
- Net Cashflow: KES ${netCashflow.toLocaleString('en-US')}
- Number of Transactions: ${transactions.length}

Outflow Categories:
${Object.entries(categoryTotals).map(([c, a]) => `- ${c}: KES ${a.toLocaleString('en-US')}`).join('\n') || '- None recorded'}

Top Outflow Payees/Merchants:
${Object.entries(topPayees).slice(0, 5).map(([p, a]) => `- ${p}: KES ${a.toLocaleString('en-US')}`).join('\n') || '- None recorded'}

Top Inflow Senders:
${Object.entries(topSenders).slice(0, 5).map(([s, a]) => `- ${s}: KES ${a.toLocaleString('en-US')}`).join('\n') || '- None recorded'}

Provide structured actionable advice in JSON format. Do not use Markdown formatting inside JSON strings. Return ONLY valid JSON:
{
  "headline": "Catchy 1-line overview of spending pattern",
  "highlights": [
    "Highlight key spend category (e.g. food/airtime/fuel) with exact percentages or amounts",
    "Highlight income vs spending ratio",
    "Practical money-saving tip tailored to Kenyan M-Pesa usage"
  ],
  "breakdownSummary": "2-3 sentence friendly summary of where the money went and potential money leaks."
}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (res.ok) {
          const aiJson = await res.json();
          const rawText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsedAi = JSON.parse(rawText);
            return NextResponse.json({
              success: true,
              source: 'gemini-ai',
              stats: statsData,
              aiAnalysis: parsedAi,
            });
          }
        }
      } catch (aiErr) {
        console.error('Gemini API call failed, using fallback:', aiErr);
      }
    }

    // Smart fallback analysis if no GEMINI_API_KEY is present or if API call fails
    const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['Expenses', 0];
    const topPayeeEntry = Object.entries(topPayees).sort((a, b) => b[1] - a[1])[0] || ['Merchants', 0];
    const topCatPct = totalSent > 0 ? Math.round((topCategoryEntry[1] / totalSent) * 100) : 0;

    const fallbackAnalysis = {
      headline: totalSent > 0
        ? `Most of your ${period === 'day' ? 'daily' : 'weekly'} money went to ${topCategoryEntry[0]} (${topCatPct}% of total outflow).`
        : `No spending recorded for this ${period}.`,
      highlights: [
        topCategoryEntry[1] > 0
          ? `Top spending area: ${topCategoryEntry[0]} taking KES ${topCategoryEntry[1].toLocaleString()} (${topCatPct}%).`
          : `No major outflows recorded in this timeframe.`,
        netCashflow >= 0
          ? `Net positive cashflow: You received KES ${netCashflow.toLocaleString()} more than you sent.`
          : `Net negative cashflow: You spent KES ${Math.abs(netCashflow).toLocaleString()} more than received.`,
        topPayeeEntry[1] > 0
          ? `Largest payee: ${topPayeeEntry[0]} (KES ${topPayeeEntry[1].toLocaleString()}).`
          : `Track your next M-Pesa SMS to see detailed merchant breakdowns.`,
      ],
      breakdownSummary: `During this ${period}, total money sent was KES ${totalSent.toLocaleString()} across ${transactions.length} transaction(s). ${
        topCategoryEntry[0] !== 'Expenses' ? `Your primary expenditure was ${topCategoryEntry[0]}.` : ''
      }`,
    };

    return NextResponse.json({
      success: true,
      source: 'rule-engine',
      hasApiKey: Boolean(apiKey),
      stats: statsData,
      aiAnalysis: fallbackAnalysis,
    });
  } catch (error: any) {
    console.error('AI Analysis API Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate AI analysis' },
      { status: 500 }
    );
  }
}
