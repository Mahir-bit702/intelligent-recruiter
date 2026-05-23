export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { system, messages, max_tokens } = req.body;

    const chutesMessages = [];
    if (system) chutesMessages.push({ role: "system", content: system });
    chutesMessages.push(...messages);

    const response = await fetch("https://api.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CHUTES_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3-0324",
        messages: chutesMessages,
        max_tokens: max_tokens || 4000,
        temperature: 0.1,
      }),
    });

    const rawText = await response.text();
    console.log("Status:", response.status, "Raw:", rawText.slice(0, 300));

    const data = JSON.parse(rawText);
    const text = data.choices?.[0]?.message?.content ?? JSON.stringify(data);

    return res.status(200).json({
      content: [{ type: "text", text }]
    });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
