const ApiError = require('../utils/ApiError');

/**
 * AI Service Abstraction using Google Gemini REST API (gemini-2.5-flash)
 */
const generateProductContent = async ({ name, category, brand, notes = '', tone = 'Professional' }) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  
  if (!apiKey) {
    throw new ApiError(
      503,
      'AI content generation is temporarily unconfigured on the server. Please enter product details manually.'
    );
  }

  // Sanitize tone input against whitelist
  const allowedTones = ['Professional', 'Concise', 'Friendly'];
  const safeTone = allowedTones.includes(tone) ? tone : 'Professional';

  // Construct secure prompt separating system instructions from seller facts
  const systemInstruction = `You are an expert e-commerce copywriter.
Task: Write compelling, high-converting product content based ONLY on the provided product facts.

STRICT ACCURACY & HALLUCINATION PREVENTION RULES:
1. Use ONLY the product facts provided below.
2. DO NOT INVENT or hallucinate features, battery life, waterproof ratings, warranties, medical claims, certifications, or free shipping promises if they were not explicitly mentioned in the facts.
3. Tone: ${safeTone}.
4. Output MUST be a valid, raw JSON object with NO markdown formatting, NO backticks, NO extra text.

JSON Schema:
{
  "title": "Optimized e-commerce title",
  "description": "Engaging description between 100 and 250 words",
  "highlights": ["Bullet point highlight 1", "Bullet point highlight 2", "Bullet point highlight 3"],
  "keywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5"]
}`;

  const userFacts = `PRODUCT FACTS PROVIDED BY SELLER:
- Product Name: ${name}
- Category: ${category || 'General'}
- Brand: ${brand || 'N/A'}
- Key Features / Notes: ${notes || 'Standard high quality product'}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: systemInstruction + '\n\n' + userFacts },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1000,
      responseMimeType: 'application/json',
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      if (response.status === 429) {
        throw new ApiError(429, 'AI generation rate limit reached. Please try again in a few minutes.');
      }
      throw new ApiError(
        500,
        `AI provider error (${response.status}): ${errData?.error?.message || 'Failed to generate content'}`
      );
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new ApiError(500, 'Invalid or empty response received from AI provider.');
    }

    // Clean potential markdown wrap if any
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      title: parsed.title || name,
      description: parsed.description || '',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(504, 'AI content generation request timed out. Please try again or enter details manually.');
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, `AI Service Error: ${err.message}`);
  }
};

module.exports = {
  generateProductContent,
};
