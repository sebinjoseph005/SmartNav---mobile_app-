import Groq from "groq-sdk";

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not set in .env");
  }
  return new Groq({ apiKey });
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("Invalid JSON returned by Groq");
  }
}

export class OpenAIService {
  static async generateItineraryJson(prompt: string): Promise<any> {
    const client = getGroqClient();

    console.log('\n🤖 ========== CALLING GROQ AI ==========');
    console.log('Model: llama3-70b-8192');
    console.log('Prompt length:', prompt.length, 'characters');
    console.log('Prompt preview:', prompt.substring(0, 200) + '...');

    const response = await client.chat.completions.create({
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `You are a STRICT travel itinerary planner API that ONLY returns valid JSON.

CRITICAL RULES:
- Return ONLY valid JSON, no explanations
- Use ONLY the exact place names provided in the user prompt
- NEVER invent new places
- NEVER use words like "exploration", "overview", "about"
- Each day must have 3-5 specific activities
- Each activity must be a real place from the provided list`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error('❌ Groq returned empty response');
      throw new Error("Groq returned empty response");
    }

    console.log('✅ Groq AI response received');
    console.log('Response length:', content.length, 'characters');
    console.log('Response preview:', content.substring(0, 300) + '...');

    const parsed = safeJsonParse(content);
    console.log('✅ JSON parsed successfully');
    console.log('Timeline days:', parsed?.timeline?.length);
    console.log('========================================\n');
    
    return parsed;
  }
}
