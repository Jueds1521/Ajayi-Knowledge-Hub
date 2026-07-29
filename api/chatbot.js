export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Use GET for this test." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured in Vercel."
    });
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        method: "GET",
        headers: {
          "x-goog-api-key": apiKey
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini models error:", data);
      return res.status(response.status).json(data);
    }

    const models = (data.models || [])
      .filter(model =>
        (model.supportedGenerationMethods || []).includes("generateContent")
      )
      .map(model => ({
        name: model.name,
        displayName: model.displayName,
        supportedGenerationMethods: model.supportedGenerationMethods
      }));

    return res.status(200).json({ models });
  } catch (error) {
    console.error("Models request error:", error);

    return res.status(500).json({
      error: error.message || "Unable to connect to Gemini."
    });
  }
}
