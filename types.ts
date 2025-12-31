
export interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export type ViewState = 'list' | 'edit' | 'memorize';

export interface MemorizeState {
  script: Script;
  blackedOutCount: number;
  currentRound: number;
}
