import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateRecap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { summary: string; tone: string; scope: string; scorecardUrl?: string }) => input,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    let scorecard = "";
    if (data.scorecardUrl && /^https?:\/\//i.test(data.scorecardUrl)) {
      try {
        const page = await fetch(data.scorecardUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; HugeFinesBot/1.0)" },
        });
        if (page.ok) {
          const html = await page.text();
          scorecard = html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 6000);
        }
      } catch {
        scorecard = "";
      }
    }

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
              "For 'Absolutely ruthless', be mercilessly funny — tear into repeat offenders, absurd fines, and anyone who keeps the party fund alive. No sympathy, no softening, no 'hard luck'. Go for the jugular while still sticking to the facts you are given. " +
              "For other tones, use cheeky clubhouse banter, dramatic commentary, or dry deadpan newsreading as requested. " +
              "Stick strictly to the facts you are given. Never invent details, settings, or reactions (e.g. 'to an empty field'), and never merge two separate fines into one cause-and-effect story — each fine is its own unrelated event unless the text says otherwise. " +
              "You do NOT know what actually happened on the field — never claim a player was robbed, unlucky, had a bad game, or got stitched up based on fines or votes. " +
              "Do NOT say 'hard luck', 'tough luck', 'bad luck', or 'better luck' to anyone. " +
              "Votes: only discuss the votes for the scope you are given, plus the cumulative season total. If the round votes and the cumulative total are identical (e.g. it's the first round), say it once — do not repeat the same numbers as if they were different things, and never compare a round tally against a season tally in the same breath. " +
              "Never roast or mock players for receiving a low vote count — anyone with votes beat the players who got none. Only celebrate vote-getters. " +
              "When you run out of meaningful game commentary, pivot to something else funny: the fines tally, repeat offenders, the clubhouse wallet, the cheapest fine, or a running joke. " +
              "If you run out of material, expand the fines section rather than padding with vote commentary. " +
              "No slurs, no personal attacks about appearance or health. " +
              "If a scorecard extract is provided, you MAY use concrete facts from it (scores, wickets, standout performances) but never invent anything beyond it. " +
              "Write 120-180 words in punchy sentences. Use the players' names and the fine details you're given.",
          },
          {
            role: "user",
            content:
              `Tone: ${data.tone}. Scope: ${data.scope}.\n\nData:\n${data.summary}` +
              (scorecard ? `\n\nScorecard extract (raw text from ${data.scorecardUrl}):\n${scorecard}` : ""),
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