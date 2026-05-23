export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const MODELS = [
    "Qwen/Qwen3-32B-TEE",
    "moonshotai/Kimi-K2.5-TEE",
    "moonshotai/Kimi-K2.6-TEE",
    "zai-org/GLM-5-TEE",
    "MiniMaxAI/MiniMax-M2.5-TEE",
    "Qwen/Qwen3.6-27B-TEE",
    "Qwen/Qwen3-235B-A22B-Thinking-2507",
    "unsloth/Mistral-Nemo-Instruct-2407-TEE",
    "Qwen/Qwen2.5-Coder-32B-Instruct-TEE",
  ];

  try {
    const { system, messages, max_tokens } = req.body;

    const chutesMessages = [];
    if (system) chutesMessages.push({ role: "system", content: system });
    chutesMessages.push(...messages);

    for (const model of MODELS) {
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
        console.log(`${model} → ${response.status}`);

        if (response.status === 200) {
          const data = JSON.parse(rawText);
          const text = data.choices?.[0]?.message?.content ?? "";
          if (text) {
            return res.status(200).json({ content: [{ type: "text", text }] });
          }
        }
      } catch(e) {
        console.log(`${model} error: ${e.message}`);
        continue;
      }
    }

    return res.status(500).json({ error: "All models unavailable. Try again later." });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
