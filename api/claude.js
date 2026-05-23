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

    const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CHUTES_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3",
        messages: chutesMessages,
        max_tokens: max_tokens || 4000,
        temperature: 0.1,
      }),
    });

    const rawText = await response.text();
    console.log("Raw:", rawText.slice(0, 500));

    const data = JSON.parse(rawText);
    console.log("Keys:", Object.keys(data));

    // Handle both streaming and non-streaming responses
    let text = "";
    if (data.choices && data.choices[0]) {
      const choice = data.choices[0];
      text = choice.message?.content || choice.text || "";
    } else if (data.content) {
      text = Array.isArray(data.content) ? data.content[0]?.text : data.content;
    } else {
      text = JSON.stringify(data);
    }

    console.log("Extracted text:", text.slice(0, 200));

    return res.status(200).json({
      content: [{ type: "text", text }]
    });

  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
