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

    // Try multiple models in order until one works
    const models = [
      "unsloth/Llama-3.3-70B-Instruct",
      "meta-llama/Llama-3.3-70B-Instruct",
      "Qwen/Qwen2.5-72B-Instruct",
    ];

    let text = "";
    let lastError = "";

    for (const model of models) {
      try {
        const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.CHUTES_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: chutesMessages,
            max_tokens: max_tokens || 4000,
            temperature: 0.1,
          }),
        });

        const rawText = await response.text();
        console.log(`Model ${model} status:`, response.status, rawText.slice(0, 100));

        if (response.status === 200) {
          const data = JSON.parse(rawText);
          text = data.choices?.[0]?.message?.content ?? "";
          if (text) break;
        }
        lastError = rawText;
      } catch(e) {
        lastError = e.message;
        continue;
      }
    }

    if (!text) {
      return res.status(500).json({ error: "All models failed: " + lastError });
    }

    return res.status(200).json({
      content: [{ type: "text", text }]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
