
export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export type HealthMode = 'COMMON' | 'CHILD' | 'PREGNANCY' | 'ELDERLY';

export interface Profile {
  id: string;
  name: string;
  age?: string;
  details?: string; // e.g., "Pregnant", "Diabetic"
  avatarColor: string;
  mode: HealthMode;
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  image?: string; // Base64 string
  isError?: boolean;
  riskLevel?: RiskLevel; // Parsed from model response
  groundingMetadata?: any; // For Maps/Search results
}

export interface ChatSessionSummary {
  id: string;
  title: string;
  date: number;
  preview: string;
  profileId: string;
}

export interface AnalysisState {
  stage: 'idle' | 'analyzing' | 'questioning' | 'guidance';
}

export const DISCLAIMER_TEXT = "Disclaimer: HealthSense is not a medical device and does not provide medical diagnoses. For concerns or severe symptoms, consult a licensed healthcare professional.";
