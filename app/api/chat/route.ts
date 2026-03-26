import { NextRequest, NextResponse } from "next/server";

/**
 * Gemini AI chat proxy — keeps API key server-side.
 * System prompt focuses on women's safety, emotional support, next steps.
 */
const SYSTEM_PROMPT = `You are Raksha, an AI safety assistant for women. Your role is to:
1. Provide immediate, practical safety advice
2. Offer calm emotional support
3. Suggest clear next steps in dangerous situations
4. Recommend emergency numbers (Police: 100, Ambulance: 102, Women Helpline: 1091)
Keep responses SHORT (2-4 sentences max), calm, and actionable. Never panic the user.`;

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Graceful fallback without API key
    return NextResponse.json({ reply: getFallbackReply(message) });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            { role: "model", parts: [{ text: "Understood. I'm Raksha, your safety assistant. I'll provide calm, practical safety guidance." }] },
            { role: "user", parts: [{ text: message }] },
          ],
          generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
        }),
      }
    );

    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? getFallbackReply(message);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: getFallbackReply(message) });
  }
}

function getFallbackReply(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("follow") || lower.includes("stalked"))
    return "Walk to a crowded public place immediately. Call someone and stay on the phone. If the person persists, call Police: 100.";
  if (lower.includes("unsafe") || lower.includes("danger") || lower.includes("scared"))
    return "Trust your instincts — move to a safe, well-lit area with people. Call Women Helpline: 1091 or Police: 100 right away.";
  if (lower.includes("pepper") || lower.includes("spray"))
    return "Aim for the eyes from 1-2 meters away. Press firmly and move away immediately. Always keep it accessible in your bag.";
  if (lower.includes("escape") || lower.includes("run"))
    return "Head toward lights, people, and open businesses. Shout 'FIRE' to attract attention — it works better than 'Help'. Call 100.";
  return "You're not alone. Stay in a public place, keep your phone charged, and call Women Helpline 1091 or Police 100 if you feel threatened.";
}
