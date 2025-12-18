export interface LanguageContent {
  language: string;
  context: string;
  significance: string[];
  locationAndDate: string[];
  examPoints: string[];
}

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctOption: string;
  explanation: string[];
}

export interface AnalysisResponse {
  results: LanguageContent[];
  mcqs?: MCQ[];
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ProcessingError {
  message: string;
  details?: string;
}