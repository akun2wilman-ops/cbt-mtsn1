import { GoogleGenAI, Type } from '@google/genai';
import { Question } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    questionText: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['multiple-choice', 'multiple-answer', 'short-answer'] },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswers: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['questionText', 'type', 'options', 'correctAnswers'],
};

export const generateQuestionsWithAI = async (
  topic: string,
  count: number,
  types: string[]
): Promise<Partial<Question>[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured. Cannot use AI features.");
  }
  
  const prompt = `
    You are an expert curriculum designer for junior high school (Madrasah Tsanawiyah) in Indonesia. 
    Your task is to generate a set of ${count} exam questions based on the topic: "${topic}".

    The question types should be a mix of: ${types.join(', ')}.

    Please generate a JSON array of question objects. Each object must conform to the provided schema.
    For 'short-answer' questions, the 'options' array should be empty.
    The content must be in Bahasa Indonesia and appropriate for students aged 13-15.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: questionSchema,
        },
        temperature: 0.8,
      },
    });

    const jsonText = response.text.trim();
    const generatedQuestions = JSON.parse(jsonText);
    return generatedQuestions;
  } catch (error) {
    console.error('Error generating questions with Gemini:', error);
    throw new Error('Failed to generate questions. Please check the topic and try again.');
  }
};

export const generateQuestionsFromText = async (
  text: string
): Promise<Partial<Question>[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured. Cannot use AI features.");
  }
  
  const prompt = `
    You are an intelligent data extraction assistant for an online exam application in Indonesia.
    The following text was extracted from a document (likely a PDF) containing exam questions.
    Your task is to carefully analyze the text and convert it into a structured JSON array of question objects.
    Each object must conform to the provided schema.

    - Content must be in Bahasa Indonesia.
    - Identify the question text.
    - Determine the question type. It must be one of: 'multiple-choice', 'multiple-answer', 'short-answer'.
    - Extract all options for multiple-choice and multiple-answer questions.
    - For 'short-answer' questions, the 'options' array must be empty.
    - Identify and extract the correct answer(s). The result must be an array of strings. For short answers, this is the expected text. For multiple choice/answer, it's the text of the correct option(s).
    - Be resilient to formatting errors, page breaks, or OCR imperfections in the source text.
    - If you cannot determine a piece of information for a question (e.g., the correct answer is not marked), make a reasonable assumption or leave it empty if the schema allows.

    Here is the text to process:
    ---
    ${text}
    ---
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // Using a more powerful model for complex parsing
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: questionSchema,
        },
        temperature: 0.2, // Lower temperature for more deterministic extraction
      },
    });

    const jsonText = response.text.trim();
    const generatedQuestions = JSON.parse(jsonText);
    return generatedQuestions;
  } catch (error) {
    console.error('Error parsing document with Gemini:', error);
    throw new Error('Gagal memproses file dengan AI. Pastikan format file jelas dan coba lagi.');
  }
};
