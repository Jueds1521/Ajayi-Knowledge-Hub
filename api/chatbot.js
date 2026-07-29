export default async function handler(req, res) {
  // Allow browser/preflight checks
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed. Use POST."
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing.");
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured in Vercel."
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
          ...(body.systemInstruction
            ? { systemInstruction: body.systemInstruction }
            : {})
        })
      }
    );

    const data = await response.json();

    console.log("Gemini status:", response.status);

    if (!response.ok) {
      console.error("Gemini API error:", JSON.stringify(data));

      return res.status(502).json({
        error:
          data?.error?.message ||
          "Gemini request failed."
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: "Unable to connect to the AI service.",
      details: error?.message || "Unknown error"
    });
  }
}
