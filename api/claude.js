export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { system, messages, max_tokens } = req.body;

    // Use OpenAI-compatible endpoint on Chutes
    const chutesMessages = [];
    if (system) chutesMessages.push({ role: "system", content: system });
    chutesMessages.push(...messages);

    const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CHUTES_API_KEY}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-5",
        messages: chutesMessages,
        max_tokens: max_tokens || 4000,
      }),
    });

    const data = await response.json();

    // Convert OpenAI format back to Anthropic format
    const text = data.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({
      content: [{ type: "text", text }]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
