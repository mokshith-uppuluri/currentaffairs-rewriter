import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResponse, MCQ, LanguageContent } from "../types";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Schema for just the language rewriting (Phase 1)
const CONTENT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          language: {
            type: Type.STRING,
            description: "The language of the content (Telugu, Hindi, Kannada, Tamil, English)",
            enum: ["Telugu", "Hindi", "Kannada", "Tamil", "English"]
          },
          context: {
            type: Type.STRING,
            description: "Around 100 words. Simple, neutral, exam-oriented. Explain background and significance."
          },
          significance: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "7-8 clear bullet points on governance, economy, society, policy, or competitive exams."
          },
          locationAndDate: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Bullet points only. Mention location and date. No assumptions."
          },
          examPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5-7 crisp factual bullet points useful for UPSC, SSC, Banking, etc."
          }
        },
        required: ["language", "context", "significance", "locationAndDate", "examPoints"]
      }
    }
  },
  required: ["results"]
};

// Schema for a batch of MCQs (Phase 2)
const MCQ_BATCH_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    mcqs: {
      type: Type.ARRAY,
      description: "Multiple choice questions based strictly on the content.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            minItems: 4,
            maxItems: 4,
            description: "Exactly 4 options."
          },
          correctOption: {
            type: Type.STRING,
            enum: ["A", "B", "C", "D"],
            description: "The letter of the correct option."
          },
          explanation: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of exactly 3 explanation points: 1. Detailed Justification, 2. Context, 3. Wrong options analysis."
          }
        },
        required: ["question", "options", "correctOption", "explanation"]
      }
    }
  },
  required: ["mcqs"]
};

// Schema for a single MCQ (Regenerate)
const SINGLE_MCQ_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      minItems: 4,
      maxItems: 4,
      description: "Exactly 4 options."
    },
    correctOption: {
      type: Type.STRING,
      enum: ["A", "B", "C", "D"],
      description: "The letter of the correct option."
    },
    explanation: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of exactly 3 explanation points: 1. Detailed Justification, 2. Context, 3. Wrong options analysis."
    }
  },
  required: ["question", "options", "correctOption", "explanation"]
};

const CONTENT_SYSTEM_INSTRUCTION = `
Role: You are an exam-focused current affairs rewriting engine.

Core Task:
REWRITE the given current affairs into five languages (Telugu, Hindi, Kannada, Tamil, English) using fully original content derived from the input.

Global Rules:
1. Analyze only the given text. Do not add, assume, or infer information not provided.
2. Tone: Simple, clear, neutral, factual, suitable for competitive exams (UPSC, SSC, Banking).
3. STRICTLY NO EMOJIS.
4. No extra commentary.

Languages order: Telugu, Hindi, Kannada, Tamil, English.
Structure per language:
    - Context: ~100 words, exam-oriented background.
    - Why this news matters: 7-8 points derived from text.
    - Where and When: factual location/date points.
    - Key Points for Exam: 5-7 crisp factual points.
`;

const MCQ_BATCH_INSTRUCTION = (count: number) => `
Role: You are an exam-focused question generator.

Task:
Generate exactly ${count} Multiple Choice Questions (MCQs) strictly based on the provided input content.

Global Rules:
1. Analyze only the given text.
2. Tone: Factual, suitable for competitive exams (UPSC, SSC, Banking).
3. STRICTLY NO EMOJIS.

Requirements per Question:
- Each question must have exactly 4 options (A, B, C, D).
- Only ONE option must be correct.
- Provide a Detailed Explanation (Array of 3 strings):
  1. First point: Why the correct answer is correct (Provide a VERY DETAILED, comprehensive justification using exact facts, figures, and reasoning. ALWAYS use phrases like "According to the news article" or "As per the news" instead of "from the text").
  2. Second point: Explanation from the news context.
  3. Third point: Why the other options are incorrect.
`;

const SINGLE_MCQ_INSTRUCTION = `
Role: You are an exam-focused question generator.
Task: Generate exactly ONE Multiple Choice Question (MCQ) based strictly on the provided input text.
Rules:
1. The question must be factual and suitable for competitive exams (UPSC/SSC).
2. It must have 4 options, 1 correct answer.
3. Provide a detailed 3-part explanation as an array of strings:
    - Point 1: DETAILED justification for the correct answer. Use phrases like "According to the news article" or "As per the news".
    - Point 2: Context/Background.
    - Point 3: Analysis of wrong options.
4. No emojis.
5. Do not use markdown.
`;

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

export const analyzeCurrentAffairs = async (text: string): Promise<AnalysisResponse> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set the API_KEY environment variable.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: text }] }],
      config: {
        systemInstruction: CONTENT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: CONTENT_SCHEMA,
        temperature: 0.3, 
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response from Gemini.");

    const parsed = JSON.parse(responseText);
    // Return with empty MCQs initially
    return {
        results: parsed.results,
        mcqs: []
    };
  } catch (error: any) {
    console.error("Gemini API Error (Content):", error);
    throw new Error(error.message || "Failed to analyze content.");
  }
};

export const generateMCQBatch = async (text: string, count: number): Promise<MCQ[]> => {
    if (!API_KEY) throw new Error("API Key is missing.");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: text }] }],
            config: {
                systemInstruction: MCQ_BATCH_INSTRUCTION(count),
                responseMimeType: "application/json",
                responseSchema: MCQ_BATCH_SCHEMA,
                temperature: 0.3,
            }
        });

        const responseText = response.text;
        if (!responseText) throw new Error("Empty response from Gemini.");

        const parsed = JSON.parse(responseText);
        
        return parsed.mcqs.map((mcq: any) => ({
            ...mcq,
            id: generateId()
        }));
    } catch (error: any) {
        console.error("Gemini API Error (MCQ Batch):", error);
        throw new Error(error.message || "Failed to generate MCQs.");
    }
};

export const regenerateSingleMCQ = async (text: string): Promise<MCQ> => {
  if (!API_KEY) throw new Error("API Key is missing.");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text }] }],
      config: {
        systemInstruction: SINGLE_MCQ_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: SINGLE_MCQ_SCHEMA,
        temperature: 0.7,
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("Empty response.");

    const parsed = JSON.parse(responseText) as Omit<MCQ, 'id'>;
    return {
      ...parsed,
      id: generateId()
    };
  } catch (error: any) {
    console.error("Regeneration Error:", error);
    throw new Error("Failed to regenerate question.");
  }
};