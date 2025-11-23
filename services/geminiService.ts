import { GoogleGenAI, Type } from "@google/genai";
import { ModelType } from "../types";

export const checkApiKey = async (): Promise<boolean> => {
  // Use type assertion to avoid conflicts with global declarations
  const win = window as any;
  if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
    return await win.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const promptForApiKey = async (): Promise<void> => {
  // Use type assertion to avoid conflicts with global declarations
  const win = window as any;
  if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
    await win.aistudio.openSelectKey();
  } else {
    console.error("AI Studio environment not detected.");
  }
};

/**
 * Step 1: Summarize the text and generate a visual prompt description.
 */
export const summarizeToVisualPrompt = async (text: string): Promise<{ summaryPoints: string[], visualPrompt: string, detectedLanguage: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are an expert Graphic Recorder and Visual Facilitator. 
    Analyze the following content and perform three tasks:
    
    1. **Language Detection**: Identify the language of the input text (e.g., Korean, English).
    2. **Summary**: Extract 3-5 key takeaways. **CRITICAL: The summary must be in the SAME language as the input text.**
    3. **Visual Prompt**: Create a detailed, descriptive image generation prompt to visualize these concepts in a "Graphic Recording" or "Sketchnote" style.
    
    The image prompt should describe:
    - A whiteboard or paper background.
    - Hand-drawn doodles, icons, and connecting arrows.
    - Colorful markers (primary colors like blue, red, yellow, black).
    - Central theme with branching ideas.
    - **Text Instructions**:
      - Identify the Main Title and 3-5 Keywords in the **detected input language**.
      - Explicitly instruct the image generator to WRITE these words in the image.
      - **CRITICAL**: Explicitly state that all visible text in the image (titles, labels, subtitles) must be in **[Detected Language]**.
      - If Korean: Instruct to "Write the title '[Title]' and keywords '[Keyword1]', '[Keyword2]' in Korean Hangul characters. Do NOT use English text."
      - If English: Instruct to "Write the title '[Title]' and keywords '[Keyword1]', '[Keyword2]' in English."

    Content to analyze:
    "${text.substring(0, 10000)}"
  `;

  const response = await ai.models.generateContent({
    model: ModelType.SUMMARIZER,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summaryPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3-5 concise summary bullet points in the input language."
          },
          visualPrompt: {
            type: Type.STRING,
            description: "A detailed prompt for an image generation model, including specific instructions to write text in the detected language."
          },
          detectedLanguage: {
            type: Type.STRING,
            description: "The detected language of the input text (e.g., 'Korean', 'English')."
          }
        },
        required: ["summaryPoints", "visualPrompt", "detectedLanguage"]
      }
    }
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("Failed to generate summary.");
  
  return JSON.parse(jsonText);
};

/**
 * Step 2: Generate the infographic using Gemini Pro Image (Nano Banana Pro)
 */
export const generateGraphicRecording = async (visualPrompt: string, language: string): Promise<string> => {
  // Re-initialize to ensure we have the latest key if it changed
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Enhance the prompt with specific style triggers and strict language enforcement
  const enhancedPrompt = `
    Create a high-quality professional graphic recording sketchnote. 
    Style: Hand-drawn marker on whiteboard. 
    
    Scene Description: ${visualPrompt}
    
    Directives:
    - **LANGUAGE PRIORITY**: The user requires the text in the image to be in **${language}**.
    - **STRICTLY** write the Title, Keywords, and Labels in **${language}**.
    - If ${language} is NOT English, ensure NO English text appears in the main visuals. 
    - Use clear, bold marker strokes for the text to ensure legibility.
    - Use simulated squiggly lines for minor body text, but for any legible words, use ${language} characters only.
    - Use vibrant colors (markers) and clear visual hierarchy.
  `;

  const response = await ai.models.generateContent({
    model: ModelType.ARTIST,
    contents: {
      parts: [
        { text: enhancedPrompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9", // Cinematic aspect for wide summary
        imageSize: "1K" // Standard high quality
      }
    }
  });

  // Extract image from parts
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image generated.");
};