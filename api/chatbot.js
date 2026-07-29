export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured in Vercel." });
  }

  try {
    const body = req.body || {};
    if (!Array.isArray(body.contents)) {
      return res.status(400).json({ error: "Invalid chat contents." });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: body.contents,
          systemInstruction: body.systemInstruction
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini request failed."
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Chat API error:", error);
    return res.status(500).json({ error: "Unable to connect to the AI service." });
  }
}
