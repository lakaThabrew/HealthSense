
import { GoogleGenAI, Chat, Part, Content, Modality } from "@google/genai";
import { Profile } from "../types";

const BASE_SYSTEM_INSTRUCTION = `
You are HealthSense, a world-class, empathetic, and multimodal health assistant. 
Your goal is to help users understand visible symptoms safely using high-level reasoning.

**Current User Profile Context:**
{{PROFILE_CONTEXT}}

**Your Protocol:**

1.  **Phase 1: Observation & Inquiry**
    *   If the user uploads an image, first gently describe what you clearly see (redness, swelling, abrasion, rash pattern, etc.).
    *   **CRITICAL:** Ask ONLY ONE smart, medically relevant clarifying question at a time if needed.
    *   Wait for the user's answer before asking the next question.

2.  **Phase 2: Analysis & Guidance**
    *   Based on the image + text history, provide a structured response.
    *   **RISK ASSESSMENT:** You MUST categorize the visible symptoms into one of these levels:
        *   **RISK_LEVEL: LOW** (Minor issues, self-care likely sufficient)
        *   **RISK_LEVEL: MEDIUM** (Monitor closely, consult doctor if no improvement)
        *   **RISK_LEVEL: HIGH** (Urgent medical attention recommended)
    *   **Structure:**
        *   **Analysis:** "This pattern is consistent with..." (Use uncertain language).
        *   **Home Care:** Safe, general steps.
        *   **Red Flags:** What to watch for.
        *   **[Hidden Line]:** Output the exact string "RISK_LEVEL: [Level]" on a new line at the very end.

3.  **Tools & Location:**
    *   If the user asks for a doctor, hospital, or pharmacy, use the 'googleMaps' tool to find relevant locations near them.

4.  **Mandatory Rules:**
    *   **STRICTLY OUTPUT PLAIN TEXT.** Do not use markdown formatting like bolding (**), italics (*), or headers (#).
    *   **MANDATORY:** You MUST end EVERY single response with this exact disclaimer:
        "\n\nDisclaimer: HealthSense is not a medical device and does not provide medical diagnoses. For concerns or severe symptoms, consult a licensed healthcare professional."

**Tone:** Professional, distinct, caring, and observant. Adjust complexity based on the profile age.
`;

const MODE_INSTRUCTIONS = {
  COMMON: "Focus on general adult health. Suggest standard over-the-counter remedies if appropriate.",
  CHILD: "CRITICAL PEDIATRIC FOCUS. Be extremely gentle. Always advise consulting a pediatrician for fevers or unclear symptoms. Do NOT suggest aspirin. Ask about behavior changes (eating, sleeping, playing).",
  PREGNANCY: "CRITICAL OBSTETRIC FOCUS. Be extremely cautious. Avoid suggesting medications unless strictly safe for pregnancy. Prioritize maternal and fetal safety. If symptom involves abdominal pain, bleeding, or reduced movement, escalate to HIGH RISK immediately.",
  ELDERLY: "CRITICAL GERIATRIC FOCUS. Consider skin fragility, dehydration risk, and potential interactions with common medications. Ask about confusion or recent falls."
};

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

export const initializeGenAI = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
    return;
  }
  genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const startNewChat = (history?: Content[], profile?: Profile) => {
  if (!genAI) initializeGenAI();
  if (!genAI) throw new Error("Failed to initialize Gemini");

  // Explicitly nullify old session
  chatSession = null;

  // Build Profile Context String
  let profileContext = "Adult User.";
  let modeInstruction = MODE_INSTRUCTIONS.COMMON;

  if (profile) {
    const mode = profile.mode || 'COMMON';
    modeInstruction = MODE_INSTRUCTIONS[mode];
    profileContext = `Name: ${profile.name}. Age: ${profile.age || 'Unknown'}. Medical Notes: ${profile.details || 'None'}. Mode: ${mode}.`;
  }
  
  const systemInstruction = BASE_SYSTEM_INSTRUCTION
    .replace('{{PROFILE_CONTEXT}}', profileContext) + 
    `\n\n**SPECIAL MODE INSTRUCTIONS (${profile?.mode || 'COMMON'}):**\n${modeInstruction}`;

  chatSession = genAI.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.4,
      tools: [{ googleMaps: {} }]
    },
    history: history
  });
  return chatSession;
};

// Helper to format errors
const formatGeminiError = (error: any): string => {
    const msg = error.message || error.toString();
    if (msg.includes("400") || msg.includes("API_KEY")) return "Configuration Error: Invalid API Key or Request.";
    if (msg.includes("503") || msg.includes("Overloaded")) return "Service is currently overloaded. Please try again in a moment.";
    if (msg.includes("Failed to fetch") || msg.includes("Network")) return "Network Error: Please check your internet connection.";
    if (msg.includes("Google Maps tool is not enabled")) return "Maps Tool Error: The location feature is temporarily unavailable.";
    return "I encountered an unexpected error. Please try again.";
};

export const sendMessageToGemini = async (text: string, imageBase64?: string): Promise<{ text: string, groundingMetadata?: any }> => {
  if (!chatSession) {
    startNewChat();
  }

  if (!chatSession) throw new Error("Chat session could not be created");

  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      let result;
      const parts: Part[] = [];

      if (imageBase64) {
          const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
          parts.push({
              inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64
              }
          });
      }
      
      if (text) {
          parts.push({ text: text || " " });
      }

      result = await chatSession.sendMessage({
          message: parts
      });

      return {
        text: result.text || "I'm having trouble analyzing that. Please try again.",
        groundingMetadata: result.candidates?.[0]?.groundingMetadata
      };

    } catch (error: any) {
      console.error(`Gemini API Error (Attempt ${retries + 1}/${maxRetries}):`, error);
      const errorMsg = error.message || "";

      // Specific handling for "Google Maps tool is not enabled"
      // If the tool fails, we retry ONCE without the tool by creating a temporary standard session
      // preventing the app from breaking completely.
      if (errorMsg.includes("Google Maps tool is not enabled") || errorMsg.includes("tool use is not supported")) {
         console.warn("Tool failed, falling back to text-only mode.");
         try {
             if (!genAI) initializeGenAI();
             const fallbackResponse = await genAI!.models.generateContent({
                 model: 'gemini-2.5-flash',
                 contents: [{ parts: [{ text: text + " (Note: Maps tool unavailable, provide general advice)" }] }]
             });
             return { text: fallbackResponse.text || "Maps unavailable, but here is some advice." };
         } catch (fallbackError) {
             throw new Error("Maps tool failed and fallback failed.");
         }
      }

      retries++;
      
      if (retries >= maxRetries) {
        throw new Error(formatGeminiError(error));
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }

  return { text: "I'm having trouble connecting right now. Please try again." };
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  if (!genAI) initializeGenAI();
  if (!genAI) throw new Error("Gemini not initialized");
  
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS generation failed:", error);
    return null;
  }
};

export const checkConnection = async (): Promise<boolean> => {
  if (!genAI) initializeGenAI();
  if (!genAI) return false;
  try {
     const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'ping',
     });
     return !!response.text;
  } catch (e) {
    console.error("Connection check failed", e);
    return false;
  }
};
