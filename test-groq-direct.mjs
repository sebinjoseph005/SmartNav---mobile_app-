// Direct Groq test
import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

async function testGroq() {
  console.log('\n🧪 Testing Groq API directly...\n');
  console.log(`GROQ_API_KEY exists: ${!!process.env.GROQ_API_KEY}`);
  console.log(`GROQ_API_KEY length: ${process.env.GROQ_API_KEY?.length}\n`);

  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not found in environment!');
    return;
  }

  try {
    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    console.log('📤 Sending simple test to Groq...');
    
    const response = await client.chat.completions.create({
      model: "llama3-70b-8192",
      temperature: 0.3,
      messages: [
        { role: "system", content: "You are a helpful assistant. Always respond with valid JSON." },
        { role: "user", content: 'Return this JSON: {"message": "Groq is working!"}' }
      ],
    });

    const content = response.choices[0]?.message?.content;
    console.log('\n✅ Groq Response:', content);
    console.log('\n🎉 SUCCESS! Groq AI is working perfectly!\n');
    
  } catch (error) {
    console.error('\n❌ Groq Error:', error.message);
    console.error('Full error:', error);
  }
}

testGroq();
