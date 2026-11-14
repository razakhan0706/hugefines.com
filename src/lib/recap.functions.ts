import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateRecap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { summary: string; tone: string; scope: string; instruction?: string }) => ({
    ...input,
    instruction: (input.instruction ?? "").slice(0, 500),
  }))
  .handler(async ({ data }) => {
    const formats = [
      "a short savage roast of 50-80 words",
      "a mock tabloid front page: headline plus 3-4 brutal one-liners",
      "a fake awards night handing out insulting awards",
      "a numbered list of roasts, one per offender",
      "a mock police report or charge sheet",
      "a dramatic fake press conference",
      "a longer roast of 150-200 words",
      "a series of fake text messages from the team group chat",
    ];
    const format = formats[Math.floor(Math.random() * formats.length)];
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
              "For 'Absolutely ruthless', be mercilessly funny — tear into repeat offenders, absurd fines, and anyone who keeps the party fund alive. No sympathy, no softening, no 'hard luck'. Go for the jugular while still sticking to the facts you are given. " +
              "For other tones, use cheeky clubhouse banter, dramatic commentary, or dry deadpan newsreading as requested. " +
              "Stick strictly to the facts you are given. Never invent details, settings, or reactions (e.g. 'to an empty field'), and never merge two separate fines into one cause-and-effect story — each fine is its own unrelated event unless the text says otherwise. " +
              "You do NOT know what actually happened on the field — never claim a player was robbed, unlucky, had a bad game, or got stitched up based on fines or votes. " +
              "Do NOT say 'hard luck', 'tough luck', 'bad luck', or 'better luck' to anyone. " +
              "Votes: only discuss the votes for the scope you are given, plus the cumulative season total. When stating vote counts, always use numerals (e.g. '3', '12', '27') — never write out numbers as words (e.g. 'three', 'twelve'). If the round votes and the cumulative total are identical (e.g. it's the first round), say it once — do not repeat the same numbers as if they were different things, and never compare a round tally against a season tally in the same breath. " +
              "Never roast or mock players for receiving a low vote count — anyone with votes beat the players who got none. Only celebrate vote-getters. " +
              "When you run out of meaningful game commentary, pivot to something else funny: the fines tally, repeat offenders, the clubhouse wallet, the cheapest fine, or a running joke. " +
              "If you run out of material, expand the fines section rather than padding with vote commentary. " +
              "No slurs, no personal attacks about appearance or health. " +
              "Your main job is comedy: roast the players hard using their fines. Do NOT just recap or list what happened — everyone already knows. Pick the funniest angles and build jokes on them; skip boring details entirely. " +
              "Every recap must feel different: vary the length, structure, opening line and running gags. Never start with 'Welcome' or 'What a round'. Use punchy sentences, players' names and the fine details you're given. " +
              "If the user gives an Instruction, make it the centrepiece of the recap.",
          },
          {
            role: "user",
            content:
              `Tone: ${data.tone}. Scope: ${data.scope}.\nFormat this time: ${format}.` +
              (data.instruction ? `\nInstruction (main point of emphasis): ${data.instruction}` : "") +
              `\n\nData:\n${data.summary}`,
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