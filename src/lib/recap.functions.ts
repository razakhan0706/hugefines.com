import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateRecap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { summary: string; tone: string; scope: string }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You write short, funny end-of-match and end-of-season recaps for amateur sports club fines sheets. " +
              "Use cheeky clubhouse banter, light roasts, running gags, and a confident rhythm. " +
              "You do NOT know what actually happened on the field — never claim a player was robbed, unlucky, had a bad game, or got stitched up based on fines or votes. " +
              "Do NOT say 'hard luck', 'tough luck', 'bad luck', or 'better luck' to anyone. " +
              "When you run out of meaningful game commentary, pivot to something else funny: the fines tally, repeat offenders, the clubhouse wallet, the cheapest fine, or a running joke. " +
              "No slurs, no personal attacks about appearance or health. " +
              "Write 120-180 words in punchy sentences. Use the players' names and the fine details you're given.",
          },
          {
            role: "user",
            content: `Tone: ${data.tone}. Scope: ${data.scope}.\n\nData:\n${data.summary}`,
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached — try again in a minute.");
    if (res.status === 402) throw new Error("AI credits exhausted. Top up to keep generating recaps.");
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { text: json.choices?.[0]?.message?.content?.trim() ?? "" };
  });