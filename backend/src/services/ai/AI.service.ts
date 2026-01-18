
import OpenAI from 'openai';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export class AIService {
  static async generateItinerary(input: {
    destination: string;
    days: number;
    budget: number;
    currency: string;
    interests: string[];
    places: any[];
  }) {
    const prompt = `
You are a travel planner.

Destination: ${input.destination}
Days: ${input.days}
Budget per person: ${input.currency} ${input.budget}
Interests: ${input.interests.join(', ')}

Places:
${input.places.map(p => `- ${p.name} (${p.kinds})`).join('\n')}

Rules:
- Stay within budget
- Prefer free places if budget is low
- Paid places only if worth it
- Create a day-wise timeline
- Include time, crowd level, safety tag

Return JSON only in this format:
{
  "days": [
    {
      "day": 1,
      "schedule": [
        {
          "time": "9:00 AM",
          "name": "",
          "type": "",
          "rating": 4.5,
          "cost": "Free / ₹500",
          "tag": "SafeZone / Moderate Crowds"
        }
      ]
    }
  ]
}
`;

    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    return JSON.parse(res.choices[0].message.content!);
  }
}
