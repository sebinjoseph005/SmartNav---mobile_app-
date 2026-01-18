import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

export class OpenAIService {
  static async generateItinerary(prompt: string) {
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a travel itinerary expert. Create detailed, day-by-day travel plans.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'No itinerary generated';
  }
}
