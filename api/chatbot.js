export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GROQ_API_KEY is not configured in Vercel."
    });
  }

  try {
    const body = req.body || {};

    if (!Array.isArray(body.contents)) {
      return res.status(400).json({
        error: "Invalid chat contents."
      });
    }

    const messages = body.contents.map((item) => ({
      role: item.role === "model" ? "assistant" : "user",
      content: Array.isArray(item.parts)
        ? item.parts.map((part) => part.text || "").join("")
        : ""
    }));

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
          temperature: 0.4
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);

      return res.status(response.status).json({
        error: data?.error?.message || "Groq request failed."
      });
    }

    return res.status(200).json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: data.choices?.[0]?.message?.content || ""
              }
            ]
          }
        }
      ]
    });

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: "Unable to connect to the AI service."
    });
  }
}
