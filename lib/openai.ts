// lib/openai.ts
import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function deobfuscateWithOpenAI(code: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = `
فك شفرة هذا الكود المشفر بجافاسكريبت node.js، وأعد كتابته بشكل واضح ومنسق:

${code}

أعد كتابة الكود المفكوك فقط بدون شرح.
`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 2000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const text = response.data.choices[0].message.content;
    return text;
  } catch (error) {
    throw new Error("OpenAI deobfuscation failed: " + error);
  }
}
