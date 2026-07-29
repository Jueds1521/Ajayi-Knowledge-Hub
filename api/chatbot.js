export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GROQ_API_KEY is not configured in Vercel."
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    if (!Array.isArray(body.contents)) {
      return res.status(400).json({
        error: "Invalid chat contents."
      });
    }

    const messages = [];

    // Send the Knowledge Hub instructions/knowledge to Groq
    if (body.systemInstruction?.parts?.length) {
      const systemText = body.systemInstruction.parts
        .map(part => part.text || "")
        .join("\n");

      if (systemText.trim()) {
        messages.push({
          role: "system",
          content: systemText
        });
      }
    }

    // Send conversation history
    for (const item of body.contents) {
      if (!item || !Array.isArray(item.parts)) continue;

      const content = item.parts
        .map(part => part.text || "")
        .join("");

      if (!content.trim()) continue;

      messages.push({
        role: item.role === "model" ? "assistant" : "user",
        content
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages,
          temperature: 0.3,
          max_tokens: 1000
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Groq request failed."
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content || "";

    return res.status(200).json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: answer
              }
            ]
          }
        }
      ]
    });

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: error?.message ||
        "Unable to connect to the AI service."
    });
  }
}
