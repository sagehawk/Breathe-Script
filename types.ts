
export interface Script {
  id: string;
  title: string;
  content: string;
  bullets?: string; // Stored as a newline-separated string
  createdAt: number;
}

export type ViewState = 'list' | 'edit' | 'memorize';

export interface MemorizeState {
  script: Script;
  blackedOutCount: number;
  currentRound: number;
}