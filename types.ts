export interface GenerationResult {
  summary: string[];
  imageUrl: string | null;
}

export interface ProcessingState {
  status: 'idle' | 'summarizing' | 'drawing' | 'completed' | 'error';
  message?: string;
}

export enum ModelType {
  SUMMARIZER = 'gemini-2.5-flash',
  ARTIST = 'gemini-3-pro-image-preview', // Nano Banana Pro
}